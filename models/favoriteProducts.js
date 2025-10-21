const mongoose = require("mongoose");


const favoriteSchema = new mongoose.Schema({
    alloyFamily: {
        type: String,
        required: true,
        trim: true
    },
    productForm: {
        type: String,
        trim: true
    },
    uom: {
        type: String,
        trim: true
    },
    uniqueID: {
        type: String,
        required: true,
    },
    grade: {
        type: String,
        trim: true
    },
    specifications: {
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
    length: {
        type: String,
    },
    lengthTolerance: {
        type: String,
        trim: true
    },
    prices: Object,
    identifier: {
        type: String,
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true // Optimized for faster lookup
    },
    productData: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ProductsData',
        required: true,
    },
    type: {
        type: String,
        enum: ['pipe-fitting', 'mill-product'],
        required: true
    }
}, { timestamps: true });

const FavoriteProducts = mongoose.model("FavoriteProducts", favoriteSchema);

module.exports = FavoriteProducts;
