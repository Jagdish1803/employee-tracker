const { ISSUE_SEVERITY } = require('../../../../packages/shared/constants');
const logger = require('../config/logger');

/**
 * Analyze SEO data and generate issues + metrics
 */
function analyzeSeo(seoData, keyword, domain) {
  const issues = [];

  if (!seoData) {
    issues.push({
      issueType: 'website_unreachable',
      severity: 'critical',
      description: 'Website could not be scraped or is not accessible',
      recommendation: 'Ensure your website is publicly accessible and loading properly',
      estimatedImpact: 'High - Search engines cannot crawl your site',
      fixDifficulty: 'medium',
      fixTimeline: '1-2 days',
    });
    return { issues };
  }

  const {
    title,
    metaDescription,
    h1Tags,
    wordCount,
    imagesTotal,
    imagesWithoutAlt,
    hasViewport,
    schemaMarkup,
    bodyTextLength,
  } = seoData;

  // Title tag checks
  if (!title) {
    issues.push({
      issueType: 'missing_title_tag',
      severity: 'critical',
      description: 'Your page is missing a title tag',
      recommendation: 'Add a descriptive title tag (50-60 characters) that includes your target keyword',
      estimatedImpact: 'Critical - Title tags are one of the most important on-page SEO factors',
      fixDifficulty: 'easy',
      fixTimeline: '1 hour',
    });
  } else if (title.length < 30) {
    issues.push({
      issueType: 'title_too_short',
      severity: 'high',
      description: `Your title tag is too short (${title.length} characters). Optimal length is 50-60 characters`,
      recommendation: `Expand your title tag to include your target keyword "${keyword}" and location if applicable`,
      estimatedImpact: 'High - Short titles miss keyword targeting opportunities',
      fixDifficulty: 'easy',
      fixTimeline: '1 hour',
    });
  } else if (title.length > 60) {
    issues.push({
      issueType: 'title_too_long',
      severity: 'medium',
      description: `Your title tag is too long (${title.length} characters). Google truncates titles over 60 characters`,
      recommendation: 'Shorten your title tag to 50-60 characters while keeping the primary keyword',
      estimatedImpact: 'Medium - Truncated titles reduce click-through rates',
      fixDifficulty: 'easy',
      fixTimeline: '1 hour',
    });
  }

  // Keyword in title check
  if (title && !title.toLowerCase().includes(keyword.toLowerCase())) {
    issues.push({
      issueType: 'keyword_not_in_title',
      severity: 'high',
      description: `Your target keyword "${keyword}" is not in the title tag`,
      recommendation: `Include "${keyword}" in your title tag, ideally near the beginning`,
      estimatedImpact: 'High - Keywords in title tags significantly impact rankings',
      fixDifficulty: 'easy',
      fixTimeline: '1 hour',
    });
  }

  // Meta description checks
  if (!metaDescription) {
    issues.push({
      issueType: 'missing_meta_description',
      severity: 'high',
      description: 'Your page is missing a meta description',
      recommendation: 'Add a compelling meta description (150-160 characters) that includes your target keyword and a call to action',
      estimatedImpact: 'High - Meta descriptions improve click-through rates from search results',
      fixDifficulty: 'easy',
      fixTimeline: '1 hour',
    });
  } else if (metaDescription.length < 120) {
    issues.push({
      issueType: 'meta_description_too_short',
      severity: 'medium',
      description: `Meta description is too short (${metaDescription.length} characters)`,
      recommendation: 'Expand your meta description to 150-160 characters to maximize search snippet real estate',
      estimatedImpact: 'Medium - Short meta descriptions waste valuable SERP space',
      fixDifficulty: 'easy',
      fixTimeline: '1 hour',
    });
  } else if (metaDescription.length > 160) {
    issues.push({
      issueType: 'meta_description_too_long',
      severity: 'low',
      description: `Meta description is too long (${metaDescription.length} characters)`,
      recommendation: 'Shorten your meta description to 150-160 characters to prevent truncation',
      estimatedImpact: 'Low - Google may truncate the description',
      fixDifficulty: 'easy',
      fixTimeline: '30 minutes',
    });
  }

  // H1 tag checks
  if (h1Tags.length === 0) {
    issues.push({
      issueType: 'missing_h1_tag',
      severity: 'high',
      description: 'Your page is missing an H1 heading tag',
      recommendation: 'Add a single H1 tag that clearly describes the page content and includes your target keyword',
      estimatedImpact: 'High - H1 tags signal the main topic of your page to search engines',
      fixDifficulty: 'easy',
      fixTimeline: '1 hour',
    });
  } else if (h1Tags.length > 1) {
    issues.push({
      issueType: 'multiple_h1_tags',
      severity: 'medium',
      description: `Your page has ${h1Tags.length} H1 tags. Best practice is to use only one`,
      recommendation: 'Consolidate to a single H1 tag and use H2-H6 for subheadings',
      estimatedImpact: 'Medium - Multiple H1s can confuse search engines about your page topic',
      fixDifficulty: 'easy',
      fixTimeline: '1-2 hours',
    });
  }

  // Keyword in H1 check
  if (h1Tags.length > 0 && !h1Tags[0].toLowerCase().includes(keyword.toLowerCase())) {
    issues.push({
      issueType: 'keyword_not_in_h1',
      severity: 'medium',
      description: `Your target keyword "${keyword}" is not in the H1 tag`,
      recommendation: `Include "${keyword}" in your H1 tag to reinforce the page topic`,
      estimatedImpact: 'Medium - Keywords in H1 help confirm page relevance',
      fixDifficulty: 'easy',
      fixTimeline: '30 minutes',
    });
  }

  // Content length check
  if (wordCount < 300) {
    issues.push({
      issueType: 'thin_content',
      severity: 'high',
      description: `Your page has very thin content (${wordCount} words). Minimum recommended is 300 words`,
      recommendation: 'Add more valuable, keyword-rich content. Top-ranking pages for competitive keywords often have 1000+ words',
      estimatedImpact: 'High - Thin content rarely ranks for competitive keywords',
      fixDifficulty: 'hard',
      fixTimeline: '1-2 weeks',
    });
  } else if (wordCount < 600) {
    issues.push({
      issueType: 'low_content_depth',
      severity: 'medium',
      description: `Your page content is below average (${wordCount} words)`,
      recommendation: 'Expand your content to cover the topic comprehensively. Aim for 800-1500 words with valuable information',
      estimatedImpact: 'Medium - Comprehensive content tends to rank better',
      fixDifficulty: 'medium',
      fixTimeline: '1 week',
    });
  }

  // Mobile viewport check
  if (!hasViewport) {
    issues.push({
      issueType: 'not_mobile_friendly',
      severity: 'critical',
      description: 'Your website does not have a mobile viewport meta tag',
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to make your site mobile-friendly',
      estimatedImpact: 'Critical - Google uses mobile-first indexing; non-mobile-friendly sites rank significantly lower',
      fixDifficulty: 'medium',
      fixTimeline: '1 day',
    });
  }

  // Image alt tags
  if (imagesWithoutAlt > 0) {
    issues.push({
      issueType: 'images_missing_alt_text',
      severity: imagesWithoutAlt > 5 ? 'medium' : 'low',
      description: `${imagesWithoutAlt} out of ${imagesTotal} images are missing alt text`,
      recommendation: 'Add descriptive alt text to all images, including relevant keywords where appropriate',
      estimatedImpact: 'Medium - Alt text helps images rank in Google Images and aids accessibility',
      fixDifficulty: 'easy',
      fixTimeline: '2-3 hours',
    });
  }

  // Schema markup
  if (schemaMarkup === 0) {
    issues.push({
      issueType: 'no_schema_markup',
      severity: 'medium',
      description: 'Your page has no structured data (Schema.org markup)',
      recommendation: 'Add relevant Schema.org markup (LocalBusiness, Product, FAQ, etc.) to enable rich snippets in search results',
      estimatedImpact: 'Medium - Schema markup can increase click-through rates by 20-30% through rich snippets',
      fixDifficulty: 'medium',
      fixTimeline: '1-2 days',
    });
  }

  return { issues };
}

/**
 * Calculate estimated traffic and revenue loss based on position
 */
function calculateMetrics(position, searchVolume) {
  if (!searchVolume) searchVolume = 1000; // Default estimate

  // Click-through rate by position (approximate)
  const ctrByPosition = {
    1: 0.316,
    2: 0.158,
    3: 0.097,
    4: 0.071,
    5: 0.056,
    6: 0.045,
    7: 0.038,
    8: 0.032,
    9: 0.027,
    10: 0.022,
  };

  const topPosCtr = ctrByPosition[1] || 0.316;
  const currentCtr = position && position <= 10 ? (ctrByPosition[position] || 0.01) : 0.005;

  const monthlyTrafficPotential = Math.round(searchVolume * topPosCtr);
  const currentMonthlyTraffic = Math.round(searchVolume * currentCtr);
  const monthlyTrafficLoss = Math.max(0, monthlyTrafficPotential - currentMonthlyTraffic);

  // Average revenue per visitor (conservative $2 estimate)
  const revenuePerVisitor = 2;
  const monthlyRevenueLoss = monthlyTrafficLoss * revenuePerVisitor;
  const yearlyRevenueLoss = monthlyRevenueLoss * 12;

  return {
    estimatedTrafficLoss: monthlyTrafficLoss,
    estimatedRevenueLoss: yearlyRevenueLoss,
    monthlyTrafficPotential,
    currentMonthlyTraffic,
  };
}

/**
 * Calculate lead score (0-100)
 */
function calculateLeadScore(position, estimatedYearlyLoss, domain, issueCount, reportViews = 0, ctaClicks = 0) {
  let score = 0;

  // Position score (40 points max) - worse ranking = higher score
  if (!position || position > 100) score += 40;
  else if (position > 50) score += 30;
  else if (position > 20) score += 20;
  else if (position > 10) score += 10;

  // Revenue loss score (30 points max)
  if (estimatedYearlyLoss > 100000) score += 30;
  else if (estimatedYearlyLoss > 50000) score += 20;
  else if (estimatedYearlyLoss > 10000) score += 10;

  // Domain quality score (15 points max)
  if (domain.endsWith('.com')) score += 5;
  if (!domain.includes('-')) score += 5;
  if (domain.length < 15) score += 5;

  // SEO issues score (10 points max)
  if (issueCount > 8) score += 10;
  else if (issueCount > 5) score += 7;
  else if (issueCount > 3) score += 4;

  // Engagement score (5 points max)
  if (reportViews > 2) score += 3;
  if (ctaClicks > 0) score += 2;

  return Math.min(score, 100);
}

/**
 * Determine lead status based on score
 */
function getLeadStatus(score) {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'warm';
  return 'cold';
}

module.exports = {
  analyzeSeo,
  calculateMetrics,
  calculateLeadScore,
  getLeadStatus,
};
