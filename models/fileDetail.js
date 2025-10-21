const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    size: {
        type: Number, // size in bytes
        required: true
    },
    url: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['csv', 'xlsx', 'xls'], // extend if needed
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    uploadedType: {
        type: String,
        default:'',
        enum: ['pipe-fitting', 'mill-product','']
    },
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
