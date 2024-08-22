const app = require("./app");

const PORT = process.env.PORT || 5005;

//* Socket IO configuration
const http = require('http');
const server = http.createServer(app);
const socketIo = require("socket.io");
const io = socketIo(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"],
  },
});

io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle incoming chat messages
  socket.on('chat message', (msg) => {

    

    io.emit('chat message', msg); // Broadcast to all connected clients
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  // console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Server listening`);
});
