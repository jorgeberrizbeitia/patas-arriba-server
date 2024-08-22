const app = require("./app");

const PORT = process.env.PORT || 5005;

//* Socket IO configuration
const http = require('http');
const server = http.createServer(app);
const socketIo = require("socket.io");
const io = socketIo(server, {
  cors: {
    origin: process.env.ORIGIN,
    methods: ["GET", "POST"], //TODO add other methods if needed like DELETE
  },
});

io.on('connection', (socket) => {
  console.log('New client connected');

  // Join a room based on the event or car group ID
  socket.on('joinRoom', (eventOrCarGroupId) => {
    socket.join(eventOrCarGroupId);
    console.log(`User joined room: ${eventOrCarGroupId}`);
  });

  // Handle incoming chat messages
  socket.on('chat message', (message) => {

    // Broadcast to all connected clients to the same chat group (event or car group ID)
    io.to(message.relatedId).emit('chat message', message); 
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  // console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Server listening`);
});
