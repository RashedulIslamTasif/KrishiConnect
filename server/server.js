const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const http       = require('http');
const { Server } = require('socket.io');
const connectDB  = require('./config/db');

dotenv.config();
connectDB();

const app    = express();
const server = http.createServer(app);

// Allow any localhost or LAN origin in development
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    allowed ? callback(null, true) : callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// Socket.io setup
const io = new Server(server, {
  cors: { origin: corsOptions.origin, methods: ['GET','POST'], credentials: true },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
  });

  socket.on('typing', ({ conversationId, userName }) => {
    socket.to(conversationId).emit('typing', { userName });
  });

  socket.on('stop_typing', (conversationId) => {
    socket.to(conversationId).emit('stop_typing');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',          require('./routes/authRoutes'));
app.use('/api/products',      require('./routes/productRoutes'));
app.use('/api/orders',        require('./routes/orderRoutes'));
app.use('/api/reviews',       require('./routes/reviewRoutes'));
app.use('/api/prices',        require('./routes/priceRoutes'));
app.use('/api/chat',          require('./routes/chatRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/coupons',       require('./routes/couponRoutes'));
app.use('/api/analytics',     require('./routes/analyticsRoutes'));

app.get('/', (req, res) => res.json({ message: 'KrishiConnect API running' }));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server + Socket.io running on http://localhost:${PORT}`));
