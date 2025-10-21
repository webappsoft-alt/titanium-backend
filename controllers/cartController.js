const moment = require("moment/moment");
const Cart = require("../models/cart");
const Quotation = require("../models/quotation");
const { createQuot } = require("./quotationController");

const calculateTotalPrice = (data, discount = "0") => {
    const totalPrice = data?.reduce((total, item) => {
        const subtotal = Number(item?.prices?.price || 0) * Number(item?.quantity || 0);
        return total + subtotal;
    }, 0) || 0;

    // Convert discount string to a number (handles cases like "+10", "-10", "0")
    const discountValue = parseFloat(discount) || 0;

    // Adjust the total price based on the discount percentage
    const adjustedPrice = totalPrice + (totalPrice * (discountValue / 100));

    return adjustedPrice.toFixed(2);
};
// Create a new cart
exports.createCart = async (req, res) => {
    const userId = req.user._id
    try {
        const {
            uniqueID,
            productForm, identifier,
            grade,
            primaryDimension, cutLength, cutWidth,
            primaryDimTol,
            lengthTolerance, customCut,
            length,
            quantity,
            prices,
            pricesId,
            specifications,
            uom,
            alloyFamily,
            type
        } = req.body;
        // Calculate total amount

        const isCustomcut = Number(cutLength || 0) > 0
        let query = { uniqueID, user: userId, customCut: isCustomcut ? { $ne: null } : null }

        const cart = await Cart.findOneAndUpdate(query, {
            uniqueID,
            productForm, identifier,
            grade,cutWidth,
            primaryDimension, cutLength,
            primaryDimTol,
            lengthTolerance, customCut,
            length,
            quantity,
            prices,
            pricesId,
            specifications,
            uom,
            alloyFamily,
            user: userId,
            type
        }, { upsert: true, new: true })

        const latestCart = await Cart.find({ user: userId }).select('uniqueID productForm identifier grade primaryDimension primaryDimTol cutLength cutWidth lengthTolerance customCut length quantity prices pricesId specifications uom alloyFamily').lean()
        await createQuot(userId, { quote: latestCart }, 'open-quote')
        res.status(201).json({ success: true, cart });
    } catch (error) {
        console.error("Error creating cart:", error);
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
};

// Update a cart
exports.updateCart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;
        const updates = req.body;

        // Find and update the cart
        const cart = await Cart.findByIdAndUpdate(id, updates, { new: true }).lean();
        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        // Find the quotation associated with the user and the open quote
        const quotation = await Quotation.findOne({
            user: cart.user,
            type: 'open-quote',
            status: 'pending'
        })
            .select('quote user')
            .populate('user', '_id discount')
            .lean();

        if (!quotation) {
            return res.status(404).json({ error: "Quotation not found" });
        }

        // Find the index of the cart item in the quotation
        const itemIndex = quotation.quote.findIndex(item => (item?.uniqueID === cart.uniqueID && (cart.customCut ? !!item?.customCut : !item?.customCut)));
        // If the item exists in the quotation, update it; otherwise, add it
        if (itemIndex !== -1) {
            // Update the item in the quotation
            const nData = { ...cart }
            delete nData.type
            delete nData._id
            delete nData.updatedAt
            delete nData.createdAt
            quotation.quote[itemIndex] = nData;
        }
        const totalAmount = calculateTotalPrice(quotation.quote, quotation?.user?.discount || 0);
        // Update the quotation with the new quote and total amount
        await Quotation.findByIdAndUpdate(quotation._id, {
            quote: quotation.quote,
            totalAmount,
            subtotal: totalAmount,
            tax: 0,
        });

        // Respond with success
        res.status(200).json({ success: true, message: "Cart updated successfully", cart });

    } catch (error) {
        console.error("Error updating cart:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get all carts (with pagination)
exports.getCarts = async (req, res) => {
    try {
        const userId = req.user._id
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const carts = await Cart.find({ user: userId })
            .sort({ _id: -1 })
        // .skip(skip)
        // .limit(parseInt(limit));

        // const totalCarts = await Cart.countDocuments();

        res.status(200).json({
            success: true,
            // totalCarts,
            // currentPage: parseInt(page),
            // totalPages: Math.ceil(totalCarts / limit),
            carts
        });
    } catch (error) {
        console.error("Error fetching carts:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Get a single cart by ID
exports.getCartById = async (req, res) => {
    try {
        const { id } = req.params;

        const cart = await Cart.findById(id);

        if (!cart) {
            return res.status(404).json({ error: "Cart not found" });
        }

        res.status(200).json({ success: true, cart });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.updateCartAndQuote = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch all carts for the user
        const carts = await Cart.find({ user: userId }).lean();
        if (!carts || carts.length === 0) {
            return res.status(404).json({ success: false, message: "No carts found for the user" });
        }

        const results = []; // Store results to send a single response at the end

        for (const cart of carts) {
            // Check if the cart is older than 30 days
            const cartCreatedAt = moment(cart.createdAt); // Assuming `createdAt` exists in the Cart schema
            const currentDate = moment();
            const isOlderThan30Days = currentDate.diff(cartCreatedAt, 'days') > 30;

            if (isOlderThan30Days) {
                // Handle quotation adjustments if needed
                const quotation = await Quotation.findOne({
                    user: cart.user,
                    type: 'open-quote',
                    status: 'pending',
                })
                    .select('quote user')
                    .populate('user', '_id discount')
                    .lean();

                if (quotation) {
                    // Remove items from the quotation that match the cart's uniqueID
                    quotation.quote = quotation.quote.filter(item => (item?.uniqueID !== cart.uniqueID && (cart.customCut ? !!item?.customCut : !item?.customCut)));

                    // Update the quotation with the updated quote and recalculate the total amount
                    await Quotation.findByIdAndUpdate(quotation._id, {
                        quote: quotation.quote,
                        totalAmount: calculateTotalPrice(quotation.quote, quotation?.user?.discount || 0),
                        subtotal: calculateTotalPrice(quotation.quote, quotation?.user?.discount || 0),
                        tax: 0,
                    });
                }

                // Delete the cart
                await Cart.findByIdAndDelete(cart._id);
                results.push({ cartId: cart._id, status: 'deleted', message: `Cart with ID ${cart._id} deleted successfully` });
            } else {
                results.push({ cartId: cart._id, status: 'not-deleted', message: `Cart with ID ${cart._id} is not older than 30 days` });
            }
        }

        // Send a single response with all results
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error processing cart deletion:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
// Delete a cart
exports.deleteCart = async (req, res) => {
    try {
        const { id } = req.params;

        const cart = await Cart.findById(id).lean();
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const quotation = await Quotation.findOne({ user: cart.user, type: 'open-quote', status: 'pending' }).select('quote user').populate('user', '_id discount').lean();
        if (quotation) {
            quotation.quote = quotation.quote.filter(item => (item?.uniqueID !== cart.uniqueID && (cart.customCut ? !!item?.customCut : !item?.customCut)));
            await Quotation.findByIdAndUpdate(quotation._id, {
                quote: quotation.quote,
                totalAmount: calculateTotalPrice(quotation.quote, quotation?.user?.discount || 0),
                subtotal: calculateTotalPrice(quotation.quote, quotation?.user?.discount || 0),
                tax: 0,
            });
        }

        await Cart.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: "Cart deleted successfully" });
    } catch (error) {
        console.error("Error deleting cart:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
