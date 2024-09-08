const app = require("./app");

const PORT = process.env.PORT || 5005;

//* Socket IO configuration
const http = require('http');
const server = http.createServer(app);
const socketIo = require("socket.io");
const socketHandler = require('./utils/socketHandler');  // Import socket handler

const io = socketIo(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"],
  },
});

app.set('io', io);  // Store io instance in the app, needed for checking users in the rooms before sending the Push Notifications
socketHandler(io);

server.listen(PORT, () => {
  // console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Server listening`);
});
