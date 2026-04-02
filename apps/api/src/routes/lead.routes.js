const express = require('express');
const router = express.Router();
const {
  captureLead,
  trackEvent,
  bookConsultation,
  getLeads,
  getLead,
  updateLead,
  getStats,
} = require('../controllers/lead.controller');
const { validate } = require('../middleware/validation');
const {
  leadCaptureSchema,
  updateLeadSchema,
  bookConsultationSchema,
  trackEventSchema,
} = require('../validators/lead.validator');
const { strictRateLimit } = require('../middleware/rateLimit');

// Public endpoints
router.post('/lead-capture', strictRateLimit, validate(leadCaptureSchema), captureLead);
router.post('/track', validate(trackEventSchema), trackEvent);
router.post('/book-consultation', validate(bookConsultationSchema), bookConsultation);

// Internal endpoints (sales team)
router.get('/internal/leads', getLeads);
router.get('/internal/leads/:leadId', getLead);
router.patch('/internal/leads/:leadId', validate(updateLeadSchema), updateLead);
router.get('/internal/stats', getStats);

module.exports = router;
