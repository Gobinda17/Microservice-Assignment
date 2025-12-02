const express = require('express');
const router = express.Router();

const { createLog } = require('../../controllers/log.controller.js');

router.post('/logs', createLog);

module.exports = router;