const Countries = require('../models/countries');
const States = require('../models/states');
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');

// Create or update states in bulk
exports.create = async (req, res) => {
    try {
        const { states } = req.body;

        if (!Array.isArray(states) || states.length === 0) {
            return res.status(400).json({ message: 'Please provide an array of states.' });
        }

        // Filter out invalid states
        const validStates = states.filter(
            (state) => state && typeof state === 'object' && state.old_id && state.old_country_id
        );

        if (validStates.length === 0) {
            return res.status(400).json({ message: 'No valid states to process.' });
        }

        // Prepare all bulk operations
        const bulkOps = await Promise.all(
            validStates.map(async (state) => {
                const { abbr, old_country_id, name, old_id } = state;
                const countryData = await Countries.findOne({ old_id: old_country_id }).select('_id');

                return {
                    updateOne: {
                        filter: { old_id },
                        update: {
                            $set: {
                                abbr,
                                name,
                                old_id,
                                old_country_id,
                                country: countryData?._id || null, // handle not found case
                            },
                        },
                        upsert: true,
                    },
                };
            })
        );

        const result = await States.bulkWrite(bulkOps);
        sendEncryptedResponse(res, { message: 'States processed successfully', result, success: true });

    } catch (error) {
        console.error('Error in states bulk create:', error);
        res.status(500).json({ message: 'Error processing states', error });
    }
};

exports.getAll = async (req, res) => {
    try {
        const states = await States.find().select('name abbr _id old_id country').sort({ _id: -1 }); // optional: sort alphabetically
        sendEncryptedResponse(res, { data: states, success: states?.length > 0 });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch states', error });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const state = await States.findOne({ _id: id });

        if (!state) {
            return res.status(404).json({ message: 'States not found' });
        }

        sendEncryptedResponse(res, { state });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch state', error });
    }
};

// Update a single state by Mongo ID
exports.edit_ = async (req, res) => {
    try {
        const updated = await States.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updated) return res.status(404).json({ message: 'States not found' });

        sendEncryptedResponse(res, updated);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update state', error });
    }
};
// Delete a state by Mongo ID
exports.delete_ = async (req, res) => {
    try {
        const deleted = await States.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'States not found' });

        sendEncryptedResponse(res, { message: 'States deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete state', error });
    }
};
