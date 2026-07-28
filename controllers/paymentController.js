const stripeService = require("../services/stripeService");
const bcService = require("../util/businesscentral");

// Create Checkout Session
exports.createCheckoutSession = async (req, res) => {
    try {
        const {
            orderNo,
            amount,
            currency,
            customerEmail
        } = req.body;

        const session = await stripeService.createCheckoutSession({
            orderNo,
            amount,
            currency,
            customerEmail
        });

        res.status(200).json({
            success: true,
            sessionId: session.id,
            url: session.url
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};


// Payment Success
exports.paymentSuccess = async (req, res) => {

    try {

        const sessionId = req.query.session_id;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "Session ID is required."
            });
        }

        const session =
            await stripeService.getCheckoutSession(sessionId);

        // Optional:
        // Automatically update Business Central
        try {

            await bcService.updatePayment({
                orderNo:
                    session.client_reference_id ||
                    session.metadata?.order_no ||
                    session.metadata?.salesOrderNo,
                sessionId: session.id,
                paymentIntent: session.payment_intent,
                amount: session.amount_total / 100,
                currency: session.currency,
                customerEmail: session.customer_details?.email,
                paymentStatus: session.payment_status
            });

        } catch (bcErr) {

            console.log(
                "Business Central update skipped:",
                bcErr.message
            );

        }

        res.status(200).json({
            success: true,
            message: "Payment Successful",
            payment: session
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};


// Payment Cancel
exports.paymentCancel = async (req, res) => {

    res.status(200).json({
        success: false,
        message: "Payment Cancelled"
    });

};


// Get Checkout Session
exports.getSessionDetails = async (req, res) => {

    try {

        const session =
            await stripeService.getCheckoutSession(
                req.params.sessionId
            );

        res.status(200).json(session);

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};


// Stripe Webhook
exports.stripeWebhook = async (req, res) => {

    try {

        const sig = req.headers["stripe-signature"];

        const event =
            stripeService.constructWebhookEvent(
                req.body,
                sig
            );

        switch (event.type) {

            case "checkout.session.completed":

                const session = event.data.object;

                console.log(
                    "Payment Completed:",
                    session.id
                );

                try {

                    await bcService.updatePayment({
                        // Without orderNo the Business Central URL is built as
                        // ".../undefined" and the PATCH silently targets nothing.
                        orderNo:
                            session.client_reference_id ||
                            session.metadata?.order_no ||
                            session.metadata?.salesOrderNo,
                        sessionId: session.id,
                        paymentIntent: session.payment_intent,
                        amount: session.amount_total / 100,
                        currency: session.currency,
                        customerEmail: session.customer_details?.email,
                        paymentStatus: session.payment_status
                    });

                    console.log(
                        "Business Central updated successfully."
                    );

                } catch (err) {

                    console.log(
                        "Business Central update failed:",
                        err.message
                    );

                }

                break;

            default:

                console.log(
                    "Unhandled Event:",
                    event.type
                );

        }

        res.json({
            received: true
        });

    } catch (err) {

        console.error(err);

        res.status(400).send(
            `Webhook Error: ${err.message}`
        );

    }

};


// Get All Payments
exports.getAllPayments = async (req, res) => {

    try {

        const payments =
            await stripeService.getAllPayments();

        res.json(payments);

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};


// Get Single Payment
exports.getPayment = async (req, res) => {

    try {

        const payment =
            await stripeService.getPayment(
                req.params.id
            );

        res.json(payment);

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};


// Sync Business Central
exports.syncBusinessCentral = async (req, res) => {

    try {

        const result =
            await bcService.updatePayment(
                req.body
            );

        res.json({
            success: true,
            data: result
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};