const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, farmName, district, lat, lng } = req.body;
  const exists = await User.findOne({ email });
  if (exists) { res.status(400); throw new Error('Email already registered'); }
  const user = await User.create({
    name, email, password, role: role || 'customer', phone, farmName,
    location: { district, lat, lng },
  });
  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, isVerified: user.isVerified, location: user.location },
  });
});

// POST /api/auth/login
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
    user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, isVerified: user.isVerified, location: user.location },
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
});

// PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  const { name, phone, farmName, farmSize, district, address, lat, lng } = req.body;
  user.name     = name     || user.name;
  user.phone    = phone    || user.phone;
  user.farmName = farmName || user.farmName;
  user.farmSize = farmSize || user.farmSize;
  user.location = {
    district: district || user.location?.district,
    address:  address  || user.location?.address,
    lat:      lat      || user.location?.lat,
    lng:      lng      || user.location?.lng,
  };
  if (req.file) user.avatar = req.file.path;
  const updated = await user.save();
  res.json({ success: true, user: updated });
});

// GET /api/auth/farmers  — list all farmers (public)
const getFarmers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const query = { role: 'farmer' };
  if (search) {
    query.$or = [
      { name:     { $regex: search, $options: 'i' } },
      { farmName: { $regex: search, $options: 'i' } },
      { 'location.district': { $regex: search, $options: 'i' } },
    ];
  }
  const farmers = await User.find(query).select('-password').sort({ isVerified: -1, name: 1 });
  res.json({ success: true, farmers });
});

// GET /api/auth/farmers/:id  — single farmer profile (public)
const getFarmerById = asyncHandler(async (req, res) => {
  const farmer = await User.findOne({ _id: req.params.id, role: 'farmer' }).select('-password');
  if (!farmer) { res.status(404); throw new Error('Farmer not found'); }
  res.json({ success: true, farmer });
});

module.exports = { register, login, getMe, updateProfile, getFarmers, getFarmerById };