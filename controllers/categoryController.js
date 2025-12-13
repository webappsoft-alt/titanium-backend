const CategoryContent = require('../models/categoryContent');
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');

// Create or Update Category
exports.create_ = async (req, res) => {
    try {
        const { name, description, images } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Name is required.' });
        }

        // Check if category exists
        let category = await CategoryContent.findOne({ name });

        if (category) {
            // Update existing category
            category.description = description ?? category.description;
            category.images = images ?? category.images;
            await category.save();

            return sendEncryptedResponse(res, { message: 'Category updated successfully.', category });
        }

        // Create new category
        category = new CategoryContent({ name, description, images });
        await category.save();

        return sendEncryptedResponse(res, { message: 'Category created successfully.', category });

    } catch (error) {
        console.error('Error in createOrUpdateCategory:', error);
        return res.status(500).json({ message: 'Internal server error.', error });
    }
};
exports.getAll = async (req, res) => {
    try {

        const categories = await CategoryContent.find().sort({ _id: -1 }).lean();
        return sendEncryptedResponse(res, { categories });

    } catch (error) {
        console.error('Error in getCategory:', error);
        return res.status(500).json({ message: 'Internal server error.', error });
    }
};
exports.getById = async (req, res) => {
    try {
        const id = req.params.id
        const category = await CategoryContent.findOne({ _id: id }).lean();
        return sendEncryptedResponse(res, { category });

    } catch (error) {
        console.error('Error in getCategory:', error);
        return res.status(500).json({ message: 'Internal server error.', error });
    }
};
