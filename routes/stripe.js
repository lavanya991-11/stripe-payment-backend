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
            orderNo,
            customerName,
            customerEmail,
            itemName,
            amount,
            currency,
            quantity
        } = req.body;

        const documentNo = orderNo || salesOrderNo;

        if (!documentNo)
            return res.status(400).json({
                success: false,
                error: 'orderNo (or salesOrderNo) is required.'
            });

        // Stripe rejects a zero/negative charge, so fail here with a message the
        // caller can act on rather than surfacing a raw Stripe error.
        if (!(Number(amount) > 0))
            return res.status(400).json({
                success: false,
                error: 'amount must be greater than zero.'
            });

        const session = await stripe.checkout.sessions.create({

            payment_method_types: ['card'],

            mode: 'payment',

            line_items: [
                {
                    price_data: {

                        // Follow the caller's currency - hardcoding one makes Stripe
                        // reject orders raised in any other currency.
                        currency: (currency || 'gbp').toLowerCase(),

                        product_data: {
                            name: itemName || ('Sales Order ' + documentNo)
                        },

                        unit_amount: Math.round(amount * 100)

                    },

                    quantity: quantity || 1
                }
            ],

            customer_email: customerEmail || undefined,

            client_reference_id: documentNo,

            metadata: {
                // order_no is the key the AL codeunit stamps; keep both spellings so
                // the success page and webhook work whichever side made the session.
                order_no: documentNo,
                salesOrderNo: documentNo,
                customerName
            },

            success_url: process.env.BASE_URL + '/payment-success?session_id={CHECKOUT_SESSION_ID}',

            cancel_url: process.env.BASE_URL + '/payment-cancel'

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
            await stripe.checkout.sessions.retrieve(
                req.params.sessionId,
                { expand: ['payment_intent.latest_charge'] }
            );

        const charge = session.payment_intent?.latest_charge;
        const card = charge?.payment_method_details?.card;
        const metadata = session.metadata || {};

        res.json({

            paymentStatus: session.payment_status,

            sessionStatus: session.status,

            paymentIntent: session.payment_intent?.id || session.payment_intent,

            chargeId: charge?.id,

            cardBrand: card?.brand,

            cardLast4: card?.last4,

            customerEmail: session.customer_details?.email,

            customerName: session.customer_details?.name,

            amount: session.amount_total,

            currency: session.currency,

            // Sessions created by the AL codeunit use order_no; the ones created here
            // use salesOrderNo. Surface a single key so the success page reads one name.
            orderNo:
                session.client_reference_id ||
                metadata.order_no ||
                metadata.salesOrderNo,

            metadata

        });

    } catch (err) {

        // An unknown/expired session id is a bad request, not a server fault - saying
        // 500 here makes the success page report an outage for a mistyped link.
        const status = err.statusCode === 404 || err.type === 'StripeInvalidRequestError'
            ? 404
            : 500;

        res.status(status).json({
            error: err.message
        });

    }

});

module.exports = router;