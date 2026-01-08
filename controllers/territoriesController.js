const Territories = require('../models/territories');  // Your Mongoose schema file
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');
const mongoose = require('mongoose');
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

exports.findTerritoryByLocation = async (data) => {
    try {
        const { countryID, stateID, old_country_id, old_state_id, country, state } = data;

        // Validate at least one identifier is provided
        if (!countryID && !stateID && !old_country_id && !old_state_id && !country && !state) {
            return {
                success: false,
                message: 'At least one search parameter is required'
            };
        }

        let territory = null;
        let matchType = null;

        // Build dynamic query conditions
        const stateConditions = [];
        const countryConditions = [];

        // State conditions
        if (stateID) {
            if (mongoose.Types.ObjectId.isValid(stateID)) {
                stateConditions.push({ 'states.stateID': new mongoose.Types.ObjectId(stateID) });
                stateConditions.push({ 'states._id': new mongoose.Types.ObjectId(stateID) });
            }
        }
        if (old_state_id) {
            stateConditions.push({ 'states.old_id': old_state_id });
        }
        if (state) {
            stateConditions.push({ 'states.name': { $regex: new RegExp(`^${state}$`, 'i') } });
        }

        // Country conditions
        if (countryID) {
            if (mongoose.Types.ObjectId.isValid(countryID)) {
                countryConditions.push({ 'countries.countryID': new mongoose.Types.ObjectId(countryID) });
                countryConditions.push({ 'countries._id': new mongoose.Types.ObjectId(countryID) });
                // Also check if country ID is referenced in states.country
                stateConditions.push({ 'states.country': countryID });
            }
        }
        if (old_country_id) {
            countryConditions.push({ 'countries.old_id': old_country_id });
        }
        if (country) {
            countryConditions.push({ 'countries.name': { $regex: new RegExp(`^${country}$`, 'i') } });
            countryConditions.push({ 'countries.iso_name': { $regex: new RegExp(`^${country}$`, 'i') } });
        }

        // PRIORITY 1: Exact match - both state AND country match
        if (stateConditions.length > 0 && countryConditions.length > 0) {
            territory = await Territories.findOne({
                status: 'active',
                $and: [
                    { $or: stateConditions },
                    { $or: countryConditions }
                ]
            });

            if (territory) {
                matchType = 'exact_match';
            }
        }

        // PRIORITY 2: State match only
        if (!territory && stateConditions.length > 0) {
            territory = await Territories.findOne({
                status: 'active',
                $or: stateConditions
            });

            if (territory) {
                matchType = 'state_match';
            }
        }

        // PRIORITY 3: Country match only
        if (!territory && countryConditions.length > 0) {
            territory = await Territories.findOne({
                status: 'active',
                $or: countryConditions
            });

            if (territory) {
                matchType = 'country_match';
            }
        }

        // PRIORITY 4: Match by state's country reference field
        if (!territory && countryID) {
            territory = await Territories.findOne({
                status: 'active',
                'states.country': countryID
            });

            if (territory) {
                matchType = 'state_country_reference';
            }
        }

        if (!territory) {
            return {
                success: false,
                message: 'No territory found for the selected location',
                searchParams: { countryID, stateID, old_country_id, old_state_id, country, state }
            };
        }

        return {
            success: true,
            matchType,
            data: {
                _id: territory._id,
                code: territory.code,
                location: territory.location,
                old_id: territory.old_id
            }
        };

    } catch (error) {
        console.error('Error finding territory:', error);
        return {
            success: false,
            message: 'Internal server error',
            error: error.message
        };
    }
};