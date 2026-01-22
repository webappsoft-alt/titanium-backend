const Country = require('../models/countries');
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');
const { addData, getData, deleteData } = require("./redisController");

// Redis keys
const ALL_COUNTRIES_KEY = "countries:all";
const COUNTRY_KEY = (id) => `countries:${id}`;

// Helper function to get all countries with caching
const getCountriesData = async () => {
    try {
        const cached = await getData(ALL_COUNTRIES_KEY);
        if (cached) return cached;

        const countries = await Country.find()
            .select('name iso_name old_id _id iso')
            .sort({ iso_name: 1 })
            .lean();
        
        await addData(ALL_COUNTRIES_KEY, countries);
        return countries;
    } catch (error) {
        console.error("Error fetching countries:", error);
        throw { message: "Internal server error", error };
    }
};

// Create or update countries in bulk
exports.create = async (req, res) => {
    try {
        const { countries } = req.body;

        const bulkOps = countries
            .filter((country) => country && typeof country === 'object' && country.old_id)
            .map((country) => {
                const { zipcode_required, states_required, numcode, iso3, iso, iso_name, name, old_id } = country;

                return {
                    updateOne: {
                        filter: { old_id },
                        update: {
                            $set: {
                                zipcode_required,
                                states_required,
                                numcode,
                                iso3,
                                iso,
                                iso_name,
                                name,
                                old_id,
                            },
                        },
                        upsert: true,
                    },
                };
            });

        if (bulkOps.length === 0) {
            return res.status(400).json({ message: 'No valid countries to process.' });
        }

        const result = await Country.bulkWrite(bulkOps);

        // 🔹 Refresh cache after bulk create/update
        await deleteData(ALL_COUNTRIES_KEY);
        const freshCountries = await Country.find()
            .select('name iso_name old_id _id iso')
            .sort({ iso_name: 1 })
            .lean();
        await addData(ALL_COUNTRIES_KEY, freshCountries);

        sendEncryptedResponse(res, { message: 'Countries processed successfully', result, success: true });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error processing countries', error });
    }
};

exports.getAll = async (req, res) => {
    try {
        const cached = await getData(ALL_COUNTRIES_KEY);
        if (cached) {
            return sendEncryptedResponse(res, { data: cached, success: true, fromCache: true });
        }

        const countries = await Country.find()
            .select('name iso_name old_id _id iso')
            .sort({ iso_name: 1 })
            .lean();
        
        await addData(ALL_COUNTRIES_KEY, countries);

        sendEncryptedResponse(res, { data: countries, success: countries?.length > 0 });
    } catch (error) {
        console.error("Error fetching countries:", error);
        res.status(500).json({ message: 'Failed to fetch countries', error });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const key = COUNTRY_KEY(id);

        const cached = await getData(key);
        if (cached) {
            return sendEncryptedResponse(res, { country: cached, success: true, fromCache: true });
        }

        const country = await Country.findOne({ _id: id }).lean();

        if (!country) {
            return res.status(404).json({ message: 'Country not found' });
        }

        await addData(key, country);

        sendEncryptedResponse(res, { country, success: true });
    } catch (error) {
        console.error("Error fetching country:", error);
        res.status(500).json({ message: 'Failed to fetch country', error });
    }
};

// Update a single country by Mongo ID
exports.edit_ = async (req, res) => {
    try {
        const updated = await Country.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        
        if (!updated) return res.status(404).json({ message: 'Country not found' });

        // 🔹 Refresh cache
        await deleteData(COUNTRY_KEY(req.params.id));
        await addData(COUNTRY_KEY(req.params.id), updated);

        await deleteData(ALL_COUNTRIES_KEY);
        const freshCountries = await Country.find()
            .select('name iso_name old_id _id iso')
            .sort({ iso_name: 1 })
            .lean();
        await addData(ALL_COUNTRIES_KEY, freshCountries);

        sendEncryptedResponse(res, { country: updated, success: true, message: 'Country updated successfully' });
    } catch (error) {
        console.error("Error updating country:", error);
        res.status(400).json({ message: 'Failed to update country', error });
    }
};

// Delete a country by Mongo ID
exports.delete_ = async (req, res) => {
    try {
        const deleted = await Country.findByIdAndDelete(req.params.id);
        
        if (!deleted) return res.status(404).json({ message: 'Country not found' });

        // 🔹 Refresh cache
        await deleteData(COUNTRY_KEY(req.params.id));
        await deleteData(ALL_COUNTRIES_KEY);

        const freshCountries = await Country.find()
            .select('name iso_name old_id _id iso')
            .sort({ iso_name: 1 })
            .lean();
        await addData(ALL_COUNTRIES_KEY, freshCountries);

        sendEncryptedResponse(res, { message: 'Country deleted successfully', success: true });
    } catch (error) {
        console.error("Error deleting country:", error);
        res.status(500).json({ message: 'Failed to delete country', error });
    }
};
