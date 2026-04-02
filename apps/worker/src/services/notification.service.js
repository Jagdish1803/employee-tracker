const axios = require('axios');
const logger = require('../config/logger');

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * Send Slack notification for hot leads
 */
async function sendSlackAlert(lead, rankCheck, leadScore) {
  if (!SLACK_WEBHOOK_URL) {
    logger.warn('Slack webhook not configured, skipping notification');
    return;
  }

  const isUltraHot = leadScore >= 90;
  const emoji = isUltraHot ? '🔥🔥🔥' : '🔥';
  const yearlyLoss = rankCheck.estimatedRevenueLoss
    ? `$${Math.round(rankCheck.estimatedRevenueLoss).toLocaleString()}/year`
    : 'Unknown';

  const message = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} Hot Lead Alert! Score: ${leadScore}/100`,
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Domain:*\n${rankCheck.domain}`,
          },
          {
            type: 'mrkdwn',
            text: `*Keyword:*\n${rankCheck.keyword}`,
          },
          {
            type: 'mrkdwn',
            text: `*Current Position:*\n#${rankCheck.currentPosition || 'Not ranked'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Revenue Loss:*\n${yearlyLoss}`,
          },
        ],
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Contact:*\n${lead.email || lead.phone || 'No contact info yet'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Lead Score:*\n${leadScore}/100 (${leadScore >= 80 ? 'HOT' : 'WARM'})`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '👀 View Lead',
              emoji: true,
            },
            url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/internal/leads/${lead.id}`,
            style: 'primary',
          },
        ],
      },
    ],
  };

  try {
    await axios.post(SLACK_WEBHOOK_URL, message, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    logger.info({ leadId: lead.id, leadScore }, 'Slack alert sent');
  } catch (err) {
    logger.error({ err, leadId: lead.id }, 'Failed to send Slack alert');
  }
}

module.exports = { sendSlackAlert };
