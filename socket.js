'use strict';

const { io } = require('socket.io-client');

// FOR LOCAL DEPLOY
// const socket = io('http://localhost:3001/');

// DEPLOYED DEV SOCKET SERVER
// const socket = io('https://team-socket-server-dev.onrender.com');

// DEPLOYED MAIN SOCKET SERVER
const socket = io('https://team-socket-server.onrender.com');

module.exports = { socket };