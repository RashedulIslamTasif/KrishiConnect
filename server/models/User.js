const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ['farmer', 'customer', 'admin'],
      default: 'customer',
    },
    phone: { type: String, trim: true },
    avatar: { type: String, default: '' },

    // Location — used for map view
    location: {
      district: { type: String, default: '' },
      address:  { type: String, default: '' },
      lat:      { type: Number, default: 23.8103 }, // Default: Dhaka
      lng:      { type: Number, default: 90.4125 },
    },

    // Farmer-specific fields
    farmName:    { type: String, default: '' },
    farmSize:    { type: String, default: '' }, // e.g. "2 acres"
    isVerified:  { type: Boolean, default: false }, // Admin toggles this

    // Rating (calculated from reviews, stored here for quick access)
    avgRating:    { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ── Hash password before saving ──────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare entered password with hashed password ────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
