const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
  },
  { timestamps: true }
);

// One review per order per customer
reviewSchema.index({ reviewer: 1, order: 1 }, { unique: true });

// After saving a review, update the farmer's avgRating
reviewSchema.post('save', async function () {
  const Review = this.constructor;
  const User = mongoose.model('User');

  const stats = await Review.aggregate([
    { $match: { farmer: this.farmer } },
    { $group: { _id: '$farmer', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await User.findByIdAndUpdate(this.farmer, {
      avgRating:    Math.round(stats[0].avgRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
