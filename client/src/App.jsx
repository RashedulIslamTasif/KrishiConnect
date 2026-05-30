import { Routes, Route } from 'react-router-dom';
import Navbar               from './components/Navbar.jsx';
import Home                 from './pages/Home.jsx';
import Marketplace          from './pages/Marketplace.jsx';
import ProductDetail        from './pages/ProductDetail.jsx';
import FarmerMap            from './pages/FarmerMap.jsx';
import FarmerProfile        from './pages/FarmerProfile.jsx';
import Login                from './pages/Login.jsx';
import Register             from './pages/Register.jsx';
import CustomerProfile      from './pages/CustomerProfile.jsx';
import Cart                 from './pages/Cart.jsx';
import Dashboard            from './pages/farmer/Dashboard.jsx';
import MyProducts           from './pages/farmer/MyProducts.jsx';
import AddProduct           from './pages/farmer/AddProduct.jsx';
import EditProduct          from './pages/farmer/EditProduct.jsx';
import FarmerOrders         from './pages/farmer/FarmerOrders.jsx';
import AnalyticsDashboard   from './pages/farmer/AnalyticsDashboard.jsx';
import FarmerAccountProfile from './pages/farmer/FarmerAccountProfile.jsx';
import MyOrders             from './pages/MyOrders.jsx';
import OrderTracking        from './pages/OrderTracking.jsx';
import Chat                 from './pages/Chat.jsx';
import { PrivateRoute, FarmerRoute } from './routes/PrivateRoute.jsx';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <Routes>
        <Route path="/"             element={<Home />} />
        <Route path="/marketplace"  element={<Marketplace />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/product/:id"  element={<ProductDetail />} />
        <Route path="/map"          element={<FarmerMap />} />
        <Route path="/farmer/:id"   element={<FarmerProfile />} />
        <Route path="/login"        element={<Login />} />
        <Route path="/register"     element={<Register />} />

        <Route element={<PrivateRoute />}>
          <Route path="/profile"              element={<CustomerProfile />} />
          <Route path="/cart"                 element={<Cart />} />
          <Route path="/orders"               element={<MyOrders />} />
          <Route path="/orders/:id"           element={<OrderTracking />} />
          <Route path="/chat"                 element={<Chat />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
        </Route>

        <Route element={<FarmerRoute />}>
          <Route path="/dashboard"             element={<Dashboard />} />
          <Route path="/dashboard/profile"     element={<FarmerAccountProfile />} />
          <Route path="/dashboard/products"    element={<MyProducts />} />
          <Route path="/dashboard/add"         element={<AddProduct />} />
          <Route path="/dashboard/edit/:id"    element={<EditProduct />} />
          <Route path="/dashboard/orders"      element={<FarmerOrders />} />
          <Route path="/dashboard/analytics"   element={<AnalyticsDashboard />} />
          <Route path="/dashboard/chat"        element={<Chat />} />
        </Route>
      </Routes>
    </div>
  );
}
