const sgMail = require('@sendgrid/mail');
const logger = require('../startup/logger');
const { generateEmailTemplate } = require('../helpers/emailTemplate');
require('dotenv').config();

if (!process.env.SENDGRIDAPIKEY) {
     throw new Error('SENDGRIDAPIKEY is not defined in environment variables');
}

sgMail.setApiKey(process.env.SENDGRIDAPIKEY);

const DEFAULT_FROM = 'sales@titanium.com';

/* ===============================
   Utility: Sleep (for retry delay)
================================= */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* ===============================
   Utility: Retry Wrapper
================================= */
const sendWithRetry = async (payload, retries = 3) => {
     try {
          const [response] = await sgMail.send(payload);
          logger.info(`📨 SendGrid Status: ${response.statusCode}`);
          return response;
     } catch (error) {
          const statusCode = error?.response?.statusCode;
          const errorBody = error?.response?.body || error.message;

          logger.error(`❌ Send attempt failed. Status: ${statusCode}`, errorBody);

          if (retries > 0 && (statusCode >= 500 || statusCode === 429)) {
               const delay = (4 - retries) * 2000; // exponential backoff
               logger.warn(`Retrying email in ${delay}ms... Attempts left: ${retries}`);
               await sleep(delay);
               return sendWithRetry(payload, retries - 1);
          }

          throw error;
     }
};

/* ===============================
   Format Attachments Safely
================================= */
const formatAttachments = (attachments = []) => {
     return attachments
          .filter(file => file && file.content)
          .map(file => ({
               content: Buffer.isBuffer(file.content)
                    ? file.content.toString('base64')
                    : file.content,
               filename: file.filename || 'attachment',
               type: file.type || 'application/octet-stream',
               disposition: 'attachment',
          }));
};

/* ===============================
   Main Email Function
================================= */
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

          logger.info(`🕶️ Preparing email | type: ${type}`);

          const formattedAttachments = formatAttachments(attachments);

          let payload;

          const baseEmail = {
               from: DEFAULT_FROM,
               subject: subject || 'Titanium Industries',
          };

          /* ===============================
             Payload Selection Logic
          ================================= */

          if (Array.isArray(titaniumUsers) && titaniumUsers.length > 0) {

               payload = {
                    ...baseEmail,
                    to: titaniumUsers,
                    html: generateEmailTemplate(type, data),
                    attachments: formattedAttachments,
               };

          } else if (Array.isArray(recipients) && recipients.length > 0) {

               payload = {
                    ...baseEmail,
                    bcc: recipients,
                    html: generateEmailTemplate(type, data),
                    attachments: formattedAttachments,
               };

          } else if (sendCode && email) {

               payload = {
                    ...baseEmail,
                    subject: 'Titanium Verification Code',
                    to: email,
                    text: `Your Titanium verification code is ${code}`,
               };

          } else if (email) {

               payload = {
                    ...baseEmail,
                    to: email,
                    html: generateEmailTemplate(type, data),
                    attachments: formattedAttachments,
               };

          } else {
               throw new Error('No valid recipient provided');
          }

          /* ===============================
             Send Email (with retry)
          ================================= */

          await sendWithRetry(payload);

          logger.info(`✅ Email sent successfully | type: ${type}`);

          return true;

     } catch (error) {
          logger.error(
               '🚨 SendGrid Email Error:',
               error?.response?.body || error.message
          );
          return false;
     }
};

/* ===============================
   Dynamic Template Email
================================= */
exports.sendDynamicTemplateEmail = async ({
     to,
     templateId,
     dynamicData = null,
     from
}) => {
     try {

          if (!to || !templateId) {
               throw new Error('Missing required fields: to or templateId');
          }

          const msg = {
               from: from || DEFAULT_FROM,
               personalizations: [
                    {
                         to: [{ email: to }],
                         dynamic_template_data: dynamicData,
                    },
               ],
               template_id: templateId,
          };

          await sendWithRetry(msg);

          logger.info('✅ Dynamic template email sent successfully');

          return true;

     } catch (error) {
          logger.error(
               '🚨 SendGrid Dynamic Email Error:',
               error?.response?.body || error.message
          );
          return false;
     }
};