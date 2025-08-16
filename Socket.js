const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",               // local dev
      "https://your-frontend-app.onrender.com", // deployed frontend
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const usersocketMap = {};
const getReceiverSocketId = (id) => usersocketMap[id];

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) usersocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(usersocketMap));

  socket.on("disconnect", () => {
    if (userId) delete usersocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(usersocketMap));
  });
});

module.exports = { app, server, io, getReceiverSocketId };
