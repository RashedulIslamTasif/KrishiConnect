/**
 * seed.js — Run with: node seed.js (inside /server folder)
 */

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const User         = require('./models/User');
const Product      = require('./models/Product');
const Order        = require('./models/Order');
const Review       = require('./models/Review');
const PriceHistory = require('./models/PriceHistory');
const connectDB    = require('./config/db');

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany(),
    Product.deleteMany(),
    Order.deleteMany(),
    Review.deleteMany(),
    PriceHistory.deleteMany(),
  ]);
  console.log('Cleared existing data');

  // ── 13 Farmers ──────────────────────────────────────────────
  const farmers = await User.create([
    {
      name: 'Rahim Uddin', email: 'rahim@farmer.com', password: 'password123',
      role: 'farmer', phone: '01711-123456', farmName: "Rahim's Organic Farm",
      farmSize: '3 acres', isVerified: true,
      location: { district: 'Manikganj', address: 'Singair, Manikganj', lat: 23.8324, lng: 90.0018 },
    },
    {
      name: 'Fatema Begum', email: 'fatema@farmer.com', password: 'password123',
      role: 'farmer', phone: '01811-234567', farmName: "Fatema's Fresh Produce",
      farmSize: '1.5 acres', isVerified: true,
      location: { district: 'Gazipur', address: 'Sreepur, Gazipur', lat: 24.1900, lng: 90.4718 },
    },
    {
      name: 'Karim Ali', email: 'karim@farmer.com', password: 'password123',
      role: 'farmer', phone: '01911-345678', farmName: "Karim's Fish & Poultry",
      farmSize: '2 acres', isVerified: true,
      location: { district: 'Munshiganj', address: 'Sirajdikhan, Munshiganj', lat: 23.5453, lng: 90.4156 },
    },
    {
      name: 'Sumaiya Khatun', email: 'sumaiya@farmer.com', password: 'password123',
      role: 'farmer', phone: '01611-456789', farmName: "Sumaiya Green Fields",
      farmSize: '2.5 acres', isVerified: true,
      location: { district: 'Tangail', address: 'Mirzapur, Tangail', lat: 24.0895, lng: 90.0512 },
    },
    {
      name: 'Babul Mia', email: 'babul@farmer.com', password: 'password123',
      role: 'farmer', phone: '01511-567890', farmName: "Babul's River Farm",
      farmSize: '4 acres', isVerified: true,
      location: { district: 'Barisal', address: 'Muladi, Barisal', lat: 22.7010, lng: 90.3535 },
    },
    {
      name: 'Roksana Parvin', email: 'roksana@farmer.com', password: 'password123',
      role: 'farmer', phone: '01311-678901', farmName: "Roksana Organic Garden",
      farmSize: '1 acre', isVerified: true,
      location: { district: 'Comilla', address: 'Burichang, Comilla', lat: 23.4607, lng: 91.1809 },
    },
    {
      name: 'Jalal Ahmed', email: 'jalal@farmer.com', password: 'password123',
      role: 'farmer', phone: '01411-789012', farmName: "Jalal Agro Farm",
      farmSize: '5 acres', isVerified: true,
      location: { district: 'Rajshahi', address: 'Paba, Rajshahi', lat: 24.3745, lng: 88.6042 },
    },
    {
      name: 'Nasrin Akter', email: 'nasrin@farmer.com', password: 'password123',
      role: 'farmer', phone: '01711-890123', farmName: "Nasrin's Dairy & Poultry",
      farmSize: '2 acres', isVerified: false,
      location: { district: 'Mymensingh', address: 'Trishal, Mymensingh', lat: 24.3307, lng: 90.4507 },
    },
    {
      name: 'Hafizur Rahman', email: 'hafizur@farmer.com', password: 'password123',
      role: 'farmer', phone: '01811-901234', farmName: "Hafizur Grain Farm",
      farmSize: '6 acres', isVerified: true,
      location: { district: 'Dinajpur', address: 'Birampur, Dinajpur', lat: 25.8483, lng: 88.6884 },
    },
    {
      name: 'Moriam Begum', email: 'moriam@farmer.com', password: 'password123',
      role: 'farmer', phone: '01911-012345', farmName: "Moriam's Spice Garden",
      farmSize: '1.5 acres', isVerified: true,
      location: { district: 'Sylhet', address: 'Golapganj, Sylhet', lat: 24.5000, lng: 92.0833 },
    },
    {
      name: 'Delwar Hossain', email: 'delwar@farmer.com', password: 'password123',
      role: 'farmer', phone: '01611-123450', farmName: "Delwar Fish Paradise",
      farmSize: '3 acres', isVerified: true,
      location: { district: 'Khulna', address: 'Dumuria, Khulna', lat: 22.8167, lng: 89.5000 },
    },
    {
      name: 'Amena Khatun', email: 'amena@farmer.com', password: 'password123',
      role: 'farmer', phone: '01511-234501', farmName: "Amena's Vegetable Hub",
      farmSize: '2 acres', isVerified: true,
      location: { district: 'Bogra', address: 'Sherpur, Bogra', lat: 24.9833, lng: 89.7833 },
    },
    {
      name: 'Mizan Sarkar', email: 'mizan@farmer.com', password: 'password123',
      role: 'farmer', phone: '01311-345012', farmName: "Mizan's Eco Farm",
      farmSize: '3.5 acres', isVerified: false,
      location: { district: 'Faridpur', address: 'Alfadanga, Faridpur', lat: 23.6070, lng: 89.8420 },
    },
  ]);
  console.log(`Created ${farmers.length} farmers`);

  // ── 12 Customers ────────────────────────────────────────────
  const customers = await User.create([
    { name: 'Arif Hossain',    email: 'arif@customer.com',    password: 'password123', role: 'customer', phone: '01612-111111' },
    { name: 'Mitu Akter',      email: 'mitu@customer.com',    password: 'password123', role: 'customer', phone: '01512-222222' },
    { name: 'Shuvo Islam',     email: 'shuvo@customer.com',   password: 'password123', role: 'customer', phone: '01712-333333' },
    { name: 'Priya Das',       email: 'priya@customer.com',   password: 'password123', role: 'customer', phone: '01812-444444' },
    { name: 'Tanvir Ahmed',    email: 'tanvir@customer.com',  password: 'password123', role: 'customer', phone: '01912-555555' },
    { name: 'Nadia Rahman',    email: 'nadia@customer.com',   password: 'password123', role: 'customer', phone: '01312-666666' },
    { name: 'Rakib Hasan',     email: 'rakib@customer.com',   password: 'password123', role: 'customer', phone: '01412-777777' },
    { name: 'Sadia Islam',     email: 'sadia@customer.com',   password: 'password123', role: 'customer', phone: '01512-888888' },
    { name: 'Imran Khan',      email: 'imran@customer.com',   password: 'password123', role: 'customer', phone: '01612-999999' },
    { name: 'Tania Begum',     email: 'tania@customer.com',   password: 'password123', role: 'customer', phone: '01712-000000' },
    { name: 'Farhan Alam',     email: 'farhan@customer.com',  password: 'password123', role: 'customer', phone: '01812-101010' },
    { name: 'Shirin Akter',    email: 'shirin@customer.com',  password: 'password123', role: 'customer', phone: '01912-121212' },
  ]);
  console.log(`Created ${customers.length} customers`);

  // ── 30 Products ─────────────────────────────────────────────
  const products = await Product.create([
    // Vegetables
    {
      name: 'Fresh Tomato', category: 'vegetables', price: 45, unit: 'kg', stock: 100,
      marketPrice: 70, description: 'Organically grown, no pesticides used.',
      farmer: farmers[0]._id,
      images: ['https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZnJlc2glMjB0b21hdG98ZW58MHx8MHx8fDA%3D'],
    },
    {
      name: 'Red Potato', category: 'vegetables', price: 28, unit: 'kg', stock: 200,
      marketPrice: 40, description: 'Fresh from Manikganj fields.',
      farmer: farmers[0]._id,
      images: ['https://images.unsplash.com/photo-1741517628573-622881235f18?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cmVkJTIwcG90YXRvfGVufDB8fDB8fHww'],
    },
    {
      name: 'Spinach (Palak)', category: 'vegetables', price: 15, unit: 'bundle', stock: 50,
      marketPrice: 25, description: 'Harvested this morning, very fresh.',
      farmer: farmers[0]._id,
      images: ['https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=70'],
    },
    {
      name: 'Winter Cauliflower', category: 'vegetables', price: 35, unit: 'piece', stock: 80,
      marketPrice: 55, description: 'Large fresh cauliflower.',
      farmer: farmers[3]._id,
      images: ['https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&q=70'],
    },
    {
      name: 'Green Brinjal', category: 'vegetables', price: 30, unit: 'kg', stock: 60,
      marketPrice: 50, description: 'Tender brinjal from Comilla.',
      farmer: farmers[5]._id,
      images: ['https://images.unsplash.com/photo-1639363567591-f0e7571f6e9e?w=400&q=70https://images.unsplash.com/photo-1650261455068-5d67d00feac9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fEdyZWVuJTIwQnJpbmphbHxlbnwwfHwwfHx8MA%3D%3D'],
    },
    {
      name: 'Bitter Gourd (Korola)', category: 'vegetables', price: 40, unit: 'kg', stock: 45,
      marketPrice: 60, description: 'Fresh bitter gourd, great for health.',
      farmer: farmers[11]._id,
      images: ['https://media.istockphoto.com/id/1272383767/photo/heap-of-fresh-green-bitter-gourd-vegetables-in-a-wicker-basket-for-selling-on-the-market.webp?a=1&b=1&s=612x612&w=0&k=20&c=wPFApTJtr-zoMXNiD_H9mj4DBRP3jrom4C9tFxYd_ks='],
    },
    {
      name: 'Sweet Pumpkin', category: 'vegetables', price: 22, unit: 'kg', stock: 90,
      marketPrice: 35, description: 'Sweet and large pumpkins.',
      farmer: farmers[3]._id,
      images: ['https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400&q=70'],
    },
    {
      name: 'Green Chili', category: 'vegetables', price: 80, unit: 'kg', stock: 30,
      marketPrice: 120, description: 'Hot and fresh green chili.',
      farmer: farmers[9]._id,
      images: ['https://images.unsplash.com/photo-1524593410820-38510f580a77?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Z3JlZW4lMjBjaGlsb3xsZW58MHx8MHx8fDA%3D%3D'],
    },
    {
      name: 'Garlic', category: 'vegetables', price: 150, unit: 'kg', stock: 40,
      marketPrice: 220, description: 'Deshi garlic, strong flavor.',
      farmer: farmers[6]._id,
      images: ['https://images.unsplash.com/photo-1540148426945-6cf22a6b2383?w=400&q=70'],
    },
    {
      name: 'Onion', category: 'vegetables', price: 55, unit: 'kg', stock: 150,
      marketPrice: 80, description: 'Fresh red onion from Rajshahi.',
      farmer: farmers[6]._id,
      images: ['https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=400&q=70'],
    },
    // Fruits
    {
      name: 'Hilsa Fish', category: 'fish', price: 850, unit: 'kg', stock: 20,
      marketPrice: 1100, description: 'Fresh Padma hilsa, caught today.',
      farmer: farmers[1]._id,
      images: ['https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&q=70'],
    },
    {
      name: 'Deshi Mango (Fazli)', category: 'fruits', price: 120, unit: 'kg', stock: 60,
      marketPrice: 180, description: 'Sweet Rajshahi Fazli mango.',
      farmer: farmers[1]._id,
      images: ['https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&q=70'],
    },
    {
      name: 'Green Banana', category: 'fruits', price: 30, unit: 'dozen', stock: 40,
      marketPrice: 50, description: 'Fresh green bananas.',
      farmer: farmers[1]._id,
      images: ['https://images.unsplash.com/photo-1620036924477-c3d6e9ce36fc?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Z3JlZW4lMjBiYW5hbmF8ZW58MHx8MHx8fDA%3D'],
    },
    {
      name: 'Guava (Peyara)', category: 'fruits', price: 60, unit: 'kg', stock: 35,
      marketPrice: 90, description: 'Sweet white guava from Barisal.',
      farmer: farmers[4]._id,
      images: ['https://images.unsplash.com/photo-1536511132770-e5058c7e8c46?w=400&q=70'],
    },
    {
      name: 'Watermelon', category: 'fruits', price: 25, unit: 'kg', stock: 80,
      marketPrice: 40, description: 'Large sweet watermelons.',
      farmer: farmers[4]._id,
      images: ['https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&q=70'],
    },
    {
      name: 'Papaya (Pepe)', category: 'fruits', price: 35, unit: 'kg', stock: 55,
      marketPrice: 55, description: 'Ripe sweet papaya.',
      farmer: farmers[12]._id,
      images: ['https://images.unsplash.com/photo-1617112848923-cc2234396a8d?w=400&q=70'],
    },
    // Fish
    {
      name: 'Rohu Fish (Rui)', category: 'fish', price: 220, unit: 'kg', stock: 25,
      marketPrice: 320, description: 'Fresh river rui fish from Khulna.',
      farmer: farmers[10]._id,
      images: ['https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=70'],
    },
    {
      name: 'Catfish (Magur)', category: 'fish', price: 350, unit: 'kg', stock: 15,
      marketPrice: 500, description: 'Live catfish, very fresh.',
      farmer: farmers[10]._id,
      images: ['https://images.unsplash.com/photo-1578507065211-1c4e99a5fd24?w=400&q=70'],
    },
    {
      name: 'Dried Fish (Shutki)', category: 'fish', price: 600, unit: 'kg', stock: 10,
      marketPrice: 900, description: 'Premium quality shutki from Cox\'s Bazar.',
      farmer: farmers[4]._id,
      images: ['https://images.unsplash.com/photo-1611171711912-e3f5b1c44e79?w=400&q=70'],
    },
    // Poultry
    {
      name: 'Country Chicken', category: 'poultry', price: 380, unit: 'kg', stock: 15,
      marketPrice: 500, description: 'Free-range deshi murgi.',
      farmer: farmers[2]._id,
      images: ['https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&q=70'],
    },
    {
      name: 'Fresh Eggs (Deshi)', category: 'poultry', price: 12, unit: 'piece', stock: 300,
      marketPrice: 18, description: 'Farm-fresh deshi eggs daily.',
      farmer: farmers[2]._id,
      images: ['https://images.unsplash.com/photo-1498654077810-12c21d4d6dc3?w=400&q=70'],
    },
    {
      name: 'Duck Eggs', category: 'poultry', price: 18, unit: 'piece', stock: 120,
      marketPrice: 28, description: 'Fresh duck eggs from Barisal.',
      farmer: farmers[7]._id,
      images: ['https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=70'],
    },
    {
      name: 'Broiler Chicken', category: 'poultry', price: 180, unit: 'kg', stock: 50,
      marketPrice: 240, description: 'Farm-raised broiler chicken.',
      farmer: farmers[7]._id,
      images: ['https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=400&q=70'],
    },
    // Grains
    {
      name: 'Miniket Rice', category: 'grains', price: 65, unit: 'kg', stock: 500,
      marketPrice: 90, description: 'Premium quality miniket rice.',
      farmer: farmers[8]._id,
      images: ['https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=70'],
    },
    {
      name: 'Red Lentil (Masur Dal)', category: 'grains', price: 110, unit: 'kg', stock: 80,
      marketPrice: 155, description: 'Fresh red lentils from Dinajpur.',
      farmer: farmers[8]._id,
      images: ['https://images.unsplash.com/photo-1585670083767-4fc41f26e0c6?w=400&q=70'],
    },
    {
      name: 'Wheat Flour (Atta)', category: 'grains', price: 48, unit: 'kg', stock: 200,
      marketPrice: 65, description: 'Whole wheat flour, freshly milled.',
      farmer: farmers[8]._id,
      images: ['https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=70'],
    },
    // Spices & Dairy
    {
      name: 'Mustard Seeds', category: 'spices', price: 90, unit: 'kg', stock: 30,
      marketPrice: 130, description: 'Pure yellow mustard seeds.',
      farmer: farmers[2]._id,
      images: ['https://images.unsplash.com/photo-1615485736163-f58b6f32e3a8?w=400&q=70'],
    },
    {
      name: 'Turmeric Powder', category: 'spices', price: 200, unit: 'kg', stock: 20,
      marketPrice: 300, description: 'Pure turmeric from Sylhet.',
      farmer: farmers[9]._id,
      images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=70'],
    },
    {
      name: 'Fresh Milk', category: 'dairy', price: 70, unit: 'litre', stock: 40,
      marketPrice: 95, description: 'Pure cow milk, collected twice daily.',
      farmer: farmers[7]._id,
      images: ['https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=70'],
    },
    {
      name: 'Deshi Ghee', category: 'dairy', price: 900, unit: 'kg', stock: 8,
      marketPrice: 1300, description: 'Pure clarified butter made from cow milk.',
      farmer: farmers[7]._id,
      images: ['https://media.istockphoto.com/id/857450176/photo/ghee-or-clarified-butter-close-up-in-wooden-bowl-and-silver-spoon-selective-focus.webp?a=1&b=1&s=612x612&w=0&k=20&c=n60RJg4OCMTlp8WtjSNFecj0grJswbBYZYLRRFoQgn4='],
    },
  ]);
  console.log(`Created ${products.length} products`);

  // ── Price History ────────────────────────────────────────────
  const priceData = [];
  const priceItems = [
    { name: 'tomato',          farmer: 38,  market: 65  },
    { name: 'potato',          farmer: 24,  market: 38  },
    { name: 'hilsa fish',      farmer: 780, market: 1050 },
    { name: 'country chicken', farmer: 350, market: 480 },
    { name: 'miniket rice',    farmer: 60,  market: 88  },
  ];
  for (const item of priceItems) {
    for (let i = 7; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i * 4);
      priceData.push({
        productName: item.name,
        farmerPrice: item.farmer + Math.floor(Math.random() * 10 - 5),
        marketPrice: item.market + Math.floor(Math.random() * 15 - 7),
        recordedAt:  date,
        farmer:      farmers[0]._id,
      });
    }
  }
  await PriceHistory.create(priceData);
  console.log(`Created ${priceData.length} price history records`);

  // ── Orders ───────────────────────────────────────────────────
  const orders = await Order.create([
    {
      customer: customers[0]._id, farmer: farmers[0]._id,
      items: [{ product: products[0]._id, name: products[0].name, image: products[0].images[0], price: 45, quantity: 3, unit: 'kg' }],
      totalAmount: 135, status: 'delivered', deliveryAddress: 'House 12, Road 4, Dhanmondi, Dhaka',
      paymentMethod: 'bkash', isPaid: true,
      statusHistory: [
        { status: 'pending',   note: 'Order placed',     updatedAt: new Date(Date.now() - 86400000 * 3) },
        { status: 'confirmed', note: 'Farmer confirmed', updatedAt: new Date(Date.now() - 86400000 * 2) },
        { status: 'delivered', note: 'Delivered',        updatedAt: new Date() },
      ],
    },
    {
      customer: customers[1]._id, farmer: farmers[1]._id,
      items: [{ product: products[10]._id, name: products[10].name, image: products[10].images[0], price: 850, quantity: 2, unit: 'kg' }],
      totalAmount: 1700, status: 'confirmed', deliveryAddress: 'Apartment 5B, Mirpur 10, Dhaka',
      paymentMethod: 'cash_on_delivery',
      statusHistory: [
        { status: 'pending',   note: 'Order placed',     updatedAt: new Date(Date.now() - 86400000) },
        { status: 'confirmed', note: 'Farmer confirmed', updatedAt: new Date() },
      ],
    },
    {
      customer: customers[2]._id, farmer: farmers[3]._id,
      items: [{ product: products[3]._id, name: products[3].name, image: products[3].images[0], price: 35, quantity: 10, unit: 'piece' }],
      totalAmount: 350, status: 'out_for_delivery', deliveryAddress: 'Flat 3A, Gulshan 2, Dhaka',
      paymentMethod: 'bkash', isPaid: true,
      statusHistory: [
        { status: 'pending',   note: 'Order placed',  updatedAt: new Date(Date.now() - 86400000 * 2) },
        { status: 'confirmed', note: 'Confirmed',      updatedAt: new Date(Date.now() - 86400000) },
        { status: 'out_for_delivery',   note: 'Out for delivery', updatedAt: new Date() },
      ],
    },
    {
      customer: customers[3]._id, farmer: farmers[2]._id,
      items: [{ product: products[20]._id, name: products[20].name, image: products[20].images[0], price: 12, quantity: 24, unit: 'piece' }],
      totalAmount: 288, status: 'pending', deliveryAddress: 'Road 7, Banani, Dhaka',
      paymentMethod: 'cash_on_delivery',
      statusHistory: [{ status: 'pending', note: 'Order placed', updatedAt: new Date() }],
    },
    {
      customer: customers[4]._id, farmer: farmers[8]._id,
      items: [{ product: products[23]._id, name: products[23].name, image: products[23].images[0], price: 65, quantity: 5, unit: 'kg' }],
      totalAmount: 325, status: 'delivered', deliveryAddress: 'House 9, Uttara Sector 4, Dhaka',
      paymentMethod: 'bkash', isPaid: true,
      statusHistory: [
        { status: 'pending',   note: 'Order placed', updatedAt: new Date(Date.now() - 86400000 * 4) },
        { status: 'delivered', note: 'Delivered',    updatedAt: new Date(Date.now() - 86400000) },
      ],
    },
  ]);
  console.log(`Created ${orders.length} orders`);

  // ── Reviews ──────────────────────────────────────────────────
  await Review.create([
    {
      reviewer: customers[0]._id, farmer: farmers[0]._id,
      product: products[0]._id, order: orders[0]._id,
      rating: 5, comment: 'Excellent tomatoes! Very fresh and no pesticides. Highly recommend Rahim bhai.',
    },
    {
      reviewer: customers[1]._id, farmer: farmers[1]._id,
      product: products[10]._id, order: orders[1]._id,
      rating: 4, comment: 'Hilsa was very fresh. Delivery was a bit slow but quality was great.',
    },
    {
      reviewer: customers[4]._id, farmer: farmers[8]._id,
      product: products[23]._id, order: orders[4]._id,
      rating: 5, comment: 'Best miniket rice I have had. Will order again!',
    },
  ]);
  console.log('Created reviews');

  console.log('\nSeed complete! Login with any of these:');
  console.log('--- Farmers ---');
  console.log('  rahim@farmer.com    / password123');
  console.log('  fatema@farmer.com   / password123');
  console.log('  karim@farmer.com    / password123');
  console.log('  sumaiya@farmer.com  / password123');
  console.log('  jalal@farmer.com    / password123');
  console.log('  hafizur@farmer.com  / password123');
  console.log('--- Customers ---');
  console.log('  arif@customer.com   / password123');
  console.log('  mitu@customer.com   / password123');
  console.log('  shuvo@customer.com  / password123');
  console.log('  tanvir@customer.com / password123');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});