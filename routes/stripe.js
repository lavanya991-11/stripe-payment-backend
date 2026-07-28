const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

//--------------------------------------
// Create Checkout Session
//--------------------------------------
router.post('/create-checkout-session', async (req, res) => {

    try {

        const {
            salesOrderNo,
            customerName,
            itemName,
            amount,
            quantity
        } = req.body;

        const session = await stripe.checkout.sessions.create({

            payment_method_types: ['card'],

            mode: 'payment',

            line_items: [
                {
                    price_data: {

                        currency: 'inr',

                        product_data: {
                            name: itemName
                        },

                        unit_amount: Math.round(amount * 100)

                    },

                    quantity: quantity || 1
                }
            ],

            metadata: {
                salesOrderNo,
                customerName
            },

            success_url:
process.env.BASE_URL +
'/payment-success?session_id={CHECKOUT_SESSION_ID}',

cancel_url:
process.env.BASE_URL +
'/payment-cancel'

        });

        res.status(200).json({
            success: true,
            sessionId: session.id,
            checkoutUrl: session.url
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            error: err.message
        });

    }

});


//--------------------------------------
// Check Payment Status
//--------------------------------------
router.get('/payment-status/:sessionId', async (req, res) => {

    try {

        const session =
            await stripe.checkout.sessions.retrieve(req.params.sessionId);

        res.json({

            paymentStatus: session.payment_status,

            paymentIntent: session.payment_intent,

            customerEmail: session.customer_details?.email,

            customerName: session.customer_details?.name,

            amount: session.amount_total,

            currency: session.currency,

            metadata: session.metadata

        });

    } catch (err) {

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;