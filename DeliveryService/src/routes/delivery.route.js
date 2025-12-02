const express = require('express');
const router = express.Router();
const { deliveryController } = require('../../controllers/delivery.controller.js');


router.post('/deliver', deliveryController);

module.exports = router;
