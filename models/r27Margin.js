const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  range: { start: Number, end: Number, infinity: { type: Boolean, default: false } },
  marginCode: [
    { label: String, value: Number }
  ]
}, { timestamps: true });

module.exports = mongoose.model('R27Margin', schema);
