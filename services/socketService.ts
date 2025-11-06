import { io, Socket } from 'socket.io-client';

// IMPORTANT: This URL points to a placeholder backend.
// For this application to work, you must set up a corresponding
// Socket.IO server (e.g., using Node.js/Express) and update this URL.
// For local development, this might be 'http://localhost:3001'.
const SERVER_URL = 'http://localhost:3001'; 

export const socket: Socket = io(SERVER_URL, {
  autoConnect: true,
  reconnection: true,
});

socket.on('connect', () => {
  console.log('Connected to Socket.IO server with id:', socket.id);
});

socket.on('disconnect', () => {
  console.log('Disconnected from Socket.IO server');
});

socket.on('connect_error', (err) => {
  // A connection error is expected if the backend server is not running.
  console.error('Connection error: Ensure the backend server is running and accessible at', SERVER_URL, err.message);
});