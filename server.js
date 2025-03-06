const express = require("express");
const { dbConnect } = require("./app/mongoConnection/dbConnect");
const Port = process.env.PORT || 3000;
const http = require("http");
const { SocketManager } = require("./app/socket/SocketManager");
var bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");


const userRoutes = require("./app/user/userRoutes");
const chatRoutes = require("./app/userChat/chatRoute");
const activityRoutes = require("./app/activityFeed/activityRoute");
const addFriendRoutes = require("./app/addFriend/addFriendRoutes");
const { corsOptionsDelegate } = require("./app/middleware/cors");


const app = express();
app.use(express.static(path.join(__dirname, "uploads")));
app.use(cors());

const server = http.createServer(app);
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
let users = [];

exports.IO = new SocketManager(server);


app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/feed", activityRoutes);
app.use("/api/friend", addFriendRoutes);


app.get("/", (req, res) => {
  return res.send("Hello Chat App Working ")
})

dbConnect()
  .then(() => {
    server.listen(Port, () => {
      console.log("server connected at port:", Port);
    });
  })
  .catch((error) => {
    console.log("an error occurred:", error);
  });


module.exports = { server }; 