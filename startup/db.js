const mongoose = require('mongoose');
const logger = require('./logger'); // Adjust the path as needed
module.exports = function () {
  const db = process.env.DB;
  mongoose.connect(db)
    .then(async (connect) => {
      logger.info(`Connected...`)
    });
}