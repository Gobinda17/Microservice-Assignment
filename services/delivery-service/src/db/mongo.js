const mongoose = require('mongoose');
const mongo_uri = process.env.MONGO_URI;

const connectToMongo = async () => {
    try {
        await mongoose.connect(mongo_uri);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

module.exports = connectToMongo;