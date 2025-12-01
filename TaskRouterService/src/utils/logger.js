const axios = require('axios');

const LOGGING_SERVICE_URL =
    process.env.LOGGING_SERVICE_URL;

async function log({ traceId, spanId, level = 'info', event, message, meta }) {
    try {
        await axios.post(`${LOGGING_SERVICE_URL}/logs`, {
            serviceName: process.env.SERVICE_NAME || 'task-router',
            traceId,
            spanId,
            level,
            event,
            message,
            timestamp: new Date().toISOString(),
            meta,
        });
    } catch (err) {
        console.error('Failed to send log from task-router:', err.message);
    }
}

module.exports = { log };