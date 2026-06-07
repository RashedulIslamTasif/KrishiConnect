const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: { type: String, enum: ['farmer', 'customer', 'admin'], default: 'customer' },
    phone: { type: String, trim: true },
    avatar: { type: String, default: '' },

    location: {
      district: { type: String, default: '' },
      address:  { type: String, default: '' },
      lat:      { type: Number, default: 23.8103 },
      lng:      { type: Number, default: 90.4125 },
    },

    farmName: { type: String, default: '' },
    farmSize: { type: String, default: '' },

    // ── Verification ─────────────────────────────────────────
    isVerified:       { type: Boolean, default: false },
    verificationStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    nidImage:   { type: String, default: '' }, // Cloudinary URL — NID card front photo
    selfieImage:{ type: String, default: '' }, // Cloudinary URL — selfie holding NID
    rejectionReason: { type: String, default: '' }, // Admin's reason if rejected

    // Rating
    avgRating:    { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);