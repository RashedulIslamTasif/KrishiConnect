import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const s = {
  page:     { minHeight: '100vh', padding: '36px 48px', maxWidth: 900, margin: '0 auto' },
  backBtn:  { background: 'transparent', border: '1px solid var(--border)', borderRadius: 99, padding: '7px 16px', color: 'var(--muted)', fontFamily: 'Sora,sans-serif', fontSize: 13, cursor: 'pointer', marginBottom: 24, display: 'inline-block' },
  topCard:  { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' },
  avatar:   { width: 80, height: 80, borderRadius: '50%', background: 'rgba(90,176,48,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: 'var(--green-lt)', flexShrink: 0 },
  name:     { fontSize: 24, fontWeight: 700, color: 'var(--white)', marginBottom: 4 },
  email:    { fontSize: 14, color: 'var(--muted)', marginBottom: 4 },
  role:     { display: 'inline-block', background: 'rgba(90,176,48,.12)', color: 'var(--green-lt)', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 99, border: '1px solid rgba(90,176,48,.25)' },
  grid:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 },
  statCard: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 },
  statLabel:{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 8 },
  statVal:  { fontSize: 26, fontWeight: 700, color: 'var(--white)' },
  section:  { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, marginBottom: 24 },
  secTitle: { fontSize: 16, fontWeight: 600, color: 'var(--white)', marginBottom: 20 },
  label:    { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' },
  input:    { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: 18 },
  saveBtn:  { background: 'var(--green-hi)', color: '#fff', border: 'none', borderRadius: 99, padding: '11px 28px', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  success:  { background: 'rgba(90,176,48,.12)', border: '1px solid rgba(90,176,48,.3)', color: 'var(--green-lt)', borderRadius: 10, padding: '10px 16px', fontSize: 13, marginBottom: 16 },
  error:    { background: 'rgba(224,85,85,.12)', border: '1px solid rgba(224,85,85,.3)', color: '#e05555', borderRadius: 10, padding: '10px 16px', fontSize: 13, marginBottom: 16 },
  orderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 },
  badge:    (status) => {
    const m = { delivered: ['rgba(90,176,48,.2)','#5ab030'], pending: ['rgba(240,184,64,.15)','#f0b840'], cancelled: ['rgba(224,85,85,.12)','#e05555'] };
    const [bg, color] = m[status] || m.pending;
    return { background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, textTransform: 'capitalize' };
  },
  pwInput:  { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: 18 },
};

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [form, setForm]     = useState({ name: '', phone: '', location: '' });
  const [orders, setOrders] = useState([]);
  const [stats, setStats]   = useState({ total: 0, delivered: 0, spent: 0 });
  const [msg, setMsg]       = useState('');
  const [err, setErr]       = useState('');
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg]     = useState('');
  const [pwErr, setPwErr]     = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ name: user.name || '', phone: user.phone || '', location: user.location?.district || user.location?.address || '' });
    api.get('/orders/my').then(r => {
      const list = Array.isArray(r.data) ? r.data : r.data.orders || [];
      setOrders(list.slice(0, 5));
      setStats({
        total:     list.length,
        delivered: list.filter(o => o.status === 'delivered').length,
        spent:     list.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.totalAmount || 0), 0),
      });
    }).catch(() => {});
  }, [user]);

  const handleSave = async () => {
    setSaving(true); setMsg(''); setErr('');
    try {
      const { data } = await api.put('/auth/profile', { name: form.name, phone: form.phone, district: form.location });
      if (login) login({ ...user, ...data.user });
      setMsg('Profile updated successfully!');
    } catch (e) { setErr(e.response?.data?.message || 'Update failed.'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    setPwMsg(''); setPwErr('');
    if (!pwForm.current || !pwForm.newPw) { setPwErr('Fill in all password fields.'); return; }
    if (pwForm.newPw !== pwForm.confirm)  { setPwErr('New passwords do not match.'); return; }
    if (pwForm.newPw.length < 6)          { setPwErr('Password must be at least 6 characters.'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwMsg('Password changed successfully!');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (e) { setPwErr(e.response?.data?.message || 'Failed to change password.'); }
    finally { setPwSaving(false); }
  };

  return (
    <div style={s.page}>
      <button style={s.backBtn} onClick={() => navigate(-1)}>← Back</button>

      {/* Top card */}
      <div style={s.topCard}>
        <div style={s.avatar}>{user?.name?.[0]?.toUpperCase() || '?'}</div>
        <div>
          <div style={s.name}>{user?.name}</div>
          <div style={s.email}>{user?.email}</div>
          <span style={s.role}>🛒 Customer</span>
        </div>
      </div>

      {/* Stats */}
      <div style={s.grid}>
        <div style={s.statCard}><div style={s.statLabel}>Total Orders</div><div style={s.statVal}>{stats.total}</div></div>
        <div style={s.statCard}><div style={s.statLabel}>Delivered</div><div style={s.statVal}>{stats.delivered}</div></div>
        <div style={s.statCard}><div style={s.statLabel}>Total Spent</div><div style={{ ...s.statVal, color: 'var(--green-lt)' }}>BDT {stats.spent.toLocaleString()}</div></div>
        <div style={s.statCard}><div style={s.statLabel}>Member Since</div><div style={{ ...s.statVal, fontSize: 18 }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-BD', { month: 'short', year: 'numeric' }) : '—'}</div></div>
      </div>

      {/* Edit Profile */}
      <div style={s.section}>
        <div style={s.secTitle}>Edit Profile</div>
        {msg && <div style={s.success}>{msg}</div>}
        {err && <div style={s.error}>{err}</div>}
        <label style={s.label}>Full Name</label>
        <input style={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" />
        <label style={s.label}>Phone Number</label>
        <input style={s.input} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01XXXXXXXXX" />
        <label style={s.label}>Location / District</label>
        <input style={s.input} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Dhaka, Chittagong..." />
        <button style={s.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>

      {/* Recent Orders */}
      <div style={s.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={s.secTitle}>Recent Orders</div>
          <Link to="/orders" style={{ fontSize: 13, color: 'var(--green-lt)', textDecoration: 'none' }}>View All →</Link>
        </div>
        {orders.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 14 }}>No orders yet. <Link to="/marketplace" style={{ color: 'var(--green-lt)' }}>Shop now</Link></div>
        ) : orders.map(o => (
          <div key={o._id} style={s.orderRow}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)', marginBottom: 2 }}>
                {o.items?.map(i => i.name || 'Product').join(', ')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {new Date(o.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-lt)' }}>BDT {o.totalAmount?.toLocaleString()}</span>
              <span style={s.badge(o.status)}>{o.status?.replace(/_/g, ' ')}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Change Password */}
      <div style={s.section}>
        <div style={s.secTitle}>Change Password</div>
        {pwMsg && <div style={s.success}>{pwMsg}</div>}
        {pwErr && <div style={s.error}>{pwErr}</div>}
        <label style={s.label}>Current Password</label>
        <input style={s.pwInput} type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="........" />
        <label style={s.label}>New Password</label>
        <input style={s.pwInput} type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} placeholder="Min 6 characters" />
        <label style={s.label}>Confirm New Password</label>
        <input style={s.pwInput} type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repeat new password" />
        <button style={s.saveBtn} onClick={handlePasswordChange} disabled={pwSaving}>{pwSaving ? 'Saving...' : 'Change Password'}</button>
      </div>
    </div>
  );
}
