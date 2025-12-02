require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectToMongo = require('./src/db/mongo');
// const router = require('./src/routes/router.route');

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

// app.use('/task_service', router);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: process.env.SERVICE_NAME });
});

(async () => {
    try {
        await connectToMongo();
        app.listen(port, () => {
            console.log(`Task Router Service is running on port ${port}`);
        });
    } catch (error) {
        console.error('Failed to start the server:', error);
    }
})();