const { v4: uuid } = require('uuid');
const axios = require('axios');
const crypto = require('crypto');
const { log } = require('../src/utils/logger');
const RoutingRequest = require('../src/models/RoutingRequest');

const DELIVERY_SERVICE_URL = process.env.DELIVERY_SERVICE_URL;

const createTask = async (req, res) => {
    const traceId = uuid();
    const spanId = uuid();

    const { channel, payload } = req.body;

    // ➡️Compute Body Hash from payload
    const bodyHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

    // ➡️Check for duplicate requests
    const existingRequest = await RoutingRequest.findOne({ bodyHash, channel, status: { $in: ['received', 'routed'] }, });

    if (existingRequest) {
        await log({ traceId: existingRequest.traceId, spanId, level: 'info', event: 'DUPLICATE_REQUEST', message: 'Duplicate routing request detected', meta: { existingTaskId: existingRequest._id, channel, bodyHash } });

        return res.status(409).json({ message: 'Duplicate request', taskId: existingRequest._id, traceId: existingRequest.traceId, status: 'duplicate-suppressed' });
    }

    // ➡️Create new RoutingRequest
    const task = await RoutingRequest.create({ traceId, channel, payload, bodyHash, status: 'received' });

    await log({ traceId, spanId, event: 'REQUEST_RECEIVED', level: 'info', message: 'Routing request received', meta: { body: req.body, taskId: task._id, bodyHash } });

    try {
        await log({ traceId, spanId, event: 'CALL_DELIVERY_SERVICE', level: 'info', message: `Calling Delivery Service for channel ${channel}`, meta: { channel, bodyHash } });

        await axios.post(`${DELIVERY_SERVICE_URL}/deliver`, { traceId, channel, payload, bodyHash, taskId: task._id });

        task.status = 'routed';
        await task.save();

        await log({ traceId, spanId, event: 'ROUTE_COMPLETED', level: 'info', message: `Routing completed via ${channel}`, meta: { taskId: task._id, channel, bodyHash } });

        return res.status(201).json({ message: 'Task created and routed', traceId, status: 'routed' });
    } catch (error) {
        task.status = 'failed';
        task.error = error.message;
        await task.save();

        await log({
            traceId,
            spanId,
            level: 'error',
            event: 'ROUTE_FAILED',
            message: `Routing failed: ${err.message}`,
            meta: { taskId: task._id, bodyHash },
        });

        return res.status(500).json({ traceId, status: 'failed', error: err.message });
    }
}

module.exports = { createTask };