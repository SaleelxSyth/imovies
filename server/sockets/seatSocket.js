const { logger } = require('../utils/logger');

let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    logger.info(`[Socket.io] Client connected: ${socket.id}`);

    // Join show room for real-time seat updates
    socket.on('joinShow', (showId) => {
      if (showId) {
        const room = `show:${showId}`;
        socket.join(room);
        logger.debug(`[Socket.io] Socket ${socket.id} joined room ${room}`);
      }
    });

    // Leave show room
    socket.on('leaveShow', (showId) => {
      if (showId) {
        const room = `show:${showId}`;
        socket.leave(room);
        logger.debug(`[Socket.io] Socket ${socket.id} left room ${room}`);
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
};

const getIO = () => ioInstance;

const broadcastSeatsLocked = (showId, payload) => {
  if (ioInstance && showId) {
    ioInstance.to(`show:${showId}`).emit('seatsLocked', {
      showId,
      ...payload
    });
  }
};

const broadcastSeatsReleased = (showId, payload) => {
  if (ioInstance && showId) {
    ioInstance.to(`show:${showId}`).emit('seatsReleased', {
      showId,
      ...payload
    });
  }
};

const broadcastSeatsBooked = (showId, payload) => {
  if (ioInstance && showId) {
    ioInstance.to(`show:${showId}`).emit('seatsBooked', {
      showId,
      ...payload
    });
  }
};

const broadcastPaymentConfirmed = (bookingId, payload) => {
  if (ioInstance && bookingId) {
    ioInstance.emit(`paymentConfirmed:${bookingId}`, payload);
    ioInstance.emit('paymentUpdated', { bookingId, status: 'confirmed', ...payload });
  }
};

const broadcastPaymentCancelled = (bookingId, payload) => {
  if (ioInstance && bookingId) {
    ioInstance.emit(`paymentCancelled:${bookingId}`, payload);
    ioInstance.emit('paymentUpdated', { bookingId, status: 'cancelled', ...payload });
  }
};

module.exports = {
  initSocket,
  getIO,
  broadcastSeatsLocked,
  broadcastSeatsReleased,
  broadcastSeatsBooked,
  broadcastPaymentConfirmed,
  broadcastPaymentCancelled
};
