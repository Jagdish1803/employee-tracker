const express = require('express');
const router = express.Router();
const { createRankCheck, getRankCheck } = require('../controllers/rankCheck.controller');
const { validate } = require('../middleware/validation');
const { rankCheckSchema } = require('../validators/rankCheck.validator');
const { defaultRateLimit } = require('../middleware/rateLimit');

router.post('/', defaultRateLimit, validate(rankCheckSchema), createRankCheck);
router.get('/:checkId', getRankCheck);

module.exports = router;
