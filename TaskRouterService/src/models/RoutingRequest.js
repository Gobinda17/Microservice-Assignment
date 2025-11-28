const mongoose = require('mongoose');

const routingRequestSchema = new mongoose.Schema({
    traceId: String,
    channel: String,
    bodyHash: { type: String, index: true },
    rawPayload: isObjectIdOrHexString,
    status: { type: String, default: 'PENDING' },
    retryCount: { type: Number, default: 0 },
});

module.exports = mongoose.model('RoutingRequest', routingRequestSchema, 'RoutingRequest');