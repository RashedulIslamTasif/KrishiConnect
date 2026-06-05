const asyncHandler = require('express-async-handler');
const Order   = require('../models/Order');
const Product = require('../models/Product');

// ── POST /api/orders ──────────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
  const { items, farmerId, deliveryAddress, paymentMethod, isPreOrder } = req.body;

  if (!items || items.length === 0) {
    res.status(400); throw new Error('No items in order');
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) { res.status(404); throw new Error(`Product ${item.product} not found`); }

    orderItems.push({
      product:  product._id,
      name:     product.name,
      image:    product.images[0] || '',
      price:    product.price,
      quantity: item.quantity,
      unit:     product.unit,
    });

    totalAmount += product.price * item.quantity;

    if (!isPreOrder) {
      product.stock -= item.quantity;
      await product.save();
    }
  }

  const order = await Order.create({
    customer:       req.user._id,
    farmer:         farmerId,
    items:          orderItems,
    totalAmount,
    deliveryAddress: deliveryAddress || '',
    paymentMethod:  paymentMethod || 'cash_on_delivery',
    isPreOrder:     isPreOrder || false,
    statusHistory:  [{ status: 'pending', note: 'Order placed' }],
  });

  const populated = await order.populate([
    { path: 'customer', select: 'name email phone' },
    { path: 'farmer',   select: 'name phone farmName' },
  ]);

  res.status(201).json({ success: true, order: populated });
});

// ── PUT /api/orders/:id/payment-method ────────────────────────
// Called by Cart / PaymentModal to set address + payment method
// before or after gateway redirect
const updatePaymentMethod = asyncHandler(async (req, res) => {
  const { deliveryAddress, paymentMethod } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.customer.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Not your order');
  }

  if (deliveryAddress) order.deliveryAddress = deliveryAddress;
  if (paymentMethod)   order.paymentMethod   = paymentMethod;
  await order.save();

  res.json({ success: true, order });
});

// ── GET /api/orders/my ────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate('farmer', 'name farmName avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// ── GET /api/orders/mine  (alias for my) ─────────────────────
const getMyOrdersAlias = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate('farmer', 'name farmName avatar')
    .sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// ── GET /api/orders/farmer ────────────────────────────────────
const getFarmerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ farmer: req.user._id })
    .populate('customer', 'name email phone')
    .sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// ── GET /api/orders/:id ───────────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('farmer',   'name phone farmName location');

  if (!order) { res.status(404); throw new Error('Order not found'); }

  const isOwner =
    order.customer._id.toString() === req.user._id.toString() ||
    order.farmer._id.toString()   === req.user._id.toString();

  if (!isOwner) { res.status(403); throw new Error('Not authorized'); }

  res.json({ success: true, order });
});

// ── PUT /api/orders/:id/status ────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.farmer.toString() !== req.user._id.toString()) {
    res.status(403); throw new Error('Only the farmer can update order status');
  }

  order.status = status;
  order.statusHistory.push({ status, note: note || '', updatedAt: new Date() });
  if (status === 'delivered') { order.isPaid = true; order.paidAt = new Date(); }

  await order.save();
  res.json({ success: true, order });
});

module.exports = {
  createOrder,
  updatePaymentMethod,
  getMyOrders,
  getMyOrdersAlias,
  getFarmerOrders,
  getOrderById,
  updateOrderStatus,
};