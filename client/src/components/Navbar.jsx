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
  const close  = () => setMenuOpen(false);

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,15,8,.97)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        /* Horizontal padding accounts for notch on sides */
        padding: '0 max(16px, env(safe-area-inset-left, 16px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
        height: 56,
      }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
          <div style={{ width:28, height:28, background:'var(--green-hi)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13 }}>🌱</div>
          <span style={{ fontSize:15, fontWeight:700, color:'var(--white)', letterSpacing:'-0.02em' }}>KrishiConnect</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display:'flex', gap:24, alignItems:'center' }} id="desktop-nav">
          {[
            { to:'/marketplace', label:'Marketplace' },
            { to:'/map',         label:'Find Farmers' },
            ...(user?.role==='farmer' ? [
              { to:'/dashboard',            label:'Dashboard' },
              { to:'/dashboard/analytics',  label:'Analytics' },
              { to:'/dashboard/chat',       label:'Messages' },
            ] : []),
            ...(user?.role==='customer' ? [
              { to:'/orders', label:'My Orders' },
              { to:'/chat',   label:'Messages'  },
            ] : []),
          ].map(n => (
            <Link key={n.to} to={n.to} style={{ color: active(n.to) ? 'var(--green-lt)' : 'rgba(240,244,236,.55)', fontSize:14, textDecoration:'none', whiteSpace:'nowrap' }}>{n.label}</Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {user && <NotificationBell />}

          {/* Cart icon */}
          {user?.role !== 'farmer' && (
            <Link to="/cart" style={{ position:'relative', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:'50%', background: active('/cart') ? 'rgba(90,176,48,.15)' : 'transparent', border:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontSize:15 }}>🛒</span>
              {cartCount > 0 && (
                <span style={{ position:'absolute', top:-3, right:-3, background:'var(--green-hi)', color:'#fff', fontSize:9, fontWeight:700, borderRadius:'50%', width:15, height:15, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Desktop auth */}
          <div id="desktop-auth" style={{ display:'flex', gap:8, alignItems:'center' }}>
            {user ? (
              <>
                <Link to={user.role==='customer' ? '/profile' : '/dashboard/profile'} style={{ fontSize:13, color:'var(--muted)', textDecoration:'none', whiteSpace:'nowrap' }}>
                  Hi, <strong style={{ color:'var(--white)' }}>{user.name.split(' ')[0]}</strong>
                </Link>
                <button onClick={() => { logout(); navigate('/'); }} style={{ fontSize:12, padding:'7px 14px', background:'transparent', border:'1px solid var(--border)', borderRadius:99, color:'var(--muted)', cursor:'pointer', fontFamily:'Sora,sans-serif', whiteSpace:'nowrap' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"    style={{ fontSize:13, color:'var(--muted)', textDecoration:'none', whiteSpace:'nowrap' }}>Login</Link>
                <Link to="/register" style={{ fontSize:12, padding:'7px 14px', textDecoration:'none', background:'var(--green-hi)', color:'#fff', borderRadius:99, fontWeight:600, whiteSpace:'nowrap' }}>Join Free</Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button id="hamburger" onClick={() => setMenuOpen(o => !o)} style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:8, padding:'5px 9px', color:'var(--white)', cursor:'pointer', fontSize:16, display:'none', flexShrink:0 }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <div style={{ position:'fixed', top:56, left:0, right:0, bottom:0, background:'rgba(10,15,8,.98)', zIndex:99, padding:'20px 20px', overflowY:'auto',
          paddingBottom:'max(20px, env(safe-area-inset-bottom, 20px))',
          paddingLeft:'max(20px, env(safe-area-inset-left, 20px))',
          paddingRight:'max(20px, env(safe-area-inset-right, 20px))',
        }}>
          {[
            { to:'/marketplace',  icon:'🛒', label:'Marketplace' },
            { to:'/map',          icon:'🗺', label:'Find Farmers' },
          ].map(n => <Link key={n.to} to={n.to} onClick={close} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,.06)', color:'var(--white)', textDecoration:'none', fontSize:16 }}><span>{n.icon}</span>{n.label}</Link>)}

          {user?.role==='farmer' && [
            { to:'/dashboard',                icon:'📊', label:'Dashboard' },
            { to:'/dashboard/products',       icon:'🌿', label:'My Products' },
            { to:'/dashboard/add',            icon:'➕', label:'Add Product' },
            { to:'/dashboard/orders',         icon:'📦', label:'Orders' },
            { to:'/dashboard/analytics',      icon:'📈', label:'Analytics' },
            { to:'/dashboard/chat',           icon:'💬', label:'Messages' },
            { to:'/dashboard/profile',        icon:'👤', label:'My Profile' },
          ].map(n => <Link key={n.to} to={n.to} onClick={close} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,.06)', color:'var(--white)', textDecoration:'none', fontSize:16 }}><span>{n.icon}</span>{n.label}</Link>)}

          {user?.role==='customer' && [
            { to:'/orders',  icon:'📦', label:'My Orders' },
            { to:'/cart',    icon:'🛒', label:`Cart${cartCount>0?` (${cartCount})` : ''}` },
            { to:'/chat',    icon:'💬', label:'Messages' },
            { to:'/profile', icon:'👤', label:'My Profile' },
          ].map(n => <Link key={n.to} to={n.to} onClick={close} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,.06)', color:'var(--white)', textDecoration:'none', fontSize:16 }}><span>{n.icon}</span>{n.label}</Link>)}

          <div style={{ marginTop:24 }}>
            {user ? (
              <button onClick={() => { logout(); navigate('/'); close(); }}
                style={{ width:'100%', background:'rgba(224,85,85,.12)', color:'#e05555', border:'1px solid rgba(224,85,85,.25)', borderRadius:12, padding:'14px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer' }}>
                Logout
              </button>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <Link to="/login" onClick={close} style={{ display:'block', textAlign:'center', padding:'13px', border:'1px solid var(--border)', borderRadius:12, color:'var(--white)', textDecoration:'none', fontWeight:600, fontSize:15 }}>Login</Link>
                <Link to="/register" onClick={close} style={{ display:'block', textAlign:'center', padding:'13px', background:'var(--green-hi)', borderRadius:12, color:'#fff', textDecoration:'none', fontWeight:600, fontSize:15 }}>Join Free</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          #desktop-nav  { display: none !important; }
          #desktop-auth { display: none !important; }
          #hamburger    { display: flex !important; }
        }
      `}</style>
    </>
  );
}
