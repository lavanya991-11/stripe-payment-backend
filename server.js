require('dotenv').config();

const express = require('express');
const path = require('path');

const stripeRoutes = require('./routes/stripe');
const businessCentralRoutes = require('./routes/businesscentral');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('Stripe Payment Gateway Running...');
});

app.use('/api/stripe', stripeRoutes);
app.use('/api/businesscentral', businessCentralRoutes);

app.get('/payment-success', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payment-success.html'));
});

app.get('/payment-cancel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'payment-cancel.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});