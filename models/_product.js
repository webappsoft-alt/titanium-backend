const mongoose = require("mongoose");

const specificationSchema = new mongoose.Schema({
    specification: {
        type: String,
        // required: true,
        trim: true,
    },
    primaryDimension: [String], // Array of primary descriptions
});


const gradeSchema = new mongoose.Schema({
    gradeAlloy: {
        type: String,
        // required: true,
        trim: true,
    },
    specifications: [specificationSchema],
});
const productSchema = new mongoose.Schema({
    product: {
        type: String,
        // required: true,
        trim: true,
    },
    grades: [gradeSchema],

});

const schema_ = new mongoose.Schema({
    alloyFamily: {
        type: String,
        required: true,
        trim: true,
    },
    productFile: {
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
    products: [productSchema], // Array of grades
}, { timestamps: true });

const Products = mongoose.model("Products", schema_);

module.exports = Products;
