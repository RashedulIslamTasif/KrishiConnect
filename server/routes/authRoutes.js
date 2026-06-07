const express = require('express');
const router  = express.Router();
const {
  register, login, getMe, updateProfile, submitNidVerification,
  changePassword, getFarmers, getFarmerById,
  getPendingVerifications, verifyFarmer,
} = require('../controllers/authController');
const protect       = require('../middleware/protect');
const authorizeRole = require('../middleware/authorizeRole');
const { uploadAvatar, uploadNid } = require('../utils/cloudinary');

router.post('/register',  register);
router.post('/login',     login);
router.get ('/me',        protect, getMe);
router.put ('/profile',   protect, uploadAvatar.single('avatar'), updateProfile);
router.put ('/change-password', protect, changePassword);

// Farmer: submit NID + selfie for verification
router.post('/verify-nid', protect, authorizeRole('farmer'),
  uploadNid.fields([{ name: 'nidImage', maxCount: 1 }, { name: 'selfieImage', maxCount: 1 }]),
  submitNidVerification
);

// Public
router.get('/farmers',     getFarmers);
router.get('/farmers/:id', getFarmerById);

// Admin only
router.get  ('/admin/verifications',      protect, authorizeRole('admin'), getPendingVerifications);
router.patch('/admin/farmers/:id/verify', protect, authorizeRole('admin'), verifyFarmer);

module.exports = router;