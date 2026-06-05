import { useState, useEffect } from 'react';
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const active = (p) => pathname === p || pathname.startsWith(p + '/');
  const close  = () => setMenuOpen(false);

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(245,247,242,.96)' : 'rgba(245,247,242,.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(60,100,40,.14)' : 'rgba(60,100,40,.08)'}`,
        boxShadow: scrolled ? '0 2px 20px rgba(20,50,10,.08)' : 'none',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 max(16px, env(safe-area-inset-left, 16px))',
        paddingRight: 'max(16px, env(safe-area-inset-right, 16px))',
        height: 60,
      }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', flexShrink:0 }}>
          <img src="/icons/icon-192.png" alt="KrishiConnect" style={{ width:34, height:34, borderRadius:10, objectFit:"cover" }} />
          <span style={{ fontSize:16, fontWeight:800, color:'#1a2415', letterSpacing:'-0.03em', fontFamily:'Plus Jakarta Sans,sans-serif' }}>KrishiConnect</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display:'flex', gap:6, alignItems:'center' }} id="desktop-nav">
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
            <Link key={n.to} to={n.to} style={{
              color: active(n.to) ? 'var(--green-hi)' : 'var(--muted)',
              fontSize:14, fontWeight:500, textDecoration:'none', padding:'6px 14px',
              borderRadius:99, background: active(n.to) ? 'var(--green-soft)' : 'transparent',
              transition:'all .2s ease', whiteSpace:'nowrap',
            }}>{n.label}</Link>
          ))}
        </div>

        {/* Right side */}
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {user && <NotificationBell />}

          {user?.role !== 'farmer' && (
            <Link to="/cart" style={{ position:'relative', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:12, background: active('/cart') ? 'var(--green-soft)' : '#fff', border:'1px solid var(--border)', boxShadow:'var(--shadow-sm)', flexShrink:0, transition:'all .2s' }}>
              <span style={{ fontSize:16 }}>🛒</span>
              {cartCount > 0 && (
                <span style={{ position:'absolute', top:-4, right:-4, background:'var(--green-hi)', color:'#fff', fontSize:9, fontWeight:700, borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 1px 4px rgba(78,158,42,.4)' }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>
          )}

          <div id="desktop-auth" style={{ display:'flex', gap:8, alignItems:'center' }}>
            {user ? (
              <>
                <Link to={user.role==='customer' ? '/profile' : '/dashboard/profile'} style={{ fontSize:13, color:'var(--muted)', textDecoration:'none', whiteSpace:'nowrap', fontWeight:500 }}>
                  Hi, <strong style={{ color:'var(--white)' }}>{user.name.split(' ')[0]}</strong>
                </Link>
                <button onClick={() => { logout(); navigate('/'); }} style={{ fontSize:12, padding:'8px 16px', background:'#fff', border:'1px solid var(--border)', borderRadius:99, color:'var(--muted)', cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', whiteSpace:'nowrap', boxShadow:'var(--shadow-sm)' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ fontSize:13, color:'var(--muted)', textDecoration:'none', whiteSpace:'nowrap', fontWeight:500, padding:'7px 14px' }}>Login</Link>
                <Link to="/register" style={{ fontSize:13, padding:'8px 18px', textDecoration:'none', background:'var(--green-hi)', color:'#fff', borderRadius:99, fontWeight:700, whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(78,158,42,.35)', fontFamily:'Plus Jakarta Sans,sans-serif' }}>Join Free</Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button id="hamburger" onClick={() => setMenuOpen(o => !o)} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:10, padding:'7px 10px', color:'var(--white)', cursor:'pointer', fontSize:16, display:'none', flexShrink:0, boxShadow:'var(--shadow-sm)' }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position:'fixed', top:60, left:0, right:0, bottom:0, background:'rgba(245,247,242,.98)', zIndex:99, padding:'16px 20px', overflowY:'auto',
          paddingBottom:'max(20px, env(safe-area-inset-bottom, 20px))',
          animation:'fadeIn .2s ease',
        }}>
          <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }`}</style>
          {[
            { to:'/marketplace',  icon:'🛒', label:'Marketplace' },
            { to:'/map',          icon:'🗺', label:'Find Farmers' },
          ].map(n => <Link key={n.to} to={n.to} onClick={close} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, marginBottom:4, color:'var(--white)', textDecoration:'none', fontSize:15, fontWeight:500, background: active(n.to) ? 'var(--green-soft)' : 'transparent' }}><span style={{fontSize:18}}>{n.icon}</span>{n.label}</Link>)}

          {user?.role==='farmer' && [
            { to:'/dashboard',           icon:'📊', label:'Dashboard' },
            { to:'/dashboard/products',  icon:'🌿', label:'My Products' },
            { to:'/dashboard/add',       icon:'➕', label:'Add Product' },
            { to:'/dashboard/orders',    icon:'📦', label:'Orders' },
            { to:'/dashboard/analytics', icon:'📈', label:'Analytics' },
            { to:'/dashboard/chat',      icon:'💬', label:'Messages' },
            { to:'/dashboard/profile',   icon:'👤', label:'My Profile' },
          ].map(n => <Link key={n.to} to={n.to} onClick={close} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, marginBottom:4, color:'var(--white)', textDecoration:'none', fontSize:15, fontWeight:500, background: active(n.to) ? 'var(--green-soft)' : 'transparent' }}><span style={{fontSize:18}}>{n.icon}</span>{n.label}</Link>)}

          {user?.role==='customer' && [
            { to:'/orders',  icon:'📦', label:'My Orders' },
            { to:'/cart',    icon:'🛒', label:`Cart${cartCount>0?` (${cartCount})` : ''}` },
            { to:'/chat',    icon:'💬', label:'Messages' },
            { to:'/profile', icon:'👤', label:'My Profile' },
          ].map(n => <Link key={n.to} to={n.to} onClick={close} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, marginBottom:4, color:'var(--white)', textDecoration:'none', fontSize:15, fontWeight:500, background: active(n.to) ? 'var(--green-soft)' : 'transparent' }}><span style={{fontSize:18}}>{n.icon}</span>{n.label}</Link>)}

          <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid var(--border)' }}>
            {user ? (
              <button onClick={() => { logout(); navigate('/'); close(); }}
                style={{ width:'100%', background:'rgba(224,85,85,.08)', color:'#d04040', border:'1px solid rgba(224,85,85,.2)', borderRadius:14, padding:'14px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer' }}>
                Logout
              </button>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <Link to="/login" onClick={close} style={{ display:'block', textAlign:'center', padding:'13px', border:'1px solid var(--border)', borderRadius:14, color:'var(--white)', textDecoration:'none', fontWeight:600, fontSize:15, background:'#fff' }}>Login</Link>
                <Link to="/register" onClick={close} style={{ display:'block', textAlign:'center', padding:'13px', background:'var(--green-hi)', borderRadius:14, color:'#fff', textDecoration:'none', fontWeight:700, fontSize:15, boxShadow:'0 2px 8px rgba(78,158,42,.3)' }}>Join Free</Link>
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
