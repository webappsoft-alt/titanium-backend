const Countries = require('../models/countries');
const States = require('../models/states');
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');
const { addData, getData, deleteData } = require("./redisController");

// Redis keys
const ALL_STATES_KEY = "states:all";
const STATE_KEY = (id) => `states:${id}`;
const STATES_BY_COUNTRY_KEY = (countryId) => `states:country:${countryId}`;

// Helper function to get all states with caching
const getStatesData = async () => {
    try {
        const cached = await getData(ALL_STATES_KEY);
        if (cached) return cached;

        const states = await States.find()
            .select('name abbr _id old_id country')
            .sort({ _id: -1 })
            .lean();
        
        await addData(ALL_STATES_KEY, states);
        return states;
    } catch (error) {
        console.error("Error fetching states:", error);
        throw { message: "Internal server error", error };
    }
};

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
                                country: countryData?._id || null,
                            },
                        },
                        upsert: true,
                    },
                };
            })
        );

        const result = await States.bulkWrite(bulkOps);

        // 🔹 Refresh cache after bulk create/update
        await deleteData(ALL_STATES_KEY);
        
        // Clear country-specific state caches
        const uniqueCountryIds = [...new Set(validStates.map(s => s.old_country_id))];
        for (const countryId of uniqueCountryIds) {
            const country = await Countries.findOne({ old_id: countryId }).select('_id');
            if (country) {
                await deleteData(STATES_BY_COUNTRY_KEY(country._id));
            }
        }

        const freshStates = await States.find()
            .select('name abbr _id old_id country')
            .sort({ _id: -1 })
            .lean();
        await addData(ALL_STATES_KEY, freshStates);

        sendEncryptedResponse(res, { message: 'States processed successfully', result, success: true });

    } catch (error) {
        console.error('Error in states bulk create:', error);
        res.status(500).json({ message: 'Error processing states', error });
    }
};

exports.getAll = async (req, res) => {
    try {
        const cached = await getData(ALL_STATES_KEY);
        if (cached) {
            return sendEncryptedResponse(res, { data: cached, success: true, fromCache: true });
        }

        const states = await States.find()
            .select('name abbr _id old_id country')
            .sort({ _id: -1 })
            .lean();
        
        await addData(ALL_STATES_KEY, states);

        sendEncryptedResponse(res, { data: states, success: states?.length > 0 });
    } catch (error) {
        console.error("Error fetching states:", error);
        res.status(500).json({ message: 'Failed to fetch states', error });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const key = STATE_KEY(id);

        const cached = await getData(key);
        if (cached) {
            return sendEncryptedResponse(res, { state: cached, success: true, fromCache: true });
        }

        const state = await States.findOne({ _id: id }).lean();

        if (!state) {
            return res.status(404).json({ message: 'State not found' });
        }

        await addData(key, state);

        sendEncryptedResponse(res, { state, success: true });
    } catch (error) {
        console.error("Error fetching state:", error);
        res.status(500).json({ message: 'Failed to fetch state', error });
    }
};

// Update a single state by Mongo ID
exports.edit_ = async (req, res) => {
    try {
        const oldState = await States.findById(req.params.id).select('country').lean();
        
        const updated = await States.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        
        if (!updated) return res.status(404).json({ message: 'State not found' });

        // 🔹 Refresh cache
        await deleteData(STATE_KEY(req.params.id));
        await addData(STATE_KEY(req.params.id), updated);

        await deleteData(ALL_STATES_KEY);
        
        // Clear country-specific caches (old and new country if changed)
        if (oldState?.country) {
            await deleteData(STATES_BY_COUNTRY_KEY(oldState.country));
        }
        if (updated.country && String(updated.country) !== String(oldState?.country)) {
            await deleteData(STATES_BY_COUNTRY_KEY(updated.country));
        }

        const freshStates = await States.find()
            .select('name abbr _id old_id country')
            .sort({ _id: -1 })
            .lean();
        await addData(ALL_STATES_KEY, freshStates);

        sendEncryptedResponse(res, { state: updated, success: true, message: 'State updated successfully' });
    } catch (error) {
        console.error("Error updating state:", error);
        res.status(400).json({ message: 'Failed to update state', error });
    }
};

// Delete a state by Mongo ID
exports.delete_ = async (req, res) => {
    try {
        const state = await States.findById(req.params.id).select('country').lean();
        const deleted = await States.findByIdAndDelete(req.params.id);
        
        if (!deleted) return res.status(404).json({ message: 'State not found' });

        // 🔹 Refresh cache
        await deleteData(STATE_KEY(req.params.id));
        await deleteData(ALL_STATES_KEY);
        
        // Clear country-specific cache
        if (state?.country) {
            await deleteData(STATES_BY_COUNTRY_KEY(state.country));
        }

        const freshStates = await States.find()
            .select('name abbr _id old_id country')
            .sort({ _id: -1 })
            .lean();
        await addData(ALL_STATES_KEY, freshStates);

        sendEncryptedResponse(res, { message: 'State deleted successfully', success: true });
    } catch (error) {
        console.error("Error deleting state:", error);
        res.status(500).json({ message: 'Failed to delete state', error });
    }
};