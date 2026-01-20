const jwt = require('jsonwebtoken');
const Joi = require('joi');
const config = require('config');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  rails_id: {
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
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  phone: {
    type: String,
    required: false,
    unique: false,
  },
  password: {
    type: String,
    required: false,
    minlength: 0,
    maxlength: 255,
  },
  profilePicture: String,
  industry: String,
  otherIndustry: String,
  isCompetitor: Boolean,
  discount: String,


  regionalManager: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
  accountManager: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },

  stratixAccount: String,
  // fcmtoken: String,
  lat: String,
  lng: String,

  countryID: { type: mongoose.Schema.Types.ObjectId, ref: 'Country' },
  stateID: { type: mongoose.Schema.Types.ObjectId, ref: 'States' },

  old_country_id: { type: String },
  old_state_id: { type: String },

  old_bill_address_id: { type: String },
  old_ship_address_id: { type: String },

  address: { type: String, required: false, default: "" },

  country: { type: String, required: false, default: "" },
  state: { type: String, required: false, default: "" },

  currentWebState: { type: String, required: false, default: "" },
  oldWebState: { type: String, required: false, default: "" },
  stateChangeDate: { type: Date },

  city: { type: String, required: false, default: "" },
  zipCode: { type: String, required: false, default: "" },

  shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Addresses' },
  billingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Addresses' },

  code: {
    type: Number,
    minlength: 0,
    maxlength: 4,
  },
  customerStatus: {
    type: String,
    default: '',
    enum: ['C', 'L', 'P', "I", "3MD", '6MD', '']
  },
  status: {
    type: String,
    default: 'inactive',
    enum: ['inactive', 'active', 'deleted', "deactivated"]
  },

  assignBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Territories' },

  branch: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Territories' }],
  routing: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Territories' }],
  roles: [{ type: String, enum: ['OS', 'IS', 'RM'] }],
  permissions: { type: String, enum: ['sales_representative', 'regional_manager', 'admin'] },

  isAcceptTerms: { type: Boolean, default: false },
  isVerify: { type: Boolean, default: false },
  isAcceptSendOffers: { type: Boolean, default: false },
  isTaxLicense: { type: Boolean, default: false },

  license_number: { type: String, default: '' },

  type: {
    type: String,
    default: 'customer',
    enum: ['customer', 'admin', 'sales', 'sub-admin']
  },
}, { timestamps: true });

function generateAuthToken(_id, type, permissions) {
  const token = jwt.sign({ _id: _id, type: type, permissions }, config.get('jwtPrivateKey'));
  return token;
}
function generateIdToken(_id) {
  const expiresIn = 3600; // Token will expire in 1 hour (3600 seconds)
  const token = jwt.sign({ _id: _id }, config.get('jwtIDPrivateKey'), { expiresIn });
  return token;
}
function generateResetPasswordToken(_id) {
  const expiresIn = 600; // Token will expire in 5 mint (300 seconds)
  const token = jwt.sign({ _id: _id }, config.get('jwtIDPrivateKey'), { expiresIn });
  return token;
}

const User = mongoose.model('user', userSchema);

function validateUser(user) {
  const commonSchema = {
    fname: Joi.string().min(2).max(50).required(),
    company: Joi.string().min(2).max(50).required(),
    lname: Joi.string().min(0).allow(null).optional(),
    address: Joi.string().min(0).allow(null).optional(),

    country: Joi.string().min(0).allow(null).optional(),
    state: Joi.string().min(0).allow(null).optional(),

    countryID: Joi.string().min(0).allow(null).optional(),
    stateID: Joi.string().min(0).allow(null).optional(),

    old_country_id: Joi.string().min(0).allow(null).optional(),
    old_state_id: Joi.string().min(0).allow(null).optional(),

    zipCode: Joi.string().min(0).allow(null).optional(),
    city: Joi.string().min(0).allow(null).optional(),
    industry: Joi.string().min(0).allow(null).optional(),
    password: Joi.string().min(5).max(255).required(),
    phone: Joi.string().min(5).max(255).required(),
    email: Joi.string().min(5).max(255).email(),
    isAcceptTerms: Joi.boolean().optional(),
    isAcceptSendOffers: Joi.boolean().optional(),
    isTaxLicense: Joi.boolean().optional(),
  };

  const schema = Joi.object({
    ...commonSchema
  });

  return schema.validate(user);
}
function passwordApiBodyValidate(body) {
  const schema = Joi.object({
    password: Joi.string().min(5).max(255).required(),
    token: Joi.string().min(5).max(255).required(),
  })

  return schema.validate(body);
}
function emailApiBodyValidate(body) {
  const schema = Joi.object({
    email: Joi.string().min(4).max(50).required(),
  })
  return schema.validate(body);
}
function phoneApiBodyValidate(body) {
  const schema = Joi.object({
    phone: Joi.string().min(4).max(50).required(),
  })
  return schema.validate(body);
}


exports.User = User;
exports.validate = validateUser;
exports.generateAuthToken = generateAuthToken;
exports.generateIdToken = generateIdToken;
exports.passwordApiBodyValidate = passwordApiBodyValidate;
exports.phoneApiBodyValidate = phoneApiBodyValidate;
exports.generateResetPasswordToken = generateResetPasswordToken;
exports.emailApiBodyValidate = emailApiBodyValidate;