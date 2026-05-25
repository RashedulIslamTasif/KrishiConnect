// reviewRoutes.js
const express = require('express');
const router  = express.Router();
const protect = require('../middleware/protect');
const authorizeRole = require('../middleware/authorizeRole');
const { createReview, getFarmerReviews } = require('../controllers/reviewController');

router.post('/',                         protect, authorizeRole('customer'), createReview);
router.get('/farmer/:farmerId',          getFarmerReviews);

module.exports = router;
