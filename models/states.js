const mongoose = require('mongoose');

const statesSchema = new mongoose.Schema({
  old_id: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  old_country_id: {
    type: String,
    required: false,
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    default: null
  },
  abbr: {
    type: String,
    required: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('States', statesSchema);
