require('dotenv').config();

const express = require('express');
const path = require('path');

const stripeRoutes = require('./routes/stripe');
const businessCentralRoutes = require('./routes/businesscentral');
const paymentController = require('./controllers/paymentController');
const errorHandler = require('./middelware/errorhandeler');

// Render injects RENDER_EXTERNAL_URL with the service's real https origin. Falling
// back to it means a deploy can never redirect the customer at localhost just
// because BASE_URL was forgotten. An explicit BASE_URL still wins, so a custom
// domain overrides it. Trailing slashes are trimmed because the callers append
// "/payment-success" directly and "//payment-success" matches no route.
process.env.BASE_URL =
    (process.env.BASE_URL || process.env.RENDER_EXTERNAL_URL || '')
        .replace(/\/+$/, '');

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

// Health check target for Render. Deliberately touches nothing external - if it
// called Stripe, a Stripe outage would read as this service being down and Render
// would restart a perfectly healthy instance.
app.get('/healthz', (req, res) => {
    res.json({ status: 'ok' });
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
    // Print the origin Stripe will actually redirect to, so the deploy log shows
    // exactly what belongs in the Business Central success/cancel fields.
    console.log(
        process.env.BASE_URL
            ? `Payment Success URL: ${process.env.BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`
            : 'BASE_URL is not set - Stripe redirects will be built from "undefined" and fail.'
    );
});
