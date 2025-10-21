const mongoose = require("mongoose");

const CompetitorMarkupSchema = new mongoose.Schema({
    minValue: {
        type: Number,
        required: [true, "Min Value is required"],
        validate: {
            validator: function (value) {
                return value < this.maxValue;
            },
            message: "Min Value must be less than Max Value",
        },
    },
    maxValue: {
        type: Number,
        required: [true, "Max Value is required"],
        validate: {
            validator: function (value) {
                return value > this.minValue;
            },
            message: "Max Value must be greater than Min Value",
        },
    },
}, { timestamps: true });

const CompetitorMarkup = mongoose.model("CompetitorMarkup", CompetitorMarkupSchema);

module.exports = CompetitorMarkup;
