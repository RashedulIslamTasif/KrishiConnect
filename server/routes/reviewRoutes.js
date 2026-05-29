const express = require('express');
const router  = express.Router();
const protect = require('../middleware/protect');
const authorizeRole = require('../middleware/authorizeRole');
const { createReview, getMyReviews, getProductReviews, getFarmerReviews } = require('../controllers/reviewController');

router.post('/',                  protect, authorizeRole('customer'), createReview);
router.get('/my',                 protect, authorizeRole('customer'), getMyReviews);
router.get('/product/:productId', getProductReviews);
router.get('/farmer/:farmerId',   getFarmerReviews);

module.exports = router;
