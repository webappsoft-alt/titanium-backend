const Quotation = require('../models/quotation');  // Your Mongoose schema file
const Addresses = require('../models/addresses');  // Your Mongoose schema file
const { User } = require('../models/user');            // Assuming there's a User schema
const { generateUniqueQuoteNo } = require('./generateCode'); // Unique number generator
const Cart = require("../models/cart");
const { parseEmails } = require('../helpers/utils')
const MailSettings = require('../models/mailSetting');

const logger = require('../startup/logger'); // Adjust the path as needed

const multer = require('multer');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const { sendGridEmail } = require('./sendGridEmial');
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');

// Use multer to handle file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

const handleTitaniumUsersEmail = async () => {
    const usersEmail = await MailSettings.findOne({}).sort({ _id: -1 }).select('sendCopyTo').lean()
    if (usersEmail?.sendCopyTo) {
        return parseEmails(usersEmail?.sendCopyTo)
    }
}

// Delete scheduled PDF file and reset quotation sentEmail fields
const cleanupScheduledQuotationEmail = async (quotationId) => {
    try {
        const quotation = await Quotation.findById(quotationId).lean();
        if (!quotation) {
            return { success: false, message: 'Quotation not found' };
        }

        const filePath = quotation.sentEmail?.saveFilePath;

        // Delete the PDF file if it exists
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Reset proceedToBtn, nextSendTime, and saveFilePath
        await Quotation.findByIdAndUpdate(quotationId, {
            $set: {
                'sentEmail.proceedToBtn': false,
                'sentEmail.nextSendTime': null,
                'sentEmail.saveFilePath': '',
            }
        });

        return { success: true, message: 'Scheduled email cleanup completed' };
    } catch (err) {
        console.error(`Error cleaning up scheduled quotation email for ${quotationId}:`, err);
        return { success: false, message: err.message };
    }
};

const handleGetUser = async ({ key, userId }) => {
    const subAdmin = await User.findById(userId)
        .select('routing branch')
        .populate('routing', 'countries states location _id') // Populate only needed fields
        .populate('branch', 'countries states location _id')
        .lean();
    // console.dir(subAdmin,{depth:null})
    if (!subAdmin) return { $in: [] }; // Handle case where user is not found

    // Extract and split `location` from routing
    const routingLocations = subAdmin.routing?.flatMap(route =>
        route.location ? route.location.split(',').map(loc => loc.trim()) : []
    ) || [];

    // Extract and split `location` from branch
    const branchLocations = subAdmin.branch?.flatMap(branch =>
        branch.location ? branch.location.split(',').map(loc => loc.trim()) : []
    ) || [];

    // Extract country and state codes from `routing`
    const routingCountries = subAdmin.routing?.flatMap(route => route.countries?.map(c => c?._id?.toString()) || []);
    const routingStates = subAdmin.routing?.flatMap(route => route.states?.map(s => s?._id?.toString()) || []);
    const routingId = subAdmin.routing?.flatMap(route => route?._id?.toString()) || [];

    // Extract country and state codes from `branch`
    const branchCountries = subAdmin.branch?.flatMap(branch => branch.countries?.map(c => c?._id?.toString()) || []);
    const branchStates = subAdmin.branch?.flatMap(branch => branch.states?.map(s => s?._id?.toString()) || []);
    const branchId = subAdmin.branch?.flatMap(branch => branch?._id?.toString()) || [];

    // Combine arrays and remove duplicates
    const countryCodes = [...new Set([...routingCountries, ...branchCountries])];
    const stateCodes = [...new Set([...routingStates, ...branchStates])];
    const locations = [...new Set([...routingLocations, ...branchLocations])];
    const assignBranch = [...new Set([...branchId, ...routingId])];

    let query = {
        $or: [
            { [key]: userId },
            ...(countryCodes.length > 0 ? [{ 'countryID': { $in: countryCodes } }] : []),
            ...(stateCodes.length > 0 ? [{ 'stateID': { $in: stateCodes } }] : []),
            ...(assignBranch.length > 0 ? [{ 'assignBranch': { $in: assignBranch } }] : []),
            ...(locations.length > 0 ? [{ 'country': { $regex: new RegExp(locations.join('|'), 'i') } }] : []),
            ...(locations.length > 0 ? [{ 'state': { $regex: new RegExp(locations.join('|'), 'i') } }] : []),
        ]
    };
    const users = await User.find(query).select('_id assignBranch email').lean(); // Using `lean()` for better performance
    return { $in: users.map(item => item._id.toString()) };
};

const calculateTotalPrice = (data, discount = "0") => {
    const totalPrice = data?.reduce((total, item) => {
        const subtotal = Number(item?.prices?.price || 0) * Number(item?.quantity || 0);
        return total + subtotal;
    }, 0) || 0;

    // Convert discount string to a number (handles cases like "+10", "-10", "0")
    const discountValue = parseFloat(discount) || 0;

    // Adjust the total price based on the discount percentage
    const adjustedPrice = totalPrice + (totalPrice * (discountValue / 100));

    return adjustedPrice.toFixed(2);
};
const createQuot = async (userId, quotationData, type) => {
    try {
        const { quote, totalAmount, notes,
            zipCode, state, city, country, address2, address1, phone,
            fname, lname, company
        } = quotationData;
        const user = await User.findOne({ _id: userId, status: 'active' }).lean();
        if (!user) {
            throw new Error('User not found!');
        }
        const totalAmountUser = totalAmount || calculateTotalPrice(quote, user?.discount)

        let existingQuotation = await Quotation.findOne({ user: userId, type: 'open-quote', status: 'pending' })
        if (existingQuotation) {
            existingQuotation.type = type;
            existingQuotation.quote = quote;
            existingQuotation.sentEmail.finalizeBtn = false;
            existingQuotation.sentEmail.isAutoSendQuote = false;
            existingQuotation.createdTS = Date.now();
            existingQuotation.totalAmount = totalAmountUser
            await existingQuotation.save();
            if (type != 'open-quote') {
                await Cart.deleteMany({ user: userId });
            }
            return { success: true, message: "Quotation created successfully" };
        }
        const quoteNo = await generateUniqueQuoteNo(Quotation);
        const orderNo = await generateUniqueQuoteNo(Quotation, 'ORD');

        const newQuotation = new Quotation({
            quote, type, totalAmount: totalAmountUser, notes,
            phone: phone || user?.phone,
            email: user?.email,
            company: company || user?.company,
            fname: fname || user?.fname,
            lname: lname || user?.lname,
            zipCode, state, city, country, address2, address1,
            quoteNo, orderNo,
            sentEmail: {
                finalizeBtn: false,
                isAutoSendQuote: false,
            },
            createdTS: Date.now(),
            isOpenQuote: type == 'open-quote' ? true : false,
            user: user._id,
        });

        await newQuotation.save();
        if (type !== 'open-quote') {
            await Cart.deleteMany({ user: userId });
        }

        return { success: true, message: "Quotation created successfully" };
    } catch (error) {
        throw new Error(error.message);
    }
};
exports.createOpenQuotation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { quote, totalAmount, subtotal, tax, notes } = req.body;

        // Load user + shipping/billing in ONE call
        const user = await User.findOne({
            _id: userId,
            status: 'active',
        })
            .populate('shippingAddress billingAddress')
            .lean();

        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: 'User not found' });
        }

        const billing = user.billingAddress || null;
        const shipping = user.shippingAddress || null;

        // Generate both numbers at once
        // Look for an existing pending Open Quote first
        const existing = await Quotation.findOne({
            user: userId,
            type: 'open-quote',
            status: 'pending',
        }).lean();
        const isSendEmailFinalizeBtn = existing?.sentEmail?.finalizeBtn || false
        if (isSendEmailFinalizeBtn || quote?.length == 0) {
            return sendEncryptedResponse(res, {
                success: false,
                quotation: existing,
            });
        }
        // Generate numbers only if missing
        let quoteNo, orderNo;

        if (existing) {
            quoteNo = existing.quoteNo;
            orderNo = existing.orderNo;
        } else {
            [quoteNo, orderNo] = await Promise.all([
                generateUniqueQuoteNo(Quotation),
                generateUniqueQuoteNo(Quotation, 'ORD'),
            ]);
        }


        const pick = (a, b, c) => a ?? b ?? c;

        const newData = {
            quote,
            totalAmount,
            subtotal,
            billing,
            shipping,
            tax,
            notes,
            isOpenQuote: true,

            quoteNo,
            orderNo,

            phone: pick(billing?.phone, shipping?.phone, user.phone),
            email: user.email,
            company: user.company,
            fname: pick(billing?.fname, shipping?.fname, user.fname),
            lname: pick(billing?.lname, shipping?.lname, user.lname),

            user: user._id,
            createdTS: Date.now(),
            type: 'open-quote',
            status: 'pending',
        };

        // Upsert user’s pending quotation
        const saved = await Quotation.findOneAndUpdate(
            { user: userId, type: 'open-quote', status: 'pending' },
            newData,
            { new: true, upsert: true }
        );

        // Populate once (clean + selective)
        const quotation = await Quotation.findById(saved._id)
            .populate({
                path: 'user',
                select: '-password',
                populate: [
                    { path: 'billingAddress' },
                    { path: 'shippingAddress' },
                ],
            })
            .lean();
        sendEncryptedResponse(res, {
            success: true,
            quotation,
            message: 'Order Created Successfully',
        });
        await cleanupScheduledQuotationEmail(saved._id)
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};
// Helper function to extract address fields
const extractAddressFields = (addressData, userId) => {
    const {
        fname,
        lname,
        old_state_id,
        old_country_id,
        address2,
        address1,
        city,
        zipCode,
        country_id,
        state_id,
        phone,
        company,
        countryID,
        state,
        stateID,
        country,
    } = addressData;

    return {
        fname,
        lname,
        old_state_id,
        old_country_id,
        address2,
        address1,
        city,
        zipCode,
        country_id,
        state_id,
        phone,
        company,
        countryID,
        state,
        stateID,
        country,
        user: userId
    };
};

async function upsertUserAddress({
    userId,
    type, // 'billingAddress' | 'shippingAddress'
    addressPayload,
    currentAddressId
}) {
    if (!addressPayload || Object.keys(addressPayload).length === 0) return null;

    const addressData = extractAddressFields(addressPayload, userId);

    if (!Object.keys(addressData).length) return null;

    let addressDoc;

    if (currentAddressId) {
        addressDoc = await Addresses.findByIdAndUpdate(
            currentAddressId,
            { $set: addressData },
            { new: true }
        );
    } else {
        addressDoc = await Addresses.create(addressData);
        await User.findByIdAndUpdate(userId, {
            $set: { [type]: addressDoc._id }
        });
    }

    return addressDoc;
}

exports.createQuotation = async (req, res) => {
    try {
        const userId = req.user._id
        const { type, quote, totalAmount, frieght, notes, billing, shipping, tax, subtotal, billingAddress, shippingMethod, shippingAddress } = req.body;
        const user = await User.findOne({ _id: userId, status: 'active' }).lean();
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }
        // Run both number generations at the same time
        const [quoteNo, orderNo] = await Promise.all([
            generateUniqueQuoteNo(Quotation),
            generateUniqueQuoteNo(Quotation, 'ORD'),
        ]);

        // Check if a pending open quotation already exists
        const existingQuotation = await Quotation.findOne({
            user: userId,
            type: 'open-quote',
            status: 'pending',
        }).lean();

        const pick = (a, b, c) => a ?? b ?? c; // small helper (optional)

        const newData = {
            quote,
            type,
            totalAmount,
            frieght,
            notes,
            billing,
            shipping,
            tax,
            subtotal,
            billingAddress,
            shippingMethod,
            shippingAddress,

            quoteNo: existingQuotation?.quoteNo ?? quoteNo,
            orderNo: existingQuotation?.orderNo ?? orderNo,

            phone: pick(billing?.phone, shipping?.phone, user?.phone),
            email: user.email,
            company: user.company,
            fname: pick(billing?.fname, shipping?.fname, user?.fname),
            lname: pick(billing?.lname, shipping?.lname, user?.lname),

            isOpenQuote: false,
            isSalesOrder: true,
            user: user._id,
            createdTS: Date.now(),
        };

        const savedQuotation = await Quotation.findOneAndReplace(
            { user: userId, type: 'open-quote', status: 'pending' },
            newData,
            { new: true, upsert: true }
        );
        // Handle billing address
        const billingAddressData = await upsertUserAddress({
            userId,
            type: 'billingAddress',
            addressPayload: billing,
            currentAddressId: billingAddress
        });

        const shippingAddressData = await upsertUserAddress({
            userId,
            type: 'shippingAddress',
            addressPayload: shipping,
            currentAddressId: shippingAddress
        });

        await Cart.deleteMany({ user: userId });
        const quotation = await Quotation.findById(savedQuotation._id)
            .populate({
                path: 'user',
                select: '-password',
                populate: [
                    { path: 'billingAddress' },
                    { path: 'shippingAddress' }
                ]
            });
        sendEncryptedResponse(res, { success: true, quotation: quotation, message: 'Order Created Successfully' });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// const handleUpdate = async () => {
//     try {
//         // Find all quotations with type 'open-quote'
//         const quotations = await Quotation.find({ type: 'open-quote', status: { $ne: 'pending' } }).lean();

//         // Use a for...of loop to properly handle async updates
//         for (const element of quotations) {
//             await Quotation.findByIdAndUpdate(element._id, { type: 'cart' });
//         }

//         console.log('Quotations updated successfully');
//     } catch (error) {
//         console.error('Error updating quotations:', error);
//     }
// };
// handleUpdate()
// Get all quotations
exports.getCustomerQuotations = async (req, res) => {
    try {
        const lastId = parseInt(req.params.id) || 1;
        const userId = req.user._id
        const { stats } = req.query
        const pageSize = 10;
        const skip = Math.max(0, (lastId - 1)) * pageSize;
        const { startDate, endDate, quoteNo, orderNo } = req.query
        let query = {
            user: userId
        }
        if (stats == 'orders') {
            query.isOpenQuote = false
        } else {
            query.isOpenQuote = true
        }
        if (quoteNo) {
            query.quoteNo = { $regex: new RegExp(quoteNo, 'i') }
        }
        if (orderNo) {
            query.orderNo = { $regex: new RegExp(orderNo, 'i') }
        }
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();

        end.setHours(23, 59, 59, 999);
        if (!startDate && endDate) {
            return res.status(400).json({ success: false, message: 'Invalid date format.' });
        }
        if (startDate) {
            if (isNaN(start.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid date format.' });
            }
            query.$or = [
                { createdTS: { $gte: start, $lte: end } },
                {
                    createdTS: { $exists: false },
                    createdAt: { $gte: start, $lte: end }
                }
            ];
        }
        if (stats == 'dashboard') {
            query.status = { $in: ['pending', 'closed'] }
            query.isOpenQuote = true
            const quotations = await Quotation.find(query).select('totalAmount createdAt updatedAt createdTS status type quoteNo orderNo')
                .sort({ createdTS: -1, createdAt: -1 }).skip(skip).limit(pageSize).lean();
            query.status = { $in: ['approved', 'pending', 'completed'] }
            query.type = { $nin: ['open-quote'] }
            query.isOpenQuote = false
            const orders = await Quotation.find(query).select('totalAmount createdAt updatedAt createdTS status type quoteNo orderNo')
                .sort({ createdTS: -1, createdAt: -1 }).skip(skip).limit(pageSize).lean();

            return sendEncryptedResponse(res, {
                success: true,
                quotations,
                orders
            });
        } else {
            const quotations = await Quotation.find(query)
                .sort({ createdTS: -1, createdAt: -1 }).skip(skip).limit(pageSize).lean();

            const totalCount = await Quotation.countDocuments(query);
            const totalPages = Math.ceil(totalCount / pageSize);

            return sendEncryptedResponse(res, {
                success: true, quotations,
                count: { totalPage: totalPages, currentPageSize: quotations.length }
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllQuotations = async (req, res) => {
    try {
        const lastId = parseInt(req.params.id) || 1;
        const validType = ['open-quote']
        const validStatus = ['closed']
        const { type, status, email, fname, startDate, endDate, lname, company, branch, quoteNo, orderNo, quote } = req.query
        const userId = req.user._id
        const userType = req.user.type
        const permissions = req.user?.permissions || ''
        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : new Date();

        end.setHours(23, 59, 59, 999);
        const pageSize = 10;
        let query = {
        }
        if (quote == 'closed') {
            query.status = { $in: ['closed', 'rejected'] }
        }
        if (quote == 'open-quote') {
            query.status = { $in: ['pending'] }
            query.type = { $in: ['open-quote'] }
        }
        if (quote == 'sales') {
            query.status = { $in: ['approved', 'pending', 'completed'] }
            query.type = { $in: ['cart', 'regular',] }
        }
        if (type && !validType.includes(type)) {
            return res.status(400).json({ error: 'Invalid Type' });
        }
        if (status && !validStatus.includes(status)) {
            return res.status(400).json({ error: 'Invalid Status' });
        }
        if (isNaN(lastId) || lastId < 0) {
            return res.status(400).json({ error: 'Invalid last_id' });
        }
        if (userType === 'sub-admin' && permissions != 'admin') {
            query.user = await handleGetUser({ key: 'salesRep', userId: userId }); // Ensures uniqueness
        }
        if (email) {
            query.email = { $regex: new RegExp(email, 'i') }
        }
        if (fname) {
            query.fname = { $regex: new RegExp(fname, 'i') }
        }
        if (lname) {
            query.lname = { $regex: new RegExp(lname, 'i') }
        }
        if (company) {
            query.company = { $regex: new RegExp(company, 'i') }
        }
        if (quoteNo) {
            query.quoteNo = { $regex: new RegExp(quoteNo, 'i') }
        }
        if (orderNo) {
            query.orderNo = { $regex: new RegExp(orderNo, 'i') }
        }
        if (branch) {
            const userId = await User.find({ assignBranch: branch }).select('_id')
            query.user = { $in: [userId?.map(item => (item?._id).toString())] }
        }
        if (!startDate && endDate) {
            return res.status(400).json({ success: false, message: 'Invalid date format.' });
        }
        if (startDate) {
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid date format.' });
            }
            query.$or = [
                { createdTS: { $gte: start, $lte: end } },
                {
                    createdTS: { $exists: false },
                    createdAt: { $gte: start, $lte: end }
                }
            ];
        }

        const skip = Math.max(0, (lastId - 1)) * pageSize;
        const quotations = await Quotation.find(query).populate('user', '-password')
            .sort(({ createdTS: -1, createdAt: -1 }))
            .skip(skip).limit(pageSize).lean();

        const totalCount = await Quotation.countDocuments(query);
        const totalPages = Math.ceil(totalCount / pageSize);
        sendEncryptedResponse(res, {
            success: true, quotations,
            count: { totalPage: totalPages, currentPageSize: quotations.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.generateExcel = async (req, res) => {
    try {
        let query = {
            // status: { $in: ['closed', 'approved', 'completed'] },
            // status: { $in: ['pending'] },
            // type: { $in: ['open-quote'] },
        }

        const quotations = await Quotation.find(query).sort({ _id: -1 })
            .populate({
                path: 'user',
                select: '_id stratixAccount customerStatus assignBranch accountManager salesRep regionalManager',
                populate: [
                    { path: 'assignBranch', select: 'code' },
                    { path: 'accountManager', select: 'email' },
                    { path: 'salesRep', select: 'email' },
                    { path: 'regionalManager', select: 'email' }
                ]
            })
            .lean();

        sendEncryptedResponse(res, {
            success: true, quotations,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getQuotationStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        if (!startDate) {
            return res.status(400).json({ message: "Start date is required" });
        }
        const start = new Date(startDate);
        let end = endDate ? new Date(endDate) : new Date();
        end.setHours(23, 59, 59, 999);

        const stats = await Quotation.aggregate([
            {
                $match: {
                    $or: [
                        { createdTS: { $gte: start, $lte: end } },
                        {
                            createdTS: { $exists: false },
                            createdAt: { $gte: start, $lte: end }
                        }
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: { $toDouble: "$totalAmount" } },
                    complete: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                    incomplete: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } }
                }
            }
        ]);

        sendEncryptedResponse(res, { stats: stats[0] || { totalAmount: 0, complete: 0, incomplete: 0 } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get a single quotation by ID
exports.getQuotationById = async (req, res) => {
    try {
        const quotation = await Quotation.findById(req.params.id)
            .populate({
                path: 'user',
                select: '-password',
                populate: [
                    { path: 'billingAddress' },
                    { path: 'shippingAddress' }
                ]
            });
        if (!quotation) {
            return res.status(404).json({ success: false, message: "Quotation not found" });
        }
        sendEncryptedResponse(res, { success: true, data: quotation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getQuotationByUserId = async (req, res) => {
    try {
        const quotation = await Quotation.find({ user: req.params.id, status: { $in: ['closed', 'pending', 'approved', 'completed'] } })
            .select('status createdTS type user orderNo quoteNo isSalesOrder isOpenQuote closedReason totalAmount updatedAt').lean();

        sendEncryptedResponse(res, { success: quotation?.length > 0, data: quotation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getOpenQuotationByUserId = async (req, res) => {
    try {
        const quotation = await Quotation.findOne({ user: req.params.id, status: 'pending', type: 'open-quote' });

        sendEncryptedResponse(res, { success: !!quotation, data: quotation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update quotation by ID
exports.updateQuotation = async (req, res) => {
    try {
        const { quote, type, totalAmount, tax, subtotal, cartItem, delData } = req.body
        const updatedQuotation = await Quotation.findByIdAndUpdate(req.params.id, { quote, type, totalAmount, tax, subtotal, }, { new: true }).populate('user', '_id isCompetitor discount').lean();
        if (!updatedQuotation) {
            return res.status(404).json({ success: false, message: "Quotation not found" });
        }
        if (cartItem) {
            const isCustomcut = Number(cartItem?.cutLength || 0) > 0
            let query = { uniqueID: cartItem?.uniqueID, user: updatedQuotation?.user?._id, customCut: isCustomcut ? { $ne: null } : null }

            const cart = await Cart.findOneAndUpdate(query, {
                ...cartItem,
                user: updatedQuotation?.user?._id,
                type
            }, { upsert: true, new: true })
        }
        if (delData) {
            const isCustomcut = Number(delData?.cutLength || 0) > 0
            let query = { uniqueID: delData?.uniqueID, user: updatedQuotation?.user?._id, customCut: isCustomcut ? { $ne: null } : null }

            const cart = await Cart.findOneAndDelete(query)
        }
        sendEncryptedResponse(res, { success: true, message: "Quotation updated successfully", data: updatedQuotation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status, leadTime, type, closedReason } = req.body
        let query = { status, leadTime }
        if (type === 'open-quote') {
            query.type = 'cart'
            query.isSalesOrder = true
        }
        if (status === 'closed') {
            query.isSalesOrder = false
            query.closedReason = closedReason
        }
        const updatedQuotation = await Quotation.findByIdAndUpdate(req.params.id, query, { new: true }).populate('user', '_id isCompetitor discount assignBranch').lean();
        if (!updatedQuotation) {
            return res.status(404).json({ success: false, message: "Quotation not found" });
        }
        if (type == 'open-quote') {
            await Cart.deleteMany({ user: updatedQuotation?.user?._id });
        }
        if (status == 'approved') {
            await sendGridEmail({
                sendCode: false,
                email: updatedQuotation?.email,
                type: 'customer-quote',
                data: updatedQuotation,
                subject: `Welcome to Titanium Industries`
            })
            // Branch + titanium users list (keep duplicates for tracking)
            const assignBranchUsers = updatedQuotation?.user?.assignBranch
                ? await User.find({ type: 'sub-admin', routing: { $in: updatedQuotation?.user?.assignBranch } })
                    .lean()
                    .select('email')
                : [];

            const titaniumUsers = await handleTitaniumUsersEmail();

            // Remove duplicates by using Set
            const uniqueTitaniumUsers = [
                ...new Set([...titaniumUsers, ...assignBranchUsers.map(item => item.email)])
            ];

            await sendGridEmail({
                sendCode: false,
                titaniumUsers: uniqueTitaniumUsers,
                type: 'customer-quote',
                data: updatedQuotation,
                subject: `Welcome to Titanium Industries`
            })
        }
        sendEncryptedResponse(res, { success: true, message: "Quotation updated successfully", data: updatedQuotation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.sendOpenQuotationEmail = [
    upload.single('pdf'),
    async (req, res) => {
        try {
            const { id: quotationId } = req.params;
            const { type } = req.body;
            const { originalname, buffer } = req.file ?? {};

            // ──────────────────────────────
            // 1) Fetch quotation + user in parallel
            // ──────────────────────────────
            const quotationPromise = Quotation.findById(quotationId)
                .populate('user')
                .lean();

            const quotation = await quotationPromise;
            if (!quotation) {
                logger.warn('Quotation not found  ❌')
                return res.status(404).json({ success: false, message: 'Quotation not found' });
            }

            // Common email payload base
            const attachment = [{ filename: originalname, content: buffer }];

            // ──────────────────────────────
            // 2) Send email to customer
            // ──────────────────────────────
            await sendGridEmail({
                sendCode: false,
                email: quotation?.email || quotationPromise?.user?.email,
                type: 'open-quote',
                data: quotation,
                subject: `Open Quote - Titanium Industries`,
                attachments: attachment,
            });
            logger.info(`Open Quote Sent To: ${quotation?.email || quotationPromise?.user?.email}  ✅`)
            if (type == 'send-to-all') {
                const userPromise = User.findById(quotation.user?._id)
                    .select('salesRep assignBranch accountManager regionalManager')
                    .populate('accountManager', 'email type permissions')
                    .populate('salesRep', 'email type permissions')
                    .populate('regionalManager', 'email type permissions')
                    .lean();

                const user = await userPromise;
                const permission =
                    (user?.regionalManager?.permissions ||
                        user?.accountManager?.permissions ||
                        user?.salesRep?.permissions) === 'admin'
                        ? 'Please approve or assign a representative.'
                        : 'Please follow up with the customer.';
                // ──────────────────────────────
                // 3) Notify role-based contacts
                // ──────────────────────────────
                const roleEmails = [
                    user?.accountManager?.email,
                    user?.salesRep?.email,
                    user?.regionalManager?.email,
                ].filter(Boolean);

                const uniqueRoleEmails = [...new Set(roleEmails)];

                const rolePayload = {
                    sendCode: false,
                    type: 'new-open-quotation',
                    data: { ...quotation, permission },
                    subject: `New Web Quote Generated - ${quotation?.billing?.country || quotation?.user?.country} - Quote #${quotation?.quoteNo}`,
                    attachments: attachment,
                };

                for (const email of uniqueRoleEmails) {
                    await sendGridEmail({ ...rolePayload, email });
                }
                logger.info(`Open Quote Sent  To Internal Assigned Roles Titanium users: ${uniqueRoleEmails?.join(', ')}  ✅`)
                // ──────────────────────────────
                // 4) Notify branch + titanium users
                // ──────────────────────────────
                const assignBranchEmails = user.assignBranch
                    ? (
                        await User.find({
                            type: 'sub-admin',
                            routing: { $in: user.assignBranch },
                        })
                            .select('email')
                            .lean()
                    ).map(u => u.email)
                    : [];

                const titaniumUsers = await handleTitaniumUsersEmail();

                const uniqueTitaniumEmails = [...new Set([...titaniumUsers, ...assignBranchEmails])];

                await sendGridEmail({
                    sendCode: false,
                    titaniumUsers: uniqueTitaniumEmails,
                    type: 'new-open-quotation',
                    data: { ...quotation, permission },
                    subject: rolePayload.subject,
                    attachments: attachment,
                });
                logger.info(`Open Quote Sent  To Main Titanium users: ${uniqueTitaniumEmails?.join(', ')}  ✅`)
            }
            const updateQuotation = await Quotation.findByIdAndUpdate(quotationId, { $set: { sentEmail: { finalizeBtn: true } } })
            return sendEncryptedResponse(res, {
                success: true,
                message: 'Email sent successfully',
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: err.message });
        }
    },
];

exports.sendQuotationEmail = [
    upload.single('pdf'), // Handle file upload
    async (req, res) => {
        try {
            const { id: quotationId, type } = req.params
            const updatedQuotation = await Quotation.findById(quotationId).lean();
            const { originalname, buffer } = req.file;
            if (type == 'approved') {
                await sendGridEmail({
                    sendCode: false,
                    email: updatedQuotation?.email,
                    type: 'customer-quote',
                    data: updatedQuotation,
                    subject: `Welcome to Titanium Industries`,
                    attachments: [
                        {
                            filename: originalname,
                            content: buffer,
                        },
                    ],
                })
                const titaniumUsers = await handleTitaniumUsersEmail()
                await sendGridEmail({
                    sendCode: false,
                    titaniumUsers: titaniumUsers,
                    type: 'customer-quote',
                    data: updatedQuotation,
                    subject: `Welcome to Titanium Industries`,
                    attachments: [
                        {
                            filename: originalname,
                            content: buffer,
                        },
                    ],
                })
                return sendEncryptedResponse(res, { success: true, message: 'Email sent successfully' });
            }
            await sendGridEmail({
                sendCode: false,
                email: updatedQuotation?.email,
                type: 'sales-order',
                data: updatedQuotation,
                subject: `Your Quote is Ready #${(type == 'sales' || type == 'sales-cart') ? updatedQuotation?.orderNo : updatedQuotation?.quoteNo} - Titanium Industries`,
                attachments: [
                    {
                        filename: originalname,
                        content: buffer,
                    },
                ],
            })
            if (type == 'sales-cart') {
                const user = await User.findOne({ _id: updatedQuotation?.user })
                    .populate('accountManager', 'email type permissions')
                    .populate('salesRep', 'email type permissions')
                    .populate('regionalManager', 'email type permissions')
                    .lean()
                    .select('salesRep assignBranch accountManager regionalManager');

                // Collect only role-based emails
                const roleEmails = [
                    user?.accountManager?.email,
                    user?.salesRep?.email,
                    user?.regionalManager?.email,
                ].filter(Boolean);

                // Make them unique so same person won’t get duplicates
                const uniqueRoleEmails = [...new Set(roleEmails)];

                // Send email to each unique role email
                for (const email of uniqueRoleEmails) {
                    await sendGridEmail({
                        sendCode: false,
                        email,
                        type: 'new-quotation',
                        data: {
                            ...updatedQuotation,
                            permission: (user?.regionalManager?.permissions || user?.accountManager?.permissions || user?.salesRep?.permissions) === 'admin'
                                ? 'Please approve or assign a representative.'
                                : 'Please follow up with the customer.'
                        },
                        subject: `New Sales Order - ${updatedQuotation?.fname} ${updatedQuotation?.lname || ''} - Quote #${(type == 'sales' || type == 'sales-cart') ? updatedQuotation?.orderNo : updatedQuotation?.quoteNo}`,
                        attachments: [
                            {
                                filename: originalname,
                                content: buffer,
                            },
                        ],
                    });
                }

                // Branch + titanium users list (keep duplicates for tracking)
                const assignBranchUsers = user.assignBranch
                    ? await User.find({ type: 'sub-admin', routing: { $in: user.assignBranch } })
                        .lean()
                        .select('email')
                    : [];

                const titaniumUsers = await handleTitaniumUsersEmail();

                // Remove duplicates by using Set
                const uniqueTitaniumUsers = [
                    ...new Set([...titaniumUsers, ...assignBranchUsers.map(item => item.email)])
                ];

                await sendGridEmail({
                    sendCode: false,
                    titaniumUsers: uniqueTitaniumUsers,
                    type: 'new-quotation',
                    data: {
                        ...updatedQuotation,
                        permission: (user?.regionalManager?.permissions || user?.accountManager?.permissions || user?.salesRep?.permissions) === 'admin'
                            ? 'Please approve or assign a representative.'
                            : 'Please follow up with the customer.'
                    },
                    subject: `New Sales Order - ${updatedQuotation?.fname} ${updatedQuotation?.lname || ''} - Quote #${(type == 'sales' || type == 'sales-cart') ? updatedQuotation?.orderNo : updatedQuotation?.quoteNo}`,
                    attachments: [
                        {
                            filename: originalname,
                            content: buffer,
                        },
                    ],
                });
            }

            sendEncryptedResponse(res, { success: true, message: 'Email sent successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
];
exports.deleteQuotation = async (req, res) => {
    try {
        const deletedQuotation = await Quotation.findByIdAndUpdate(req.params.id, { $set: { status: 'deactivated' } });
        if (!deletedQuotation) {
            return res.status(404).json({ success: false, message: "Quotation not found" });
        }
        sendEncryptedResponse(res, { success: true, message: "Quotation deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Save PDF file locally and schedule email for later
exports.savePdfAndScheduleEmail = [
    upload.single('pdf'),
    async (req, res) => {
        try {
            const { quotationId } = req.body;
            const { buffer } = req.file ?? {};

            if (!quotationId) {
                return res.status(400).json({ success: false, message: 'quotationId is required' });
            }

            if (!buffer) {
                return res.status(400).json({ success: false, message: 'PDF file is required' });
            }

            const quotation = await Quotation.findById(quotationId).lean();
            if (!quotation) {
                return res.status(404).json({ success: false, message: 'Quotation not found' });
            }
            if (quotation.sentEmail.isAutoSendQuote) {
                return sendEncryptedResponse(res, { success: false, message: 'Email Sent' });
            }

            // Create uploads directory if it doesn't exist
            const uploadsDir = path.join(__dirname, '..', 'uploads', 'quotations');
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Save PDF file with quotationId as filename
            const filePath = path.join(uploadsDir, `${quotationId}.pdf`);
            fs.writeFileSync(filePath, buffer);

            // Set nextSendTime to 3 hours from now
            const nextSendTime = new Date(Date.now() + 3 * 60 * 60 * 1000);

            // Update quotation with proceedToBtn, saveFilePath, and nextSendTime
            await Quotation.findByIdAndUpdate(quotationId, {
                $set: {
                    'sentEmail.proceedToBtn': true,
                    'sentEmail.isAutoSendQuote': false,
                    'sentEmail.saveFilePath': filePath,
                    'sentEmail.nextSendTime': nextSendTime,
                }
            });

            return sendEncryptedResponse(res, {
                success: true,
                message: 'PDF saved and email scheduled successfully',
                nextSendTime,
            });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: err.message });
        }
    },
];

// Cron job handler to process scheduled quotation emails
exports.processScheduledQuotationEmails = async () => {
    try {
        const now = new Date();

        // Find quotations where proceedToBtn is true and nextSendTime has passed
        const quotations = await Quotation.find({
            'sentEmail.proceedToBtn': true,
            'sentEmail.isAutoSendQuote': false,
            'sentEmail.nextSendTime': { $lte: now },
        }).populate('user').lean();
        if (quotations?.length == 0) {
            return
        }
        for (const quotation of quotations) {
            try {
                const filePath = quotation.sentEmail?.saveFilePath;

                // Check if file exists
                if (!filePath || !fs.existsSync(filePath)) {
                    console.error(`PDF file not found for quotation ${quotation._id}`);
                    continue;
                }

                // Read the PDF file
                const pdfBuffer = fs.readFileSync(filePath);
                const attachment = [{
                    filename: `${quotation._id}.pdf`,
                    content: pdfBuffer,
                }];

                // Send email to customer
                await sendGridEmail({
                    sendCode: false,
                    email: quotation?.email || quotation?.user?.email,
                    type: 'open-quote',
                    data: quotation,
                    subject: `Open Quote - Titanium Industries`,
                    attachments: attachment,
                });

                // Get user with populated fields for role-based emails
                const user = await User.findById(quotation.user?._id)
                    .select('salesRep assignBranch accountManager regionalManager')
                    .populate('accountManager', 'email type permissions')
                    .populate('salesRep', 'email type permissions')
                    .populate('regionalManager', 'email type permissions')
                    .lean();

                const permission =
                    (user?.regionalManager?.permissions ||
                        user?.accountManager?.permissions ||
                        user?.salesRep?.permissions) === 'admin'
                        ? 'Please approve or assign a representative.'
                        : 'Please follow up with the customer.';

                // Notify role-based contacts
                const roleEmails = [
                    user?.accountManager?.email,
                    user?.salesRep?.email,
                    user?.regionalManager?.email,
                ].filter(Boolean);

                const uniqueRoleEmails = [...new Set(roleEmails)];

                const rolePayload = {
                    sendCode: false,
                    type: 'new-open-quotation',
                    data: { ...quotation, permission },
                    subject: `New Web Quote Generated - ${quotation?.billing?.country || quotation?.user?.country} - Quote #${quotation?.quoteNo}`,
                    attachments: attachment,
                };

                for (const email of uniqueRoleEmails) {
                    await sendGridEmail({ ...rolePayload, email });
                }

                // Notify branch + titanium users
                const assignBranchEmails = user?.assignBranch
                    ? (
                        await User.find({
                            type: 'sub-admin',
                            routing: { $in: user.assignBranch },
                        })
                            .select('email')
                            .lean()
                    ).map(u => u.email)
                    : [];

                const titaniumUsers = await handleTitaniumUsersEmail();

                const uniqueTitaniumEmails = [...new Set([...titaniumUsers, ...assignBranchEmails])];

                await sendGridEmail({
                    sendCode: false,
                    titaniumUsers: uniqueTitaniumEmails,
                    type: 'new-open-quotation',
                    data: { ...quotation, permission },
                    subject: rolePayload.subject,
                    attachments: attachment,
                });

                // Delete the PDF file
                fs.unlinkSync(filePath);

                // Reset proceedToBtn and nextSendTime
                await Quotation.findByIdAndUpdate(quotation._id, {
                    $set: {
                        'sentEmail.proceedToBtn': false,
                        'sentEmail.isAutoSendQuote': true,
                        'sentEmail.nextSendTime': null,
                        'sentEmail.saveFilePath': '',
                    }
                });

                console.log(`Scheduled email sent for quotation ${quotation._id}`);
            } catch (err) {
                console.error(`Error processing quotation ${quotation._id}:`, err);
            }
        }
    } catch (err) {
        console.error('Error in processScheduledQuotationEmails:', err);
    }
};

exports.createQuot = createQuot;
exports.handleGetUser = handleGetUser;