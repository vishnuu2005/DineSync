import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    // In dev, Vite proxies /api, but Socket.IO can connect directly to origin or port 5000
    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL ||
      (window.location.port === '3000'
        ? `${window.location.protocol}//${window.location.hostname}:5000`
        : window.location.origin);

    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket.IO] Connected to real-time server:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ [Socket.IO] Connection notice:', error.message);
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default getSocket;
