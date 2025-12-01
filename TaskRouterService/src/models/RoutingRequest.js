const mongoose = require('mongoose');

const routingRequestSchema = new mongoose.Schema({
    traceId: { type: String, required: true, index: true },
    channel: { type: String, required: true },
    payload: { type: Object, required: true },
    bodyHash: { type: String, required: true, index: true },
    status: {
        type: String,
        enum: ['received', 'routed', 'failed'],
        default: 'received',
    },
    error: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('RoutingRequest', routingRequestSchema, 'RoutingRequest');