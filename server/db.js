const mongoose = require('mongoose');

let ready = false;

async function connectMongo(uri) {
    if (!uri) return false;
    if (ready) return true;

    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
    });
    ready = true;
    console.log('MongoDB connected');
    return true;
}

function isMongoReady() {
    return ready && mongoose.connection.readyState === 1;
}

module.exports = { connectMongo, isMongoReady };

