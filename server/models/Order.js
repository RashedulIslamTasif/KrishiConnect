const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String, required: true },
  image:    { type: String },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit:     { type: String },
});

// ── Payment transaction sub-document ──────────────────────────
const paymentTransactionSchema = new mongoose.Schema({
  gateway:       { type: String, enum: ['bkash', 'nagad', 'cash_on_delivery'] },
  // bKash fields
  paymentID:     { type: String },   // bKash paymentID from /create
  trxID:         { type: String },   // final transaction ID from /execute
  // Nagad fields  
  paymentReferenceId: { type: String },  // Nagad reference
  merchantCallbackURL: { type: String },
  // Common
  amount:        { type: Number },
  currency:      { type: String, default: 'BDT' },
  status:        { type: String, enum: ['initiated', 'pending', 'completed', 'failed', 'cancelled', 'refunded'], default: 'initiated' },
  rawResponse:   { type: mongoose.Schema.Types.Mixed },  // store full gateway response
  initiatedAt:   { type: Date, default: Date.now },
  completedAt:   { type: Date },
  failureReason: { type: String },
}, { _id: false });

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    farmer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items:    [orderItemSchema],

    totalAmount:  { type: Number, required: true },

    // status flow: pending → confirmed → harvested → out_for_delivery → delivered → cancelled
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'harvested', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },

    isPreOrder: { type: Boolean, default: false },

    // Delivery
    deliveryAddress: { type: String },
    deliveryDate:    { type: Date },

    // ── Payment ───────────────────────────────────────────────
    paymentMethod: {
      type: String,
      enum: ['cash_on_delivery', 'bkash', 'nagad'],
      default: 'cash_on_delivery',
    },
    isPaid:      { type: Boolean, default: false },
    paidAt:      { type: Date },
    paymentTransaction: paymentTransactionSchema,

    // Status history timeline
    statusHistory: [
      {
        status:    String,
        updatedAt: { type: Date, default: Date.now },
        note:      String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);