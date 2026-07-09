/**
 * NairaSats - Naira to Bitcoin Lightning settlement gateway
 *
 * Sample archetype for the LAB Open Source Builders Fund.
 * Reference implementation for African merchants accepting NGN and settling to Lightning.
 */

require('dotenv').config();
const express = require('express');
const { createCheckout } = require('./gateway');
const { handleWebhook } = require('./webhook');
const { startSettlementWorker } = require('./settlement');

const PORT = process.env.PORT || 3000;

async function main() {
  const app = express();

  // Parse JSON except for webhook route which needs raw body for signature verification
  app.use((req, res, next) => {
    if (req.path === '/webhook/paystack') {
      express.raw({ type: 'application/json' })(req, res, next);
    } else {
      express.json()(req, res, next);
    }
  });

  // Checkout endpoint
  app.post('/checkout', createCheckout);

  // Paystack webhook receiver
  app.post('/webhook/paystack', handleWebhook);

  // Health check
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  // Start the settlement worker in background
  startSettlementWorker({
    lnbitsUrl: process.env.LNBITS_URL,
    lnbitsKey: process.env.LNBITS_KEY,
    merchantLightningAddress: process.env.MERCHANT_LIGHTNING_ADDRESS,
    exchangeRateSource: process.env.EXCHANGE_RATE_SOURCE || 'default',
  });

  app.listen(PORT, () => {
    console.log(`NairaSats gateway running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
