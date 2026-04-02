const { getPrismaClient } = require('../config/database');
const { getRankCheckQueue } = require('../config/queue');
const { successResponse, errorResponse } = require('../utils/response');
const { rankCheckSchema } = require('../validators/rankCheck.validator');
const { ESTIMATED_CHECK_TIME_SECONDS } = require('../utils/constants');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

async function createRankCheck(req, res, next) {
  try {
    const { keyword, domain, location, device } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const sessionId = req.headers['x-session-id'] || uuidv4();

    const prisma = getPrismaClient();

    // Create rank check record
    const rankCheck = await prisma.rankCheck.create({
      data: {
        keyword,
        domain,
        location,
        device,
        status: 'queued',
        ipAddress,
        sessionId,
      },
    });

    // Enqueue job
    const queue = getRankCheckQueue();
    const job = await queue.add(
      'rank-check',
      {
        checkId: rankCheck.id,
        keyword,
        domain,
        location,
        device,
      },
      {
        jobId: rankCheck.id,
        priority: 1,
      }
    );

    // Update with job ID
    await prisma.rankCheck.update({
      where: { id: rankCheck.id },
      data: { jobId: job.id },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'check_started',
        checkId: rankCheck.id,
        sessionId,
        ipAddress,
        userAgent: req.headers['user-agent'],
        eventData: { keyword, domain, location, device },
      },
    });

    logger.info({ checkId: rankCheck.id, keyword, domain }, 'Rank check queued');

    return successResponse(
      res,
      {
        checkId: rankCheck.id,
        status: 'queued',
        estimatedTime: ESTIMATED_CHECK_TIME_SECONDS,
      },
      201
    );
  } catch (err) {
    next(err);
  }
}

async function getRankCheck(req, res, next) {
  try {
    const { checkId } = req.params;
    const prisma = getPrismaClient();

    const rankCheck = await prisma.rankCheck.findUnique({
      where: { id: checkId },
      include: {
        serpResults: {
          orderBy: { position: 'asc' },
          take: 10,
        },
        competitors: {
          orderBy: { position: 'asc' },
        },
        seoIssues: {
          orderBy: { severity: 'asc' },
        },
        report: {
          select: {
            id: true,
            viewCount: true,
            emailCapturedAt: true,
          },
        },
      },
    });

    if (!rankCheck) {
      return errorResponse(res, 'Rank check not found', 404);
    }

    let result = null;
    if (rankCheck.status === 'completed') {
      result = {
        position: rankCheck.currentPosition,
        positionChange: rankCheck.positionChange,
        searchVolume: rankCheck.searchVolume,
        estimatedTrafficLoss: rankCheck.estimatedTrafficLoss,
        estimatedRevenueLoss: rankCheck.estimatedRevenueLoss,
        topResults: rankCheck.serpResults,
        competitors: rankCheck.competitors,
        seoIssues: rankCheck.seoIssues,
      };
    }

    return successResponse(res, {
      checkId: rankCheck.id,
      status: rankCheck.status,
      progress: rankCheck.progress,
      keyword: rankCheck.keyword,
      domain: rankCheck.domain,
      location: rankCheck.location,
      device: rankCheck.device,
      createdAt: rankCheck.createdAt,
      completedAt: rankCheck.completedAt,
      result,
      error: rankCheck.errorMessage || undefined,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { createRankCheck, getRankCheck };
