const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { healthCheck, readinessCheck } = require('../controllers/health.controller');

const healthRateLimit = rateLimit({
  windowMs: 60000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/health', healthRateLimit, healthCheck);
router.get('/ready', healthRateLimit, readinessCheck);

module.exports = router;
