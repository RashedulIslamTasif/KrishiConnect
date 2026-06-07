const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

const safeUser = (u) => ({
  _id: u._id, name: u.name, email: u.email, role: u.role,
  avatar: u.avatar, phone: u.phone, farmName: u.farmName, farmSize: u.farmSize,
  isVerified: u.isVerified, verificationStatus: u.verificationStatus,
  nidImage: u.nidImage, selfieImage: u.selfieImage, rejectionReason: u.rejectionReason,
  location: u.location, createdAt: u.createdAt, updatedAt: u.updatedAt,
});

// ── Register ──────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, farmName, district, lat, lng } = req.body;
  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('Email already registered'); }
  const user = await User.create({ name, email, password, role: role || 'customer', phone, farmName, location: { district, lat, lng } });
  res.status(201).json({ success: true, token: generateToken(user._id), user: safeUser(user) });
});

// ── Login ─────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error('Please provide email and password'); }
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) { res.status(401); throw new Error('Invalid email or password'); }
  res.json({ success: true, token: generateToken(user._id), user: safeUser(user) });
});

// ── Get current user ──────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user: safeUser(user) });
});

// ── Update profile ────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  const { name, phone, farmName, farmSize, district, address, lat, lng } = req.body;
  if (name     !== undefined) user.name     = name;
  if (phone    !== undefined) user.phone    = phone;
  if (farmName !== undefined) user.farmName = farmName;
  if (farmSize !== undefined) user.farmSize = farmSize;
  if (district !== undefined) user.location.district = district;
  if (address  !== undefined) user.location.address  = address;
  if (lat      !== undefined) user.location.lat       = Number(lat);
  if (lng      !== undefined) user.location.lng       = Number(lng);
  if (req.file) user.avatar = req.file.path;
  const updated = await user.save();
  res.json({ success: true, user: safeUser(updated) });
});

// ── Submit NID verification ───────────────────────────────────
// POST /api/auth/verify-nid   (farmer only, multipart: nidImage + selfieImage)
const submitNidVerification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role !== 'farmer') { res.status(403); throw new Error('Only farmers can submit NID verification'); }
  if (user.verificationStatus === 'approved') { res.status(400); throw new Error('Already verified'); }

  if (!req.files?.nidImage?.[0] || !req.files?.selfieImage?.[0]) {
    res.status(400); throw new Error('Both NID photo and selfie are required');
  }

  user.nidImage    = req.files.nidImage[0].path;
  user.selfieImage = req.files.selfieImage[0].path;
  user.verificationStatus = 'pending';
  user.rejectionReason    = '';
  await user.save();

  res.json({ success: true, message: 'Verification documents submitted. Admin will review within 24–48 hours.', user: safeUser(user) });
});

// ── Change password ───────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) { res.status(400); throw new Error('Provide current and new password'); }
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) { res.status(401); throw new Error('Current password is incorrect'); }
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
      { name: { $regex: search, $options: 'i' } },
      { farmName: { $regex: search, $options: 'i' } },
      { 'location.district': { $regex: search, $options: 'i' } },
    ];
  }
  const farmers = await User.find(query).select('-password').sort({ isVerified: -1, name: 1 });
  res.json({ success: true, farmers });
});

// ── Get single farmer (public) ────────────────────────────────
const getFarmerById = asyncHandler(async (req, res) => {
  const farmer = await User.findOne({ _id: req.params.id, role: 'farmer' }).select('-password');
  if (!farmer) { res.status(404); throw new Error('Farmer not found'); }
  res.json({ success: true, farmer });
});

// ── Admin: get all pending verifications ──────────────────────
const getPendingVerifications = asyncHandler(async (req, res) => {
  const farmers = await User.find({ role: 'farmer', verificationStatus: { $in: ['pending', 'approved', 'rejected'] } })
    .select('-password')
    .sort({ verificationStatus: 1, updatedAt: -1 });
  res.json({ success: true, farmers });
});

// ── Admin: approve or reject farmer ──────────────────────────
const verifyFarmer = asyncHandler(async (req, res) => {
  const farmer = await User.findOne({ _id: req.params.id, role: 'farmer' });
  if (!farmer) { res.status(404); throw new Error('Farmer not found'); }
  const { action, reason } = req.body; // action: 'approve' | 'reject'
  if (action === 'approve') {
    farmer.isVerified = true;
    farmer.verificationStatus = 'approved';
    farmer.rejectionReason = '';
  } else if (action === 'reject') {
    farmer.isVerified = false;
    farmer.verificationStatus = 'rejected';
    farmer.rejectionReason = reason || 'Documents could not be verified.';
  } else {
    res.status(400); throw new Error('action must be approve or reject');
  }
  await farmer.save();
  res.json({ success: true, farmer: safeUser(farmer) });
});

module.exports = {
  register, login, getMe, updateProfile, submitNidVerification,
  changePassword, getFarmers, getFarmerById,
  getPendingVerifications, verifyFarmer,
};