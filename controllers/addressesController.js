const { User } = require('../models/user');

const Addresses = require('../models/addresses');
const Countries = require('../models/countries');
const States = require('../models/states');
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');

exports.create_ = async (req, res) => {
    const { addresses } = req.body;

    if (!Array.isArray(addresses) || addresses.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No customer data provided',
        });
    }

    const getReference = async (model, filter, projection = '_id') =>
        filter ? await model.findOne(filter).select(projection).lean() : null;

    try {
        const bulkOperations = await Promise.all(
            addresses.map(async (customer) => {
                try {
                    const {
                        fname, lname, address2, old_id, old_user_id, address1, city, zipCode, country_id, state_id, phone, company } = customer;

                    const [country, state, user] = await Promise.all([
                        country_id ? getReference(Countries, { old_id: country_id }, '_id name') : null,
                        state_id ? getReference(States, { old_id: state_id }, '_id name') : null,
                        old_user_id ? getReference(User, { old_id: old_user_id }, '_id email') : null,
                    ]);

                    const addressData = {
                        fname,
                        lname, address2, old_id, old_user_id, address1, city, zipCode,
                        phone,
                        company,

                        email: old_user_id ? user?.email : '',
                        user: old_user_id ? user?._id : null,
                        countryID: country_id ? country?._id : null,
                        stateID: state_id ? state?._id : null,

                        country: country_id ? country?.name : '',
                        state: state_id ? state?.name : '',

                        old_country_id: country_id,
                        old_state_id: state_id,
                    };

                    return {
                        updateOne: {
                            filter: { old_id },
                            update: { $set: addressData },
                            upsert: true,
                        },
                    };
                } catch (error) {
                    console.error(`Error preparing bulk`, error);
                    return null; // skip invalid customers
                }
            })
        );

        const validOperations = bulkOperations.filter(Boolean); // remove null entries

        if (validOperations.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid customer records to process',
            });
        }

        const bulkResult = await Addresses.bulkWrite(validOperations, { ordered: false });

        return sendEncryptedResponse(res, {
            success: true,
            message: 'Addresses data processed successfully',
            matchedCount: bulkResult.matchedCount,
            modifiedCount: bulkResult.modifiedCount,
            upsertedCount: bulkResult.upsertedCount,
        });
    } catch (error) {
        console.error('Bulk import error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message,
        });
    }
}
// Helper function to extract address fields
const extractAddressFields = (addressData, userId) => {
    const {
        fname,
        lname,
        old_state_id,
        old_country_id,
        address2,
        address1,
        city,
        zipCode,
        country_id,
        state_id,
        phone,
        company,
        countryID,
        state,
        stateID,
        country
    } = addressData;

    return {
        fname,
        lname,
        old_state_id,
        old_country_id,
        address2,
        address1,
        city,
        zipCode,
        country_id,
        state_id,
        phone,
        company,
        countryID,
        state,
        country,
        stateID,
        user: userId
    };
};

async function upsertUserAddress({
    userId,
    type, // 'billingAddress' | 'shippingAddress'
    addressPayload,
    currentAddressId
}) {
    if (!addressPayload || Object.keys(addressPayload).length === 0) return null;

    const addressData = extractAddressFields(addressPayload, userId);

    if (!Object.keys(addressData).length) return null;

    let addressDoc;

    if (currentAddressId) {
        addressDoc = await Addresses.findByIdAndUpdate(
            currentAddressId,
            { $set: addressData },
            { new: true }
        );
    } else {
        addressDoc = await Addresses.create(addressData);
        await User.findByIdAndUpdate(userId, {
            $set: { [type]: addressDoc._id }
        });
    }

    return addressDoc;
}
exports.update = async (req, res) => {
    try {
        const { billing, shipping } = req.body;
        const userId = req.params.id;

        // Handle billing address
        const billingAddress = await upsertUserAddress({
            userId,
            type: 'billingAddress',
            addressPayload: billing,
            currentAddressId: billing._id
        });

        const shippingAddress = await upsertUserAddress({
            userId,
            type: 'shippingAddress',
            addressPayload: shipping,
            currentAddressId: shipping._id
        });

        sendEncryptedResponse(res, {
            success: true,
            message: "Addresses updated successfully",
            billingAddress,
            shippingAddress
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};
