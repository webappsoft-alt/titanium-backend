const DiscountedProduct = require("../models/discountedProduct");
const sendEncryptedResponse = require("../utils/sendEncryptedResponse");

exports.getProductName = async (req, res) => {
    try {
        const prod = await DiscountedProduct.aggregate([
            {
                $match: { identifier: 'Excess' }
            },
            {
                $group: {
                    _id: {
                        alloyFamily: "$alloyFamily",
                        productForm: "$productForm"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    alloyFamily: "$_id.alloyFamily",
                    productForm: "$_id.productForm"
                }
            }
        ]);

        sendEncryptedResponse(res, {
            data: prod,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
exports.getSelectedProducts = async (req, res) => {
    try {
        const { selected, distinctValue, value, label, type } = req.query;

        // // Validate required query parameters
        // if (!label || !value) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Missing required query parameters: 'label' and 'value' are required.",
        //     });
        // }

        // Construct the query dynamically
        const query = { status: "active" };
        if (type) query.type = type
        if (value && label) query[label] = value
        let data;
        if (distinctValue) {
            data = await DiscountedProduct.distinct(distinctValue, query);
        } else if (selected) {
            data = await DiscountedProduct.find(query).select(selected);
        } else {
            data = await DiscountedProduct.find(query);
        }

        if (!data) {
            return res.status(404).json({
                success: false,
                message: "No matching products found.",
            });
        }

        // Return the results
        sendEncryptedResponse(res, { success: true, data });

    } catch (error) {
        console.error("Error in getSelectedProducts:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error. Please try again later.",
            error: error.message,
        });
    }
};

exports.getFilter = async (req, res) => {
    try {
        const { primaryDimension, gradeAlloy, specifications, alloyFamily, productForm } = req.query;

        // Construct query dynamically
        const query = { identifier: 'Excess' };
        if (productForm) query.productForm = productForm;
        if (alloyFamily) query.alloyFamily = alloyFamily;
        if (primaryDimension) query.primaryDimension = primaryDimension;
        if (gradeAlloy) query.gradeAlloy = gradeAlloy;
        if (specifications) query.specifications = specifications;

        // List of fields to fetch distinct values
        const fields = ['primaryDimension', 'gradeAlloy', 'specifications'];
        const data = {};

        // Fetch distinct values for each field
        for (const field of fields) {
            data[field] = await DiscountedProduct.distinct(field, query);
        }

        // Return the results
        sendEncryptedResponse(res, {
            success: true,
            data,
        });
    } catch (error) {
        console.error('Error in getFilter:', error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

exports.getAll = async (req, res) => {
    try {
        const lastId = parseInt(req.params.id) || 1;
        const { alloyFamily, type, primaryDimension, gradeAlloy, productForm, specifications, } = req.query
        if (isNaN(lastId) || lastId < 0) {
            return res.status(400).json({ error: 'Invalid last_id' });
        }
        const pageSize = 12;

        const skip = Math.max(0, (lastId - 1)) * pageSize;
        let query = { identifier: 'Excess' };
        if (alloyFamily) {
            query.alloyFamily = alloyFamily
        }
        if (type) {
            query.type = type
        }
        if (primaryDimension) query.primaryDimension = primaryDimension;
        if (gradeAlloy) query.gradeAlloy = gradeAlloy;
        if (productForm) query.productForm = productForm;
        if (specifications) query.specifications = specifications;

        query.status = 'active'
        const metalAlloys = await DiscountedProduct.find(query).sort({ _id: -1 }).skip(skip).limit(pageSize).lean();
        const totalCount = await DiscountedProduct.countDocuments(query);
        const totalPages = Math.ceil(totalCount / pageSize);;

        sendEncryptedResponse(res, {
            success: metalAlloys?.length > 0,
            products: metalAlloys,
            count: { totalPage: totalPages, currentPageSize: metalAlloys.length, totalCount }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

exports.getById = async (req, res) => {
    try {
        const metalAlloy = await DiscountedProduct.findOne({ _id: req.params.id });

        if (!metalAlloy) {
            return res.status(404).json({
                success: false,
                message: "Products Data entry not found",
            });
        }

        sendEncryptedResponse(res, {
            success: !!metalAlloy,
            message: "Products Data entry retrieved successfully",
            data: metalAlloy,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};


exports.getUniqueAlloyFamilies = async (req, res) => {
    try {
        const alloyFamilies = await DiscountedProduct.distinct('alloyFamily', { status: 'active' }).sort({ _id: -1 });

        sendEncryptedResponse(res, {
            success: alloyFamilies?.length > 0,
            alloyFamilies: alloyFamilies,
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
exports.getByNames = async (req, res) => {
    try {
        const { nameKey, nameValue, nameSelect } = req.query;
        const alloyFamilies = await DiscountedProduct.aggregate([
            { $match: { [nameKey]: nameValue, status: 'active' } },
            {
                $group: {
                    _id: {
                        alloyFamily: "$alloyFamily",
                        productForm: "$productForm",
                        type: "$type"
                    },
                    doc: { $first: "$$ROOT" }
                }
            },
            {
                $replaceRoot: { newRoot: "$doc" }
            },
            { $project: nameSelect?.split(' ').reduce((acc, field) => ({ ...acc, [field]: 1 }), {}) },
            { $sort: { _id: -1 } }
        ]);

        // let query = { status: 'active' };
        // query[nameKey] = nameValue;
        // // Perform the query with the dynamic filter and sorting
        // const alloyFamilies = await DiscountedProduct.find(query)
        //     .select(nameSelect)
        //     .sort({ _id: -1 });
        sendEncryptedResponse(res, {
            success: alloyFamilies?.length > 0,
            product: alloyFamilies,
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
