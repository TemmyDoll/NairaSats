# NairaSats

> Sample project for the LAB Open Source Builders Fund. This is a reference archetype showing what a Wallet and Payment Infrastructure submission can look like. It is intentionally minimal so builders can see the shape of a fundable project without copying production code.

Reference implementation for accepting Naira payments via Paystack and settling into Bitcoin Lightning through a merchant wallet. Built for African merchants who want to hold value in Bitcoin without touching crypto rails themselves.

## Why this exists

African merchants who want Bitcoin exposure face a real friction: their customers pay in local currency, and every conversion adds cost, complexity, and regulatory exposure. NairaSats is the reference pattern for accepting local payments and automatically converting settlement into Lightning-denominated value, letting merchants stay in Bitcoin without changing how customers pay them.

## Focus area alignment

This project aligns with the **Wallet and Payment Infrastructure** track of the LAB Open Source Builders Fund. It shows a concrete pattern for bridging African fiat rails to Bitcoin Lightning, which is exactly the kind of financial infrastructure the fund exists to encourage.

## What it does

- Accepts NGN payments through Paystack's standard checkout
- Verifies payment webhook signatures
- Converts settled NGN into satoshis via a configurable exchange rate source
- Sends the equivalent Bitcoin over Lightning to the merchant's configured wallet
- Logs every transaction with full audit trail

## Architecture

Three components:

1. **Payment gateway** exposes a checkout endpoint that hands off to Paystack
2. **Webhook handler** receives Paystack confirmations and validates them
3. **Settlement worker** converts confirmed NGN to sats and pays out via Lightning

The Lightning integration uses LNBits by default but is pluggable so any Lightning wallet with an API can be substituted.

## Getting started

```bash
git clone https://github.com/YOUR-ORG/nairasats
cd nairasats
npm install
cp .env.example .env
# Fill in PAYSTACK_SECRET_KEY, LNBITS_URL, LNBITS_KEY, MERCHANT_LIGHTNING_ADDRESS
npm run start
```

## Testing a payment

```bash
# Local test with Paystack test keys
curl -X POST http://localhost:3000/checkout \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "email": "test@example.com"}'
```

## Development

```bash
npm test              # Run test suite
npm run lint          # Check code style
npm run webhook-test  # Simulate a Paystack webhook locally
```

## Security notes

This is a reference implementation. Before running with real funds, ensure:

- Paystack webhook signatures are verified against your secret key
- Lightning wallet API keys are stored in a secrets manager
- Exchange rate source is a trusted feed with fallback
- Transaction logs are backed up and immutable
- Rate limiting and abuse protection are in place

## Roadmap

- v0.1: Basic Paystack to Lightning flow with LNBits
- v0.2: Multi-wallet support (Alby, BTCPay, custom LN nodes)
- v0.3: Configurable settlement policies (immediate vs batched)
- v0.4: Merchant dashboard for transaction history and settings

## Contributing

Contributions welcome. See CONTRIBUTING.md for guidelines. Priority areas: additional Lightning wallet adapters, exchange rate source integrations, merchant dashboard UI.

## License

MIT

## Fund attribution

Built as a sample archetype for the [LAB Open Source Builders Fund](https://artizen.fund/index/mf/lab-open-source-builders-fund).
