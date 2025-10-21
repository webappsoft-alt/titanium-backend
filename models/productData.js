const mongoose = require("mongoose");

const schema_ = new mongoose.Schema({
    alloyFamily: {
        type: String,
    },
    alloyType: {
        type: String,
    },
    name: {
        type: String,
    },
    isFeature: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
    },
    meta: {
        description: {
            type: String,
        },
        title: {
            type: String,
        },
        keywords: {
            type: String,
        },
    },
    image: {
        type: String,
    },
    imgAlt: {
        type: String,
    },
    type: {
        type: String,
        enum: ['pipe-fitting', 'mill-product']
    },
    slug: String,
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Products' },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'deactivated']
    },
}, { timestamps: true });

const Products = mongoose.model("ProductsData", schema_);

module.exports = Products;
