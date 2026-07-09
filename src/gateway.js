/**
 * Gateway - creates checkout sessions via Paystack
 */

const axios = require('axios');

async function createCheckout(req, res) {
  try {
    const { amount, email, metadata = {} } = req.body;

    if (!amount || !email) {
      return res.status(400).json({ error: 'amount and email required' });
    }

    // Paystack expects amount in kobo (NGN * 100)
    const amountInKobo = Math.round(amount * 100);

    const paystackRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        amount: amountInKobo,
        email,
        currency: 'NGN',
        metadata: {
          ...metadata,
          settlement_type: 'lightning',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      checkout_url: paystackRes.data.data.authorization_url,
      reference: paystackRes.data.data.reference,
    });
  } catch (err) {
    console.error('Checkout creation failed:', err.message);
    res.status(500).json({ error: 'Checkout initialization failed' });
  }
}

module.exports = { createCheckout };
