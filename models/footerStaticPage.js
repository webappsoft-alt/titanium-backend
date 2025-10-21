const mongoose = require("mongoose");
const schema_ = mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['faqs', 'terms-condition']
    },
    detail: {
        type: String,
        required: false
    },
    faqs: { question: String, answer: String,  },
    orderIndex: { type: Number, required: false },
}, { timestamps: true })
module.exports = mongoose.model("StaticPage", schema_)