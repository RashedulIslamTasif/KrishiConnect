const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

const getProducts = asyncHandler(async (req, res) => {
  const { category, farmer, search, limit = 20, page = 1 } = req.query;
  const query = {};
  if (category) query.category = category;
  if (farmer)   query.farmer   = farmer;
  if (search)   query.name     = { $regex: search, $options: 'i' };

  const skip = (Number(page) - 1) * Number(limit);
  const [products, total] = await Promise.all([
    Product.find(query).populate('farmer', 'name farmName location isVerified avatar').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(query),
  ]);
  res.json({ success: true, products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('farmer', 'name farmName location isVerified avatar phone');
  if (!product) { res.status(404); throw new Error('Product not found'); }
  res.json({ success: true, product });
});

const createProduct = asyncHandler(async (req, res) => {
  const { name, description, category, price, unit, stock, harvestDate, marketPrice, images: bodyImages } = req.body;

  // Accept images from Cloudinary upload OR from URL strings in body
  let images = [];
  if (req.files && req.files.length > 0) {
    images = req.files.map(f => f.path);
  } else if (bodyImages) {
    images = Array.isArray(bodyImages) ? bodyImages.filter(Boolean) : [bodyImages].filter(Boolean);
  }

  const product = await Product.create({
    name, description, category,
    price: Number(price),
    unit,
    stock: Number(stock),
    harvestDate,
    marketPrice: marketPrice ? Number(marketPrice) : undefined,
    images,
    farmer: req.user._id,
  });

  res.status(201).json({ success: true, product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  if (product.farmer.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized to update this product');
  }

  const { images: bodyImages, price, stock, marketPrice, ...rest } = req.body;

  const updates = { ...rest };
  if (price)       updates.price       = Number(price);
  if (stock)       updates.stock       = Number(stock);
  if (marketPrice) updates.marketPrice = Number(marketPrice);

  // Accept images from file upload OR URL in body
  if (req.files && req.files.length > 0) {
    updates.images = req.files.map(f => f.path);
  } else if (bodyImages) {
    updates.images = Array.isArray(bodyImages) ? bodyImages.filter(Boolean) : [bodyImages].filter(Boolean);
  }

  const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  res.json({ success: true, product: updated });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }
  if (product.farmer.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not authorized to delete this product');
  }
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});

const getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ farmer: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, products });
});

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getMyProducts };
