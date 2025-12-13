const Prices = require("../models/prices");
const sendEncryptedResponse = require("../utils/sendEncryptedResponse");

exports.getPrice = async (req, res) => {
    try {

        let query = { status: 'active' };

        // Filter by uniqueID if provided
        if (req.query.id) {
            query.uniqueID = req.query.id
        }

        // // Modify query to filter by priceLabel if provided
        // if (req.query.priceLabel) {
        //     query["prices.priceLabel"] = req.query.priceLabel;
        // }

        let priceData = await Prices.findOne(query)
            .sort({ _id: -1 })
            .lean();
        // console.log(priceData)
        // If both id and priceLabel are provided, filter out non-matching prices
        if (req.query.priceLabel && req.query.id && priceData) {
            priceData.prices = priceData.prices.find(price => price.priceLabel === req.query.priceLabel);
        }

        sendEncryptedResponse(res, {
            success: !!priceData,
            prices: priceData,
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
exports.getDiscounted = async (req, res) => {
    try {

        let query = { status: 'active', identifier: 'Excess' };

        let priceData = await Prices.find(query).select('available_quantity type identifier uniqueID')
            .sort({ _id: -1 }).limit(20)
            .lean();

        sendEncryptedResponse(res, {
            success: priceData?.length > 0,
            prices: priceData,
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
exports.getMultiplePrices = async (req, res) => {
    try {
        let query = { status: 'active' };

        // Filter by multiple uniqueIDs if provided
        if (req.query.id) {
            const ids = req.query.id.split(','); // Expecting comma-separated IDs
            query.uniqueID = { $in: ids };
        }

        // Modify query to filter by priceLabel if provided
        if (req.query.priceLabel) {
            query["prices.priceLabel"] = req.query.priceLabel;
        }

        let priceData = await Prices.find(query)
            .sort({ _id: -1 })
            .lean();

        // If both id and priceLabel are provided, filter out non-matching prices within each result
        if (req.query.priceLabel && priceData.length) {
            priceData = priceData.map(item => {
                return {
                    ...item,
                    prices: item.prices.find(price => price.priceLabel === req.query.priceLabel)
                };
            });
        }

        sendEncryptedResponse(res, {
            success: priceData.length > 0,
            prices: priceData,
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