/**
 * paymentController.js
 *
 * Real bKash & Nagad payment gateway integration.
 *
 * bKash Checkout API (v1.2.0-beta) docs:
 *   https://developer.bka.sh/docs/checkout-url-v1-2-0-beta
 *
 * Nagad MFS API:
 *   https://nagad.com.bd/developer/api-doc
 *
 * ENV variables needed:
 *   BKASH_APP_KEY, BKASH_APP_SECRET, BKASH_USERNAME, BKASH_PASSWORD
 *   BKASH_BASE_URL   (sandbox: https://tokenized.sandbox.bka.sh/v1.2.0-beta)
 *   NAGAD_MERCHANT_ID, NAGAD_MERCHANT_PRIVATE_KEY, NAGAD_MERCHANT_PUBLIC_KEY
 *   NAGAD_BASE_URL   (sandbox: http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0)
 *   FRONTEND_URL     (e.g. https://yoursite.com  — for callback URLs)
 */

const asyncHandler = require('express-async-handler');
const axios        = require('axios');
const crypto       = require('crypto');
const Order        = require('../models/Order');

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Generate a unique merchant invoice number */
const merchantInvoice = (orderId) =>
  `KRC-${orderId.toString().slice(-8).toUpperCase()}-${Date.now().toString().slice(-5)}`;

// ─────────────────────────────────────────────────────────────
// ██████  ██   ██  █████  ███████ ██   ██
// ██   ██ ██  ██  ██   ██ ██      ██   ██
// ██████  █████   ███████ ███████ ███████
// ██   ██ ██  ██  ██   ██      ██ ██   ██
// ██████  ██   ██ ██   ██ ███████ ██   ██
// ─────────────────────────────────────────────────────────────

let bkashToken     = null;
let bkashTokenExp  = 0;

/** Get (or refresh) bKash token */
async function getBkashToken() {
  if (bkashToken && Date.now() < bkashTokenExp) return bkashToken;

  const { data } = await axios.post(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/token/grant`,
    {
      app_key:    process.env.BKASH_APP_KEY,
      app_secret: process.env.BKASH_APP_SECRET,
    },
    {
      headers: {
        username:     process.env.BKASH_USERNAME,
        password:     process.env.BKASH_PASSWORD,
        'Content-Type': 'application/json',
      },
    }
  );

  if (data.statusCode !== '0000') throw new Error(`bKash token error: ${data.statusMessage}`);

  bkashToken    = data.id_token;
  // expires_in is in seconds; refresh 1 min early
  bkashTokenExp = Date.now() + (data.expires_in - 60) * 1000;
  return bkashToken;
}

/**
 * POST /api/payment/bkash/create
 * Body: { orderId }
 * Creates a bKash payment and returns the bkashURL to redirect the user to.
 */
const bkashCreate = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order)                                          { res.status(404); throw new Error('Order not found'); }
  if (order.customer.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not your order'); }
  if (order.isPaid)                                    { res.status(400); throw new Error('Order already paid'); }

  const token   = await getBkashToken();
  const invoice = merchantInvoice(orderId);
  const callbackURL = `${process.env.FRONTEND_URL}/payment/bkash/callback?orderId=${orderId}`;

  const { data } = await axios.post(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/create`,
    {
      mode:                  '0011',           // checkout URL mode
      payerReference:        req.user._id.toString(),
      callbackURL,
      amount:                order.totalAmount.toFixed(2),
      currency:              'BDT',
      intent:                'sale',
      merchantInvoiceNumber: invoice,
    },
    {
      headers: {
        Authorization:  token,
        'X-APP-Key':    process.env.BKASH_APP_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  if (data.statusCode !== '0000') {
    throw new Error(`bKash create failed: ${data.statusMessage}`);
  }

  // Persist transaction initiation
  order.paymentTransaction = {
    gateway:   'bkash',
    paymentID: data.paymentID,
    amount:    order.totalAmount,
    status:    'initiated',
    rawResponse: data,
    initiatedAt: new Date(),
  };
  await order.save();

  res.json({ success: true, bkashURL: data.bkashURL, paymentID: data.paymentID });
});

/**
 * POST /api/payment/bkash/callback
 * Called by bKash after user completes payment (also used as our redirect handler).
 * Query params: paymentID, status, orderId
 */
const bkashCallback = asyncHandler(async (req, res) => {
  const { paymentID, status, orderId } = req.query;

  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (status === 'cancel' || status === 'failure') {
    order.paymentTransaction.status    = status === 'cancel' ? 'cancelled' : 'failed';
    order.paymentTransaction.rawResponse = { ...order.paymentTransaction.rawResponse, callbackStatus: status };
    await order.save();
    return res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=${status}&orderId=${orderId}`);
  }

  // status === 'success' — execute the payment
  const token = await getBkashToken();

  const { data } = await axios.post(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`,
    { paymentID },
    {
      headers: {
        Authorization:  token,
        'X-APP-Key':    process.env.BKASH_APP_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  if (data.statusCode === '0000' && data.transactionStatus === 'Completed') {
    order.isPaid    = true;
    order.paidAt    = new Date();
    order.paymentTransaction.status      = 'completed';
    order.paymentTransaction.trxID       = data.trxID;
    order.paymentTransaction.completedAt = new Date();
    order.paymentTransaction.rawResponse = data;
    order.statusHistory.push({ status: order.status, note: `bKash payment completed. TrxID: ${data.trxID}` });
    await order.save();
    return res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=success&orderId=${orderId}&trxID=${data.trxID}`);
  }

  // Payment execute failed
  order.paymentTransaction.status       = 'failed';
  order.paymentTransaction.failureReason = data.statusMessage;
  order.paymentTransaction.rawResponse  = data;
  await order.save();
  res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=failure&orderId=${orderId}`);
});

/**
 * POST /api/payment/bkash/verify/:orderId
 * Lets the frontend double-check payment status.
 */
const bkashVerify = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.customer.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not your order'); }

  const token = await getBkashToken();

  const { data } = await axios.post(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/payment/status`,
    { paymentID: order.paymentTransaction?.paymentID },
    {
      headers: {
        Authorization:  token,
        'X-APP-Key':    process.env.BKASH_APP_KEY,
        'Content-Type': 'application/json',
      },
    }
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
 * Sign a Nagad request body with the merchant private key (RSA).
 * Nagad requires the sensitive payload to be encrypted with their public key
 * and signed with our private key.
 */
function nagadSign(data) {
  const privateKey = Buffer.from(process.env.NAGAD_MERCHANT_PRIVATE_KEY, 'base64').toString('utf8');
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64');
}

function nagadEncrypt(data) {
  const publicKey = `-----BEGIN PUBLIC KEY-----\n${process.env.NAGAD_MERCHANT_PUBLIC_KEY}\n-----END PUBLIC KEY-----`;
  return crypto.publicEncrypt(
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    Buffer.from(data)
  ).toString('base64');
}

/**
 * POST /api/payment/nagad/create
 * Body: { orderId }
 * Step 1: Initialize Nagad payment session → Step 2: Place order → return payment URL
 */
const nagadCreate = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  const order = await Order.findById(orderId);
  if (!order)                                                  { res.status(404); throw new Error('Order not found'); }
  if (order.customer.toString() !== req.user._id.toString())  { res.status(403); throw new Error('Not your order'); }
  if (order.isPaid)                                            { res.status(400); throw new Error('Order already paid'); }

  const merchantId  = process.env.NAGAD_MERCHANT_ID;
  const baseURL     = process.env.NAGAD_BASE_URL;
  const datetime    = new Date().toISOString().replace(/[-T:.Z]/g, '').slice(0, 14); // YYYYMMDDHHmmss
  const ordRef      = merchantInvoice(orderId);
  const callbackURL = `${process.env.FRONTEND_URL}/payment/nagad/callback?orderId=${orderId}`;

  // ── Step 1: Initialize ──
  const initSensitiveData = JSON.stringify({
    merchantId,
    datetime,
    orderId:          ordRef,
    challenge:        crypto.randomBytes(16).toString('hex'),
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
  if (!initData?.sensitiveData) throw new Error('Nagad initialization failed');

  const paymentRefId = initData.paymentReferenceId;

  // ── Step 2: Complete / place order ──
  const orderSensitiveData = JSON.stringify({
    merchantId,
    orderId:          ordRef,
    amount:           order.totalAmount.toFixed(2),
    currencyCode:     '050',   // BDT
    challenge:        initData.challenge,
  });

  const orderBody = {
    sensitiveData:    nagadEncrypt(orderSensitiveData),
    signature:        nagadSign(orderSensitiveData),
    merchantCallbackURL: callbackURL,
    additionalMerchantInfo: {
      productName: 'KrishiConnect Order',
      productCount: order.items.length,
    },
  };

  const placeRes = await axios.post(
    `${baseURL}/api/dfs/check-out/complete/${paymentRefId}`,
    orderBody,
    { headers: { 'X-KM-Api-Version': 'v-0.2.0', 'Content-Type': 'application/json' } }
  );

  const placeData = placeRes.data;
  if (placeData.status !== 'Success') throw new Error(`Nagad order placement failed: ${placeData.reason}`);

  // Save initiation
  order.paymentTransaction = {
    gateway:              'nagad',
    paymentReferenceId:   paymentRefId,
    merchantCallbackURL:  callbackURL,
    amount:               order.totalAmount,
    status:               'initiated',
    rawResponse:          placeData,
    initiatedAt:          new Date(),
  };
  await order.save();

  res.json({ success: true, callURL: placeData.callBackUrl, paymentReferenceId: paymentRefId });
});

/**
 * POST /api/payment/nagad/callback
 * Nagad redirects here with payment_ref_id and status.
 */
const nagadCallback = asyncHandler(async (req, res) => {
  const { payment_ref_id, status, orderId } = req.query;

  const order = await Order.findById(orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  if (status !== 'Success') {
    order.paymentTransaction.status       = 'failed';
    order.paymentTransaction.failureReason = `Nagad status: ${status}`;
    await order.save();
    return res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=failure&orderId=${orderId}`);
  }

  // Verify with Nagad
  const baseURL = process.env.NAGAD_BASE_URL;
  const { data: verify } = await axios.get(
    `${baseURL}/api/dfs/verify/payment/${payment_ref_id}`,
    { headers: { 'X-KM-Api-Version': 'v-0.2.0' } }
  );

  if (verify.status === 'Success') {
    order.isPaid    = true;
    order.paidAt    = new Date();
    order.paymentTransaction.status      = 'completed';
    order.paymentTransaction.completedAt = new Date();
    order.paymentTransaction.rawResponse = verify;
    order.statusHistory.push({ status: order.status, note: `Nagad payment verified. Ref: ${payment_ref_id}` });
    await order.save();
    return res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=success&orderId=${orderId}`);
  }

  order.paymentTransaction.status       = 'failed';
  order.paymentTransaction.failureReason = verify.reason || 'Verification failed';
  await order.save();
  res.redirect(`${process.env.FRONTEND_URL}/payment/result?status=failure&orderId=${orderId}`);
});

/**
 * GET /api/payment/nagad/verify/:orderId
 */
const nagadVerify = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.customer.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not your order'); }

  const payRef  = order.paymentTransaction?.paymentReferenceId;
  const baseURL = process.env.NAGAD_BASE_URL;

  const { data } = await axios.get(
    `${baseURL}/api/dfs/verify/payment/${payRef}`,
    { headers: { 'X-KM-Api-Version': 'v-0.2.0' } }
  );

  res.json({ success: true, isPaid: order.isPaid, gatewayStatus: data.status, reference: payRef });
});

// ─────────────────────────────────────────────────────────────
// REFUND  (bKash only — Nagad refund API is same pattern)
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/payment/refund/:orderId
 * Admin/farmer can issue a refund for a completed bKash payment.
 */
const refundPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order)        { res.status(404); throw new Error('Order not found'); }
  if (!order.isPaid) { res.status(400); throw new Error('Order not paid'); }

  const txn = order.paymentTransaction;
  if (!txn || txn.gateway !== 'bkash') {
    res.status(400); throw new Error('Refund only supported for bKash currently');
  }

  const token = await getBkashToken();
  const { data } = await axios.post(
    `${process.env.BKASH_BASE_URL}/tokenized/checkout/payment/refund`,
    {
      paymentID:             txn.paymentID,
      amount:                txn.amount.toFixed(2),
      trxID:                 txn.trxID,
      sku:                   'krishi-refund',
      reason:                req.body.reason || 'Customer request',
    },
    {
      headers: {
        Authorization:  token,
        'X-APP-Key':    process.env.BKASH_APP_KEY,
        'Content-Type': 'application/json',
      },
    }
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

module.exports = {
  bkashCreate,
  bkashCallback,
  bkashVerify,
  nagadCreate,
  nagadCallback,
  nagadVerify,
  refundPayment,
};