const { getPrismaClient } = require('../config/database');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response');
const logger = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

async function captureLead(req, res, next) {
  try {
    const { checkId, email, phone, name, company } = req.body;
    const prisma = getPrismaClient();

    // Verify rank check exists
    const rankCheck = await prisma.rankCheck.findUnique({
      where: { id: checkId },
    });

    if (!rankCheck) {
      return errorResponse(res, 'Rank check not found', 404);
    }

    // Find or create lead
    let lead;
    if (email) {
      lead = await prisma.lead.upsert({
        where: { email },
        update: {
          phone: phone || undefined,
          name: name || undefined,
          company: company || undefined,
          totalChecks: { increment: 1 },
          updatedAt: new Date(),
        },
        create: {
          email,
          phone,
          name,
          company,
          totalChecks: 1,
          utmSource: rankCheck.sessionId ? undefined : 'organic',
        },
      });
    } else {
      lead = await prisma.lead.create({
        data: {
          phone,
          name,
          company,
          totalChecks: 1,
        },
      });
    }

    // Associate lead with rank check
    await prisma.rankCheck.update({
      where: { id: checkId },
      data: { leadId: lead.id },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        eventType: 'email_captured',
        checkId,
        leadId: lead.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        eventData: { email: email ? true : false },
      },
    });

    // Update report if exists
    await prisma.report.updateMany({
      where: { checkId },
      data: {
        leadId: lead.id,
        emailCapturedAt: new Date(),
      },
    });

    logger.info({ leadId: lead.id, checkId }, 'Lead captured');

    return successResponse(res, {
      leadId: lead.id,
      message: 'Contact information saved successfully',
    });
  } catch (err) {
    next(err);
  }
}

async function trackEvent(req, res, next) {
  try {
    const { event, checkId, leadId, sessionId, data } = req.body;
    const prisma = getPrismaClient();

    await prisma.analyticsEvent.create({
      data: {
        eventType: event,
        checkId: checkId || undefined,
        leadId: leadId || undefined,
        sessionId: sessionId || undefined,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        eventData: data || {},
      },
    });

    // Track CTA clicks on lead
    if (event === 'cta_clicked' && leadId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { ctaClicks: { increment: 1 } },
      }).catch(() => {});
    }

    // Track report views
    if (event === 'report_viewed' && checkId) {
      await prisma.report.updateMany({
        where: { checkId },
        data: {
          viewCount: { increment: 1 },
          viewedAt: new Date(),
        },
      });

      if (leadId) {
        await prisma.lead.update({
          where: { id: leadId },
          data: { reportViews: { increment: 1 } },
        }).catch(() => {});
      }
    }

    return successResponse(res, { tracked: true });
  } catch (err) {
    next(err);
  }
}

async function bookConsultation(req, res, next) {
  try {
    const { leadId, preferredTime, message } = req.body;
    const prisma = getPrismaClient();

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    await prisma.leadInteraction.create({
      data: {
        leadId,
        interactionType: 'consultation_booked',
        channel: 'web',
        subject: 'Consultation Request',
        message: `Preferred time: ${preferredTime}${message ? `\n\n${message}` : ''}`,
        outcome: 'pending',
      },
    });

    await prisma.analyticsEvent.create({
      data: {
        eventType: 'consultation_booked',
        leadId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        eventData: { preferredTime },
      },
    });

    logger.info({ leadId, preferredTime }, 'Consultation booked');

    return successResponse(res, {
      message: 'Consultation request received. We will contact you shortly.',
    });
  } catch (err) {
    next(err);
  }
}

// Internal endpoints
async function getLeads(req, res, next) {
  try {
    const { status, minScore, limit = 50, page = 1, assignedTo } = req.query;
    const prisma = getPrismaClient();

    const where = {};
    if (status) where.leadStatus = status;
    if (minScore) where.leadScore = { gte: parseInt(minScore, 10) };
    if (assignedTo) where.assignedTo = assignedTo;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: [{ leadScore: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: {
          rankChecks: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              keyword: true,
              domain: true,
              currentPosition: true,
              estimatedRevenueLoss: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return paginatedResponse(res, leads, total, parseInt(page, 10), parseInt(limit, 10));
  } catch (err) {
    next(err);
  }
}

async function getLead(req, res, next) {
  try {
    const { leadId } = req.params;
    const prisma = getPrismaClient();

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        rankChecks: {
          orderBy: { createdAt: 'desc' },
          include: {
            seoIssues: true,
            competitors: { take: 5 },
          },
        },
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    return successResponse(res, lead);
  } catch (err) {
    next(err);
  }
}

async function updateLead(req, res, next) {
  try {
    const { leadId } = req.params;
    const { leadStatus, assignedTo, notes, nextFollowUpAt, conversionValue } = req.body;
    const prisma = getPrismaClient();

    const updateData = {};
    if (leadStatus !== undefined) updateData.leadStatus = leadStatus;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (notes !== undefined) updateData.notes = notes;
    if (nextFollowUpAt !== undefined) updateData.nextFollowUpAt = new Date(nextFollowUpAt);
    if (conversionValue !== undefined) {
      updateData.conversionValue = conversionValue;
      if (leadStatus === 'won') updateData.convertedAt = new Date();
    }

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    return successResponse(res, lead);
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const prisma = getPrismaClient();

    const [
      totalLeads,
      hotLeads,
      totalChecks,
      completedChecks,
      leadsByStatus,
      recentLeads,
    ] = await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { leadStatus: 'hot' } }),
      prisma.rankCheck.count(),
      prisma.rankCheck.count({ where: { status: 'completed' } }),
      prisma.lead.groupBy({ by: ['leadStatus'], _count: true }),
      prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, email: true, leadScore: true, leadStatus: true, createdAt: true },
      }),
    ]);

    return successResponse(res, {
      leads: {
        total: totalLeads,
        hot: hotLeads,
        byStatus: leadsByStatus.reduce((acc, item) => {
          acc[item.leadStatus] = item._count;
          return acc;
        }, {}),
        recent: recentLeads,
      },
      checks: {
        total: totalChecks,
        completed: completedChecks,
        conversionRate: totalChecks > 0
          ? ((totalLeads / totalChecks) * 100).toFixed(1)
          : 0,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  captureLead,
  trackEvent,
  bookConsultation,
  getLeads,
  getLead,
  updateLead,
  getStats,
};
