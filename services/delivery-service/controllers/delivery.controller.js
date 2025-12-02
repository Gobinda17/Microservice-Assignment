const { v4: uuid } = require('uuid');
const { log } = require('../src/utils/logger');
const Delivery = require('../src/models/Delivery');

const MAX_RETRY_COUNT = parseInt(process.env.MAX_RETRY_COUNT || '3', 10);

// 🔧 Stub for actual provider call (Email/SMS/WhatsApp)
// Replace this with real integration (SendGrid/Twilio/etc.)
const sendNotification = async ({ channel, payload }) => {
    // For now, always succeed (or randomly fail if you want to test retries)
    // throw new Error('Simulated provider error');  // uncomment to test failures
    return true;
}

const deliveryController = async (req, res) => {
    const { traceId, channel, payload, bodyHash } = req.body;
    const spanId = uuid();

    if (!channel || !payload) {
        return res.status(400).json({ error: 'channel and payload are required' });
    }

    // 1️⃣ Create delivery record with status 'received'
    const delivery = await Delivery.create({
        traceId,
        channel,
        payload,
        bodyHash: bodyHash || null,
        status: 'received',
        retryCount: 0,
        maxRetries: MAX_RETRY_COUNT,
    });

    await log({
        traceId,
        spanId,
        event: 'DELIVERY_REQUEST_RECEIVED',
        message: `Delivery request for channel ${channel}`,
        bodyHash,
        meta: { payload, deliveryId: delivery._id.toString() },
    });

    let attempt = 0;
    let success = false;
    let lastError = null;

    while (attempt < MAX_RETRY_COUNT && !success) {
        attempt += 1;

        await log({
            traceId,
            spanId,
            event: 'DELIVERY_ATTEMPT',
            message: `Attempt #${attempt} for channel ${channel}`,
            bodyHash,
            meta: {
                deliveryId: delivery._id.toString(),
                attempt,
                maxRetries: MAX_RETRY_COUNT,
            },
        });

        try {
            await sendNotification({ channel, payload });
            success = true;
            delivery.status = 'success';
            delivery.retryCount = attempt - 1; // retries done before success
            delivery.error = undefined;
            await delivery.save();

            await log({
                traceId,
                spanId,
                event: 'DELIVERY_SUCCESS',
                message: `Delivered via ${channel} on attempt #${attempt}`,
                bodyHash,
                meta: {
                    deliveryId: delivery._id.toString(),
                    attempt,
                },
            });

            return res.json({
                status: 'success',
                retryCount: delivery.retryCount,
                deliveryId: delivery._id.toString(),
            });
        } catch (err) {
            lastError = err;

            await log({
                traceId,
                spanId,
                level: 'error',
                event: 'DELIVERY_ATTEMPT_FAILED',
                message: `Attempt #${attempt} failed via ${channel}: ${err.message}`,
                bodyHash,
                meta: {
                    deliveryId: delivery._id.toString(),
                    attempt,
                    error: err.message,
                },
            });
        }
    }

    // ❌ All retries exhausted
    delivery.status = 'failed';
    delivery.retryCount = attempt;
    delivery.error = lastError ? lastError.message : 'Unknown error';
    await delivery.save();

    await log({
        traceId,
        spanId,
        level: 'error',
        event: 'DELIVERY_FAILED',
        message: `All ${MAX_RETRY_COUNT} attempts failed via ${channel}`,
        bodyHash,
        meta: {
            deliveryId: delivery._id.toString(),
            finalRetryCount: delivery.retryCount,
            error: delivery.error,
        },
    });

    return res.status(500).json({
        status: 'failed',
        retryCount: delivery.retryCount,
        error: delivery.error,
        deliveryId: delivery._id.toString(),
    });
}

module.exports = { deliveryController };