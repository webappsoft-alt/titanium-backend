const GeneralContent = require('../models/generalContent');
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');

// Bulk Create or Update
exports.bulkCreateOrUpdate = async (req, res) => {
    try {
        const { generalContent } = req.body; // Expecting an array of objects

        if (!Array.isArray(generalContent) || generalContent.length === 0) {
            return res.status(400).json({ message: 'Content array is required.' });
        }

        const results = [];

        for (const item of generalContent) {
            const { _id, image, description } = item;

            if (!image || !description) {
                results.push({ error: 'Missing required fields', item });
                continue;
            }

            if (_id) {
                // Update existing document
                const updated = await GeneralContent.findByIdAndUpdate(
                    _id,
                    { image, description },
                    { new: true }
                );
                results.push(updated || { error: 'Item not found for update', _id });
            } else {
                // Create new document
                const created = new GeneralContent({ image, description });
                await created.save();
                results.push(created);
            }
        }

        return sendEncryptedResponse(res, { message: 'Content Updated Successfully', results, success: true });
    } catch (error) {
        console.error('Error in bulkCreateOrUpdate:', error);
        return res.status(500).json({ message: 'Internal server error.', error });
    }
};

exports.getAll = async (req, res) => {
    try {

        const data = await GeneralContent.find().sort({ _id: -1 }).lean();
        return sendEncryptedResponse(res, { data });

    } catch (error) {
        console.error('Error in getCategory:', error);
        return res.status(500).json({ message: 'Internal server error.', error });
    }
};