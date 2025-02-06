const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
        user: "xderdating@gmail.com",
        pass: "yhhjfpkzxyfbxvnb",
    },
});


module.exports = { transporter }