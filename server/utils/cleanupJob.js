const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const { broadcastSeatsReleased } = require('../sockets/seatSocket');
const { logger } = require('./logger');

let cleanupInterval = null;

const runCleanup = async () => {
  try {
    const now = new Date();

    // 1. Find expired locked seats
    const expiredSeats = await Seat.find({
      status: 'locked',
      lockExpiresAt: { $lt: now }
    }).select('_id show seatNumber');

    if (expiredSeats.length > 0) {
      // Group by showId for socket broadcast
      const showGroupMap = {};
      const expiredIds = [];

      expiredSeats.forEach((seat) => {
        expiredIds.push(seat._id);
        const sId = seat.show.toString();
        if (!showGroupMap[sId]) {
          showGroupMap[sId] = [];
        }
        showGroupMap[sId].push(seat.seatNumber);
      });

      // Atomically reset status
      await Seat.updateMany(
        { _id: { $in: expiredIds }, status: 'locked', lockExpiresAt: { $lt: now } },
        {
          $set: {
            status: 'available',
            lockedBy: null,
            lockExpiresAt: null,
            booking: null
          }
        }
      );

      // Broadcast to each show room
      Object.keys(showGroupMap).forEach((showId) => {
        const releasedSeats = showGroupMap[showId];
        broadcastSeatsReleased(showId, {
          seats: releasedSeats,
          reason: 'Lock expired'
        });
        logger.info(`[Cleanup] Released ${releasedSeats.length} expired seats for show ${showId}`);
      });
    }

    // 2. Mark stale pending bookings (> 10 mins old) as cancelled
    const staleTime = new Date(Date.now() - 10 * 60 * 1000);
    const staleBookings = await Booking.find({
      status: 'pending',
      createdAt: { $lt: staleTime }
    });

    if (staleBookings.length > 0) {
      await Booking.updateMany(
        { _id: { $in: staleBookings.map((b) => b._id) } },
        {
          $set: {
            status: 'cancelled',
            cancellationReason: 'Payment window expired'
          }
        }
      );
      logger.info(`[Cleanup] Cancelled ${staleBookings.length} stale pending bookings`);
    }
  } catch (error) {
    logger.error(`[Cleanup Error] ${error.message}`);
  }
};

const startCleanupJob = (intervalMs = 20000) => {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(runCleanup, intervalMs);
  logger.info(`[Cleanup Job] Started seat lock cleanup runner (interval: ${intervalMs}ms)`);
};

const stopCleanupJob = () => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info('[Cleanup Job] Stopped seat lock cleanup runner');
  }
};

module.exports = { startCleanupJob, stopCleanupJob, runCleanup };
