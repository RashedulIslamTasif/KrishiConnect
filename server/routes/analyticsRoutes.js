const express       = require('express');
const router        = express.Router();
const protect       = require('../middleware/protect');
const authorizeRole = require('../middleware/authorizeRole');
const { getFarmerAnalytics, getRecommendations } = require('../controllers/analyticsController');

router.get('/farmer',              protect, authorizeRole('farmer'), getFarmerAnalytics);
router.get('/recommendations/:userId', protect, getRecommendations);

module.exports = router;
