const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { MongoMemoryServer } = require('mongodb-memory-server');

const binaryPath = path.resolve(__dirname, '..', '.mongo-bin', 'mongod.exe');
const downloadDir = path.resolve(__dirname, '..', '.mongo-bin');

if (fs.existsSync(binaryPath)) {
  process.env.MONGOMS_SYSTEM_BINARY = binaryPath;
}
process.env.MONGOMS_DOWNLOAD_DIR = downloadDir;

let mongoServer;

const setupTestDB = () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
    process.env.MOCK_PAYMENT_MODE = 'true';

    mongoServer = await MongoMemoryServer.create({
      binary: {
        systemBinary: fs.existsSync(binaryPath) ? binaryPath : undefined,
        downloadDir
      }
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }, 60000);

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });
};

module.exports = { setupTestDB };
