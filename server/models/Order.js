const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:     { type: String, required: true },
  image:    { type: String },
  price:    { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit:     { type: String },
});

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [orderItemSchema],

    totalAmount: {
      type: Number,
      required: true,
    },

    // Order status flow:
    // pending → confirmed → harvested → out_for_delivery → delivered → cancelled
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'harvested', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },

    isPreOrder: { type: Boolean, default: false },

    // Delivery info
    deliveryAddress: { type: String },
    deliveryDate:    { type: Date },

    // Payment (simplified — no real payment gateway for college project)
    paymentMethod: {
      type: String,
      enum: ['cash_on_delivery', 'bkash', 'nagad'],
      default: 'cash_on_delivery',
    },
    isPaid: { type: Boolean, default: false },

    // QR code data (base64 string generated on frontend)
    qrData: { type: String },

    // Status history for timeline view
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
