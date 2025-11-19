const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const { User, validate, generateAuthToken, passwordApiBodyValidate, generateIdToken, emailApiBodyValidate, phoneApiBodyValidate, generateResetPasswordToken } = require('../models/user');
const express = require('express');
const { sendGridEmail, sendDynamicTemplateEmail } = require('../controllers/sendGridEmial');
const Territories = require('../models/territories');  // Your Mongoose schema file
const passwordauth = require('../middleware/passwordauth');
const { generateCode } = require('../controllers/generateCode');
const router = express.Router();
const { TempUser } = require('../models/TempUser');
const { handleGetUser } = require('../controllers/quotationController');
const CompetitorMarkup = require("../models/competitor-value");
const MailSettings = require('../models/mailSetting');
const CompetitorDomain = require('../models/competitorDomain');  // Your Mongoose schema file

const Countries = require('../models/countries');
const States = require('../models/states');
const Addresses = require('../models/addresses');
const { parseEmails } = require('../helpers/utils');
const userPath = [
  { label: '/customer/quotes', value: 'quotes' },
  { label: '/customer/orders', value: 'orders' },
  { label: '/customer/quick-quote', value: 'quick-quote' },
  { label: '/customer/mill-products', value: 'mill-products' },
  { label: '/customer/services', value: 'orders' },
  { label: '/customer/dashboard', value: 'dashboard' },
  { label: '/customer/faq', value: 'faq' },
  { label: '/customer/terms', value: 'terms' },
  { label: '/customer/profile-account', value: 'profile' },
  { label: '/customer/cart', value: 'cart' },
  { label: '/products', value: 'products' },
  { label: '/product/', value: 'product' },
];
const handleTitaniumUsersEmail = async () => {
  const usersEmail = await MailSettings.findOne({}).sort({ _id: -1 }).select('sendCopyTo').lean()
  if (usersEmail?.sendCopyTo) {
    return parseEmails(usersEmail?.sendCopyTo)
  }
}
router.get('/me', auth, async (req, res) => {
  const { page } = req.query

  const user = await User.findById(req.user._id).select('-password')
    .populate('shippingAddress')
    .populate('billingAddress')
    .lean()
  const competData = await CompetitorMarkup.findOne().sort({ _id: -1 }).select('minValue maxValue').lean()
  const token = generateAuthToken(user?._id, user?.type, user?.permissions || '');
  res.send({ success: !!user, user: user, token, data: competData });
  const stateManagment = userPath.find(item => page?.startsWith(item.label)) || null;
  if (stateManagment?.value) {
    const updateduser = await User.findOneAndUpdate({ _id: req.user._id, currentWebState: { $ne: stateManagment?.value } }, { currentWebState: stateManagment?.value, oldWebState: user?.currentWebState || '', stateChangeDate: Date.now() }, { new: true })
  }
});

router.get('/:email', async (req, res) => {
  const user = await User.findOne({ email: req.params.email }).select('-password').lean()
  res.send({ success: !!user, user: user });
});
router.get('/byId/:id', [auth, admin], async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, status: { $ne: 'deleted' } })
      .populate('branch', 'location code _id')
      .populate('routing', 'location code _id')
      .populate('assignBranch', 'location code _id')
      .populate('accountManager', 'email fname _id phone')
      .populate('salesRep', 'email fname _id phone')
      .populate('regionalManager', 'email fname _id phone')
      .populate('shippingAddress')
      .populate('billingAddress')
      .select('-password').lean()
    res.send({ success: !!user, user: user });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/titanium/roles', [auth, admin], async (req, res) => {
  try {
    const users = await User.find(
      { status: 'active', type: 'sub-admin', }
    ).select('email _id roles branch fname lname').lean();
    // Categorizing users based on their roles
    const categorizedUsers = {
      accountManager: users,
      salesRep: users,
      regionalManager: users
    };
    // const categorizedUsers = {
    //   accountManager: users.filter(user => user.roles.includes('OS')),
    //   salesRep: users.filter(user => user.roles.includes('IS')),
    //   regionalManager: users.filter(user => user.roles.includes('RM'))
    // };

    res.status(200).json({ data: categorizedUsers, success: true });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/forget-password', async (req, res) => {
  const { error } = emailApiBodyValidate(req.body);

  if (error) return res.status(400).send({ message: error.details[0].message });

  const { email, } = req.body;

  const user = await User.findOne({ email }).lean();

  if (!user) return res.status(400).send({ message: "User is not registered with that Phone number or email" });

  if (user.status == 'deleted') return res.status(400).send({ message: 'User has been deleted. Contact admin for further support.' });

  const token = generateResetPasswordToken(user._id);
  const link = `https://api.titanium.com/api/password/forgot/${user?._id}/${token}?redirect=https://qqa.titanium.com`
  await sendGridEmail({
    email: email,
    sendCode: false,
    type: 'reset-password',
    subject: 'Password Reset',
    data: {
      fname: user.fname || '',
      lname: user.lname || '',
      resetLink: link,
      websiteName: 'Titanium Industries',
    }
  })
  res.send({ success: true, message: 'Please check your email to reset your password', link });
  return

});

router.put('/reset-password/:userId/:token', passwordauth, async (req, res) => {

  const { error } = passwordApiBodyValidate(req.body);
  if (error) return res.status(400).send({ success: false, message: error.details[0].message });
  const { password } = req.body

  const user = await User.findById(req.user._id);

  if (req.params.userId != req.user._id) return res.status(400).send({ success: false, message: 'The User with the given ID was not found.' });
  if (!user) return res.status(400).send({ success: false, message: 'The User with the given ID was not found.' });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  user.password = hashedPassword;

  await user.save();
  await sendGridEmail({
    email: user?.email,
    sendCode: false,
    type: 'password-change',
    subject: 'Password Changed',
    data: {
      fname: user.fname || '',
      lname: user.lname || '',
      siteLink: 'https://qqa.titanium.com',
      websiteName: 'Titanium Industries',
    }
  })
  res.send({ success: true, message: "Password updated successfully" });
});

router.put('/update-password', passwordauth, async (req, res) => {

  const { error } = passwordApiBodyValidate(req.body);
  if (error) return res.status(400).send({ success: false, message: error.details[0].message });

  const { password } = req.body

  const user = await User.findById(req.user._id);

  if (!user) return res.status(400).send({ success: false, message: 'The User with the given ID was not found.' });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  user.password = hashedPassword;

  await user.save();

  res.send({ success: true, message: "Password updated successfully" });
});

router.put('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req?.user?._id);

    if (!user) return res.status(400).send({ success: false, message: 'The User with the given ID was not found.' });

    const validPassword = await bcrypt.compare(oldPassword, user.password);
    if (!validPassword) return res.status(400).send({ success: false, message: 'Invalid password' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;

    await user.save();

    res.send({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

router.post('/send-code', async (req, res) => {
  const { error } = emailApiBodyValidate(req.body);
  if (error) return res.status(400).send({ success: false, message: error.details[0].message });

  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email, isVerify: true });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const verificationCode = generateCode();
    await sendGridEmail({ email: email, code: verificationCode })

    const existingTempUser = await TempUser.findOne({ email });
    if (existingTempUser) {
      await TempUser.findByIdAndUpdate(existingTempUser._id, { code: verificationCode, })
    } else {
      const tempVerification = new TempUser({ email, code: verificationCode });
      await tempVerification.save();
    }
    return res.json({ success: true, message: 'Verification code sent successfully', verificationCode });
  } catch (error) {
    console.error('Error sending verification code:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

router.post('/verify-otp/registration', async (req, res) => {
  try {
    const { email, code } = req.body;

    const verificationRecord = await TempUser.findOne({ email }).sort({ _id: -1 });

    if (!verificationRecord || verificationRecord.code !== code) {
      return res.status(400).json({ success: false, message: 'Incorrect verification code' });
    }
    const user = await User.findOneAndUpdate({ email }, { isVerify: true, code }).lean();
    await TempUser.deleteMany({ email });
    if (user?.status == 'inactive') {
      await sendGridEmail({
        sendCode: false,
        subject: 'Welcome to Titanium Industries',
        email: user?.email,
        type: 'user-registration',
        data: user
      })
      // Get distinct territory IDs that match country and state
      const territoryIds = await Territories.distinct('_id', {
        $or: [
          { 'countries.countryID': user?.countryID },
          { 'states.stateID': user.stateID }
        ]
      });

      const usersList = territoryIds?.length
        ? await User.find({
          routing: { $in: territoryIds },
          type: 'sub-admin',
        })
          .select('email')
          .lean()
        : [];
      // Titanium users
      const titaniumUsers = await handleTitaniumUsersEmail();

      // Merge and deduplicate emails
      const uniqueTitaniumUsers = [
        ...new Set([
          ...titaniumUsers,
          ...usersList.map(item => item.email)
        ])
      ];

      await sendGridEmail({
        titaniumUsers: uniqueTitaniumUsers,
        sendCode: false,
        subject: 'New Pending “T.I. Quick Quote App Account”',
        type: 'pending-user',
        data: user
      })
      await sendGridEmail({
        sendCode: false,
        subject: 'New Pending “T.I. Quick Quote App Account”',
        email: 'sales@titanium.com',
        type: 'pending-user',
        data: user
      })
    }
    return res.json({ success: true, message: 'Account created successfully, Please wait for admin approval' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.post('/signup/customer', async (req, res) => {
  try {
    const { error } = validate(req.body);
    if (error) return res.status(400).send({ success: false, message: error.details[0].message });

    const { fname, lname, stateID, countryID, old_state_id, old_country_id, isTaxLicense, isAcceptSendOffers, isAcceptTerms, phone, password, email, company,
      address,
      country, industry,
      zipCode, city, state } = req.body;


    // const verificationRecord = await TempUser.findOne({ email });

    // if (!verificationRecord) return res.status(400).json({ success: false, message: 'Verification is not completed' });

    const user = await User.findOne({ email });

    if (user) return res.status(400).send({ success: false, message: 'Email already registered' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      password: hashedPassword,
      fname,
      lname, stateID, countryID, old_state_id, old_country_id, isTaxLicense, isAcceptSendOffers, isAcceptTerms, phone,
      email,
      company,
      address,
      isVerify: false,
      country, industry,
      zipCode, city, state,
      type: req.params.type,
    });

    await newUser.save();
    // await TempUser.deleteMany({ email });

    const verificationCode = generateCode();
    await sendGridEmail({ email: email, code: verificationCode })

    const existingTempUser = await TempUser.findOne({ email });
    if (existingTempUser) {
      await TempUser.findByIdAndUpdate(existingTempUser._id, { code: verificationCode, })
    } else {
      const tempVerification = new TempUser({ email, code: verificationCode });
      await tempVerification.save();
    }
    res.send({ success: true, message: 'Verification code match successfully', verificationCode });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
router.post('/import/customer', [auth, admin], async (req, res) => {
  const { customerData } = req.body;

  if (!Array.isArray(customerData) || customerData.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No customer data provided',
    });
  }

  const getReference = async (model, filter, projection = '_id') =>
    filter ? await model.findOne(filter).select(projection).lean() : null;

  try {

    // 🔥 Get all competitor domains
    const competitorDomains = await CompetitorDomain.find({ status: 'active' })
      .select('domain -_id')
      .lean();

    const domainList = competitorDomains.map(d => d.domain.toLowerCase().trim());

    const bulkOperations = await Promise.all(
      customerData.map(async (customer) => {
        try {
          const {
            fname, lname, license_number, rails_id,
            isTaxLicense, isAcceptSendOffers, isAcceptTerms, isCompetitor,
            discount, country_id, state_id, phone, email,
            company, stratixAccount, branch_id,
            accountManager_id, regionalManager_id, salesRep_id,
            old_ship_address_id, old_bill_address_id
          } = customer;

          // ------------------------------
          // 🔥 COMPETITOR DOMAIN CHECK
          // ------------------------------

          if (!isCompetitor && email) {
            const emailLower = email.toLowerCase();

            const isCompetitorEmail = domainList.some(domain =>
              emailLower.endsWith(domain)
            );

            if (isCompetitorEmail) {
              return null; // ❌ Skip this record
            }
          }

          const [
            country,
            state,
            branch,
            accountManager,
            regionalManager,
            salesRep,
            billingAddress,
            shippingAddress
          ] = await Promise.all([
            country_id ? getReference(Countries, { old_id: country_id }, '_id name') : null,
            state_id ? getReference(States, { old_id: state_id }, '_id name') : null,
            branch_id ? getReference(Territories, { old_id: branch_id }, '_id') : null,
            accountManager_id ? getReference(User, { type: 'sub-admin', rails_id: accountManager_id }, '_id') : null,
            regionalManager_id ? getReference(User, { type: 'sub-admin', rails_id: regionalManager_id }, '_id') : null,
            salesRep_id ? getReference(User, { type: 'sub-admin', rails_id: salesRep_id }, '_id') : null,
            old_bill_address_id ? getReference(Addresses, { old_id: old_bill_address_id }, '_id zipCode address1 address2') : null,
            old_ship_address_id ? getReference(Addresses, { old_id: old_ship_address_id }, '_id zipCode address1 address2') : null,
          ]);

          const userData = {
            fname, lname,
            license_number,
            rails_id,
            isTaxLicense,
            isAcceptSendOffers,
            isAcceptTerms,
            isCompetitor,
            discount,
            phone,
            email,
            company,
            stratixAccount,

            assignBranch: branch?._id || null,
            salesRep: salesRep?._id || null,

            billingAddress: billingAddress?._id || null,
            shippingAddress: shippingAddress?._id || null,
            address: old_ship_address_id?.address1 || old_bill_address_id?.address1 || '',
            zipCode: old_ship_address_id?.zipCode || old_bill_address_id?.zipCode || '',

            regionalManager: regionalManager?._id || null,
            accountManager: accountManager?._id || null,

            countryID: country?._id || null,
            country: country?.name || '',
            stateID: state?._id || null,
            state: state?.name || '',

            old_country_id: country_id,
            old_state_id: state_id,

            isVerify: true,
            status: 'active',
            type: 'customer'
          };

          return {
            updateOne: {
              filter: { email },
              update: { $set: userData },
              upsert: true,
            },
          };
        } catch (error) {
          console.error(`Error preparing bulk op for ${customer.email || 'unknown'}`, error);
          return null;
        }
      })
    );

    const validOperations = bulkOperations.filter(Boolean);

    if (validOperations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid customer records to process',
      });
    }

    const bulkResult = await User.bulkWrite(validOperations, { ordered: false });

    return res.json({
      success: true,
      message: 'Customer data processed successfully',
      matchedCount: bulkResult.matchedCount,
      modifiedCount: bulkResult.modifiedCount,
      upsertedCount: bulkResult.upsertedCount,
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

// Importing/Updating Titanium Customers
router.post('/import/titanium', [auth, admin], async (req, res) => {
  try {
    const { titaniumData } = req.body; // Destructure titaniumData from the request body

    if (!Array.isArray(titaniumData) || titaniumData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or empty titaniumData provided.',
      });
    }

    // Process each customer in the array using Promise.all for concurrency
    const results = await Promise.all(
      titaniumData.map(async (customer) => {
        try {
          const { fname, email, phone, branch, roles, routing, permissions } = customer;

          // Validate required fields
          if (!email || !fname) {
            return {
              email,
              success: false,
              message: 'Customer must have a valid email and name.',
            };
          }

          // Check if the user already exists
          const existingUser = await User.findOne({ email });

          // Prepare the query data for upsert
          const queryData = {
            fname,
            phone,
            email,
            permissions,
            roles,
            isVerify: true,
            status: 'active',
            type: 'sub-admin',
          };

          // Fetch and map related fields (branch and routing)
          const branchData = await Territories.find({
            code: { $in: branch },
            status: 'active',
          }).select('_id');
          const routingData = await Territories.find({
            code: { $in: routing },
            status: 'active',
          }).select('_id');

          if (branchData.length > 0) {
            queryData.branch = branchData.map((item) => item._id.toString());
          }

          if (routingData.length > 0) {
            queryData.routing = routingData.map((item) => item._id.toString());
          }

          // Insert or update the user data
          await User.findOneAndUpdate({ email }, queryData, {
            new: true,
            upsert: true,
          });

          return {
            email,
            success: true,
            message: existingUser
              ? 'Customer updated successfully.'
              : 'New customer added successfully.',
          };
        } catch (error) {
          // Handle errors for individual customers
          console.error(`Error processing customer ${customer.email}:`, error);
          return {
            email: customer.email,
            success: false,
            message: `Error processing customer: ${error.message}`,
          };
        }
      })
    );

    // Respond with the results of all operations
    res.json({
      success: true,
      message: 'Customer data processed successfully.',
      results,
    });
  } catch (error) {
    // Handle server errors
    console.error('Error importing customers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
});

router.post('/register/titanium', [auth, admin], async (req, res) => {
  try {
    const { fname, phone, password, email, branch, routing, permissions, roles } = req.body;

    const user = await User.findOne({ email });

    if (user) return res.status(400).send({ success: false, message: 'Email already registered' });
    if (phone) {
      const checkPhone = await User.findOne({ phone });
      if (checkPhone) return res.status(400).send({ success: false, message: 'Phone already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      password: hashedPassword,
      fname, phone,
      isVerify: true,
      email, branch, routing, permissions, roles,
      type: 'sub-admin',
      status: 'active'
    });

    await newUser.save();

    res.send({ success: true, message: 'Account created successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
router.put('/titanium/:id', [auth, admin], async (req, res) => {
  try {
    const userId = req.params.id
    const { fname, phone, password, email, branch, routing, permissions, roles } = req.body;
    if (phone) {
      const checkPhone = await User.findOne({ _id: { $ne: userId }, phone });
      if (checkPhone) return res.status(400).send({ success: false, message: 'Phone already registered' });
    }

    let query = { fname, phone, branch, routing, permissions, roles }
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      query.password = hashedPassword
    }
    const updatedUser = await User.findByIdAndUpdate(userId, query)

    res.send({ success: true, message: 'Account Updated successfully', updatedUser });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.get('/customer/:id/:status/:search?', [auth, admin], async (req, res) => {

  try {
    let query = {};
    const { status } = req.params;
    const userType = req.user.type
    const userId = req.user._id
    const { type, phone, email, fname, assignBranch, isGenerateReport, routing, startDate, endDate, lname, company, stratixAccount, branch, industry, otherIndustry, country } = req.query;

    const validStatuses = ['inactive', 'active', 'all', "deactivated"]

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    end.setHours(23, 59, 59, 999);

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    query.type = 'customer';
    if (userType === 'sub-admin' && type == 'customer') {
      query._id = await handleGetUser({ key: 'salesRep', userId: userId }); // Ensures uniqueness
    }
    if (type) {

      const validUser = ['sub-admin', "customer"]

      if (!validUser.includes(type)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
      }
      query.type = type;
    }
    const lastId = parseInt(req.params.id) || 1;

    if (isNaN(lastId) || lastId < 0) {
      return res.status(400).json({ error: 'Invalid last_id' });
    }
    const pageSize = 10;

    const skip = Math.max(0, (lastId - 1)) * pageSize;
    if (req.params.search) {
      query.$or = [
        { fname: { $regex: new RegExp(req.params.search, 'i') } },
        { lname: { $regex: new RegExp(req.params.search, 'i') } },
        { email: { $regex: new RegExp(req.params.search, 'i') } },
        { country: { $regex: new RegExp(req.params.search, 'i') } },
        { phone: { $regex: new RegExp(req.params.search, 'i') } },
      ]
    }
    if (phone) {
      query.phone = { $regex: new RegExp(phone, 'i') }
    }
    if (email) {
      query.email = { $regex: new RegExp(email, 'i') }
    }
    if (fname) {
      query.fname = { $regex: new RegExp(fname, 'i') }
    }
    if (lname) {
      query.$or = [
        { lname: { $regex: new RegExp(lname, "i") } },
        { fname: { $regex: new RegExp(lname, "i") } }
      ];
    }
    if (company) {
      query.company = { $regex: new RegExp(company, 'i') }
    }
    if (stratixAccount) {
      query.stratixAccount = stratixAccount
    }
    if (assignBranch) {
      query.assignBranch = { $in: [assignBranch] }
    }
    if (routing) {
      query.routing = { $in: [routing] }
    }
    if (branch) {
      query.branch = { $in: [branch] }
    }
    if (industry) {
      query.industry = industry
    }
    if (otherIndustry) {
      query.otherIndustry = otherIndustry
    }
    if (country) {
      query.country = country
    }
    if (!startDate && endDate) {
      return res.status(400).json({ success: false, message: 'Invalid date format.' });
    }
    if (startDate) {
      if (isNaN(start.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid date format.' });
      }
      query.createdAt = {
        $gte: start, // Greater than or equal to start date
        $lte: end    // Less than or equal to end date
      }
    }
    query.status = { $nin: ['deleted'] };
    if (req.params.status != "all") {
      query.status = req.params.status
    }
    let users = []
    if (isGenerateReport == 'true') {
      users = await User.find(query).sort({ _id: -1 })
        .select('-password')
        .populate('assignBranch', 'code')
        .populate('accountManager', 'email fname lname')
        .populate('salesRep', 'email fname lname')
        .populate('regionalManager', 'email fname lname')
        .lean();
    } else if (type == 'sub-admin') {
      users = await User.find(query).sort({ _id: -1 })
        .populate('routing', 'location code _id') ////
        .populate('branch', 'location code _id') ///
        .select('-password')
        .skip(skip).limit(pageSize).lean();
    } else {
      users = await User.find(query).sort({ _id: -1 })
        .populate('assignBranch', 'location code _id')
        .populate('branch', 'location code _id') ///
        .populate('routing', 'location code _id') ////
        .populate('accountManager', 'email fname _id phone')
        .populate('salesRep', 'email fname _id phone')
        .populate('regionalManager', 'email fname _id phone')
        .populate('shippingAddress')
        .populate('billingAddress')
        .select('-password')
        .skip(skip).limit(pageSize).lean();
    }

    const totalCount = isGenerateReport == 'true' ? 0 : await User.countDocuments(query);
    const totalPages = isGenerateReport == 'true' ? 0 : Math.ceil(totalCount / pageSize);

    if (users.length > 0) {
      res.status(200).json({ success: true, users: users, count: { totalPage: totalPages, currentPageSize: users.length } });
    } else {
      res.status(200).json({ success: false, users: [], message: 'No more users found', count: { totalPage: totalPages, currentPageSize: users.length } });
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// router.post('/signup/admin', async (req, res) => {
//   try {

//     const { fname, lname, phone, password, email } = req.body;

//     const user = await User.findOne({ type: "admin" });

//     if (user) return res.status(400).send({ success: false, message: 'Admin already registered' });

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newUser = new User({
//       password: hashedPassword,
//       fname,
//       lname, phone,
//       email,
//       type: "admin",
//     });

//     await newUser.save();

//     res.send({ success: true, message: 'Account created successfully', user: newUser });
//   } catch (error) {
//     return res.status(500).json({ message: 'Internal server error', error: error.message });
//   }
// });
router.post('/google/auth', async (req, res) => {
  try {
    const { fname, email, profilePicture } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      const token = generateAuthToken(user._id, user.type);
      res.send({ success: true, message: 'Login successfully', token: token, user: user });
      return
    }

    const newUser = new User({
      fname,
      profilePicture,
      email,
      type: 'customer',
    });

    await newUser.save();
    const token = generateAuthToken(newUser._id, newUser.type);
    res.send({ success: true, message: 'Account created successfully', token: token, user: newUser });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.post('/verify-otp/forget-password', passwordauth, async (req, res) => {
  try {
    const { code } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) return res.status(400).send({ success: false, message: 'The User with the given ID was not found.' });

    if (Number(user.code) !== Number(code)) return res.status(400).send({ success: false, message: 'Incorrect code.' });

    return res.json({ success: true, message: 'Verification code match successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error', error: error.message });
  }
});

router.post('/check-email', async (req, res) => {
  const { error } = emailApiBodyValidate(req.body);
  if (error) return res.status(400).send({ success: false, message: error.details[0].message });

  const { email } = req.body;

  const user = await User.findOne({ email });
  if (user) return res.status(400).send({ success: false, message: 'Email already existed' });

  res.send({ success: true, message: "Email doesn't existed" });
});
router.post('/check-phone', async (req, res) => {
  const { error } = phoneApiBodyValidate(req.body);
  if (error) return res.status(400).send({ success: false, message: error.details[0].message });

  const { phone } = req.body;

  const user = await User.findOne({ phone });
  if (user) return res.status(400).send({ success: false, message: 'Phone Number already existed' });

  res.send({ success: true, message: "Phone Number doesn't existed" });
});

router.put('/update-user/:id?', auth, async (req, res) => {
  const {
    fname, lname, phone, password,
    address,
    industry, otherIndustry, billingAddress, company, assignBranch, isCompetitor, discount, regionalManager, salesRep, accountManager, stratixAccount,
    zipCode, city,
    state, stateID, country, countryID, old_state_id, old_country_id
  } = req.body;
  const userId = req.params.id || req.user._id
  const checkUser = await User.findOne({ _id: userId })
  if (!checkUser) {
    return res.status(404).json({ success: false, message: 'User not found!' })
  }
  if (phone) {
    const userCheck = await User.findOne({ _id: { $ne: userId }, phone });
    if (userCheck) return res.status(400).send({ success: false, message: 'Phone Number already existed' });
  }
  // Create an object to store the fields to be updated
  let updateFields = Object.fromEntries(
    Object.entries({
      fname, lname, phone,
      address,
      isCompetitor, discount,
      company,
      otherIndustry, billingAddress,
      stratixAccount,
      zipCode, city, state, stateID, country, countryID, old_state_id, old_country_id
    }).filter(([key, value]) => value != null)
  );
  if (password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    updateFields.password = hashedPassword
  }

  // Check if there are any fields to update
  if (Object.keys(updateFields).length === 0) {
    return res.status(400).send({ success: false, message: 'No valid fields provided for update.' });
  }
  const user = await User.findByIdAndUpdate(userId, {
    ...updateFields, industry,
    assignBranch,
    regionalManager, salesRep, accountManager,
  }, { new: true });

  if (!user) return res.status(400).send({ success: false, message: 'The User with the given ID was not found.' });
  const updatedUser = await User.findOne({ _id: userId }).select('-password')

  res.send({ success: true, message: 'User updated successfully', user: updatedUser });
});

router.post('/admin/create-user', [auth, admin], async (req, res) => {
  try {
    const {
      fname, lname, phone, email, password,
      address, industry, otherIndustry, company, assignBranch, isCompetitor, discount,
      regionalManager, salesRep, accountManager, stratixAccount, zipCode, city, state, stateID, country, countryID, old_state_id, old_country_id
    } = req.body;

    // Check if email exists
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const checkUser = await User.findOne({ email });
    if (checkUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    // Check if phone exists
    if (phone) {
      const userCheck = await User.findOne({ phone });
      if (userCheck) {
        return res.status(400).json({ success: false, message: 'Phone number already exists' });
      }
    }

    // Create user fields dynamically
    let updateFields = Object.fromEntries(
      Object.entries({
        fname, lname, phone, email, address,
        industry, otherIndustry, company, assignBranch, isCompetitor, discount,
        regionalManager, salesRep,
        accountManager, stratixAccount, zipCode, city, state, stateID, country, countryID, old_state_id, old_country_id,
        isVerify: true,
        status: 'active',
        type: 'customer',
      }).filter(([_, value]) => value !== undefined && value !== null)
    );

    // Hash password only if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    // Ensure at least one valid field exists
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for user creation.' });
    }

    // Create and save user
    const user = new User(updateFields);
    await user.save();

    // Fetch created user without password
    const newUser = await User.findById(user._id).select('-password');

    res.status(201).json({ success: true, message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/change/:status/:id', [auth, admin], async (req, res) => {
  const validstatus = ['active', 'deactivated']
  const checkStatus = validstatus.includes(req.params.status)
  if (!checkStatus) {
    return res.status(404).json('Invalid Status')
  }
  const checkUser = await User.findById(req.params.id).lean();
  if (!checkUser) return res.status(400).send({ success: false, message: 'The User with the given ID was not found.' });
  const user = await User.findByIdAndUpdate(req.params.id, { status: req.params.status, isVerify: true }, { new: true });
  if (req.params.status == 'active') {
    await sendGridEmail({
      sendCode: false,
      subject: 'Account approved for Titanium Industries, Inc.',
      email: checkUser?.email,
      type: 'account-approved',
      data: checkUser
    })
  }
  if (req.params.status == 'deactivated') {
    await sendGridEmail({
      sendCode: false,
      subject: 'Your Account Has Been Deactivated, Titanium Industries, Inc.',
      email: checkUser?.email,
      type: 'user-deactivated',
      data: checkUser
    })
  }

  res.send({ success: true, message: 'User Updated successfully', user });
});

router.delete('/', auth, async (req, res) => {

  const user = await User.findByIdAndUpdate(req.user._id, { status: 'deleted' }, { new: true });

  if (!user) return res.status(400).send({ success: false, message: 'The User with the given ID was not found.' });

  res.send({ success: true, message: 'User deleted successfully', user });
});


module.exports = router; 
