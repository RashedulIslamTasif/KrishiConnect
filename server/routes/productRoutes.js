const express       = require('express');
const router        = express.Router();
const protect       = require('../middleware/protect');
const authorizeRole = require('../middleware/authorizeRole');
const { upload }    = require('../utils/cloudinary');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
} = require('../controllers/productController');

// Public
router.get('/',    getProducts);
router.get('/:id', getProductById);

// Farmer only
router.get('/farmer/mine', protect, authorizeRole('farmer'), getMyProducts);
router.post('/',    protect, authorizeRole('farmer'), upload.array('images', 5), createProduct);
router.put('/:id',  protect, authorizeRole('farmer'), upload.array('images', 5), updateProduct);
router.delete('/:id', protect, authorizeRole('farmer'), deleteProduct);

module.exports = router;
