const mongoose = require('mongoose');

const connectDB = async () => {
    const uri =
        process.env.MONGODB_URI || 'mongodb://localhost:27017/comms_system';

    if (mongoose.connection.readyState === 1) return;

    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    console.log('✅ Logging Service connected to MongoDB');
}

module.exports = connectDB;
