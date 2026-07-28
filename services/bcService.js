const axios = require('axios');

exports.updateSalesOrder = async (session) => {

    const salesOrderNo = session.metadata.salesOrderNo;

    const body = {

        paymentStatus: "Paid",

        stripeSessionId: session.id,

        paymentIntentId: session.payment_intent

    };

    await axios.patch(

        process.env.BC_API +

        "/salesOrders('" +

        salesOrderNo +

        "')",

        body,

        {

            headers: {

                Authorization:

                    "Bearer " +

                    process.env.BC_ACCESS_TOKEN,

                "Content-Type":

                    "application/json"

            }

        }

    );

};