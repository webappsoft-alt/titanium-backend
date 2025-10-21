const Density = require('../models/density');

// Create or update densities in bulk
exports.create = async (req, res) => {
    try {
        const { densities } = req.body;

        const bulkOps = densities
            .map((density) => {
                const { updatedLabel, densityKg, densityLbs, alloyType, alloyFamily } = density;

                return {
                    updateOne: {
                        filter: { alloyType, alloyFamily },
                        update: {
                            $set: {
                                updatedLabel, densityKg, densityLbs, alloyType, alloyFamily
                            },
                        },
                        upsert: true,
                    },
                };
            });

        if (bulkOps.length === 0) {
            return res.status(400).json({ message: 'No valid densities to process.' });
        }

        const result = await Density.bulkWrite(bulkOps);
        res.status(200).json({ message: 'Densities processed successfully', result, success: true });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error processing densities', error });
    }
};
exports.getSelectedDensity = async (req, res) => {
    try {
        const { selected, distinctValue, value, label, type, queryItem } = req.query;
        let query = { status: "active" };
        if (type) query.type = type
        if (value && label) query[label] = value
        if (queryItem) {
            query = { ...query, ...queryItem }
        }
        let data;
        if (distinctValue) {
            data = await Density.distinct(distinctValue, query);
        } else if (selected) {
            data = await Density.find(query).select(selected);
        } else {
            data = await Density.find(query);
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "No matching products found.",
            });
        }

        // Return the results
        res.status(200).json({ success: true, data });

    } catch (error) {
        console.error("Error in density:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error. Please try again later.",
            error: error.message,
        });
    }
};
exports.getAll = async (req, res) => {
    try {
        const densities = await Density.find().sort({ iso_name: 1 }); // optional: sort alphabetically
        res.status(200).json({ data: densities, success: densities?.length > 0 });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch densities', error });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const density = await Density.findOne({ _id: id });

        if (!density) {
            return res.status(404).json({ message: 'Density not found' });
        }

        res.status(200).json({ density });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch density', error });
    }
};

// Update a single density by Mongo ID
exports.edit_ = async (req, res) => {
    try {
        const updated = await Density.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updated) return res.status(404).json({ message: 'Density not found' });

        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update density', error });
    }
};
// Delete a density by Mongo ID
exports.delete_ = async (req, res) => {
    try {
        const deleted = await Density.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Density not found' });

        res.status(200).json({ message: 'Density deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete density', error });
    }
};
