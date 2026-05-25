const express       = require('express');
const router        = express.Router();
const protect       = require('../middleware/protect');
const authorizeRole = require('../middleware/authorizeRole');
const {
  createOrder,
  getMyOrders,
  getFarmerOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');

router.post('/',             protect, authorizeRole('customer'), createOrder);
router.get('/my',            protect, authorizeRole('customer'), getMyOrders);
router.get('/farmer',        protect, authorizeRole('farmer'),   getFarmerOrders);
router.get('/:id',           protect, getOrderById);
router.put('/:id/status',    protect, authorizeRole('farmer'),   updateOrderStatus);

module.exports = router;
