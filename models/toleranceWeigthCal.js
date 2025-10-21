const mongoose = require("mongoose");

const schema_ = new mongoose.Schema({
    alloyFamily: [{
        type: String,
    }],
    alloyType: [{
        type: String,
    }],
    diameter: [{
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        tolerance: { type: Number, default: 0 },
    }],
    length: [{
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        tolerance: { type: Number, default: 0 },
    }],
    outsideDiameter: [{
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        tolerance: { type: Number, default: 0 },
    }],
    insideDiameter: [{
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        tolerance: { type: Number, default: 0 },
    }],
    wallTickness: [{
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        tolerance: { type: Number, default: 0 },
    }],
    hexAF: [{
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        tolerance: { type: Number, default: 0 },
    }],
    thickness: [{
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        tolerance: { type: Number, default: 0 },
    }],
    width: [{
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        tolerance: { type: Number, default: 0 },
    }],
    type: {
        type: String,
        enum: ['diameter', 'length', 'hexAF', 'thickness', 'width', 'wallTickness', 'insideDiameter', 'outsideDiameter']
    },
    unit: {
        type: String,
        enum: ['in', 'ft', 'mm', 'm']
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'deactivated']
    },
}, { timestamps: true });

const Products = mongoose.model("ToleranceWeigth", schema_);

module.exports = Products;
