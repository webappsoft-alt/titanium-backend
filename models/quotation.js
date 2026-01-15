const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
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
})
const schema_ = new mongoose.Schema({
    quoteNo: {
        type: String,
        unique: true,
        index: true
    },
    billing: addressSchema,
    shipping: addressSchema,
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
    orderNo: {
        type: String,
    },
    shippingMethod: { type: String, required: false, default: "" },
    paymentMethod: { type: String, required: false, default: "" },
    subtotal: { type: Number, required: false, default: 0 },
    tax: { type: Number, required: false, default: 0 },

    shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Addresses' },
    billingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Addresses' },

    notes: {
        type: String,
    },
    quote: [{
        uniqueID: {
            type: String,
            required: true,
        },
        productForm: {
            type: String,
        },
        identifier: {
            type: String,
        },
        grade: {
            type: String,
        },
        primaryDimension: {
            type: String,
        },
        primaryDimTol: {
            type: String,
        },
        cutLength: String,
        cutWidth: String,
        lengthTolerance: {
            type: String,
        },
        length: {
            type: String,
        },
        quantity: {
            type: String,
        },
        prices: {
            type: Object,
        },
        customCut: {
            type: Object,
        },
        oldPrices: {
            type: Object,
        },
        pricesId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Prices',
            required: false,
            default: null
        },
        specifications: {
            type: String,
        },
        uom: {
            type: String,
        },
        alloyFamily: {
            type: String,
            required: true,
            trim: true,
        }
    }],
    totalAmount: {
        type: Number,
        required: true,
    },
    frieght: {
        type: Number,
        required: false,
        default: 0
    },
    leadTime: {
        type: String,
    },
    isOpenQuote: Boolean,
    isSalesOrder: { type: Boolean, default: false },
    closedReason: String,
    sentEmail:{
        finalizeBtn: { type: Boolean, default: false },
        proceedToBtn: { type: Boolean, default: false },
        nextSendTime: Date,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    type: {
        type: String,
        enum: ['cart', 'regular', 'open-quote']
    },
    createdTS: {
        type: Date,
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['active', 'pending', 'closed', 'approved', 'completed', 'rejected', 'deactivated']
    },
}, { timestamps: true });

const Quotation = mongoose.model("Quotation", schema_);

module.exports = Quotation;
