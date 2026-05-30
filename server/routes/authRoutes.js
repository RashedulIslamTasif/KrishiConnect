const express = require('express');
const router  = express.Router();
const { register, login, getMe, updateProfile, getFarmers, getFarmerById, changePassword } = require('../controllers/authController');
const protect = require('../middleware/protect');
const { upload } = require('../utils/cloudinary');

router.post('/register',         register);
router.post('/login',            login);
router.get('/me',                protect, getMe);
router.put('/profile',           protect, upload.single('avatar'), updateProfile);
router.put('/change-password',   protect, changePassword);
router.get('/farmers',           getFarmers);
router.get('/farmers/:id',       getFarmerById);

module.exports = router;
