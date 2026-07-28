const axios = require("axios");
require("dotenv").config();

async function updatePayment(data) {

    try {

        const response = await axios.patch(

            `${process.env.BC_API_URL}/${data.orderNo}`,

            {
                paymentStatus: data.paymentStatus,
                stripeSessionId: data.sessionId,
                stripePaymentIntentId: data.paymentIntent,
                stripeAmountPaid: data.amount,
                stripeCurrency: data.currency,
                customerEmail: data.customerEmail
            },

            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.BC_ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }

        );

        return response.data;

    } catch (err) {

        console.error(
            "Business Central Update Failed:",
            err.response?.data || err.message
        );

        throw err;
    }
}

module.exports = {
    updatePayment
};