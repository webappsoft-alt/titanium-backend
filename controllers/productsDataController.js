const Products = require("../models/_product"); // Products Schema
const Quotation = require("../models/quotation"); // Products Schema
const Price = require("../models/prices"); // Products Schema
const Tolerances = require("../models/tolerance"); // Products Schema
const ProductData = require("../models/productData"); // ProductsData Schema
const mongoose = require("mongoose");

exports.create = async (req, res) => {
    try {
        const { productDataArray } = req.body;

        if (!Array.isArray(productDataArray) || productDataArray.length === 0) {
            return res.status(400).json({ error: "Product data array is required and should not be empty" });
        }

        // Fetch all alloyFamily names along with their products
        const allProducts = await Products.find({}, "alloyFamily products.product type");

        if (!allProducts.length) {
            return res.status(400).json({ error: "Products not found! Please upload Mill Product & Pipe Fitting" });
        }

        const productPromises = productDataArray.map(async (productData) => {
            const { name, description, image, meta } = productData;

            if (!name) {
                return { error: "Product name is required" };
            }

            let matchedProduct = null;
            let alloyFamily = "";
            let prodNType = "";

            // Try to find a matching product using full name match
            for (const prod of allProducts) {
                for (const subProduct of prod.products) {
                    const fullProductName = `${prod.alloyFamily} ${subProduct.product}`; // Combine alloyFamily + product
                    if (fullProductName.toLowerCase() === name.toLowerCase()) {
                        matchedProduct = prod;
                        alloyFamily = prod.alloyFamily;
                        prodNType = subProduct.product;
                        break;
                    }
                }
            }

            if (matchedProduct) {
                const slug = `${matchedProduct.type}-${name.replace(/\s+/g, '-').toLowerCase()}`;

                // Upsert (insert or update) the productData
                return await ProductData.findOneAndUpdate(
                    { name, type: matchedProduct.type }, // Condition to find existing product
                    {
                        $set: {
                            alloyFamily,
                            name,
                            description,
                            image,
                            meta,
                            slug,
                            alloyType: prodNType,
                            type: matchedProduct.type,
                            product: matchedProduct._id,
                            status: 'active'
                        }
                    },
                    { upsert: true, new: true } // Insert if not found, return updated/new doc
                );
            }

            return null;
        });

        // Run all insert/update operations in parallel
        const results = await Promise.all(productPromises);

        // Filter out any errors or null results
        const insertedOrUpdatedProducts = results.filter(product => product !== null);

        res.status(201).json({
            message: "Product data inserted/updated successfully",
            data: insertedOrUpdatedProducts,
            success: true
        });

    } catch (error) {
        console.error("Error inserting/updating product data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.getAll = async (req, res) => {
    try {
        const lastId = parseInt(req.params.id) || 1;
        const { alloyFamily, type } = req.query
        if (isNaN(lastId) || lastId < 0) {
            return res.status(400).json({ error: 'Invalid last_id' });
        }
        const pageSize = 10;

        const skip = Math.max(0, (lastId - 1)) * pageSize;
        let query = {};
        if (alloyFamily) {
            query.alloyFamily = alloyFamily
        }
        if (type) {
            query.type = type
        }
        query.status = 'active'
        const metalAlloys = await ProductData.find(query).sort({ _id: -1 }).skip(skip).limit(pageSize).lean();

        const totalCount = await ProductData.countDocuments(query);
        const totalPages = Math.ceil(totalCount / pageSize);;

        res.status(200).json({
            success: metalAlloys?.length > 0,
            products: metalAlloys,
            count: { totalPage: totalPages, currentPageSize: metalAlloys.length }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
exports.getNavHeader = async (req, res) => {
    try {
        let query = { status: 'active' };

        // Fetch products with pagination
        const metalAlloys = await ProductData.find(query).select('-description -product')
            .sort({ _id: -1 })
            .lean();

        // Get all unique types
        const uniqueTypes = await Products.distinct("type", query);
        // Structure the response
        const typeData = uniqueTypes.map((type) => {
            const label = type === "mill-product" ? "MILL PRODUCTS" : "PIPE AND FITTINGS";
            return {
                label: label,
                children: metalAlloys
                    .filter((item) => item.type === type) // Filter based on type
                    .reduce((acc, item) => {
                        // Check if alloyFamily already exists in the accumulator
                        let existingGroup = acc.find(group => group.label === item.alloyFamily);

                        if (!existingGroup) {
                            // Create a new group for the alloyFamily
                            existingGroup = {
                                label: item.alloyFamily,
                                value: `/product?category=${item?.alloyFamily}&type=${item?.type}`,
                                children: []
                            };
                            acc.push(existingGroup);
                        }

                        // Add the matching item to the correct group
                        existingGroup.children.push({
                            ...item,
                            label: item?.name,
                            value: item?._id,
                        });

                        return acc;
                    }, []) // Start with an empty array accumulator
            };
        });
        res.status(200).json({
            success: typeData.length > 0,
            products: typeData,
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
        const { id } = req.params;

        // Determine whether the provided ID is a valid MongoDB ObjectId
        const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };

        const metalAlloy = await ProductData.findOne(query);

        if (!metalAlloy) {
            return res.status(404).json({
                success: false,
                message: "Product data entry not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Product data entry retrieved successfully",
            productData: metalAlloy,
        });

    } catch (error) {
        console.error("Error in getById:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
exports.edit_ = async (req, res) => {
    try {
        const {
            alloyFamily,
            isFeature,
            name,
            description,
            image, imgAlt,
            meta,
            slug,
            alloyType,
            type,
        } = req.body;
        const staticPageId = req.params.id;

        let updateFields = Object.fromEntries(
            Object.entries({
                alloyFamily,
                isFeature,
                name,
                description,
                image, imgAlt,
                meta,
                slug,
                alloyType,
                type,
            }).filter(([key, value]) => value !== undefined)
        );

        // Check if there are any fields to update
        if (Object.keys(updateFields).length === 0) {
            return res
                .status(400)
                .send({
                    success: false,
                    message: "No valid fields provided for update.",
                });
        }

        const staticPage = await ProductData.findOneAndUpdate(
            { _id: staticPageId },
            updateFields,
            { new: true }
        );

        if (!staticPage)
            return res
                .status(404)
                .send({
                    success: false,
                    message: `Product data was not found.`,
                });

        res.send({
            success: true,
            message: `Product updated successfully`,
            data: staticPage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
exports.delete_ = async (req, res) => {
    try {

        const staticPageId = req.params.id;

        const staticPage = await ProductData.findOneAndUpdate(
            { _id: staticPageId },
            { status: 'deactivated' },
            { new: true }
        );

        if (!staticPage)
            return res
                .status(404)
                .send({
                    success: false,
                    message: `Product data was not found.`,
                });

        res.send({
            success: true,
            message: `Product updated successfully`,
            data: staticPage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal server error", error: error.message });
    }
};
const handleResetAll = async () => {
    try {
        const [productsDeleted, productDataDeleted, quotationsDeleted, pricesDeleted, tolerancesDeleted] = await Promise.all([
            Products.deleteMany(),
            ProductData.deleteMany(),
            Quotation.deleteMany(),
            Price.deleteMany(),
            Tolerances.deleteMany()
        ]);

        console.dir("Database Reset Summary:");
        console.dir(`✅ Products deleted:`,);
        console.dir(productsDeleted, { depth: null });
        console.dir(`✅ ProductData deleted:`);
        console.dir(productDataDeleted, { depth: null });
        console.dir(`✅ Quotations deleted:`);
        console.dir(quotationsDeleted, { depth: null });
        console.dir(`✅ Prices deleted:`);
        console.dir(pricesDeleted, { depth: null });
        console.dir(`✅ Tolerances deleted:`);
        console.dir(tolerancesDeleted, { depth: null });

        return { success: true, message: "All collections have been reset successfully." };
    } catch (error) {
        console.error("❌ Error resetting database:", error);
        return { success: false, error: "Failed to reset all collections." };
    }
};

// handleResetAll()