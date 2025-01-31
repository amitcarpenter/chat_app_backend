const socketIO = require("socket.io");

class SocketManager {
  constructor(server) {
    this.io = socketIO(server);
    this.connectedUsers = {};
    this.sender = "";
    this.initializeSocketEvents();
  }
  extractUserId(socket) {
    const userId = socket.handshake.query.userId;
    return userId;
  }

  initializeSocketEvents() {
    this.io.on("connection", async (socket) => {
      const userId = this.extractUserId(socket);
      console.log("Connected", userId);

      this.connectedUsers[userId] = socket.id;

      socket.on("disconnect", () => {
        // Remove the user's entry when they disconnect
        const userID = Object.keys(this.connectedUsers).find(
          (key) => this.connectedUsers[key] === socket.id
        );
        if (userID) {
          delete this.connectedUsers[userID];
          console.log(`User ${userID} disconnected`);
        }
      });
    });
  }

  // Method to send a message to a particular user
  sendMessageToUser(receiverId, sendMesssageToUser, roomId, senderId) {
    const sendMessage = [{ ...sendMesssageToUser, roomId: roomId }];
    let socketID = this.connectedUsers[receiverId];
    let senderSocketId = this.connectedUsers[senderId];
    this.io.to(senderSocketId).emit("sendermessage", sendMessage);
    if (socketID) {
      this.io.to(socketID).emit("private-message", sendMessage);
    } else {
      console.log(`User ${receiverId} is not connected`);
    }
  }

  // Additional methods for handling custom socket events can be added here
}

module.exports = SocketManager;
