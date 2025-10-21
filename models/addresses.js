const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  old_id: {
    type: String,
    required: false,
  },
  old_user_id: {
    type: Number,
    required: false,
  },
  fname: {
    type: String,
    required: false,
  },
  lname: {
    type: String,
    required: false,
  },
  company: {
    type: String,
    required: false,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },

  address1: { type: String, required: false, default: "" },
  address2: { type: String, required: false, default: "" },

  country: { type: String, required: false, default: "" },
  state: { type: String, required: false, default: "" },

  countryID: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
  stateID: { type: mongoose.Schema.Types.ObjectId, ref: 'States' },

  city: { type: String, required: false, default: "" },
  zipCode: { type: String, required: false, default: "" },

  user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },


  old_country_id: { type: String },
  old_state_id: { type: String },

}, { timestamps: true });

module.exports = mongoose.model('Addresses', schema);
