const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
    {
        serviceName: { type: String, required: true },
        traceId: { type: String },
        spanId: { type: String },
        level: { type: String, default: 'info' },
        event: { type: String },
        message: { type: String },
        bodyHash: { type: String },
        timestamp: { type: Date, default: Date.now },
        meta: { type: Object },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Logs', logSchema, 'Logs');
