const express       = require('express');
const router        = express.Router();
const protect       = require('../middleware/protect');
const authorizeRole = require('../middleware/authorizeRole');
const { getPriceHistory, recordPrice, getLatestPrices } = require('../controllers/priceController');

router.get('/all',          getLatestPrices);
router.get('/:productName', getPriceHistory);
router.post('/',            protect, authorizeRole('farmer'), recordPrice);

module.exports = router;
