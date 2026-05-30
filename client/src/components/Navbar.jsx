import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname }     = useLocation();
  const navigate         = useNavigate();
  const active = (p) => pathname === p || pathname.startsWith(p + '/');

  const NavLink = ({ to, children }) => (
    <Link to={to} style={{ color: active(to) ? 'var(--green-lt)' : 'rgba(240,244,236,.55)', fontSize: 14, fontWeight: 400, textDecoration: 'none', transition: 'color .2s' }}>
      {children}
    </Link>
  );

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,15,8,.88)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', height: 64 }}>

      {/* Logo */}
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
        <div style={{ width:32, height:32, background:'var(--green-hi)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>🌱</div>
        <span style={{ fontSize:17, fontWeight:700, color:'var(--white)', letterSpacing:'-0.02em' }}>KrishiConnect</span>
      </Link>

      {/* Nav links */}
      <div style={{ display:'flex', gap:28 }}>
        <NavLink to="/marketplace">Marketplace</NavLink>
        <NavLink to="/map">Find Farmers</NavLink>
        {user?.role === 'farmer' && <>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/dashboard/analytics">Analytics</NavLink>
          <NavLink to="/dashboard/chat">Messages</NavLink>
        </>}
        {user?.role === 'customer' && <>
          <NavLink to="/orders">My Orders</NavLink>
          <NavLink to="/chat">Messages</NavLink>
        </>}
      </div>

      {/* Auth */}
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        {user && <NotificationBell />}
        {user ? (
          <>
            {/* Clickable name → profile */}
            <Link
              to={user.role === 'customer' ? '/profile' : '/dashboard/profile'}
              style={{ fontSize:13, color:'var(--muted)', textDecoration:'none' }}
            >
              Hi, <strong style={{ color:'var(--white)' }}>{user.name.split(' ')[0]}</strong>
            </Link>
            <button
              onClick={() => { logout(); navigate('/'); }}
              style={{ fontSize:13, padding:'8px 18px', background:'transparent', border:'1px solid var(--border)', borderRadius:99, color:'var(--muted)', cursor:'pointer', fontFamily:'Sora,sans-serif' }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login"    style={{ fontSize:13, color:'var(--muted)', textDecoration:'none' }}>Login</Link>
            <Link to="/register" style={{ fontSize:13, padding:'8px 20px', textDecoration:'none', background:'var(--green-hi)', color:'#fff', borderRadius:99, fontWeight:600 }}>Join Free</Link>
          </>
        )}
      </div>
    </nav>
  );
}
