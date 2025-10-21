const mongoose = require("mongoose");

const schema_ = new mongoose.Schema({
    alloyFamily: {
        type: String,
    },
    alloyType: {
        type: String,
    },
    densityLbs: {
        type: String,
    },
    densityKg: {
        type: String,
    },
    updatedLabel: {
        type: String,
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'deactivated']
    },
}, { timestamps: true });

const Products = mongoose.model("Density", schema_);

module.exports = Products;
