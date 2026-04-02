const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const rankCheckRoutes = require('./rankCheck.routes');
const leadRoutes = require('./lead.routes');

router.use('/', healthRoutes);
router.use('/check-ranking', rankCheckRoutes);
router.use('/', leadRoutes);

module.exports = router;
