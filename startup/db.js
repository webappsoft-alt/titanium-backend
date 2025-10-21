const mongoose = require('mongoose');
const logger = require('./logger'); // Adjust the path as needed
module.exports = function () {
  const db = 'mongodb+srv://utecho683:s8usb52NsJoaLxpF@stablecrm.jmm0l.mongodb.net/titanium-backend';
  mongoose.connect(db)
    .then(async (connect) => {
      logger.info(`Connected...`)
    });
}