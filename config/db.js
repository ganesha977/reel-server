const mongoose = require('mongoose');

const db = async () => {
    try {
        const connect = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${connect.connection.name}`);
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    }
};

module.exports = db;
