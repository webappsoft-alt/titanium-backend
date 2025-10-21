const mongoose = require("mongoose");

const schema_ = new mongoose.Schema({
    domain: {
        type: String,
    },
    status: {
        type: String,
        default: 'active',
        enum: ['active', 'deactivated']
    },
}, { timestamps: true });

const Prices = mongoose.model("CompetitorDomain", schema_);

module.exports = Prices;
