const client = require('../esClinet');
const Log = require('../models/Log');

const createLog = async (req, res) => {
    const log = req.body;

    if (!log.serviceName) {
        return res.status(400).json({ error: 'serviceName is required' });
    }

    // Normalize timestamp
    const timestampStr = log.timestamp || new Date().toISOString();
    const timestamp = new Date(timestampStr);
    const date = timestampStr.slice(0, 10); // YYYY-MM-DD
    const serviceName = log.serviceName;
    const indexName = `logs-${serviceName}-${date}`;

    try {
        // 1️⃣ Save in MongoDB
        await Log.create({
            serviceName,
            traceId: log.traceId,
            spanId: log.spanId,
            level: log.level || 'info',
            event: log.event,
            message: log.message,
            bodyHash: log.bodyHash,
            timestamp,
            meta: log.meta || {},
        });

        // 2️⃣ Save in Elasticsearch
        await client.index({
            index: indexName,
            document: {
                ...log,
                '@timestamp': timestampStr, // Kibana time field
            },
        });

        return res.json({ status: 'ok' });
    } catch (err) {
        console.error('❌ Error handling log:', err);
        return res.status(500).json({ status: 'error', error: err.message });
    }
}

module.exports = { createLog };