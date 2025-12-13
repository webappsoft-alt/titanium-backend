const FavoriteProducts = require('../models/favoriteProducts');
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');
// Add a new favorite item
exports.create_ = async (req, res) => {
    try {
        const { uniqueID } = req.body;

        // Check if favorite already exists for this user and uniqueID
        const existing = await FavoriteProducts.findOne({
            uniqueID,
            user: req.user._id,
        });

        if (existing) {
            // Remove if exists (toggle off)
            await FavoriteProducts.findByIdAndDelete(existing._id);
            return sendEncryptedResponse(res, { success: true, message: 'Removed from favorites' });
        }

        // Else, add it (toggle on)
        const favoriteData = {
            ...req.body,
            user: req.user._id,
        };

        const favorite = new FavoriteProducts(favoriteData);
        await favorite.save();

        sendEncryptedResponse(res, {
            success: true,
            message: 'Added to favorites successfully',
            data: favorite,
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get all favorites for a user
exports.getByUser = async (req, res) => {
    try {
        const favorites = await FavoriteProducts.find({ user: req.user._id }).populate('productData');
        sendEncryptedResponse(res, { success: true, data: favorites });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Get a single favorite by ID
exports.getById = async (req, res) => {
    try {
        const favorite = await FavoriteProducts.find({ productData: req.params.id, user: req.user._id }).select('uniqueID');

        if (!favorite) {
            return res.status(404).json({ success: false, message: 'Favorite Product not found' });
        }

        sendEncryptedResponse(res, { success: true, data: favorite });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// Remove a favorite item
exports.remove_ = async (req, res) => {
    try {
        const deleted = await FavoriteProducts.findOneAndDelete({ _id: req.params.id, user: req.user._id });

        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Favorite Product not found or not authorized' });
        }

        sendEncryptedResponse(res, { success: true, message: 'Favorite Product removed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
