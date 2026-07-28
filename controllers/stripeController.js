const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bcController = require('./bcController');

exports.paymentSuccess = async (req, res) => {

    try {

        const sessionId = req.query.session_id;

        const session =
            await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {

            await bcController.updateSalesOrder(session);

            res.send("Payment Successfully");

        } else {

            res.send("Payment Pending");

        }

    } catch (err) {

        console.log(err);

        res.status(500).send(err.message);

    }

};