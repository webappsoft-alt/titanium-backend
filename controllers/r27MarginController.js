const R27Margin = require('../models/r27Margin');

// Create or update r27Margin in bulk
exports.create = async (req, res) => {
    try {
        const { marginData } = req.body;

        const bulkOps = marginData
            .map((country) => {
                const { marginCode, range } = country;

                return {
                    updateOne: {
                        filter: { range },
                        update: {
                            $set: {
                                marginCode, range
                            },
                        },
                        upsert: true,
                    },
                };
            });

        if (bulkOps.length === 0) {
            return res.status(400).json({ message: 'No valid R27 Margin to process.' });
        }

        const result = await R27Margin.bulkWrite(bulkOps);
        res.status(200).json({ message: 'R27 Margin processed successfully', result, success: true });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: 'Error processing R27 Margin', error });
    }
};
exports.getAll = async (req, res) => {
    try {
        const r27Margin = await R27Margin.find().sort({ _id: -1 }); // optional: sort alphabetically
        res.status(200).json({ data: r27Margin, success: r27Margin?.length > 0 });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch R27 Margin', error });
    }
};

exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const country = await R27Margin.findOne({ _id: id });

        if (!country) {
            return res.status(404).json({ message: 'R27 Margin not found' });
        }

        res.status(200).json({ country });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch country', error });
    }
};
exports.getByValue = async (req, res) => {
    try {
        const { value } = req.query
        const result = await R27Margin.findOne({
            $or: [
                {
                    'range.infinity': false,
                    'range.start': { $lte: value },
                    'range.end': { $gte: value },
                },
                {
                    'range.infinity': true,
                    'range.start': { $lte: value },
                },
            ],
        });
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch country', error });
    }
}

// Update a single country by Mongo ID
exports.edit_ = async (req, res) => {
    try {
        const updated = await R27Margin.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updated) return res.status(404).json({ message: 'R27 Margin not found' });

        res.status(200).json(updated);
    } catch (error) {
        res.status(400).json({ message: 'Failed to update country', error });
    }
};
// Delete a country by Mongo ID
exports.delete_ = async (req, res) => {
    try {
        const deleted = await R27Margin.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'R27 Margin not found' });

        res.status(200).json({ message: 'R27 Margin deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete R27 Margin', error });
    }
};
