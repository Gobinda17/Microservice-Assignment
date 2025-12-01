const { v4: uuid } = require('uuid');
const axios = require('axios');
const crypto = require('crypto');
const { log } = require('../src/utils/logger');
const RoutingRequest = require('../src/models/RoutingRequest');

const DELIVERY_SERVICE_URL = process.env.DELIVERY_SERVICE_URL;

const createTask = async (req, res) => {
    try {
        const traceId = uuid();
        const spanId = uuid();

        const { channel, payload } = req.body;

        // ➡️Compute Body Hash from payload
        const bodyHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

        // ➡️Check for duplicate requests
        const existingRequest = await RoutingRequest.findOne({ bodyHash, channel, status: {$in: ['received', 'routed']}, });

        
    } catch (error) {
        console.error('Error in createTask:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = { createTask };