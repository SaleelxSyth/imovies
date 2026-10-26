import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true
    });
  }
  return socket;
};

export const joinShowRoom = (showId) => {
  const s = getSocket();
  if (s && showId) {
    s.emit('joinShow', showId);
  }
};

export const leaveShowRoom = (showId) => {
  const s = getSocket();
  if (s && showId) {
    s.emit('leaveShow', showId);
  }
};
