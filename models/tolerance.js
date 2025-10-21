const mongoose = require("mongoose");

const toleranceSchema = new mongoose.Schema({
    label: {
        type: String,
    },
    value: {
        type: String,
    },
});

const schema_ = new mongoose.Schema({
    uniqueID: {
        type: String,
        required: true,
        trim: true,
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
    tolerance: [toleranceSchema], // Array of grades
}, { timestamps: true });

const Tolerances = mongoose.model("Tolerance", schema_);

module.exports = Tolerances;
