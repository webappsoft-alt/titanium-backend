const MailSettings = require('../models/mailSetting');
const bcrypt = require('bcryptjs');

// Save or Update Mail Settings
exports.saveMailSettings = async (req, res) => {
    try {
        const { smpt, interceptEmail, sendCopyTo, sendMailsAs, enableMailDelivery, password, username } = req.body;
        let mailSettings = await MailSettings.findOne(); // Find existing settings
        let updateFields = { smpt, interceptEmail, sendCopyTo, sendMailsAs, enableMailDelivery, username }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateFields.password = hashedPassword
        }
        if (mailSettings) {
            // Update existing settings
            mailSettings = await MailSettings.findByIdAndUpdate(mailSettings._id, updateFields, { new: true });
        } else {
            // Create new settings
            mailSettings = new MailSettings(updateFields);
            await mailSettings.save();
        }

        res.status(200).json({ success: true, message: "Mail settings updated successfully", mailSettings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Mail Settings
exports.getMailSettings = async (req, res) => {
    try {
        const mailSetting = await MailSettings.findOne();
        if (!mailSetting) {
            return res.status(404).json({ success: false, message: "Mail settings not found" });
        }
        res.status(200).json({ success: true, mailSetting });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
