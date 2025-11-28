require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectToMongo = require('./src/db/mongo');

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

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