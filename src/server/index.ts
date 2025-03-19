/**
 * @module server/index
 * @description Main server entry point that sets up Express and Lance.gg
 * @license MIT
 */

import path from 'path';
import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';

// Game configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;
const UPDATE_RATE = 60; // Game steps per second
const STEP_DELTA = 1000 / UPDATE_RATE;

// Create Express app
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server);

// Serve static files from the dist/client directory
app.use(express.static(path.join(__dirname, '../../client')));

// API routes
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve the main HTML file for any other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/index.html'));
});

// Start the HTTP server
server.listen(PORT, () => {
  console.log(`Game server started on http://localhost:${PORT}`);
  console.log(`Socket.IO server running on ws://localhost:${PORT}`);
});

// Handle server shutdown
process.on('SIGINT', () => {
  console.log('Server shutting down...');
//   serverEngine.stop();
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});

export { app, server, io };