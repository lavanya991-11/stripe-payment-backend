require('dotenv').config();

const express = require('express');
const path = require('path');

const stripeRoutes = require('./routes/stripe');
const businessCentralRoutes = require('./routes/businesscentral');
const paymentController = require('./controllers/paymentController');
const errorHandler = require('./middelware/errorhandeler');

const app = express();

// The webhook must be mounted BEFORE express.json(): Stripe signs the raw bytes, so
// a parsed body would fail signature verification. Only mount it when the signing
// secret is configured, otherwise every delivery would 400 with a confusing error.
if (process.env.STRIPE_WEBHOOK_SECRET) {
    app.post(
        '/api/stripe/webhook',
        express.raw({ type: 'application/json' }),
        paymentController.stripeWebhook
    );
} else {
    console.warn(
        'STRIPE_WEBHOOK_SECRET is not set - /api/stripe/webhook is disabled. ' +
        'Payment status will only update when Business Central polls Stripe.'
    );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('Stripe Payment Gateway Running...');
});

app.use('/api/stripe', stripeRoutes);
app.use('/api/businesscentral', businessCentralRoutes);

// Stripe redirects the customer's browser to these two URLs after Checkout. The
// success page is intentionally dumb HTML - it calls back into
// /api/stripe/payment-status/:sessionId to confirm with Stripe before claiming the
// payment went through, because reaching this URL alone proves nothing.
app.get('/payment-success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payment-success.html'));
});

app.get('/payment-cancel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payment-cancel.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
