const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// ── Register ──────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, farmName, district, lat, lng } = req.body;
  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('Email already registered'); }
  const user = await User.create({
    name, email, password,
    role: role || 'customer',
    phone, farmName,
    location: { district, lat, lng },
  });
  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, isVerified: user.isVerified, location: user.location },
  });
});

// ── Login ─────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error('Please provide email and password'); }
  const user = await User.findOne({ email }).select('+password');
  if (!user) { res.status(401); throw new Error('Invalid email or password'); }
  const isMatch = await user.matchPassword(password);
  if (!isMatch) { res.status(401); throw new Error('Invalid email or password'); }
  res.json({
    success: true,
    token: generateToken(user._id),
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, isVerified: user.isVerified, location: user.location, createdAt: user.createdAt },
  });
});

// ── Get current user ──────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

// ── Update profile ────────────────────────────────────────────
// FIX: Only update location sub-fields that were actually sent in the request.
// Previously the whole location object was reassigned using || fallback, which
// caused lat/lng to be set to undefined (and dropped by Mongo) on avatar-only
// uploads where no location fields were included in the FormData body.
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }

  const { name, phone, farmName, farmSize, district, address, lat, lng } = req.body;

  if (name     !== undefined) user.name     = name;
  if (phone    !== undefined) user.phone    = phone;
  if (farmName !== undefined) user.farmName = farmName;
  if (farmSize !== undefined) user.farmSize = farmSize;

  // Only patch the location fields that were actually provided
  if (district !== undefined) user.location.district = district;
  if (address  !== undefined) user.location.address  = address;
  if (lat      !== undefined) user.location.lat       = Number(lat);
  if (lng      !== undefined) user.location.lng       = Number(lng);

  // req.file is set by uploadAvatar middleware (multer-storage-cloudinary).
  // req.file.path is the persistent Cloudinary URL.
  if (req.file) user.avatar = req.file.path;

  const updated = await user.save();
  res.json({ success: true, user: updated });
});

// ── Change password ───────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) { res.status(400); throw new Error('Please provide current and new password'); }
  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) { res.status(401); throw new Error('Current password is incorrect'); }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password changed successfully' });
});

// ── Get all farmers (public) ──────────────────────────────────
const getFarmers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const query = { role: 'farmer' };
  if (search) {
    query.$or = [
      { name:              { $regex: search, $options: 'i' } },
      { farmName:          { $regex: search, $options: 'i' } },
      { 'location.district': { $regex: search, $options: 'i' } },
    ];
  }
  const farmers = await User.find(query).select('-password').sort({ isVerified: -1, name: 1 });
  res.json({ success: true, farmers });
});

// ── Get single farmer by ID (public) ─────────────────────────
const getFarmerById = asyncHandler(async (req, res) => {
  const farmer = await User.findOne({ _id: req.params.id, role: 'farmer' }).select('-password');
  if (!farmer) { res.status(404); throw new Error('Farmer not found'); }
  res.json({ success: true, farmer });
});

// ── Verify / unverify a farmer (admin only) ───────────────────
// PATCH /api/auth/farmers/:id/verify   { "isVerified": true | false }
// Omitting isVerified in the body defaults to true (i.e. approve).
const verifyFarmer = asyncHandler(async (req, res) => {
  const farmer = await User.findOne({ _id: req.params.id, role: 'farmer' });
  if (!farmer) { res.status(404); throw new Error('Farmer not found'); }
  farmer.isVerified = req.body.isVerified ?? true;
  await farmer.save();
  res.json({ success: true, message: `Farmer ${farmer.isVerified ? 'verified' : 'unverified'} successfully`, farmer });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getFarmers,
  getFarmerById,
  verifyFarmer,
};