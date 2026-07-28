const axios = require('axios');

exports.updateSalesOrder = async function (session) {

    try {

        const salesOrderNo = session.metadata.salesOrderNo;

        const body = {

            paymentStatus: "Paid",

            stripeSessionId: session.id,

            paymentIntent: session.payment_intent

        };

        const url =
            process.env.BC_URL +
            "/SalesOrders('" +
            salesOrderNo +
            "')";

        await axios.patch(

            url,

            body,

            {

                headers: {

                    Authorization:
                        "Bearer " + process.env.BC_ACCESS_TOKEN,

                    "Content-Type":
                        "application/json"

                }

            }

        );

        console.log("Business Central Updated");

    } catch (err) {

        console.log(err.response?.data || err.message);

    }

};