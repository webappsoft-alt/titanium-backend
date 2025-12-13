const Territories = require('../models/territories');  // Your Mongoose schema file
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');

exports.create = async (req, res) => {
    try {
        const { countries, states, location, code, } = req.body;

        const territories = new Territories({ countries, states, location, code });

        await territories.save();

        sendEncryptedResponse(res, { success: true, message: "Territories created successfully", territories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all territories
exports.getAll = async (req, res) => {
    try {
        const lastId = parseInt(req.params.id) || 1;

        if (isNaN(lastId) || lastId < 0) {
            return res.status(400).json({ error: 'Invalid last_id' });
        }
        const pageSize = 10;
        let query = { status: 'active' }

        const skip = Math.max(0, (lastId - 1)) * pageSize;
        const territories = await Territories.find(query).sort({ _id: -1 }).skip(skip).limit(pageSize).lean();

        const totalCount = await Territories.countDocuments(query);
        const totalPages = Math.ceil(totalCount / pageSize);

        sendEncryptedResponse(res, {
            success: true, territories,
            count: { totalPage: totalPages, currentPageSize: territories.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllData = async (req, res) => {
    try {

        let query = { status: 'active' }
        const territories = await Territories.find(query).select('-countries -states').sort({ _id: -1 }).lean();
        sendEncryptedResponse(res, {
            success: true, territories,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single quotation by ID
exports.getById = async (req, res) => {
    try {
        const quotation = await Territories.findById(req.params.id);
        if (!quotation) {
            return res.status(404).json({ success: false, message: "Territories not found" });
        }
        sendEncryptedResponse(res, { success: true, data: quotation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update quotation by ID
exports.edit = async (req, res) => {
    try {
        const { countries, states, location, code, } = req.body
        const updatedTerritories = await Territories.findByIdAndUpdate(req.params.id, { countries, states, location, code, }, { new: true });
        if (!updatedTerritories) {
            return res.status(404).json({ success: false, message: "Territories not found" });
        }
        sendEncryptedResponse(res, { success: true, message: "Territories updated successfully", data: updatedTerritories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete quotation by ID
exports.delete_ = async (req, res) => {
    try {
        const deletedTerritories = await Territories.findByIdAndUpdate(req.params.id, { $set: { status: 'deactivated' } });
        if (!deletedTerritories) {
            return res.status(404).json({ success: false, message: "Territories not found" });
        }
        sendEncryptedResponse(res, { success: true, message: "Territories deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
