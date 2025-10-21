const mongoose = require("mongoose");

const schema_ = new mongoose.Schema({
    alloyFamily: {
        type: String,
    },
    productForm: {
        type: String,
    },
    specifications: {
        type: String,
    },
    gradeAlloy: {
        type: String,
    },
    primaryDimension: {
        type: String,
    },
    uniqueID: {
        type: String,
    },
    available_quantity: {
        type: Number,
    },
    uom: String,
    length: Number,
    lengthTolerance: Number,
    diameter: Number,
    primaryDimTol: Number,
    density: Number,
    lbFTTol: Number,
    lbFTwithoutTol: Number,
    identifier: {
        type: String,
    },
    type: {
        type: String,
        enum: ['pipe-fitting', 'mill-product']
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'deactivated']
    },
}, { timestamps: true });

const DiscountedProduct = mongoose.model("DiscountedProduct", schema_);

module.exports = DiscountedProduct;
