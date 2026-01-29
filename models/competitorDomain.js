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
schema_.index({ domain: 1, status: 1 });
module.exports = Prices;
