const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema(
  {
    // Product name used as key (e.g. "tomato", "potato")
    productName: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    farmerPrice: {
      type: Number,
      required: true,
    },
    marketPrice: {
      type: Number,
      required: true,
    },
    // Optional: link to specific farmer for granular tracking
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

priceHistorySchema.index({ productName: 1, recordedAt: -1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);
