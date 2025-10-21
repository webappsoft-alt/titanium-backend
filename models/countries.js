const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  old_id: {
    type: String,
    required: false,
  },
  iso_name: {
    type: String,
    required: false,
  },
  iso: {
    type: String,
    required: false,
  },
  iso3: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  numcode: {
    type: String,
    required: false,
  },
  states_required: {
    type: String,
    required: false,
  },
  zipcode_required: {
    type: String,
    required: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('Country', countrySchema);
