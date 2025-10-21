const nodemailer = require('nodemailer');
const logger = require('../startup/logger'); // Adjust the path as needed
const { generateEmailTemplate } = require('../helpers/emailTemplate')

exports.sendEmail = async ({ email, code, subject, sendCode = true, data, type, recipients = [], attachments =[]}) => {
     // Create a Nodemailer transporter object
     const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
               user: 'danishgoheer17@gmail.com',
               pass: 'zzmftuogtusnnriu',
          },
     });

     // Email data
     const mailOptions = {
          from: 'danishgoheer17@gmail.com',
          to: email, // Replace with the recipient's email address
          subject: 'Titanium Verification code',
          text: 'Your Titanium code is ' + code,
     };
     const broadcastEmail = {
          from: 'danishgoheer17@gmail.com',
          bcc: recipients.join(','),
          subject: subject,
          html: generateEmailTemplate(type, data),
          attachments:attachments,
     };
     const htmlMail = {
          from: 'danishgoheer17@gmail.com',
          to: email, // Replace with the recipient's email address
          subject: subject,
          html: generateEmailTemplate(type, data),
          attachments:attachments,
     };

     // Send the email
     transporter.sendMail(recipients?.length > 0 ? broadcastEmail : (sendCode ? mailOptions : htmlMail), (error, info) => {
          if (error) {
               logger.error('Error sending email: ', error);
          } else {
               logger.info('Email sent: ' + info.response);
          }
     });
}

