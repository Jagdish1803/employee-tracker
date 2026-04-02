const sgMail = require('@sendgrid/mail');
const logger = require('../config/logger');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@seo-checker.com';
const FROM_NAME = process.env.FROM_NAME || 'SEO Rank Checker';

/**
 * Send an email via SendGrid
 */
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SENDGRID_API_KEY) {
    logger.warn('SendGrid not configured, skipping email send');
    return { skipped: true };
  }

  if (!text) {
    throw new Error('Plain text version must be provided for all emails');
  }

  try {
    await sgMail.send({
      to,
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      html,
      text,
    });

    logger.info({ to, subject }, 'Email sent successfully');
    return { sent: true };
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send email');
    throw err;
  }
}

/**
 * Send hot lead immediate email
 */
async function sendHotLeadEmail(lead, rankCheck) {
  const subject = `🚨 Your Website Is Losing Money – Here's the Proof`;

  const yearlyLoss = rankCheck.estimatedRevenueLoss
    ? `$${Math.round(rankCheck.estimatedRevenueLoss).toLocaleString()}`
    : 'thousands of dollars';

  const consultationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/consultation?lead=${lead.id}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #e53e3e;">Your Website Is Losing Money</h1>
      <p>Hi ${lead.name || 'there'},</p>
      <p>We just analyzed <strong>${rankCheck.domain}</strong> for the keyword 
         "<strong>${rankCheck.keyword}</strong>" and found some concerning results.</p>
      
      <div style="background: #fff5f5; border-left: 4px solid #e53e3e; padding: 20px; margin: 20px 0;">
        <h2 style="color: #e53e3e; margin-top: 0;">Your Current Situation</h2>
        <ul>
          <li>Current Position: #${rankCheck.currentPosition || 'Not ranked'}</li>
          <li>Estimated Yearly Revenue Loss: ${yearlyLoss}</li>
          <li>Monthly Traffic You're Missing: ${Math.round((rankCheck.estimatedTrafficLoss || 0)).toLocaleString()} visitors</li>
        </ul>
      </div>
      
      <p>While you're not ranking, your competitors are capturing every customer searching for 
         "${rankCheck.keyword}" right now.</p>
      
      <p>We can fix this. Our SEO team has helped dozens of businesses in your 
         industry reach page 1 within 90 days.</p>
      
      <p><a href="${consultationUrl}">Book your free SEO strategy call now.</a></p>
      
      <p>Best regards,<br>The SEO Team</p>
    </div>
  `;

  const text = [
    `Your Website Is Losing Money`,
    ``,
    `Hi ${lead.name || 'there'},`,
    ``,
    `We analyzed ${rankCheck.domain} for "${rankCheck.keyword}" and found issues.`,
    ``,
    `Current Position: #${rankCheck.currentPosition || 'Not ranked'}`,
    `Estimated Yearly Revenue Loss: ${yearlyLoss}`,
    `Monthly Traffic Loss: ${Math.round((rankCheck.estimatedTrafficLoss || 0)).toLocaleString()} visitors`,
    ``,
    `Book your free SEO strategy call: ${consultationUrl}`,
    ``,
    `Best regards, The SEO Team`,
  ].join('\n');

  return sendEmail({ to: lead.email, subject, html, text });
}

/**
 * Send warm lead day 1 email
 */
async function sendWarmLeadEmail(lead, rankCheck) {
  const subject = `Your Free SEO Report is Ready – Here's What We Found`;

  const consultationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/consultation?lead=${lead.id}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2b6cb0;">Your SEO Report for ${rankCheck.domain}</h1>
      <p>Hi ${lead.name || 'there'},</p>
      <p>Thank you for using our free SEO rank checker. Here's a summary of what we found 
         for <strong>${rankCheck.keyword}</strong>:</p>
      
      <div style="background: #ebf8ff; border-left: 4px solid #2b6cb0; padding: 20px; margin: 20px 0;">
        <ul>
          <li>Current Position: #${rankCheck.currentPosition || 'Not in top 100'}</li>
          <li>Estimated Monthly Traffic Loss: ${Math.round((rankCheck.estimatedTrafficLoss || 0)).toLocaleString()} visitors</li>
        </ul>
      </div>
      
      <p>The good news? These issues are fixable. Would you like to see exactly how?</p>
      
      <p><a href="${consultationUrl}">Schedule a free strategy call.</a></p>
      
      <p>Best regards,<br>The SEO Team</p>
    </div>
  `;

  const text = [
    `Your SEO Report for ${rankCheck.domain}`,
    ``,
    `Hi ${lead.name || 'there'},`,
    ``,
    `Here's what we found for "${rankCheck.keyword}":`,
    ``,
    `Current Position: #${rankCheck.currentPosition || 'Not in top 100'}`,
    `Estimated Monthly Traffic Loss: ${Math.round((rankCheck.estimatedTrafficLoss || 0)).toLocaleString()} visitors`,
    ``,
    `Schedule a free strategy call: ${consultationUrl}`,
    ``,
    `Best regards, The SEO Team`,
  ].join('\n');

  return sendEmail({ to: lead.email, subject, html, text });
}

/**
 * Trigger email sequence based on lead score
 */
async function triggerEmailSequence(lead, rankCheck, leadScore) {
  if (!lead.email) {
    logger.info({ leadId: lead.id }, 'No email for lead, skipping sequence');
    return;
  }

  if (leadScore >= 80) {
    // Hot lead - immediate email
    await sendHotLeadEmail(lead, rankCheck).catch((err) =>
      logger.error({ err, leadId: lead.id }, 'Failed to send hot lead email')
    );
  } else if (leadScore >= 60) {
    // Warm lead - day 1 email
    await sendWarmLeadEmail(lead, rankCheck).catch((err) =>
      logger.error({ err, leadId: lead.id }, 'Failed to send warm lead email')
    );
  }
}

module.exports = { sendEmail, sendHotLeadEmail, sendWarmLeadEmail, triggerEmailSequence };
