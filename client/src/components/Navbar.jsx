import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar({ minimalMode = false, hide = false }) {
  if (hide) return null;
  const { user, logout } = useAuth();
  const { cartCount }    = useCart();
  const { pathname }     = useLocation();
  const navigate         = useNavigate();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled,    setScrolled]    = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const active = (p) => pathname === p || pathname.startsWith(p + '/');
  const close  = () => setMenuOpen(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed',
        // Push below the mobile OS status bar using safe-area-inset-top
        top: 'env(safe-area-inset-top, 0px)',
        left: 0, right: 0,
        zIndex: 1000,
        background: scrolled ? 'rgba(245,247,242,.97)' : 'rgba(245,247,242,.93)',
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${scrolled ? 'rgba(60,100,40,.14)' : 'rgba(60,100,40,.08)'}`,
        boxShadow: scrolled ? '0 2px 20px rgba(20,50,10,.08)' : 'none',
        transition: 'all 0.3s ease',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px',
        height: 58,
      }}>

        {/* Logo */}
        <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
          <img src="/icons/icon-192.png" alt="KrishiConnect" style={{ width:32, height:32, borderRadius:9, objectFit:'cover' }} />
          <span style={{ fontSize:15, fontWeight:800, color:'#1a2415', letterSpacing:'-0.03em', fontFamily:'Plus Jakarta Sans,sans-serif' }}>KrishiConnect</span>
        </Link>

        {/* Desktop nav links */}
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

        {/* Right side icons */}
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>

          {/* In minimal mode, only show hamburger */}
          {!minimalMode && (
            <>
              {/* 🔍 Search button */}
              <button
                onClick={() => setSearchOpen(o => !o)}
                style={{ width:38, height:38, borderRadius:12, background: searchOpen ? 'rgba(78,158,42,.12)' : '#fff', border:'1px solid rgba(60,100,40,.14)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, boxShadow:'0 1px 4px rgba(0,0,0,.06)', transition:'all .2s' }}
                aria-label="Search"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={searchOpen ? '#4e9e2a' : '#6b7a5e'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>

              {/* 🔔 Notifications */}
              {user && <NotificationBell />}

              {/* 🛒 Cart */}
              {user?.role !== 'farmer' && (
                <Link to="/cart" style={{ position:'relative', textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', width:38, height:38, borderRadius:12, background: active('/cart') ? 'rgba(78,158,42,.12)' : '#fff', border:'1px solid rgba(60,100,40,.14)', boxShadow:'0 1px 4px rgba(0,0,0,.06)', flexShrink:0, transition:'all .2s' }}>
                  <span style={{ fontSize:16 }}>🛒</span>
                  {cartCount > 0 && (
                    <span style={{ position:'absolute', top:-4, right:-4, background:'#4e9e2a', color:'#fff', fontSize:9, fontWeight:700, borderRadius:'50%', width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Desktop auth */}
              <div id="desktop-auth" style={{ display:'flex', gap:8, alignItems:'center' }}>
                {user ? (
                  <>
                    <Link to={user.role==='customer' ? '/profile' : '/dashboard/profile'} style={{ fontSize:13, color:'var(--muted)', textDecoration:'none', whiteSpace:'nowrap', fontWeight:500 }}>
                      Hi, <strong style={{ color:'var(--ink)' }}>{user.name.split(' ')[0]}</strong>
                    </Link>
                    <button onClick={() => { logout(); navigate('/'); }} style={{ fontSize:12, padding:'8px 16px', background:'#fff', border:'1px solid rgba(60,100,40,.14)', borderRadius:99, color:'var(--muted)', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" style={{ fontSize:13, color:'var(--muted)', textDecoration:'none', whiteSpace:'nowrap', fontWeight:500, padding:'7px 14px' }}>Login</Link>
                    <Link to="/register" style={{ fontSize:13, padding:'8px 18px', textDecoration:'none', background:'#4e9e2a', color:'#fff', borderRadius:99, fontWeight:700, whiteSpace:'nowrap' }}>Join Free</Link>
                  </>
                )}
              </div>
            </>
          )}

          {/* Hamburger — always visible */}
          <button id="hamburger" onClick={() => setMenuOpen(o => !o)} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.14)', borderRadius:10, padding:'7px 10px', cursor:'pointer', fontSize:16, display: minimalMode ? 'flex' : 'none', flexShrink:0 }}>
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* ── Search bar dropdown ── */}
      {searchOpen && (
        <div style={{
          position: 'fixed',
          top: `calc(env(safe-area-inset-top, 0px) + 58px)`,
          left: 0, right: 0,
          zIndex: 999,
          background: '#fff',
          borderBottom: '1px solid rgba(60,100,40,.12)',
          boxShadow: '0 8px 24px rgba(0,0,0,.1)',
          padding: '12px 16px',
          animation: 'slideDown .2s ease',
        }}>
          <form onSubmit={handleSearch} style={{ display:'flex', gap:10, alignItems:'center' }}>
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products, farmers..."
              style={{
                flex: 1, height: 44, padding: '0 16px',
                border: '1.5px solid rgba(78,158,42,.3)',
                borderRadius: 12, fontSize: 15,
                outline: 'none', background: '#f7f9f5',
                fontFamily: 'inherit', color: '#1a2415',
              }}
            />
            <button type="submit" style={{
              height: 44, padding: '0 20px',
              background: '#4e9e2a', color: '#fff',
              border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}>Search</button>
            <button type="button" onClick={() => setSearchOpen(false)} style={{
              height: 44, width: 44,
              background: '#f5f5f5', border: 'none',
              borderRadius: 12, cursor: 'pointer', fontSize: 18,
            }}>✕</button>
          </form>
        </div>
      )}

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: `calc(env(safe-area-inset-top, 0px) + 58px)`,
          left: 0, right: 0, bottom: 0,
          background: 'rgba(245,247,242,.98)',
          zIndex: 998,
          padding: '16px 20px',
          overflowY: 'auto',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom, 20px))',
          animation: 'fadeIn .2s ease',
        }}>
          {[
            { to:'/marketplace',  icon:'🛒', label:'Marketplace' },
            { to:'/map',          icon:'🗺', label:'Find Farmers' },
          ].map(n => (
            <Link key={n.to} to={n.to} onClick={close} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, marginBottom:4, color:'#1a2415', textDecoration:'none', fontSize:15, fontWeight:500, background: active(n.to) ? 'rgba(78,158,42,.1)' : 'transparent' }}>
              <span style={{fontSize:18}}>{n.icon}</span>{n.label}
            </Link>
          ))}

          {user?.role==='farmer' && [
            { to:'/dashboard',           icon:'📊', label:'Dashboard' },
            { to:'/dashboard/products',  icon:'🌿', label:'My Products' },
            { to:'/dashboard/add',       icon:'➕', label:'Add Product' },
            { to:'/dashboard/orders',    icon:'📦', label:'Orders' },
            { to:'/dashboard/analytics', icon:'📈', label:'Analytics' },
            { to:'/dashboard/chat',      icon:'💬', label:'Messages' },
            { to:'/dashboard/profile',   icon:'👤', label:'My Profile' },
          ].map(n => (
            <Link key={n.to} to={n.to} onClick={close} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, marginBottom:4, color:'#1a2415', textDecoration:'none', fontSize:15, fontWeight:500, background: active(n.to) ? 'rgba(78,158,42,.1)' : 'transparent' }}>
              <span style={{fontSize:18}}>{n.icon}</span>{n.label}
            </Link>
          ))}

          {user?.role==='customer' && [
            { to:'/orders',  icon:'📦', label:'My Orders' },
            { to:'/cart',    icon:'🛒', label:`Cart${cartCount>0?` (${cartCount})`:''}`},
            { to:'/chat',    icon:'💬', label:'Messages' },
            { to:'/profile', icon:'👤', label:'My Profile' },
          ].map(n => (
            <Link key={n.to} to={n.to} onClick={close} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:14, marginBottom:4, color:'#1a2415', textDecoration:'none', fontSize:15, fontWeight:500, background: active(n.to) ? 'rgba(78,158,42,.1)' : 'transparent' }}>
              <span style={{fontSize:18}}>{n.icon}</span>{n.label}
            </Link>
          ))}

          <div style={{ marginTop:20, paddingTop:20, borderTop:'1px solid rgba(60,100,40,.12)' }}>
            {user ? (
              <button onClick={() => { logout(); navigate('/'); close(); }}
                style={{ width:'100%', background:'rgba(224,85,85,.08)', color:'#d04040', border:'1px solid rgba(224,85,85,.2)', borderRadius:14, padding:'14px', fontFamily:'inherit', fontWeight:600, fontSize:15, cursor:'pointer' }}>
                Logout
              </button>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <Link to="/login" onClick={close} style={{ display:'block', textAlign:'center', padding:'13px', border:'1px solid rgba(60,100,40,.14)', borderRadius:14, color:'#1a2415', textDecoration:'none', fontWeight:600, fontSize:15, background:'#fff' }}>Login</Link>
                <Link to="/register" onClick={close} style={{ display:'block', textAlign:'center', padding:'13px', background:'#4e9e2a', borderRadius:14, color:'#fff', textDecoration:'none', fontWeight:700, fontSize:15 }}>Join Free</Link>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn    { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        @media (max-width: 768px) {
          #desktop-nav  { display: none !important; }
          #desktop-auth { display: none !important; }
          #hamburger    { display: flex !important; }
        }
      `}</style>
    </>
  );
}