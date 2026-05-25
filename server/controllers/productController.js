const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// ── GET /api/products ────────────────────────────────────────
// Public. Supports: ?category=vegetables&location=dhaka&search=tomato&page=1
const getProducts = asyncHandler(async (req, res) => {
  const { category, search, farmer, page = 1, limit = 12 } = req.query;

  const query = { isAvailable: true, stock: { $gt: 0 } };

  if (category)  query.category = category;
  if (farmer)    query.farmer   = farmer;
  if (search)    query.name     = { $regex: search, $options: 'i' };

  const total    = await Product.countDocuments(query);
  const products = await Product.find(query)
    .populate('farmer', 'name location isVerified avgRating farmName avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    total,
    page:       Number(page),
    totalPages: Math.ceil(total / limit),
    products,
  });
});

// ── GET /api/products/:id ────────────────────────────────────
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('farmer', 'name location isVerified avgRating farmName avatar phone');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.json({ success: true, product });
});

// ── POST /api/products ───────────────────────────────────────
// Farmer only
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, category, price, unit, stock, harvestDate, marketPrice } = req.body;

  // Collect uploaded image URLs from Cloudinary
  const images = req.files ? req.files.map((f) => f.path) : [];

  const product = await Product.create({
    name,
    description,
    category,
    price,
    unit,
    stock,
    harvestDate,
    marketPrice,
    images,
    farmer: req.user._id,
  });

  res.status(201).json({ success: true, product });
});

// ── PUT /api/products/:id ────────────────────────────────────
// Farmer only — their own product
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) { res.status(404); throw new Error('Product not found'); }
  if (product.farmer.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized to update this product');
  }

  const updates = req.body;
  if (req.files && req.files.length > 0) {
    updates.images = req.files.map((f) => f.path);
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.json({ success: true, product: updated });
});

// ── DELETE /api/products/:id ─────────────────────────────────
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) { res.status(404); throw new Error('Product not found'); }
  if (product.farmer.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized to delete this product');
  }

  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

// ── GET /api/products/farmer/mine ────────────────────────────
// Farmer sees their own products (including out of stock)
const getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ farmer: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, products });
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getMyProducts };
