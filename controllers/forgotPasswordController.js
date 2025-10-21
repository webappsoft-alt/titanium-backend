
const { User } = require('../models/user')
const path = require('path');
const bcrypt = require('bcryptjs');

exports.forgotPassword = async (req, res) => {
    try {
        res.sendFile(path.join(__dirname, '../startup/forgot-password.html'));
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
exports.UpdatePassword = async (req, res) => {
    try {
        const userId = req.user._id;
        const newPassword = req.body.newPassword;
        const user = await User.findOne({ _id: userId })
        if (!user) return res.status(404).send({ success: false, message: 'User not found!' });
        if (user.status == 'deleted') return res.status(400).send({ success: false, message: 'User has been deleted. Contact admin for further support.' });
        if (user.status == 'deactivated') return res.status(400).send({ success: false, message: 'User has been deactivated. Contact admin for further support.' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();
      
        res.status(200).send(`Password reset successful`);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
}