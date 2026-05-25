import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const s = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 40, width: '100%', maxWidth: 420 },
  title: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--white)', marginBottom: 6 },
  sub: { fontSize: 14, color: 'var(--muted)', marginBottom: 32 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' },
  input: { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: 20 },
  btn: { width: '100%', background: 'var(--green-hi)', color: '#fff', border: 'none', borderRadius: 99, padding: '14px', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginTop: 4 },
  err: { background: 'rgba(224,85,85,.12)', border: '1px solid rgba(224,85,85,.3)', color: '#e05555', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 20 },
  link: { color: 'var(--green-lt)', textDecoration: 'none' },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--muted)' },
};

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
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

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.title}>Welcome back</div>
        <div style={s.sub}>Sign in to your KrishiConnect account</div>
        {error && <div style={s.err}>{error}</div>}
        <label style={s.label}>Email</label>
        <input style={s.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        <label style={s.label}>Password</label>
        <input style={s.input} type="password" placeholder="........" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        <button style={s.btn} onClick={handleSubmit} disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</button>
        <div style={s.footer}>Don't have an account? <Link to="/register" style={s.link}>Register</Link></div>
      </div>
    </div>
  );
}
