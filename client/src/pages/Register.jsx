import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const s = {
  wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 40, width: '100%', maxWidth: 440 },
  title: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--white)', marginBottom: 6 },
  sub: { fontSize: 14, color: 'var(--muted)', marginBottom: 32 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' },
  input: { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: 20 },
  select: { width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: 20 },
  btn: { width: '100%', background: 'var(--green-hi)', color: '#fff', border: 'none', borderRadius: 99, padding: '14px', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginTop: 4 },
  err: { background: 'rgba(224,85,85,.12)', border: '1px solid rgba(224,85,85,.3)', color: '#e05555', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 20 },
  link: { color: 'var(--green-lt)', textDecoration: 'none' },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--muted)' },
};

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer', location: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate  = useNavigate();
  const { register } = useAuth();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'farmer' ? '/dashboard' : '/marketplace');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.title}>Join KrishiConnect</div>
        <div style={s.sub}>Create your account to get started</div>
        {error && <div style={s.err}>{error}</div>}
        <label style={s.label}>Full Name</label>
        <input style={s.input} name="name" placeholder="Your full name" value={form.name} onChange={handleChange} />
        <label style={s.label}>Email</label>
        <input style={s.input} name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} />
        <label style={s.label}>Password</label>
        <input style={s.input} name="password" type="password" placeholder="Min 6 characters" value={form.password} onChange={handleChange} />
        <label style={s.label}>I am a...</label>
        <select style={s.select} name="role" value={form.role} onChange={handleChange}>
          <option value="customer">Customer</option>
          <option value="farmer">Farmer</option>
        </select>
        <label style={s.label}>Location (optional)</label>
        <input style={s.input} name="location" placeholder="City, District..." value={form.location} onChange={handleChange} />
        <button style={s.btn} onClick={handleSubmit} disabled={loading}>{loading ? 'Creating account...' : 'Create Account'}</button>
        <div style={s.footer}>Already have an account? <Link to="/login" style={s.link}>Sign in</Link></div>
      </div>
    </div>
  );
}
