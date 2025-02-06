const socketIO = require("socket.io");
const { server } = require("../../server")

class SocketManager {

  static connectedUsers = {};

  constructor(server) {
    SocketManager.io = socketIO(server);
    this.sender = "";
    this.initializeSocketEvents();
  }

  extractUserId(socket) {
    const userId = socket.handshake.query.userId;
    return userId;
  }

  initializeSocketEvents() {
    SocketManager.io.on("connection", async (socket) => {
      const userId = this.extractUserId(socket);
      console.log("Connected", userId);
      SocketManager.connectedUsers[userId] = socket.id;

      
      socket.on("disconnect", () => {
        const userID = Object.keys(SocketManager.connectedUsers).find(
          (key) => SocketManager.connectedUsers[key] === socket.id
        );
        if (userID) {
          delete SocketManager.connectedUsers[userID];
          console.log(`User ${userID} disconnected`);
        }
      });
    });
  }

  sendMessageToUser(receiverId, sendMesssageToUser, roomId, senderId) {
    const sendMessage = [{ ...sendMesssageToUser, roomId: roomId }];
    let socketID = SocketManager.connectedUsers[receiverId];
    let senderSocketId = SocketManager.connectedUsers[senderId];

    SocketManager.io.to(senderSocketId).emit("sendermessage", sendMessage);

    // console.log(socketID , "socketID");
    // console.log(senderSocketId , "senderSocketId");
    // console.log(SocketManager.connectedUsers , "SocketManagerSocketManager");
  
    if (socketID) {
      SocketManager.io.to(socketID).emit("private-message", sendMessage);
    } else {
      console.log(`User ${receiverId} is not connected`);
    }
  }

}


let SocketIO = new SocketManager(server);

module.exports = { SocketManager, SocketIO }
