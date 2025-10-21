const Competitor = require('../models/competitorDomain');  // Your Mongoose schema file

exports.create = async (req, res) => {
    try {
        const { domain, } = req.body;

        const domainData = new Competitor({ domain });

        await domainData.save();

        res.status(201).json({ success: true, message: "Competitor created successfully", domainData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all domainData
exports.getAll = async (req, res) => {
    try {
        const lastId = parseInt(req.params.id) || 1;

        if (isNaN(lastId) || lastId < 0) {
            return res.status(400).json({ error: 'Invalid last_id' });
        }
        const pageSize = 10;
        let query = { status: 'active' }

        const skip = Math.max(0, (lastId - 1)) * pageSize;
        const domainData = await Competitor.find(query).sort({ _id: -1 }).skip(skip).limit(pageSize).lean();

        const totalCount = await Competitor.countDocuments(query);
        const totalPages = Math.ceil(totalCount / pageSize);

        res.status(200).json({
            success: true, domainData,
            count: { totalPage: totalPages, currentPageSize: domainData.length }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
exports.getAllData = async (req, res) => {
    try {

        let query = { status: 'active' }
        const domainData = await Competitor.find(query).sort({ _id: -1 }).lean();
        res.status(200).json({
            success: true, domainData,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get a single quotation by ID
exports.getById = async (req, res) => {
    try {
        const quotation = await Competitor.findById(req.params.id);
        if (!quotation) {
            return res.status(404).json({ success: false, message: "Competitor not found" });
        }
        res.status(200).json({ success: true, data: quotation });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update quotation by ID
exports.edit = async (req, res) => {
    try {
        const { domain, } = req.body
        const updatedCompetitor = await Competitor.findByIdAndUpdate(req.params.id, { domain, }, { new: true });
        if (!updatedCompetitor) {
            return res.status(404).json({ success: false, message: "Competitor not found" });
        }
        res.status(200).json({ success: true, message: "Competitor updated successfully", data: updatedCompetitor });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete quotation by ID
exports.delete_ = async (req, res) => {
    try {
        const deletedCompetitor = await Competitor.findByIdAndDelete(req.params.id);
        if (!deletedCompetitor) {
            return res.status(404).json({ success: false, message: "Competitor not found" });
        }
        res.status(200).json({ success: true, message: "Competitor deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
