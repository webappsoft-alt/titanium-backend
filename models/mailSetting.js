const mongoose = require('mongoose');

const MailSettingsSchema = new mongoose.Schema({
    enableMailDelivery: { type: Boolean, default: false },
    sendMailsAs: { type: String, required: true },
    sendCopyTo: { type: String },
    interceptEmail: { type: String },
    smpt: {
        domain: { type: String, required: true },
        host: { type: String, required: true },
        port: { type: String, required: true },
        connection: { type: String, enum: ['none', 'ssl', 'tls'], default: 'none' },
        authType: { type: String, enum: ['none', 'plain', 'login', 'cram_md5'], default: 'none' },
    },
    username: { type: String },
    password: { type: String, select:false }
}, { timestamps: true });

module.exports = mongoose.model('MailSettings', MailSettingsSchema);
