const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = async (order) => {

    return await stripe.checkout.sessions.create({

        payment_method_types: ['card'],

        mode: 'payment',

        line_items: [

            {

                price_data: {

                    // Follow the order's currency instead of assuming one - a currency
                    // the account has no payment methods for makes Stripe reject the
                    // whole session.
                    currency: (order.currency || 'gbp').toLowerCase(),

                    product_data: {

                        name: order.itemName || ('Sales Order ' + order.orderNo)

                    },

                    unit_amount: Math.round(order.amount * 100)

                },

                quantity: order.quantity || 1

            }

        ],

        customer_email: order.customerEmail || undefined,

        client_reference_id: order.orderNo || order.salesOrderNo,

        metadata: {

            // order_no is what the AL codeunit stamps, so keep both spellings and the
            // success page / webhook can read one key whichever side created the session.
            order_no: order.orderNo || order.salesOrderNo,

            salesOrderNo: order.orderNo || order.salesOrderNo,

            customerNo: order.customerNo

        },

        success_url:
            process.env.BASE_URL +
            "/payment-success?session_id={CHECKOUT_SESSION_ID}",

        cancel_url:
            process.env.BASE_URL +
            "/payment-cancel"

    });

};

exports.getSession = async (sessionId) => {

    return await stripe.checkout.sessions.retrieve(sessionId);

};

// Same lookup as getSession, but expands the charge so callers also get the card
// brand / last 4 / charge id in one round trip. paymentController calls this name.
exports.getCheckoutSession = async (sessionId) => {

    return await stripe.checkout.sessions.retrieve(sessionId, {

        expand: ['payment_intent.latest_charge']

    });

};

// Verifies the Stripe signature on a webhook. Needs the raw (unparsed) body - see
// the express.raw() mount in server.js, which must come before express.json().
exports.constructWebhookEvent = (rawBody, signature) => {

    if (!process.env.STRIPE_WEBHOOK_SECRET)
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');

    return stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
    );

};