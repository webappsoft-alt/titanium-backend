// Required packages
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const { User } = require('../models/user');
const router = express.Router();
require('dotenv').config();
const qs = require('qs'); // To serialize form data


// Environment variables
const PAYTRACE_API_URL = 'https://api.paytrace.com';
const PAYTRACE_USERNAME = 'userweb';
const PAYTRACE_PASSWORD = 'Titanpass1972';
const PAYTRACE_INTEGRATOR_ID = '849502260888';

// Helper function to get PayTrace access token

async function getPayTraceToken() {
    try {
        console.log(PAYTRACE_PASSWORD,)
      const response = await axios.post(
        `${PAYTRACE_API_URL}/v3/token`,
        qs.stringify({
          grant_type: 'client_credentials',
          client_id: PAYTRACE_USERNAME,
          client_secret: PAYTRACE_PASSWORD
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
  
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting PayTrace token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with PayTrace');
    }
  }
// Create a PayTrace customer
exports.create = async (req, res) => {
    try {
        const { email } = req.body;

        // Find the user in the database
        const user = await User.findOne({ email }).select('_id fname email lname billingAddress shippingAddress').lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const userId = user?._id
        // Get PayTrace token
        const token = await getPayTraceToken();

        // // Create customer in PayTrace
        // const customerResponse = await axios.post(
        //     `${PAYTRACE_API_URL}/v3/customer/create`,
        //     {
        //         customer_label: `cust_${userId}`,
        //         name: `${user.fname} ${user.lname}`,
        //         email: user.email,
        //         billing_address: {
        //             name: `${user?.billingAddress?.fname} ${user?.billingAddress?.lname}`,
        //             street_address: user?.billingAddress?.address1,
        //             street_address2: user?.billingAddress?.address2 || "",
        //             city: user?.billingAddress?.city,
        //             state: user?.billingAddress?.state,
        //             zip: user?.billingAddress?.zipCode,
        //             country: user?.billingAddress?.country || "US"
        //         },
        //         // integrator_id: PAYTRACE_INTEGRATOR_ID
        //     },
        //     {
        //         headers: {
        //             Authorization: `Bearer ${token}`,
        //             'X-Permalinks': true
        //         }
        //     }
        // );

        // // Update user with PayTrace customer ID
        // user.paytraceCustomerId = `cust_${userId}`;
        // await user.save();

        res.json({
            success: true,
            message: 'Customer created successfully',
            // customerResponse
        });
    } catch (error) {
        console.error('Error creating customer:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create customer',
            error: error.response?.data?.message || error.message
        });
    }
};

// // Add a payment method (card) to a customer
// router.post('/add-payment-method', async (req, res) => {
//     try {
//         const { userId, cardNumber, expirationMonth, expirationYear, cardholderName, cvv } = req.body;

//         // Find the user in the database
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         if (!user.paytraceCustomerId) {
//             return res.status(400).json({ success: false, message: 'User does not have a PayTrace customer ID' });
//         }

//         // Get PayTrace token
//         const token = await getPayTraceToken();

//         // Add payment method to PayTrace customer
//         const paymentMethodResponse = await axios.post(
//             `${PAYTRACE_API_URL}/v3/payment_method/create`,
//             {
//                 customer_id: user.paytraceCustomerId,
//                 credit_card: {
//                     number: cardNumber,
//                     expiration_month: expirationMonth,
//                     expiration_year: expirationYear
//                 },
//                 card_holder_name: cardholderName,
//                 cvv: cvv,
//                 integrator_id: PAYTRACE_INTEGRATOR_ID
//             },
//             {
//                 headers: { Authorization: `Bearer ${token}` }
//             }
//         );

//         // Extract token from response
//         const cardToken = paymentMethodResponse.data.payment_method_token;

//         // Get card details from PayTrace
//         const cardDetailsResponse = await axios.get(
//             `${PAYTRACE_API_URL}/v3/payment_method/${cardToken}`,
//             {
//                 headers: { Authorization: `Bearer ${token}` }
//             }
//         );

//         const cardDetails = cardDetailsResponse.data;

//         // Save card to user's account
//         user.savedCards.push({
//             cardToken: cardToken,
//             cardType: cardDetails.card_type,
//             last4: cardDetails.masked_number.slice(-4),
//             expirationMonth: expirationMonth,
//             expirationYear: expirationYear,
//             isDefault: user.savedCards.length === 0 // Set as default if it's the first card
//         });

//         await user.save();

//         res.json({
//             success: true,
//             message: 'Payment method added successfully',
//             cardToken: cardToken,
//             cardDetails: {
//                 cardType: cardDetails.card_type,
//                 last4: cardDetails.masked_number.slice(-4),
//                 expirationMonth: expirationMonth,
//                 expirationYear: expirationYear
//             }
//         });
//     } catch (error) {
//         console.error('Error adding payment method:', error.response?.data || error.message);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to add payment method',
//             error: error.response?.data?.message || error.message
//         });
//     }
// });

// // Get saved payment methods for a user
// router.get('/payment-methods/:userId', async (req, res) => {
//     try {
//         const { userId } = req.params;

//         // Find the user in the database
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         res.json({
//             success: true,
//             paymentMethods: user.savedCards
//         });
//     } catch (error) {
//         console.error('Error getting payment methods:', error.message);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to get payment methods',
//             error: error.message
//         });
//     }
// });

// // Process a payment with a saved card
// router.post('/process-payment', async (req, res) => {
//     try {
//         const { userId, cardToken, amount, description } = req.body;

//         // Find the user in the database
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         if (!user.paytraceCustomerId) {
//             return res.status(400).json({ success: false, message: 'User does not have a PayTrace customer ID' });
//         }

//         // Get PayTrace token
//         const token = await getPayTraceToken();

//         // Process payment using token
//         const paymentResponse = await axios.post(
//             `${PAYTRACE_API_URL}/v3/transactions/sale/by_token`,
//             {
//                 amount: amount,
//                 payment_method_token: cardToken,
//                 description: description,
//                 integrator_id: PAYTRACE_INTEGRATOR_ID
//             },
//             {
//                 headers: { Authorization: `Bearer ${token}` }
//             }
//         );

//         res.json({
//             success: true,
//             message: 'Payment processed successfully',
//             transactionId: paymentResponse.data.transaction_id,
//             approvalCode: paymentResponse.data.approval_code,
//             response: paymentResponse.data
//         });
//     } catch (error) {
//         console.error('Error processing payment:', error.response?.data || error.message);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to process payment',
//             error: error.response?.data?.message || error.message
//         });
//     }
// });

// // Create a payment link for a customer
// router.post('/create-payment-link', async (req, res) => {
//     try {
//         const { userId, amount, description, expirationDays } = req.body;

//         // Find the user in the database
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         // Get PayTrace token
//         const token = await getPayTraceToken();

//         // Calculate expiration date
//         const expirationDate = new Date();
//         expirationDate.setDate(expirationDate.getDate() + (expirationDays || 30));

//         // Create payment link
//         const paymentLinkResponse = await axios.post(
//             `${PAYTRACE_API_URL}/v3/payment_link/create`,
//             {
//                 amount: amount,
//                 description: description,
//                 customer_id: user.paytraceCustomerId || null,
//                 expiration_date: expirationDate.toISOString().split('T')[0], // YYYY-MM-DD format
//                 email: user.email,
//                 integrator_id: PAYTRACE_INTEGRATOR_ID
//             },
//             {
//                 headers: { Authorization: `Bearer ${token}` }
//             }
//         );

//         res.json({
//             success: true,
//             message: 'Payment link created successfully',
//             paymentLink: paymentLinkResponse.data.payment_link,
//             expirationDate: expirationDate.toISOString().split('T')[0],
//             linkId: paymentLinkResponse.data.link_id
//         });
//     } catch (error) {
//         console.error('Error creating payment link:', error.response?.data || error.message);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to create payment link',
//             error: error.response?.data?.message || error.message
//         });
//     }
// });

// // Set a card as default
// router.put('/set-default-card', async (req, res) => {
//     try {
//         const { userId, cardToken } = req.body;

//         // Find the user in the database
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         // Find the card and set it as default
//         let cardFound = false;
//         for (let card of user.savedCards) {
//             if (card.cardToken === cardToken) {
//                 card.isDefault = true;
//                 cardFound = true;
//             } else {
//                 card.isDefault = false;
//             }
//         }

//         if (!cardFound) {
//             return res.status(404).json({ success: false, message: 'Card not found' });
//         }

//         await user.save();

//         res.json({
//             success: true,
//             message: 'Default card updated successfully'
//         });
//     } catch (error) {
//         console.error('Error setting default card:', error.message);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to set default card',
//             error: error.message
//         });
//     }
// });

// // Remove a saved card
// router.delete('/remove-card', async (req, res) => {
//     try {
//         const { userId, cardToken } = req.body;

//         // Find the user in the database
//         const user = await User.findById(userId);
//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }

//         // Get PayTrace token
//         const token = await getPayTraceToken();

//         // Remove the card from PayTrace
//         await axios.delete(
//             `${PAYTRACE_API_URL}/v3/payment_method/${cardToken}`,
//             {
//                 headers: { Authorization: `Bearer ${token}` }
//             }
//         );

//         // Remove the card from user's account
//         const initialCardCount = user.savedCards.length;
//         user.savedCards = user.savedCards.filter(card => card.cardToken !== cardToken);

//         // If the card was not found
//         if (initialCardCount === user.savedCards.length) {
//             return res.status(404).json({ success: false, message: 'Card not found' });
//         }

//         // If the removed card was the default, set another card as default
//         const wasDefault = user.savedCards.every(card => card.isDefault === false);
//         if (wasDefault && user.savedCards.length > 0) {
//             user.savedCards[0].isDefault = true;
//         }

//         await user.save();

//         res.json({
//             success: true,
//             message: 'Card removed successfully'
//         });
//     } catch (error) {
//         console.error('Error removing card:', error.response?.data || error.message);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to remove card',
//             error: error.response?.data?.message || error.message
//         });
//     }
// });

// module.exports = router;