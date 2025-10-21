const mongoose = require("mongoose");

const schema_ = new mongoose.Schema({
    old_id: String,
    code: {
        type: String,
    },
    location: {
        type: String,
    },
    states: [{
        name: {
            type: String,
        },
        abbr: {
            type: String,
        },
        country: {
            type: String,
        },
        old_id: {
            type: String,
        },
        stateID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'States',
            default: null
        },
    }],
    countries: [{
        name: {
            type: String,
        },
        iso: {
            type: String,
        },
        old_id: {
            type: String,
            required: false,
        },
        iso_name: {
            type: String,
            required: false,
        },
        countryID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Country",
            default: null
        },
    }],
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'deactivated']
    },
}, { timestamps: true });

const Prices = mongoose.model("Territories", schema_);

module.exports = Prices;
