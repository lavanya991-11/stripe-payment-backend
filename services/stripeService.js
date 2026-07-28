const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.createCheckoutSession = async (order) => {

    return await stripe.checkout.sessions.create({

        payment_method_types: ['card'],

        mode: 'payment',

        line_items: [

            {

                price_data: {

                    currency: 'inr',

                    product_data: {

                        name: order.itemName

                    },

                    unit_amount: Math.round(order.amount * 100)

                },

                quantity: order.quantity

            }

        ],

        metadata: {

            salesOrderNo: order.salesOrderNo,

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