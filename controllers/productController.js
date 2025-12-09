const Products = require("../models/_product");
const DiscountedProduct = require("../models/discountedProduct");
const Prices = require("../models/prices");
const Tolerance = require("../models/tolerance");

// Create or update products, prices, and tolerances
exports.create = async (req, res) => {
    try {
        const { pricesData, products: prodList, toleranceData, discountedProd } = req.body;

        /** ----------------
         *  PROCESS PRODUCTS
         *  ---------------- */
        const productUpdates = await Promise.all(prodList.map(async (product) => {
            const { alloyFamily, type, productFile, products } = product;

            // Find existing document
            const existingDoc = await Products.findOne({ alloyFamily, type });

            if (!existingDoc) {
                // Insert new document if not exists
                return {
                    updateOne: {
                        filter: { alloyFamily, type },
                        update: { $set: { alloyFamily, type, productFile, products } },
                        upsert: true
                    }
                };
            }

            // Iterate through new products array
            products.forEach(newProduct => {
                const existingProduct = existingDoc.products.find(p => p.product === newProduct.product);

                if (existingProduct) {
                    newProduct.grades.forEach(newGrade => {
                        const existingGrade = existingProduct.grades.find(g => g.gradeAlloy === newGrade.gradeAlloy);

                        if (existingGrade) {
                            newGrade.specifications.forEach(newSpec => {
                                const existingSpec = existingGrade.specifications.find(s => s.specification === newSpec.specification);

                                if (existingSpec) {
                                    // If specification exists, only update changed fields
                                    existingSpec.primaryDimension = Array.from(new Set([...existingSpec.primaryDimension, ...newSpec.primaryDimension]));
                                } else {
                                    // If specification does not exist, add it
                                    existingGrade.specifications.push(newSpec);
                                }
                            });
                        } else {
                            // If grade does not exist, add it
                            existingProduct.grades.push(newGrade);
                        }
                    });
                } else {
                    // If product does not exist, add it
                    existingDoc.products.push(newProduct);
                }
            });

            return {
                updateOne: {
                    filter: { alloyFamily, type },
                    update: { $set: { products: existingDoc.products, productFile } },
                    upsert: true
                }
            };
        }));

        /** ---------------
         *  PROCESS PRICES
         *  --------------- */
        const priceUpdates = pricesData.map(({ uniqueID, prices, available_quantity, identifier, type }) => ({
            updateOne: {
                filter: { uniqueID },
                update: {
                    $set: {
                        prices,
                        type,
                        available_quantity, identifier,
                        uniqueID,
                    }
                },
                upsert: true
            }
        }));

        /** ------------------
         *  PROCESS TOLERANCES
         *  ------------------ */
        const toleranceUpdates = toleranceData?.length > 0 ? toleranceData.map(({ uniqueID, tolerance, type }) => ({
            updateOne: {
                filter: { uniqueID },
                update: {
                    $set: {
                        tolerance,
                        type,
                        uniqueID,
                    }
                },
                upsert: true
            }
        })) : [];
        const discountedData = discountedProd?.length > 0 ? discountedProd.map(({ uniqueID, identifier, available_quantity, primaryDimension, specifications, gradeAlloy, productForm, alloyFamily,
            uom, length, lengthTolerance, diameter, primaryDimTol, density, lbFTTol, lbFTwithoutTol, type, }) => ({
                updateOne: {
                    filter: { uniqueID },
                    update: {
                        $set: {
                            identifier, available_quantity, primaryDimension, specifications, gradeAlloy, productForm, alloyFamily,
                            uniqueID, uom, length, lengthTolerance, diameter, primaryDimTol, density, lbFTTol, lbFTwithoutTol, type
                        }
                    },
                    upsert: true
                }
            })) : [];
        // console.dir(productUpdates, { depth: null })
        /** -----------------------
         *  EXECUTE BULK UPDATES
         *  ----------------------- */
        const [productResult, priceResult, toleranceResult, discountedResult] = await Promise.all([
            Products.bulkWrite(productUpdates),
            Prices.bulkWrite(priceUpdates),
            toleranceUpdates.length > 0 ? Tolerance.bulkWrite(toleranceUpdates) : [],
            discountedData.length > 0 ? DiscountedProduct.bulkWrite(discountedData) : []
        ]);

        res.status(201).json({
            success: true,
            message: "Entries created/updated successfully",
            products: productResult,
            prices: priceResult,
            tolerances: toleranceResult,
            discountedResult
        });

    } catch (error) {
        console.error("❌ Error inserting/updating data:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};

exports.getUniqueAlloyFamilies = async (req, res) => {
    try {
        const alloyFamilies = await Products.distinct('alloyFamily', { status: 'active' }).sort({ _id: -1 });

        res.status(200).json({
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

exports.getProductForm = async (req, res) => {
    try {
        const { nameValue } = req.query;

        let query = { status: 'active', alloyFamily: nameValue };
        // Perform the query with the dynamic filter and sorting
        const alloyFamilies = await Products.find(query)
            .select('products.product products._id type')
            .sort({ _id: -1 });
        res.status(200).json({
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
exports.getByNames = async (req, res) => {
    try {
        const { nameKey, nameValue, nameSelect } = req.query;

        let query = { status: 'active' };
        query[nameKey] = nameValue;
        // Perform the query with the dynamic filter and sorting
        const alloyFamilies = await Products.find(query)
            .select(nameSelect)
            .sort({ _id: -1 });
        res.status(200).json({
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

// Get all metal alloy entries
exports.getAll = async (req, res) => {
    try {
        const lastId = parseInt(req.params.id) || 1;

        if (isNaN(lastId) || lastId < 0) {
            return res.status(400).json({ error: 'Invalid last_id' });
        }
        const pageSize = 10;

        const skip = Math.max(0, (lastId - 1)) * pageSize;
        let query = {};
        query.status = 'active'
        const metalAlloys = await Products.find(query).sort({ _id: -1 }).skip(skip).limit(pageSize).lean();

        const totalCount = await Products.countDocuments(query);
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
        const metalAlloys = await Products.find(query)
            .sort({ _id: -1 })
            .select('-products.grades')
            .lean();

        // Get all unique types
        const uniqueTypes = await Products.distinct("type", query);

        // Structure the response
        const typeData = uniqueTypes.map((type) => {
            const label = type === "mill-product" ? "MILL PRODUCTS" : "PIPE AND FITTINGS";
            return {
                label: label,
                children: metalAlloys
                    .filter((item) => item.type === type)
                    .map(({ alloyFamily, products }) => ({
                        label: alloyFamily,
                        children: products?.map((item) => ({
                            label: `${alloyFamily} ${item?.product}`,
                            path: item?._id,
                            slug: (`${label} ${alloyFamily} ${item?.product}`)
                                .toLowerCase()
                                .replace(/ /g, '-') // Replace all spaces with hyphens
                        }))
                    }))
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

// Get a single metal alloy entry by ID
exports.getById = async (req, res) => {
    try {
        const metalAlloy = await Products.findById(req.params.id);

        if (!metalAlloy) {
            return res.status(404).json({
                success: false,
                message: "Products entry not found",
            });
        }

        res.status(200).json({
            success: !!metalAlloy,
            message: "Products entry retrieved successfully",
            product: metalAlloy,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
// Update a metal alloy entry by ID
exports.update = async (req, res) => {
    try {
        const { alloyFamily, productFile, type, products } = req.body;

        const updatedProducts = await Products.findByIdAndUpdate(
            req.params.id,
            { alloyFamily, productFile, type, products },
            { new: true, runValidators: true }
        );

        if (!updatedProducts) {
            return res.status(404).json({
                success: false,
                message: "Products entry not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Products entry updated successfully",
            data: updatedProducts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
// Delete a metal alloy entry by ID
exports.delete_ = async (req, res) => {
    try {
        const deletedProducts = await Products.findByIdAndDelete(req.params.id);

        if (!deletedProducts) {
            return res.status(404).json({
                success: false,
                message: "Products entry not found",
            });
        }

        res.status(200).json({
            success: true,
            message: "Products entry deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
