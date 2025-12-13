require('dotenv').config();
const { requestLogger } = require('./startup/requestLogger');
const mongoose = require('mongoose');

const express = require('express');
const app = express();
const socketio = require("socket.io");
const http = require('http');
const logger = require('./startup/logger'); // Adjust the path as needed
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } }) //for omit cors error
const auth = require('./middleware/auth')
const { initializeSocket } = require('./socket/socket'); // Import the socket setup file
const optionalAuth = require('./middleware/optionalAuth')

const admin = require("firebase-admin");
initializeSocket(server, io);
const config = {
  "type": process.env.TYPE,
  "project_id": process.env.PROJECTID,
  "private_key_id": process.env.PRIVATE_KEY_ID,
  "private_key": process.env.PRIVATE_KEY,
  "client_email": process.env.CLIENT_EMAIL,
  "client_id": process.env.CLIENTID,
  "auth_uri": process.env.AUTH_URI,
  "token_uri": process.env.TOKEN_URL,
  "auth_provider_x509_cert_url": process.env.AUTHPROVIDER,
  "client_x509_cert_url": process.env.CLIENT_CERT,
  "universe_domain": process.env.DOMAIN
};


admin.initializeApp({
  credential: admin.credential.cert(config),
  storageBucket: "gs://task-connect-app.appspot.com"
});
// ⚠️ Must call corsConfig before any routes
require('./startup/corsConfig')(app);
// Cache control
app.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    "Pragma": "no-cache",
    "Expires": "0"
  });
  next();
});

app.use(requestLogger);

require('./startup/config')();
require('./startup/logging')();
require('./startup/db')();
require('./startup/prod')(app);
require('./startup/validation')();
require('./startup/routes')(app);

const port = process.env.PORT || 5022;
server.listen(port, '0.0.0.0', () => logger.info(`Listening on port  ${port}...`));

module.exports = server;