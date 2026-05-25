const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: { type: String, default: '' },
    category: {
      type: String,
      required: true,
      enum: ['vegetables', 'fruits', 'grains', 'dairy', 'fish', 'poultry', 'spices', 'other'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0,
    },
    unit: {
      type: String,
      enum: ['kg', 'g', 'piece', 'dozen', 'litre', 'bundle'],
      default: 'kg',
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    images: [{ type: String }], // Array of Cloudinary URLs

    // The farmer who owns this product
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Pre-order: if harvest date is in the future, it's a pre-orderable item
    harvestDate: { type: Date },
    isAvailable: { type: Boolean, default: true },

    // Market price for comparison (populated from PriceHistory)
    marketPrice: { type: Number, default: 0 },

    // Rating cache
    avgRating:    { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Virtual: is this a pre-order item?
productSchema.virtual('isPreOrder').get(function () {
  return this.harvestDate && this.harvestDate > new Date();
});

// Virtual: savings percentage vs market price
productSchema.virtual('savingsPercent').get(function () {
  if (!this.marketPrice || this.marketPrice <= this.price) return 0;
  return Math.round(((this.marketPrice - this.price) / this.marketPrice) * 100);
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
