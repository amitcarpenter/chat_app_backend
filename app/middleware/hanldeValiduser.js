const { User } = require("../user/userModal");

async function ValidUser(auth_token) {
  const isValidUser = await User.findOne({ auth_token });
  if (!isValidUser) {
    return "Unauthorised user";
  }
  return true;
}


module.exports = { ValidUser }