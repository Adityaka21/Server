require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
   host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.GMAIL_EMAIL_ID,
        pass: process.env.GMAIL_APP_PASSWORD,
    }
});

const send = async (to,subject,body) => {
    const emailOptions = {
        from: process.env.GMAIL_EMAIL_ID,
        to: to,
        subject: subject,
        text: body,
    };
    try {
         await transporter.verify();
        await transporter.sendMail(emailOptions);

    }catch (error){
        console.log(error);
        throw error;
    }
};

module.exports = {send}