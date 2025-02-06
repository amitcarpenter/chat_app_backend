const nodemailer = require('nodemailer');
const path = require('path');
require("dotenv").config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});


const sendEmail = async (emailOptions) => {
    const mailOptions = {
        from: EMAIL_USER,
        to: emailOptions.to,
        subject: emailOptions.subject,
        html: emailOptions.html,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${emailOptions.to}`);
    } catch (error) {
        throw new Error("Error sending email");
    }
};

module.exports = { transporter, sendEmail }
