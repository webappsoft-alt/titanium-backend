const CompetitorMarkup = require("../models/competitor-value");
const sendEncryptedResponse = require("../utils/sendEncryptedResponse");

// ✅ Create a new CompetitorMarkup entry
exports.create = async (req, res) => {
    try {
        const { minValue, maxValue } = req.body;

        if (minValue >= maxValue) {
            return res.status(400).json({ success: false, message: "Min Value must be less than Max Value" });
        }

        const newCompetitorMarkup = await CompetitorMarkup.findOneAndUpdate({}, { minValue, maxValue }, { new: true, upsert: true }).sort({ _id: -1 });

        sendEncryptedResponse(res, { success: true, message: "Competitor Markup created/updated successfully", data: newCompetitorMarkup });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// ✅ Get all CompetitorMarkup entries
exports.getAll = async (req, res) => {
    try {
        const CompetitorMarkupEntries = await CompetitorMarkup.findOne().sort({ _id: -1 });
        sendEncryptedResponse(res, { success: !!CompetitorMarkupEntries, data: CompetitorMarkupEntries });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// ✅ Get a single CompetitorMarkup entry by ID
exports.getById = async (req, res) => {
    try {
        const CompetitorMarkup = await CompetitorMarkup.findById(req.params.id);
        if (!CompetitorMarkup) {
            return res.status(404).json({ success: false, message: "Entry not found" });
        }
        sendEncryptedResponse(res, { success: true, data: CompetitorMarkup });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// ✅ Update a CompetitorMarkup entry
exports.edit_ = async (req, res) => {
    try {
        const { minValue, maxValue } = req.body;

        if (minValue >= maxValue) {
            return res.status(400).json({ success: false, message: "Min Value must be less than Max Value" });
        }

        const updatedCompetitorMarkup = await CompetitorMarkup.findByIdAndUpdate(req.params.id, { minValue, maxValue }, { new: true });

        if (!updatedCompetitorMarkup) {
            return res.status(404).json({ success: false, message: "Entry not found" });
        }

        sendEncryptedResponse(res, { success: true, message: "Entry updated successfully", data: updatedCompetitorMarkup });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};

// ✅ Delete a CompetitorMarkup entry
exports.delete_ = async (req, res) => {
    try {
        const deletedCompetitorMarkup = await CompetitorMarkup.findByIdAndDelete(req.params.id);
        if (!deletedCompetitorMarkup) {
            return res.status(404).json({ success: false, message: "Entry not found" });
        }
        sendEncryptedResponse(res, { success: true, message: "Entry deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
