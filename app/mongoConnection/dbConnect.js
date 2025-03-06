const mongoose = require("mongoose");
const dotenv = require("dotenv")
dotenv.config()

async function dbConnect() {
  await mongoose.connect(
    process.env.DB_CONNECTION
  );
  console.log("dataBase connected successfully");
}

module.exports = {
  dbConnect,
};
