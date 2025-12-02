const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
    {
        traceId: { type: String, index: true },
        channel: { type: String, required: true },
        payload: { type: Object, required: true },
        bodyHash: { type: String, index: true },
        status: {
            type: String,
            enum: ['received', 'success', 'failed'],
            default: 'received',
        },
        retryCount: {
            type: Number,
            default: 0,
        },
        maxRetries: {
            type: Number,
            default: 3,
        },
        error: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Delivery', deliverySchema, 'Delivery');
