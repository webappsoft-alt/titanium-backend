const Country = require('../models/countries');
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');

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
                                iso_name, name,
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
        sendEncryptedResponse(res, { message: 'Countries processed successfully', result, success: true });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error processing countries', error });
    }
};
exports.getAll = async (req, res) => {
    try {
        const countries = await Country.find().select('name iso_name old_id _id iso').sort({ iso_name: 1 }); // optional: sort alphabetically
        sendEncryptedResponse(res, { data: countries, success: countries?.length > 0 });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch countries', error });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const country = await Country.findOne({ _id: id });

        if (!country) {
            return res.status(404).json({ message: 'Country not found' });
        }

        sendEncryptedResponse(res, { country });
    } catch (error) {
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

        sendEncryptedResponse(res, updated);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update country', error });
    }
};
// Delete a country by Mongo ID
exports.delete_ = async (req, res) => {
    try {
        const deleted = await Country.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Country not found' });

        sendEncryptedResponse(res, { message: 'Country deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete country', error });
    }
};
