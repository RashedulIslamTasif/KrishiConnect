const express = require('express');
const router  = express.Router();
const protect = require('../middleware/protect');
const {
  bkashCreate,
  bkashCallback,
  bkashVerify,
  nagadCreate,
  nagadCallback,
  nagadVerify,
  refundPayment,
} = require('../controllers/paymentController');

// ── bKash ──────────────────────────────────────────────────
// Create a bKash payment session (returns bkashURL)
router.post('/bkash/create',       protect, bkashCreate);
// bKash redirects the user here after payment
router.get('/bkash/callback',      bkashCallback);          // no auth — gateway callback
// Frontend calls this to double-check payment status
router.get('/bkash/verify/:orderId', protect, bkashVerify);

// ── Nagad ──────────────────────────────────────────────────
// Create a Nagad payment session (returns callURL)
router.post('/nagad/create',       protect, nagadCreate);
// Nagad redirects the user here after payment
router.get('/nagad/callback',      nagadCallback);           // no auth — gateway callback
// Frontend calls this to double-check payment status
router.get('/nagad/verify/:orderId', protect, nagadVerify);

// ── Refund ─────────────────────────────────────────────────
router.post('/refund/:orderId',    protect, refundPayment);

module.exports = router;