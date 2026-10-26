const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Imovies';

  try {
    return await mongoose
      .connect(uri, { serverSelectionTimeoutMS: 2500 })
      .then(() => {
        console.log('Connected to MongoDB');
        return mongoose.connection;
      })
      .catch(async (err) => {
        console.error('MongoDB connection error:', err.message || err);
        if (process.env.NODE_ENV !== 'production') {
          try {
            console.log('Starting in-memory MongoDB fallback for local development...');
            const downloadDir = path.resolve(__dirname, '..', '.mongo-bin');
            const binaryPath = path.join(downloadDir, 'mongod.exe');

            if (!fs.existsSync(downloadDir)) {
              fs.mkdirSync(downloadDir, { recursive: true });
            }
            process.env.MONGOMS_DOWNLOAD_DIR = downloadDir;
            if (fs.existsSync(binaryPath)) {
              process.env.MONGOMS_SYSTEM_BINARY = binaryPath;
            }

            const { MongoMemoryServer } = require('mongodb-memory-server');
            memoryServer = await MongoMemoryServer.create({
              binary: {
                systemBinary: fs.existsSync(binaryPath) ? binaryPath : undefined,
                downloadDir
              }
            });
            const memoryUri = memoryServer.getUri();
            return await mongoose
              .connect(memoryUri)
              .then(() => {
                console.log('Connected to MongoDB (In-Memory Fallback)');
                return mongoose.connection;
              })
              .catch((fallbackErr) => {
                console.error('MongoDB connection error:', fallbackErr);
                throw fallbackErr;
              });
          } catch (memErr) {
            console.error('Could not initialize in-memory fallback:', memErr.message);
            throw err;
          }
        }
        throw err;
      });
  } catch (error) {
    console.error('Fatal MongoDB error:', error.message);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (e) {
    // ignore
  }
  if (memoryServer) {
    try {
      await memoryServer.stop();
    } catch (e) {
      // ignore
    }
  }
};

module.exports = { connectDB, disconnectDB };
