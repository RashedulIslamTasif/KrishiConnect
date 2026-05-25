# KrishiConnect — New Features Setup Guide

## New packages to install

### SERVER (run inside /server)
npm install socket.io

### CLIENT (run inside /client)
npm install socket.io-client qrcode.react

---

## New files added

### Backend (server/)
| File | Purpose |
|------|---------|
| models/Message.js        | Chat messages |
| models/Conversation.js   | Chat threads |
| models/Notification.js   | All notifications |
| models/Coupon.js         | Discount codes |
| controllers/chatController.js         | Chat API logic |
| controllers/notificationController.js | Notification API |
| controllers/couponController.js       | Coupon validate/apply |
| controllers/analyticsController.js    | Analytics + Recommendations |
| routes/chatRoutes.js          | /api/chat/* |
| routes/notificationRoutes.js  | /api/notifications/* |
| routes/couponRoutes.js        | /api/coupons/* |
| routes/analyticsRoutes.js     | /api/analytics/* |
| server.js (REPLACED)          | Now includes Socket.io |

### Frontend (client/src/)
| File | Purpose |
|------|---------|
| hooks/useSocket.js                       | Socket.io hook |
| pages/Chat.jsx                           | Full real-time chat UI |
| pages/OrderTracking.jsx                  | Visual tracking timeline |
| pages/farmer/AnalyticsDashboard.jsx      | Sales charts + KPIs |
| components/NotificationBell.jsx          | Drop-in bell with badge |
| components/CouponInput.jsx               | Coupon field for checkout |
| components/Recommendations.jsx           | Smart product recommendations |
| App.jsx (REPLACED)                       | All new routes added |
| components/Navbar.jsx (REPLACED)         | Bell + new links added |

---

## API Endpoints added

### Chat
- GET  /api/chat/conversations          — list all my conversations
- POST /api/chat/start                  — start/get a conversation
- GET  /api/chat/unread                 — unread message count
- GET  /api/chat/:id/messages           — get messages in a conversation
- POST /api/chat/:id/messages           — send a message

### Notifications
- GET  /api/notifications               — get all my notifications
- GET  /api/notifications/unread-count  — unread count
- PUT  /api/notifications/read-all      — mark all as read
- PUT  /api/notifications/:id/read      — mark one as read

### Coupons
- POST /api/coupons/validate            — check if coupon is valid
- POST /api/coupons/apply               — mark coupon as used
- POST /api/coupons                     — create a coupon (farmer/admin)
- GET  /api/coupons/mine               — list my coupons
- DELETE /api/coupons/:id              — delete a coupon

### Analytics
- GET  /api/analytics/farmer                  — full farmer dashboard data
- GET  /api/analytics/recommendations/:userId — smart recommendations

---

## Socket.io events

| Event | Direction | Description |
|-------|-----------|-------------|
| join               | Client → Server | User joins their personal room |
| join_conversation  | Client → Server | Join a chat room |
| typing             | Client → Server | User is typing |
| stop_typing        | Client → Server | User stopped typing |
| new_message        | Server → Client | New chat message received |
| notification       | Server → Client | New notification pushed |

---

## How to use CouponInput in checkout

```jsx
import CouponInput from '../components/CouponInput';

// Inside your checkout component:
const [discount, setDiscount] = useState(0);

<CouponInput
  orderAmount={cartTotal}
  onApply={({ discount, finalAmount, code }) => {
    setDiscount(discount);
    setCouponCode(code);
  }}
  onRemove={() => setDiscount(0)}
/>

<div>Final: ৳{cartTotal - discount}</div>
```

## How to use Recommendations

```jsx
import Recommendations from '../components/Recommendations';
import { useAuth } from '../context/AuthContext';

const { user } = useAuth();

// Drop anywhere on home or marketplace:
<Recommendations userId={user?._id} />
```

## Sample coupon codes to seed

Add these manually or in seed.js:
- KRISHI20 → 20% off (min order ৳200)
- WELCOME50 → ৳50 flat off
- FRESH10 → 10% off

---

## Order Status Flow (updated)
pending → confirmed → harvested → out_for_delivery → delivered → cancelled

Each status change:
1. Updates order.statusHistory array
2. Sends notification to customer via Socket.io
3. Notification appears in their bell instantly
