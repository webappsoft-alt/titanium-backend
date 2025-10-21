const mongoose = require("mongoose");
const schema_ = mongoose.Schema({
    image: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
}, { timestamps: true })
module.exports = mongoose.model("generalContent", schema_)