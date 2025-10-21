const sgMail = require('@sendgrid/mail');
const logger = require('../startup/logger'); // Adjust the path as needed
const { generateEmailTemplate } = require('../helpers/emailTemplate');
require('dotenv').config();

// Set your SendGrid API key
sgMail.setApiKey(process.env.SENDGRIDAPIKEY); // Better to use environment variable

exports.sendGridEmail = async ({
     email,
     code,
     subject,
     sendCode = true,
     data,
     type,
     recipients = [],
     attachments = [],
     titaniumUsers = []
}) => {
     try {
          // Convert attachment content (buffer) to base64 if not already
          const formattedAttachments = attachments.map(file => {
               const base64Content =
                    Buffer.isBuffer(file.content)
                         ? file.content.toString('base64')
                         : file.content;

               return {
                    content: base64Content,
                    filename: file.filename,
                    type: file.type || 'application/pdf', // default if not passed
                    disposition: 'attachment',
               };
          });

          const baseEmail = {
               from: 'sales@titanium.com',
               subject: subject || 'Welcome to Titanium Industries',
          };

          const sendCodeMailOptions = {
               ...baseEmail,
               subject: 'Titanium Verification Code',
               to: email,
               text: `Your Titanium code is ${code}`,
          };

          const htmlMail = {
               ...baseEmail,
               to: email,
               html: generateEmailTemplate(type, data),
               attachments: formattedAttachments,
          };
          const titaniumUsersMail = {
               ...baseEmail,
               to: titaniumUsers,
               html: generateEmailTemplate(type, data),
               attachments: formattedAttachments,
          };

          const broadcastEmail = {
               ...baseEmail,
               bcc: recipients,
               html: generateEmailTemplate(type, data),
               attachments: formattedAttachments,
          };

          const payload =
               titaniumUsers?.length > 0 ? titaniumUsersMail : (recipients.length > 0
                    ? broadcastEmail
                    : sendCode
                         ? sendCodeMailOptions
                         : htmlMail);

          await sgMail.send(payload);
          logger.info('Email sent via SendGrid ✅');
     } catch (error) {
          console.log(error);
          logger.error('Error sending email via SendGrid ❌: ', error.response?.body || error.message);
     }
};

// Exported function for sending dynamic template emails
exports.sendDynamicTemplateEmail = async ({ to, templateId, dynamicData = null, from }) => {
     try {
          const msg = {
               from: from || 'sales@titanium.com', // Must be verified in SendGrid
               personalizations: [
                    {
                         to: [{ email: to }],
                         dynamic_template_data: dynamicData,
                    },
               ],
               template_id: templateId,
          };

          await sgMail.send(msg);
          logger.info('Dynamic template email sent successfully ✅');
     } catch (error) {
          logger.error('SendGrid Dynamic Email Error ❌:', error.response?.body || error.message);
     }
};