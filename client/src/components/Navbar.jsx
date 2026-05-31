import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount }    = useCart();
  const { pathname }     = useLocation();
  const navigate         = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const active = (p) => pathname === p || pathname.startsWith(p + '/');

  const NavLink = ({ to, children, onClick }) => (
    <Link to={to} onClick={onClick} style={{ color: active(to) ? 'var(--green-lt)' : 'rgba(240,244,236,.7)', fontSize: 15, fontWeight: 500, textDecoration: 'none', padding: '10px 0', display: 'block' }}>
      {children}
    </Link>
  );

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(10,15,8,.95)', backdropFilter:'blur(16px)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', height:60 }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
          <div style={{ width:30, height:30, background:'var(--green-hi)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🌱</div>
          <span style={{ fontSize:16, fontWeight:700, color:'var(--white)', letterSpacing:'-0.02em' }}>KrishiConnect</span>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display:'flex', gap:24, alignItems:'center' }} className="desktop-nav">
          <Link to="/marketplace" style={{ color: active('/marketplace') ? 'var(--green-lt)' : 'rgba(240,244,236,.55)', fontSize:14, textDecoration:'none' }}>Marketplace</Link>
          <Link to="/map" style={{ color: active('/map') ? 'var(--green-lt)' : 'rgba(240,244,236,.55)', fontSize:14, textDecoration:'none' }}>Find Farmers</Link>
          {user?.role === 'farmer' && <>
            <Link to="/dashboard" style={{ color: active('/dashboard') ? 'var(--green-lt)' : 'rgba(240,244,236,.55)', fontSize:14, textDecoration:'none' }}>Dashboard</Link>
            <Link to="/dashboard/analytics" style={{ color: active('/dashboard/analytics') ? 'var(--green-lt)' : 'rgba(240,244,236,.55)', fontSize:14, textDecoration:'none' }}>Analytics</Link>
          </>}
          {user?.role === 'customer' && <>
            <Link to="/orders" style={{ color: active('/orders') ? 'var(--green-lt)' : 'rgba(240,244,236,.55)', fontSize:14, textDecoration:'none' }}>My Orders</Link>
          </>}
        </div>

        {/* Right side */}
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {user && <NotificationBell />}

          {/* Cart */}
          {user?.role !== 'farmer' && (
            <Link to="/cart" style={{ position:'relative', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:'50%', background: active('/cart') ? 'rgba(90,176,48,.15)' : 'transparent', border:'1px solid var(--border)' }}>
              <span style={{ fontSize:16 }}>🛒</span>
              {cartCount > 0 && (
                <span style={{ position:'absolute', top:-3, right:-3, background:'var(--green-hi)', color:'#fff', fontSize:9, fontWeight:700, borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Desktop auth */}
          {user ? (
            <div style={{ display:'flex', gap:8, alignItems:'center' }} className="desktop-nav">
              <Link to={user.role === 'customer' ? '/profile' : '/dashboard/profile'} style={{ fontSize:13, color:'var(--muted)', textDecoration:'none' }}>
                Hi, <strong style={{ color:'var(--white)' }}>{user.name.split(' ')[0]}</strong>
              </Link>
              <button onClick={() => { logout(); navigate('/'); }} style={{ fontSize:12, padding:'7px 14px', background:'transparent', border:'1px solid var(--border)', borderRadius:99, color:'var(--muted)', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', gap:8 }} className="desktop-nav">
              <Link to="/login" style={{ fontSize:13, color:'var(--muted)', textDecoration:'none' }}>Login</Link>
              <Link to="/register" style={{ fontSize:12, padding:'7px 16px', textDecoration:'none', background:'var(--green-hi)', color:'#fff', borderRadius:99, fontWeight:600 }}>Join Free</Link>
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button onClick={() => setMenuOpen(o => !o)} style={{ display:'none', background:'transparent', border:'1px solid var(--border)', borderRadius:8, padding:'6px 10px', color:'var(--white)', cursor:'pointer', fontSize:18 }} className="hamburger">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div style={{ position:'fixed', top:60, left:0, right:0, bottom:0, background:'rgba(10,15,8,.97)', zIndex:99, padding:24, overflowY:'auto' }}>
          <NavLink to="/marketplace" onClick={closeMenu}>🛒 Marketplace</NavLink>
          <NavLink to="/map" onClick={closeMenu}>🗺 Find Farmers</NavLink>

          {user?.role === 'farmer' && <>
            <NavLink to="/dashboard" onClick={closeMenu}>📊 Dashboard</NavLink>
            <NavLink to="/dashboard/products" onClick={closeMenu}>🌿 My Products</NavLink>
            <NavLink to="/dashboard/add" onClick={closeMenu}>➕ Add Product</NavLink>
            <NavLink to="/dashboard/orders" onClick={closeMenu}>📦 Orders</NavLink>
            <NavLink to="/dashboard/analytics" onClick={closeMenu}>📈 Analytics</NavLink>
            <NavLink to="/dashboard/chat" onClick={closeMenu}>💬 Messages</NavLink>
            <NavLink to="/dashboard/profile" onClick={closeMenu}>👤 My Profile</NavLink>
          </>}

          {user?.role === 'customer' && <>
            <NavLink to="/orders" onClick={closeMenu}>📦 My Orders</NavLink>
            <NavLink to="/cart" onClick={closeMenu}>🛒 Cart {cartCount > 0 ? `(${cartCount})` : ''}</NavLink>
            <NavLink to="/chat" onClick={closeMenu}>💬 Messages</NavLink>
            <NavLink to="/profile" onClick={closeMenu}>👤 My Profile</NavLink>
          </>}

          <div style={{ borderTop:'1px solid var(--border)', marginTop:20, paddingTop:20 }}>
            {user ? (
              <>
                <div style={{ fontSize:14, color:'var(--muted)', marginBottom:16 }}>
                  Logged in as <strong style={{ color:'var(--white)' }}>{user.name}</strong>
                </div>
                <button onClick={() => { logout(); navigate('/'); closeMenu(); }}
                  style={{ width:'100%', background:'rgba(224,85,85,.12)', color:'#e05555', border:'1px solid rgba(224,85,85,.25)', borderRadius:12, padding:'12px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer' }}>
                  Logout
                </button>
              </>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <Link to="/login" onClick={closeMenu} style={{ display:'block', textAlign:'center', padding:'12px', border:'1px solid var(--border)', borderRadius:12, color:'var(--white)', textDecoration:'none', fontWeight:600, fontSize:15 }}>Login</Link>
                <Link to="/register" onClick={closeMenu} style={{ display:'block', textAlign:'center', padding:'12px', background:'var(--green-hi)', borderRadius:12, color:'#fff', textDecoration:'none', fontWeight:600, fontSize:15 }}>Join Free</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </>
  );
}
