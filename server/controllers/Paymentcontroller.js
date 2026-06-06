/**
 * paymentController.js
 *
 * bKash Checkout API v1.2.0-beta
 * Nagad MFS Remote Payment Gateway
 *
 * Required ENV:
 *   BKASH_BASE_URL       https://tokenized.sandbox.bka.sh/v1.2.0-beta  (sandbox)
 *   BKASH_APP_KEY        from bKash merchant portal
 *   BKASH_APP_SECRET     from bKash merchant portal
 *   BKASH_USERNAME       from bKash merchant portal
 *   BKASH_PASSWORD       from bKash merchant portal
 *
 *   NAGAD_BASE_URL       http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0
 *   NAGAD_MERCHANT_ID    from Nagad merchant portal
 *   NAGAD_MERCHANT_PRIVATE_KEY   PEM string OR base64-encoded PEM (auto-detected)
 *   NAGAD_MERCHANT_PUBLIC_KEY    PEM string OR base64 (provided by Nagad)
 *
 *   FRONTEND_URL         https://yoursite.com  (no trailing slash)
 */

const asyncHandler = require('express-async-handler');
const axios        = require('axios');
const crypto       = require('crypto');
const Order        = require('../models/Order');

// ─────────────────────────────────────────────────────────────
// ENV VALIDATION — fail fast with clear messages
// ─────────────────────────────────────────────────────────────
const checkEnv = (keys) => {
  const missing = keys.filter(k => !process.env[k]);
  if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`);
};

const merchantInvoice = (orderId) =>
  `KRC-${orderId.toString().slice(-8).toUpperCase()}-${Date.now().toString().slice(-5)}`;

// ─────────────────────────────────────────────────────────────
// ██████  ██   ██  █████  ███████ ██   ██
// ██   ██ ██  ██  ██   ██ ██      ██   ██
// ██████  █████   ███████ ███████ ███████
// ██   ██ ██  ██  ██   ██      ██ ██   ██
// ██████  ██   ██ ██   ██ ███████ ██   ██
// ─────────────────────────────────────────────────────────────

let bkashToken    = null;
let bkashTokenExp = 0;

async function getBkashToken() {
  // Validate env first
  checkEnv(['BKASH_BASE_URL','BKASH_APP_KEY','BKASH_APP_SECRET','BKASH_USERNAME','BKASH_PASSWORD']);

  // Validate URL format
  const baseURL = process.env.BKASH_BASE_URL.trim().replace(/\/$/, '');
  if (!baseURL.startsWith('http')) {
    throw new Error(`BKASH_BASE_URL is invalid: "${baseURL}". Should start with https://`);
  }

  if (bkashToken && Date.now() < bkashTokenExp) return { token: bkashToken, baseURL };

  const { data } = await axios.post(
    `${baseURL}/tokenized/checkout/token/grant`,
    { app_key: process.env.BKASH_APP_KEY, app_secret: process.env.BKASH_APP_SECRET },
    { headers: { username: process.env.BKASH_USERNAME, password: process.env.BKASH_PASSWORD, 'Content-Type': 'application/json' } }
  );

  if (data.statusCode !== '0000') throw new Error(`bKash token error: ${data.statusMessage}`);

  bkashToken    = data.id_token;
  bkashTokenExp = Date.now() + (data.expires_in - 60) * 1000;
  return { token: bkashToken, baseURL };
}

// POST /api/payment/bkash/create
const bkashCreate = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order)                                                 { res.status(404); throw new Error('Order not found'); }
  if (order.customer.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not your order'); }
  if (order.isPaid)                                           { res.status(400); throw new Error('Order already paid'); }

  checkEnv(['FRONTEND_URL']);
  const { token, baseURL } = await getBkashToken();
  const invoice     = merchantInvoice(orderId);
  const callbackURL = `${process.env.FRONTEND_URL.trim()}/payment/bkash/callback?orderId=${orderId}`;

  const { data } = await axios.post(
    `${baseURL}/tokenized/checkout/create`,
    {
      mode:                  '0011',
      payerReference:        req.user._id.toString(),
      callbackURL,
      amount:                order.totalAmount.toFixed(2),
      currency:              'BDT',
      intent:                'sale',
      merchantInvoiceNumber: invoice,
    },
    { headers: { Authorization: token, 'X-APP-Key': process.env.BKASH_APP_KEY, 'Content-Type': 'application/json' } }
  );

  if (data.statusCode !== '0000') throw new Error(`bKash create failed: ${data.statusMessage}`);

  order.paymentTransaction = {
    gateway: 'bkash', paymentID: data.paymentID, amount: order.totalAmount,
    status: 'initiated', rawResponse: data, initiatedAt: new Date(),
  };
  await order.save();

  res.json({ success: true, bkashURL: data.bkashURL, paymentID: data.paymentID });
});

// GET /api/payment/bkash/callback  (bKash redirects here)
const bkashCallback = asyncHandler(async (req, res) => {
  const { paymentID, status, orderId } = req.query;
  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (status === 'cancel' || status === 'failure') {
    order.paymentTransaction.status = status === 'cancel' ? 'cancelled' : 'failed';
    await order.save();
    return res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=${status}&orderId=${orderId}`);
  }

  const { token, baseURL } = await getBkashToken();
  const { data } = await axios.post(
    `${baseURL}/tokenized/checkout/execute`,
    { paymentID },
    { headers: { Authorization: token, 'X-APP-Key': process.env.BKASH_APP_KEY, 'Content-Type': 'application/json' } }
  );

  if (data.statusCode === '0000' && data.transactionStatus === 'Completed') {
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentTransaction.status      = 'completed';
    order.paymentTransaction.trxID       = data.trxID;
    order.paymentTransaction.completedAt = new Date();
    order.paymentTransaction.rawResponse = data;
    order.statusHistory.push({ status: order.status, note: `bKash payment completed. TrxID: ${data.trxID}` });
    await order.save();
    return res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=success&orderId=${orderId}&trxID=${data.trxID}`);
  }

  order.paymentTransaction.status        = 'failed';
  order.paymentTransaction.failureReason = data.statusMessage;
  order.paymentTransaction.rawResponse   = data;
  await order.save();
  res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=failure&orderId=${orderId}`);
});

// GET /api/payment/bkash/verify/:orderId
const bkashVerify = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order)                                                 { res.status(404); throw new Error('Order not found'); }
  if (order.customer.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not your order'); }

  const { token, baseURL } = await getBkashToken();
  const { data } = await axios.post(
    `${baseURL}/tokenized/checkout/payment/status`,
    { paymentID: order.paymentTransaction?.paymentID },
    { headers: { Authorization: token, 'X-APP-Key': process.env.BKASH_APP_KEY, 'Content-Type': 'application/json' } }
  );

  res.json({ success: true, isPaid: order.isPaid, gatewayStatus: data.transactionStatus, trxID: data.trxID });
});

// ─────────────────────────────────────────────────────────────
// ███    ██  █████   ██████   █████  ██████
// ████   ██ ██   ██ ██       ██   ██ ██   ██
// ██ ██  ██ ███████ ██   ███ ███████ ██   ██
// ██  ██ ██ ██   ██ ██    ██ ██   ██ ██   ██
// ██   ████ ██   ██  ██████  ██   ██ ██████
// ─────────────────────────────────────────────────────────────

/**
 * Smart key decoder — handles all common formats:
 *   1. Raw PEM (starts with -----BEGIN...)
 *   2. Base64-encoded PEM
 *   3. Raw base64 key body (no headers) — wraps in PKCS8 headers
 */
function decodePemKey(envValue, type = 'PRIVATE KEY') {
  const raw = envValue.trim();

  // Already a PEM string
  if (raw.startsWith('-----BEGIN')) return raw;

  // Try base64 decode → check if result is PEM
  try {
    const decoded = Buffer.from(raw, 'base64').toString('utf8').trim();
    if (decoded.startsWith('-----BEGIN')) return decoded;
  } catch (_) {}

  // Treat as raw base64 key body — wrap with PEM headers
  const header = `-----BEGIN ${type}-----`;
  const footer = `-----END ${type}-----`;
  // Split into 64-char lines
  const body = raw.replace(/\s/g, '').match(/.{1,64}/g).join('\n');
  return `${header}\n${body}\n${footer}`;
}

function nagadSign(data) {
  checkEnv(['NAGAD_MERCHANT_PRIVATE_KEY']);
  const pem  = decodePemKey(process.env.NAGAD_MERCHANT_PRIVATE_KEY, 'PRIVATE KEY');
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  return sign.sign(pem, 'base64');
}

function nagadEncrypt(data) {
  checkEnv(['NAGAD_MERCHANT_PUBLIC_KEY']);
  const pem = decodePemKey(process.env.NAGAD_MERCHANT_PUBLIC_KEY, 'PUBLIC KEY');
  return crypto.publicEncrypt(
    { key: pem, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(data)
  ).toString('base64');
}

// POST /api/payment/nagad/create
const nagadCreate = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  checkEnv(['NAGAD_BASE_URL','NAGAD_MERCHANT_ID','NAGAD_MERCHANT_PRIVATE_KEY','NAGAD_MERCHANT_PUBLIC_KEY','FRONTEND_URL']);

  const order = await Order.findById(orderId);
  if (!order)                                                 { res.status(404); throw new Error('Order not found'); }
  if (order.customer.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not your order'); }
  if (order.isPaid)                                           { res.status(400); throw new Error('Order already paid'); }

  const merchantId  = process.env.NAGAD_MERCHANT_ID;
  const baseURL     = process.env.NAGAD_BASE_URL.trim().replace(/\/$/, '');
  const datetime    = new Date().toISOString().replace(/[-T:.Z]/g,'').slice(0,14);
  const ordRef      = merchantInvoice(orderId);
  const callbackURL = `${process.env.FRONTEND_URL.trim()}/payment/nagad/callback?orderId=${orderId}`;

  // Step 1: Initialize
  const initSensitiveData = JSON.stringify({
    merchantId, datetime, orderId: ordRef,
    challenge: crypto.randomBytes(16).toString('hex'),
  });

  const initBody = {
    accountNumber: req.user.phone || '01000000000',
    dateTime:      datetime,
    sensitiveData: nagadEncrypt(initSensitiveData),
    signature:     nagadSign(initSensitiveData),
  };

  const initRes = await axios.post(
    `${baseURL}/api/dfs/check-out/initialize/${merchantId}/${ordRef}`,
    initBody,
    { headers: { 'X-KM-Api-Version': 'v-0.2.0', 'Content-Type': 'application/json' } }
  );

  const initData = initRes.data;
  if (!initData?.sensitiveData) throw new Error(`Nagad initialization failed: ${JSON.stringify(initData)}`);

  const paymentRefId = initData.paymentReferenceId;

  // Step 2: Complete / place order
  const orderSensitiveData = JSON.stringify({
    merchantId, orderId: ordRef,
    amount:       order.totalAmount.toFixed(2),
    currencyCode: '050',
    challenge:    initData.challenge,
  });

  const orderBody = {
    sensitiveData:    nagadEncrypt(orderSensitiveData),
    signature:        nagadSign(orderSensitiveData),
    merchantCallbackURL: callbackURL,
    additionalMerchantInfo: {
      productName:  'KrishiConnect Order',
      productCount: order.items.length,
    },
  };

  const placeRes = await axios.post(
    `${baseURL}/api/dfs/check-out/complete/${paymentRefId}`,
    orderBody,
    { headers: { 'X-KM-Api-Version': 'v-0.2.0', 'Content-Type': 'application/json' } }
  );

  const placeData = placeRes.data;
  if (placeData.status !== 'Success') throw new Error(`Nagad order placement failed: ${placeData.reason || JSON.stringify(placeData)}`);

  order.paymentTransaction = {
    gateway: 'nagad', paymentReferenceId: paymentRefId,
    merchantCallbackURL: callbackURL, amount: order.totalAmount,
    status: 'initiated', rawResponse: placeData, initiatedAt: new Date(),
  };
  await order.save();

  res.json({ success: true, callURL: placeData.callBackUrl, paymentReferenceId: paymentRefId });
});

// GET /api/payment/nagad/callback
const nagadCallback = asyncHandler(async (req, res) => {
  const { payment_ref_id, status, orderId } = req.query;
  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (status !== 'Success') {
    order.paymentTransaction.status        = 'failed';
    order.paymentTransaction.failureReason = `Nagad status: ${status}`;
    await order.save();
    return res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=failure&orderId=${orderId}`);
  }

  const baseURL   = process.env.NAGAD_BASE_URL.trim().replace(/\/$/, '');
  const { data: verify } = await axios.get(
    `${baseURL}/api/dfs/verify/payment/${payment_ref_id}`,
    { headers: { 'X-KM-Api-Version': 'v-0.2.0' } }
  );

  if (verify.status === 'Success') {
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentTransaction.status      = 'completed';
    order.paymentTransaction.completedAt = new Date();
    order.paymentTransaction.rawResponse = verify;
    order.statusHistory.push({ status: order.status, note: `Nagad payment verified. Ref: ${payment_ref_id}` });
    await order.save();
    return res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=success&orderId=${orderId}`);
  }

  order.paymentTransaction.status        = 'failed';
  order.paymentTransaction.failureReason = verify.reason || 'Verification failed';
  await order.save();
  res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=failure&orderId=${orderId}`);
});

// GET /api/payment/nagad/verify/:orderId
const nagadVerify = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order)                                                 { res.status(404); throw new Error('Order not found'); }
  if (order.customer.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not your order'); }

  const payRef  = order.paymentTransaction?.paymentReferenceId;
  const baseURL = process.env.NAGAD_BASE_URL.trim().replace(/\/$/, '');
  const { data } = await axios.get(
    `${baseURL}/api/dfs/verify/payment/${payRef}`,
    { headers: { 'X-KM-Api-Version': 'v-0.2.0' } }
  );

  res.json({ success: true, isPaid: order.isPaid, gatewayStatus: data.status, reference: payRef });
});

// POST /api/payment/refund/:orderId
const refundPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order)        { res.status(404); throw new Error('Order not found'); }
  if (!order.isPaid) { res.status(400); throw new Error('Order not paid'); }

  const txn = order.paymentTransaction;
  if (!txn || txn.gateway !== 'bkash') { res.status(400); throw new Error('Refund only supported for bKash currently'); }

  const { token, baseURL } = await getBkashToken();
  const { data } = await axios.post(
    `${baseURL}/tokenized/checkout/payment/refund`,
    { paymentID: txn.paymentID, amount: txn.amount.toFixed(2), trxID: txn.trxID, sku: 'krishi-refund', reason: req.body.reason || 'Customer request' },
    { headers: { Authorization: token, 'X-APP-Key': process.env.BKASH_APP_KEY, 'Content-Type': 'application/json' } }
  );

  if (data.statusCode === '0000') {
    order.isPaid = false;
    order.paymentTransaction.status = 'refunded';
    order.statusHistory.push({ status: order.status, note: `Refund issued. RefundTrxID: ${data.refundTrxID}` });
    await order.save();
    return res.json({ success: true, message: 'Refund successful', refundTrxID: data.refundTrxID });
  }

  res.status(400).json({ success: false, message: data.statusMessage });
});

module.exports = { bkashCreate, bkashCallback, bkashVerify, nagadCreate, nagadCallback, nagadVerify, refundPayment };