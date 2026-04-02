const logger = require('../config/logger');
const { getPrismaClient } = require('../config/database');
const { scrapeGoogleSearch, scrapeDomainHomepage } = require('../services/scrapedo.service');
const { parseGoogleResults, findDomainPosition, extractCompetitors, parseDomainSeo } = require('../services/parser.service');
const { analyzeSeo, calculateMetrics, calculateLeadScore, getLeadStatus } = require('../services/seo.service');
const { triggerEmailSequence } = require('../services/email.service');
const { sendSlackAlert } = require('../services/notification.service');
const { getCachedSerpResults, cacheSerpResults } = require('../utils/helpers');

/**
 * Main rank check processor
 * Implements the complete worker logic flow
 */
async function processRankCheck(job) {
  const { checkId, keyword, domain, location, device } = job.data;
  const prisma = getPrismaClient();

  logger.info({ checkId, keyword, domain, location, device }, 'Processing rank check job');

  try {
    // Step 1: Update status to processing
    await prisma.rankCheck.update({
      where: { id: checkId },
      data: { status: 'processing', progress: 5 },
    });

    await job.updateProgress(5);

    // Step 2: Check Redis cache
    let serpResults = await getCachedSerpResults(keyword, location, device);
    let fromCache = false;

    if (serpResults) {
      fromCache = true;
      logger.info({ checkId, keyword }, 'Using cached SERP results');
      await job.updateProgress(40);
    } else {
      // Step 3: Scrape Google via Scrape.do
      await prisma.rankCheck.update({
        where: { id: checkId },
        data: { progress: 15 },
      });
      await job.updateProgress(15);

      const html = await scrapeGoogleSearch(keyword, location, device);

      await job.updateProgress(35);

      // Step 4: Parse HTML with Cheerio
      serpResults = parseGoogleResults(html);

      if (serpResults.length === 0) {
        throw new Error('Failed to parse any results from Google HTML');
      }

      // Step 5: Cache results
      await cacheSerpResults(keyword, location, device, serpResults);

      await job.updateProgress(40);
    }

    // Save SERP results to database
    await prisma.rankCheck.update({
      where: { id: checkId },
      data: { progress: 45 },
    });

    if (serpResults.length > 0) {
      await prisma.serpResult.createMany({
        data: serpResults.map((r) => ({
          checkId,
          position: r.position,
          domain: r.domain,
          url: r.url,
          title: r.title,
          description: r.description,
          isTarget: r.domain.replace(/^www\./, '') === domain.replace(/^www\./, ''),
        })),
        skipDuplicates: true,
      });
    }

    await job.updateProgress(50);

    // Step 6: Find target domain position
    const currentPosition = findDomainPosition(serpResults, domain);
    logger.info({ checkId, domain, currentPosition }, 'Domain position found');

    // Step 7: Extract top 10 competitors
    const competitorData = extractCompetitors(serpResults, domain, 10);
    if (competitorData.length > 0) {
      await prisma.competitor.createMany({
        data: competitorData.map((c) => ({
          checkId,
          domain: c.domain,
          position: c.position,
          url: c.url,
          title: c.title,
        })),
        skipDuplicates: true,
      });
    }

    await job.updateProgress(60);

    // Step 8: Analyze target domain for SEO issues
    let seoData = null;
    try {
      const homepageHtml = await scrapeDomainHomepage(domain);
      seoData = parseDomainSeo(homepageHtml, domain);
    } catch (err) {
      logger.warn({ domain, error: err.message }, 'Could not scrape domain homepage');
    }

    const { issues } = analyzeSeo(seoData, keyword, domain);

    if (issues.length > 0) {
      await prisma.seoIssue.createMany({
        data: issues.map((issue) => ({
          checkId,
          issueType: issue.issueType,
          severity: issue.severity,
          description: issue.description,
          recommendation: issue.recommendation,
          estimatedImpact: issue.estimatedImpact,
          fixDifficulty: issue.fixDifficulty,
          fixTimeline: issue.fixTimeline,
        })),
        skipDuplicates: true,
      });
    }

    await job.updateProgress(75);

    // Step 9: Calculate metrics
    const metrics = calculateMetrics(currentPosition, null);

    // Step 10: Calculate lead score
    const issueCount = issues.length;
    const leadScore = calculateLeadScore(
      currentPosition,
      metrics.estimatedRevenueLoss,
      domain,
      issueCount
    );
    const leadStatus = getLeadStatus(leadScore);

    // Step 11: Update rank check with results
    await prisma.rankCheck.update({
      where: { id: checkId },
      data: {
        status: 'completed',
        progress: 100,
        currentPosition,
        estimatedTrafficLoss: metrics.estimatedTrafficLoss,
        estimatedRevenueLoss: metrics.estimatedRevenueLoss,
        completedAt: new Date(),
      },
    });

    // Create report
    await prisma.report.upsert({
      where: { checkId },
      update: {},
      create: { checkId },
    });

    await job.updateProgress(85);

    // Step 12: Update lead score if lead is associated
    const rankCheck = await prisma.rankCheck.findUnique({
      where: { id: checkId },
      include: { lead: true },
    });

    if (rankCheck?.lead) {
      const lead = rankCheck.lead;

      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          leadScore,
          leadStatus,
        },
      });

      // Step 13: Trigger notifications for hot leads
      if (leadScore >= 80) {
        logger.info({ checkId, leadId: lead.id, leadScore }, 'Hot lead detected!');

        // Send Slack alert
        await sendSlackAlert(
          lead,
          { ...rankCheck, estimatedRevenueLoss: metrics.estimatedRevenueLoss },
          leadScore
        );

        // Trigger email sequence
        await triggerEmailSequence(
          lead,
          { ...rankCheck, ...metrics },
          leadScore
        );
      } else if (leadScore >= 60 && lead.email) {
        // Warm lead - trigger email
        await triggerEmailSequence(
          lead,
          { ...rankCheck, ...metrics },
          leadScore
        );
      }
    }

    await job.updateProgress(100);

    logger.info(
      {
        checkId,
        keyword,
        domain,
        currentPosition,
        leadScore,
        issueCount,
        fromCache,
      },
      'Rank check completed successfully'
    );

    return {
      checkId,
      currentPosition,
      leadScore,
      issueCount,
      fromCache,
    };
  } catch (err) {
    logger.error({ err, checkId, keyword, domain }, 'Rank check processing failed');

    await prisma.rankCheck.update({
      where: { id: checkId },
      data: {
        status: 'failed',
        errorMessage: err.message,
      },
    }).catch(() => {});

    throw err;
  }
}

module.exports = { processRankCheck };
