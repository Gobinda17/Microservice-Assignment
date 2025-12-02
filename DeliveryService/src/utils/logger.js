const axios = require('axios');

const LOGGING_SERVICE_URL = process.env.LOGGING_SERVICE_URL;

const log = async ({ traceId, spanId, level, event, message, meta, bodyHash }) => {
    try {
        await axios.post(`${LOGGING_SERVICE_URL}/logs`, {
            serviceName: process.env.SERVICE_NAME,
            traceId,
            spanId,
            level,
            event,
            message,
            bodyHash,
            timestamp: new Date().toISOString(),
            meta,
        });
    } catch (error) {
        console.error('Failed to send log from delivery-service:', error.message);
    }
}

module.exports = { log };