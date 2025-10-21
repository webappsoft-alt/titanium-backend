const mongoose = require("mongoose");


const cartSchema = new mongoose.Schema({
    uniqueID: {
        type: String,
        required: true,
    },
    productForm: {
        type: String,
        trim: true
    },
    grade: {
        type: String,
        trim: true
    },
    primaryDimension: {
        type: String,
        trim: true
    },
    primaryDimTol: {
        type: String,
        trim: true
    },
    lengthTolerance: {
        type: String,
        trim: true
    },
    length: {
        type: String,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    prices: Object,
    customCut: Object,
    oldPrices: {
        type: Object,
    },
    cutLength: String,
    cutWidth: String,
    pricesId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prices',
        required: false,
        default: null
    },
    specifications: {
        type: String,
        trim: true
    },
    uom: {
        type: String,
        trim: true
    },
    identifier: {
        type: String,
    },
    alloyFamily: {
        type: String,
        required: true,
        trim: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true // Optimized for faster lookup
    },
    type: {
        type: String,
        enum: ['pipe-fitting', 'mill-product'],
        required: true
    }
}, { timestamps: true });

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
