const mongoose = require("mongoose");

const pricesSchema = new mongoose.Schema({
    priceLabel: {
        type: String,
    },
    price: {
        type: String,
    },
});

const schema_ = new mongoose.Schema({
    uniqueID: {
        type: String,
        required: true,
        trim: true,
    },
    identifier: String,
    available_quantity: Number,
    type: {
        type: String,
        enum: ['pipe-fitting', 'mill-product']
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'deactivated']
    },
    prices: [pricesSchema], // Array of grades
}, { timestamps: true });

const Prices = mongoose.model("Prices", schema_);

module.exports = Prices;
