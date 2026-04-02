// Lead statuses
const LEAD_STATUS = {
  COLD: 'cold',
  WARM: 'warm',
  HOT: 'hot',
  CONTACTED: 'contacted',
  WON: 'won',
  LOST: 'lost',
};

// Check statuses
const CHECK_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

// SEO issue severities
const ISSUE_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Queue names
const QUEUE_NAMES = {
  RANK_CHECK: 'rank-check',
  EMAIL: 'email',
  NOTIFICATION: 'notification',
};

// Cache TTLs (in seconds)
const CACHE_TTL = {
  SERP_RESULTS: 3600, // 1 hour
  RATE_LIMIT: 60,     // 1 minute
  SESSION: 86400,     // 24 hours
};

// Lead score thresholds
const LEAD_SCORE = {
  HOT_THRESHOLD: 80,
  WARM_THRESHOLD: 60,
};

// Analytics event types
const ANALYTICS_EVENTS = {
  CHECK_STARTED: 'check_started',
  CHECK_COMPLETED: 'check_completed',
  REPORT_VIEWED: 'report_viewed',
  EMAIL_CAPTURED: 'email_captured',
  CTA_CLICKED: 'cta_clicked',
  CONSULTATION_BOOKED: 'consultation_booked',
};

module.exports = {
  LEAD_STATUS,
  CHECK_STATUS,
  ISSUE_SEVERITY,
  QUEUE_NAMES,
  CACHE_TTL,
  LEAD_SCORE,
  ANALYTICS_EVENTS,
};
