const jwt = require('jsonwebtoken');
const config = require('config');
const connectedUsers = {};
let ioInstance;

function initializeSocket(http, io) {
    ioInstance = io
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.query.token;
            if (!token) {
                socket.disconnect();
                return next(new Error('Authentication error. Token missing.'));
            }
            const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
            socket.user = decoded;
            next();
        } catch (error) {
            socket.disconnect();
            return next(new Error('Authentication error. Invalid token.'));
        }
    });

    io.on("connection", async (socket) => {
        try {
            const userId = socket.user._id;
            connectedUsers[userId] = socket;
            console.log('socket connected');
            socket.emit('authentication', userId)
           
           
            socket.on("disconnect", async () => {
                console.log(`Socket ${socket.id} disconnected`);
                socket.emit('disconnected', userId)
                delete connectedUsers[userId];
            });
        } catch (error) {
            console.error(error);
            socket.disconnect();
        }
    });
}
function emitNotification(userId, eventName, data) {
    if (!ioInstance) {
        console.error('Socket.io instance not initialized.');
        return;
    }
    console.log("first")
    if (userId) {
        // Emit the notification only to the specific user if they are connected
        const socket = connectedUsers[userId];
        if (socket) {
            socket.emit(eventName, data);
        } else {
            console.error(`User with ID ${userId} is not connected. Storing notification.`);
            // Optionally store notification for later delivery when the user connects
        }
    } else {
        console.log('first2')
        // Emit to all connected users if userId is not specified
        ioInstance.emit(eventName, data);
    }
};

module.exports = {
    emitNotification,
    initializeSocket
}