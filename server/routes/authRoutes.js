const express = require('express');
const router  = express.Router();
const {
  register,
  login,
  getMe,
  updateProfile,
  getFarmers,
  getFarmerById,
  changePassword,
  verifyFarmer,
} = require('../controllers/authController');
const protect       = require('../middleware/protect');
const authorizeRole = require('../middleware/authorizeRole');
const { upload, uploadAvatar } = require('../utils/cloudinary');

router.post('/register',       register);
router.post('/login',          login);
router.get ('/me',             protect, getMe);

// FIX: use uploadAvatar (dedicated avatar storage) instead of the
// product-image upload middleware so avatars go to krishiconnect/avatars
// and are processed with face-crop transformation.
router.put ('/profile',        protect, uploadAvatar.single('avatar'), updateProfile);

router.put ('/change-password', protect, changePassword);

// Public farmer routes
router.get ('/farmers',        getFarmers);
router.get ('/farmers/:id',    getFarmerById);

// Admin-only: verify or unverify a farmer
// PATCH /api/auth/farmers/:id/verify   body: { "isVerified": true }
router.patch('/farmers/:id/verify', protect, authorizeRole('admin'), verifyFarmer);

module.exports = router;