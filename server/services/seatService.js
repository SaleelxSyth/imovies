const Seat = require('../models/Seat');
const { broadcastSeatsLocked, broadcastSeatsReleased } = require('../sockets/seatSocket');

const LOCK_TTL_MINUTES = parseInt(process.env.SEAT_LOCK_TTL_MINUTES || '5', 10);

const getSeatsForShow = async (showId, currentUserId = null) => {
  const now = new Date();

  // In-line lazy release for expired locks on this show
  await Seat.updateMany(
    {
      show: showId,
      status: 'locked',
      lockExpiresAt: { $lt: now }
    },
    {
      $set: {
        status: 'available',
        lockedBy: null,
        lockExpiresAt: null,
        booking: null
      }
    }
  );

  const seats = await Seat.find({ show: showId })
    .sort({ row: 1, number: 1 })
    .lean();

  return seats.map((seat) => ({
    ...seat,
    isMyLock: currentUserId && seat.lockedBy ? seat.lockedBy.toString() === currentUserId.toString() : false
  }));
};

const lockSeats = async (showId, seatNumbers, userId) => {
  if (!seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    const error = new Error('Please select at least one seat');
    error.statusCode = 400;
    throw error;
  }

  if (seatNumbers.length > 8) {
    const error = new Error('You cannot book more than 8 seats in a single reservation');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const lockExpiresAt = new Date(now.getTime() + LOCK_TTL_MINUTES * 60 * 1000);
  const lockedSeats = [];

  try {
    for (const seatNo of seatNumbers) {
      // Atomic condition: seat must be available, expired lock, or already locked by this same user
      const updatedSeat = await Seat.findOneAndUpdate(
        {
          show: showId,
          seatNumber: seatNo,
          $or: [
            { status: 'available' },
            { status: 'locked', lockExpiresAt: { $lt: now } },
            { status: 'locked', lockedBy: userId }
          ]
        },
        {
          $set: {
            status: 'locked',
            lockedBy: userId,
            lockExpiresAt
          }
        },
        { new: true }
      );

      if (!updatedSeat) {
        // Rollback already locked seats in this request
        if (lockedSeats.length > 0) {
          await Seat.updateMany(
            {
              show: showId,
              seatNumber: { $in: lockedSeats.map((s) => s.seatNumber) },
              lockedBy: userId
            },
            {
              $set: {
                status: 'available',
                lockedBy: null,
                lockExpiresAt: null
              }
            }
          );
        }

        const conflictError = new Error(`Seat ${seatNo} is no longer available or already reserved by another user`);
        conflictError.statusCode = 409;
        throw conflictError;
      }

      lockedSeats.push(updatedSeat);
    }

    // Broadcast lock to all connected clients in this show's room
    broadcastSeatsLocked(showId, {
      seats: seatNumbers,
      lockedBy: userId,
      lockExpiresAt
    });

    return {
      success: true,
      lockedSeats,
      lockExpiresAt
    };
  } catch (error) {
    throw error;
  }
};

const unlockSeats = async (showId, seatNumbers, userId) => {
  if (!seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    return { success: true, released: [] };
  }

  // Filter if user is not admin: can only release seats locked by themselves
  const filter = {
    show: showId,
    seatNumber: { $in: seatNumbers },
    status: 'locked'
  };

  if (userId) {
    filter.lockedBy = userId;
  }

  const result = await Seat.updateMany(filter, {
    $set: {
      status: 'available',
      lockedBy: null,
      lockExpiresAt: null,
      booking: null
    }
  });

  broadcastSeatsReleased(showId, {
    seats: seatNumbers,
    userId
  });

  return { success: true, modifiedCount: result.modifiedCount };
};

module.exports = {
  getSeatsForShow,
  lockSeats,
  unlockSeats
};
