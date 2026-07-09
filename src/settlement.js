/**
 * Settlement - converts confirmed NGN to satoshis and pays out via Lightning
 */

const axios = require('axios');

const settlementQueue = [];
let config = {};

function startSettlementWorker(cfg) {
  config = cfg;
  processQueue();
}

function queueSettlement(item) {
  settlementQueue.push(item);
}

async function processQueue() {
  while (true) {
    if (settlementQueue.length === 0) {
      await sleep(2000);
      continue;
    }

    const item = settlementQueue.shift();

    try {
      await settlePayment(item);
    } catch (err) {
      console.error(`Settlement failed for ${item.reference}:`, err.message);
      // In production: retry with backoff, dead letter queue, alerting
    }
  }
}

async function settlePayment({ reference, ngnAmount, metadata }) {
  const satsAmount = await convertNgnToSats(ngnAmount);

  console.log(
    `Settling ${reference}: ${ngnAmount} NGN => ${satsAmount} sats`
  );

  await payLightning({
    address: config.merchantLightningAddress,
    amountSats: satsAmount,
    memo: `NairaSats settlement: ${reference}`,
  });

  console.log(`Settlement complete for ${reference}`);
}

async function convertNgnToSats(ngnAmount) {
  const rate = await getExchangeRate();
  // rate is NGN per BTC
  const btcAmount = ngnAmount / rate;
  return Math.floor(btcAmount * 100000000);
}

async function getExchangeRate() {
  // Default: fetch from Coingecko public API
  const res = await axios.get(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=ngn'
  );
  return res.data.bitcoin.ngn;
}

async function payLightning({ address, amountSats, memo }) {
  // Resolve Lightning Address to invoice via LNURL-pay
  const [user, domain] = address.split('@');
  const lnurlRes = await axios.get(
    `https://${domain}/.well-known/lnurlp/${user}`
  );

  const callback = lnurlRes.data.callback;
  const invoiceRes = await axios.get(
    `${callback}?amount=${amountSats * 1000}`
  );

  const invoice = invoiceRes.data.pr;

  // Pay the invoice via LNBits
  await axios.post(
    `${config.lnbitsUrl}/api/v1/payments`,
    { out: true, bolt11: invoice },
    { headers: { 'X-Api-Key': config.lnbitsKey } }
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { startSettlementWorker, queueSettlement };
