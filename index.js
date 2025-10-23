require('dotenv').config();
const { requestLogger } = require('./startup/requestLogger');

const express = require('express');
const cors = require('cors');
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

app.use(cors());
app.use(requestLogger);

require('./startup/config')();
require('./startup/logging')();
require('./startup/routes')(app);
require('./startup/db')();
require('./startup/validation')();

const port = process.env.PORT || 5004;
server.listen(port,'0.0.0.0', () => logger.info(`Listening on port  ${port}...`));


module.exports = server;