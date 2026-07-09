/**
 * Webhook - receives and validates Paystack payment confirmations
 */

const crypto = require('crypto');
const { queueSettlement } = require('./settlement');

function handleWebhook(req, res) {
  try {
    const signature = req.headers['x-paystack-signature'];
    const rawBody = req.body;

    if (!verifySignature(signature, rawBody)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(rawBody.toString());

    if (event.event === 'charge.success') {
      const { reference, amount, metadata } = event.data;

      // Amount from Paystack is in kobo; convert to NGN
      const ngnAmount = amount / 100;

      queueSettlement({
        reference,
        ngnAmount,
        metadata,
      });

      console.log(`Payment confirmed: ${reference} for ${ngnAmount} NGN`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook handling failed:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

function verifySignature(signature, rawBody) {
  if (!signature || !rawBody) return false;

  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');

  return hash === signature;
}

module.exports = { handleWebhook };
