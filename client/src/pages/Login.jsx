import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [focusField, setFocusField] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'farmer' ? '/dashboard' : '/marketplace');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width:'100%', background: focusField===field ? '#f9faf7' : '#f5f7f2',
    border: `1.5px solid ${focusField===field ? '#4e9e2a' : 'rgba(60,100,40,.15)'}`,
    borderRadius:14, padding:'14px 18px', color:'#1a2415', fontSize:15,
    outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif',
    boxShadow: focusField===field ? '0 0 0 3px rgba(78,158,42,.1)' : 'none',
    transition:'all .2s ease', boxSizing:'border-box', marginBottom:20,
  });

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', display:'flex' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Left image panel (desktop) */}
      <div id="login-left" style={{ flex:1, position:'relative', overflow:'hidden', display:'none' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=70')", backgroundSize:'cover', backgroundPosition:'center' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,rgba(10,40,5,.5),rgba(10,40,5,.8))' }} />
        <div style={{ position:'relative', zIndex:2, padding:56, display:'flex', flexDirection:'column', justifyContent:'flex-end', height:'100%' }}>
          <div style={{ fontSize:36, fontWeight:800, color:'#fff', letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:16 }}>
            Fresh from the<br /><span style={{ color:'#a8e07a', fontFamily:'Fraunces,serif', fontStyle:'italic' }}>farm to your door</span>
          </div>
          <div style={{ fontSize:14, color:'rgba(255,255,255,.6)', lineHeight:1.7 }}>Join 2,400+ verified farmers and thousands of happy customers.</div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ width:'100%', maxWidth:420, animation:'fadeUp .5s cubic-bezier(.22,1,.36,1) both' }}>
          
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40 }}>
            <img src="/icons/icon-192.png" alt="KrishiConnect" style={{ width:40, height:40, borderRadius:12, objectFit:"cover" }} />
            <span style={{ fontSize:18, fontWeight:800, color:'#1a2415', letterSpacing:'-0.03em' }}>KrishiConnect</span>
          </div>

          <div style={{ fontSize:28, fontWeight:800, letterSpacing:'-0.03em', color:'#1a2415', marginBottom:6 }}>Welcome back 👋</div>
          <div style={{ fontSize:14, color:'#7a9070', marginBottom:36, lineHeight:1.5 }}>Sign in to your KrishiConnect account</div>

          {error && (
            <div style={{ background:'rgba(192,64,64,.08)', border:'1.5px solid rgba(192,64,64,.2)', color:'#c04040', borderRadius:12, padding:'13px 16px', fontSize:13, marginBottom:24, display:'flex', alignItems:'center', gap:8 }}>
              ⚠️ {error}
            </div>
          )}

          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#7a9070', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Email Address</label>
          <input
            style={inputStyle('email')} type="email" placeholder="you@example.com"
            value={email} onChange={e => setEmail(e.target.value)}
            onFocus={() => setFocusField('email')} onBlur={() => setFocusField('')}
          />

          <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#7a9070', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Password</label>
          <input
            style={inputStyle('password')} type="password" placeholder="Enter your password"
            value={password} onChange={e => setPassword(e.target.value)}
            onFocus={() => setFocusField('password')} onBlur={() => setFocusField('')}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />

          <button
            onClick={handleSubmit} disabled={loading}
            style={{ width:'100%', background: loading ? '#afc09e' : 'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', border:'none', borderRadius:99, padding:'15px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15, cursor: loading ? 'default' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(78,158,42,.4)', transition:'all .2s', marginTop:4, letterSpacing:'-.01em' }}>
            {loading ? '⏳ Signing in...' : 'Sign In →'}
          </button>

          <div style={{ textAlign:'center', marginTop:28, fontSize:14, color:'#7a9070' }}>
            Don't have an account? <Link to="/register" style={{ color:'#4e9e2a', textDecoration:'none', fontWeight:700 }}>Join Free →</Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) { #login-left { display: flex !important; } }
      `}</style>
    </div>
  );
}
