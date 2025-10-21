const Quotation = require("../models/quotation");
const { User } = require('../models/user');
exports.getCount = async (req, res) => {
    try {
        // Define queries to count documents
        const queries = {
            openQuote: Quotation.countDocuments({
                type: 'open-quote',
                status: { $in: ['pending'] },
            }),
            closeQuote: Quotation.countDocuments({
                status: { $in: ['closed', 'rejected'] },
            }),
            salesQuote: Quotation.countDocuments({
                type: { $in: ['cart', 'regular',] },
                status: { $in: ['approved', 'pending', 'completed'] },
            }),
            customers: User.countDocuments({
                type: 'customer',
                status: 'active',
            }),
        };

        // Execute queries concurrently using Promise.all
        const [openQuote, closeQuote, salesQuote, customers] = await Promise.all(
            Object.values(queries)
        );

        // Respond with counts
        res.status(200).json({
            success: true,
            count: { openQuote, closeQuote, salesQuote, customers },
        });
    } catch (error) {
        console.error("Error fetching counts:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to fetch counts. Please try again later.",
        });
    }
};
