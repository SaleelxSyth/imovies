const validateEnv = () => {
  const required = ['JWT_SECRET'];
  const missing = [];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(`[Config Warning] Missing optional/required env variables: ${missing.join(', ')}. Using defaults.`);
  }

  return {
    PORT: process.env.PORT || 5000,
    MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/Imovies',
    JWT_SECRET: process.env.JWT_SECRET || 'imovies_default_jwt_secret_dev_key',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_imovies_mock_key',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'rzp_mock_secret_key_12345',
    MOCK_PAYMENT_MODE: process.env.MOCK_PAYMENT_MODE !== 'false',
    PAYMENT_MODE: process.env.PAYMENT_MODE || 'qr',
    SEAT_LOCK_TTL_MINUTES: parseInt(process.env.SEAT_LOCK_TTL_MINUTES || '5', 10),
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
};

module.exports = { validateEnv };
