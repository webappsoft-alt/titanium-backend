const Tolerances = require("../models/tolerance");
const sendEncryptedResponse = require("../utils/sendEncryptedResponse");

exports.getTolerance = async (req, res) => {
    try {

        let query = { status: 'active' };

        // Filter by uniqueID if provided
        if (req.query.id) {
            query.uniqueID = req.query.id
        }

        let toleranceData = await Tolerances.findOne(query)
            .sort({ _id: -1 })
            .lean();

        sendEncryptedResponse(res, {
            success: !!toleranceData,
            tolerance: toleranceData,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

exports.getMultipleTolerances = async (req, res) => {
    try {
        let query = { status: 'active' };

        // Filter by multiple uniqueIDs if provided
        if (req.body.id) {
            const ids = req.body.id; // Expecting comma-separated IDs
            query.uniqueID = { $in: ids };
        }

        let toleranceData = await Tolerances.find(query)
            .sort({ _id: -1 })
            .lean();

        sendEncryptedResponse(res, {
            success: toleranceData.length > 0,
            tolerances: toleranceData,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};