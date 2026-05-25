const express       = require('express');
const router        = express.Router();
const protect       = require('../middleware/protect');
const authorizeRole = require('../middleware/authorizeRole');
const { validateCoupon, applyCoupon, createCoupon, getMyCoupons, deleteCoupon } = require('../controllers/couponController');

router.post('/validate', protect, validateCoupon);
router.post('/apply',    protect, applyCoupon);
router.get('/mine',      protect, authorizeRole('farmer','admin'), getMyCoupons);
router.post('/',         protect, authorizeRole('farmer','admin'), createCoupon);
router.delete('/:id',    protect, authorizeRole('farmer','admin'), deleteCoupon);

module.exports = router;
