const Joi = require('joi');
const bcrypt = require('bcryptjs');
const { User, generateAuthToken } = require('../models/user');
const express = require('express');
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { isWhitelisted } = require('../startup/security');
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Try again later.',
  skip: isWhitelisted,
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
    return req.body?.email || ip;
  }
});
const authIPLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 200,
  message: 'Too many login attempts. Try again later.',
  skip: isWhitelisted,
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
    return ip;
  }
});

router.post('/', authLimiter, authIPLimiter, async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).send({ success: false, message: error.details[0].message });

    const { email, password } = req.body;

    if (!password) {
      return res.status(400).send({ success: false, message: 'Password is required' });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(400).send({ success: false, message: 'Invalid credentials' });

    if (!user?.password) {
      return res.status(400).send({ success: false, message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).send({ success: false, message: 'Invalid credentials' });

    if (user.isVerify == false) {
      return res.status(400).send({
        success: false,
        message: 'Your account is not active, please wait for admin approval',
      });
    }
    if (user.status == 'inactive') {
      return res.status(400).send({
        success: false,
        message: 'Your account is not approved, please wait for admin approval',
      });
    }
    if (user.status == 'deleted') {
      return res.status(400).send({
        success: false,
        message: 'User has been deleted. Contact admin for further support.',
      });
    }
    if (user.status == 'deactivated') {
      return res.status(400).send({
        success: false,
        message: 'User has been deactivated. Contact admin for further support.',
      });
    }

    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    await User.updateOne({ _id: user._id }, {
      lastLogin: {
        date: new Date(),
        ip,
        browser: userAgent,
      }
    });

    const token = generateAuthToken(user._id, user.type, user?.permissions || '', user?.email);
    sendEncryptedResponse(res, {
      token: token,
      user: { ...user, lastLogin: { date: new Date(), ip, browser: userAgent } },
      success: true,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

router.post('/admin', authLimiter, authIPLimiter, async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send({ success: false, message: error.details[0].message });

  const { email, password } = req.body;

  const user = await User.findOne({ email }).lean();

  if (!user) return res.status(400).send({ success: false, message: 'Invalid credentials' });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) return res.status(400).send({ success: false, message: 'Invalid credentials' });

  if (user.type !== 'admin') return res.status(400).send({ success: false, message: 'Invalid credentials' });

  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';

  await User.updateOne({ _id: user._id }, {
    lastLogin: {
      date: new Date(),
      ip,
      browser: userAgent,
    }
  });

  const token = generateAuthToken(user._id, user.type, "admin", user?.permissions || '', user.email);
  sendEncryptedResponse(res, {
    token: token,
    user: { ...user, lastLogin: { date: new Date(), ip, browser: userAgent } },
    success: true
  });
});


function validate(req) {
  const emailSchema = {
    email: Joi.string().min(5).max(255).email(),
    password: Joi.string().min(5).max(255).required(),
  };

  const schema = Joi.object(emailSchema)

  return schema.validate(req);
}


module.exports = router;
