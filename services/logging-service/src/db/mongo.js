const mongoose = require('mongoose');
const mongo_uri = process.env.MONGODB_URI || 'mongodb://host.docker.internal:27017/comms_system';

const connectDB = async () => {
    try {
        await mongoose.connect(mongo_uri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

module.exports = connectDB;
