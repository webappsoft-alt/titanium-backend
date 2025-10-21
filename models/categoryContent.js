const mongoose = require("mongoose");
const schema_ = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false
    },
    images: [{
        type: String,
        required: false
    }],
}, { timestamps: true })
module.exports = mongoose.model("CategoryContent", schema_)