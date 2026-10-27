const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { validateEnv } = require('./config/env');
validateEnv();

const { connectDB } = require('./config/db');
const { logger, morganStream } = require('./utils/logger');
const { initSocket } = require('./sockets/seatSocket');
const { startCleanupJob } = require('./utils/cleanupJob');
const { generalLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/error');
const Movie = require('./models/Movie');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const movieRoutes = require('./routes/movieRoutes');
const theatreRoutes = require('./routes/theatreRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);

// Initialize Socket.io with CORS configuration
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const io = new Server(server, {
  cors: {
    origin: [clientUrl, 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});
initSocket(io);

// Security and utility middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);


app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
  process.env.CLIENT_URL?.replace(/\/$/, ''),
  'https://imovies-lemon.vercel.app',
  'https://imovies-oql331l18-syth2.vercel.app',
  'https://imovies-3xfwkc7z7-syth2.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
].filter(Boolean);

      if (
        allowedOrigins.includes(origin) ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }

      logger.error(`CORS rejected origin: ${origin}`);
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true
  })
);


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined', { stream: morganStream }));

// Rate limiting
app.use('/api', generalLimiter);

// Static assets (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/theatres', theatreRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// The server must start listening only after the DB connects
if (process.env.NODE_ENV !== 'test') {
  connectDB()
    .then(async () => {
      // Auto-seed if database is empty
      const movieCount = await Movie.countDocuments();
      if (movieCount === 0) {
        logger.info('Empty database detected. Auto-seeding initial data...');
        const { seedData } = require('./seed/seed');
        // Run seed without process.exit
        try {
          await seedData(false);
          logger.info('Auto-seed completed successfully.');
        } catch (sErr) {
          logger.warn(`Auto-seed warning: ${sErr.message}`);
        }
      }

      startCleanupJob();
      server.listen(PORT, () => {
        logger.info(`=================================================`);
        logger.info(`  🎬 iMovies API Server is live on port ${PORT}`);
        logger.info(`  Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`  Client URL: ${clientUrl}`);
        logger.info(`=================================================`);
      });
    })
    .catch((err) => {
      logger.error(`Failed to start server due to DB connection error: ${err.message}`);
      process.exit(1);
    });
}

module.exports = { app, server };
