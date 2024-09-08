const usersInRoom = {};

function socketHandler(io) {

    io.on('connection', (socket) => {
        console.log('New client connected');

        // Join a room based on the event ID or car group ID
        socket.on('joinRoom', (data) => {

            const eventOrCarGroupId = data.room;
            const userID = data.userID;

            socket.join(eventOrCarGroupId);
            socket.userID = userID;

            if (!usersInRoom[eventOrCarGroupId]) {
                usersInRoom[eventOrCarGroupId] = [];
            }
            usersInRoom[eventOrCarGroupId].push(userID);

            console.log(`User ${userID} joined room: ${eventOrCarGroupId}`);
        });

        // Handle incoming chat messages
        socket.on('chat message', (message) => {
            console.log("transmitting new message to everyone in chat")
            // Broadcast to all connected clients to the same chat group (event or car group ID) that a message was created
            io.to(message.relatedId).emit('chat message', message);
        });

        socket.on("message delete", (message) => {

            // Broadcast to all connected clients to the same chat group (event or car group ID) that a message was deleted
            io.to(message.relatedId).emit('message delete', message);
        })

        socket.on('disconnect', () => {
            for (const room in usersInRoom) {
                usersInRoom[room] = usersInRoom[room].filter(id => id !== socket.userID);
            }
            console.log(`User ${socket.userID} disconnected`);
        });
    });
}

// InMemory implementation of getUsersInRoom
function getUsersInRoom(room) {
    return usersInRoom[room] || [];
}

// on-the-fly implementation of getUsersInRoom
function _getUsersInRoom(room, io) {
    const roomSockets = io.sockets.adapter.rooms.get(room);

    if (!roomSockets) return [];

    const userIDs = Array.from(roomSockets).map(socketId => {
        const socket = io.sockets.sockets.get(socketId);
        return socket ? socket.userID : null;
    }).filter(userID => userID !== null);  // Filter out any null values

    return userIDs;
}

module.exports = socketHandler;
module.exports.getUsersInRoom = getUsersInRoom;
