const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'user',
  //   required: true,
  // },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: false,
  },
  msg: {
    type: String,
    required: true,
  },
  attended: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Support', supportSchema);
