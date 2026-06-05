import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

const s = {
  page:      { minHeight: '100vh', padding: '24px 16px', maxWidth: 900, margin: '0 auto' },
  backBtn:   { background: 'transparent', border: '1px solid rgba(60,100,40,.1)', borderRadius: 99, padding: '7px 16px', color: '#7a9070', fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 13, cursor: 'pointer', marginBottom: 24, display: 'inline-block' },
  topCard:   { background: '#fff', border: '1px solid rgba(60,100,40,.1)', borderRadius: 20, padding: '16px', marginBottom: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' },
  avatar:    { width: 80, height: 80, borderRadius: '50%', background: '#e8f5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#4e9e2a', flexShrink: 0 },
  name:      { fontSize: 24, fontWeight: 800, color: '#1a2415', marginBottom: 2 },
  farmName:  { fontSize: 14, color: '#4e9e2a', marginBottom: 4 },
  email:     { fontSize: 13, color: '#7a9070', marginBottom: 8 },
  badgeRow:  { display: 'flex', gap: 8, flexWrap: 'wrap' },
  roleBadge: { display: 'inline-block', background: '#e8f5e1', color: '#4e9e2a', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 99, border: '1px solid rgba(78,158,42,.2)' },
  verified:  { display: 'inline-block', background: 'rgba(29,158,117,.12)', color: '#1d9e75', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 99, border: '1px solid rgba(29,158,117,.25)' },
  unverified:{ display: 'inline-block', background: 'rgba(240,184,64,.1)', color: '#f0b840', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 99, border: '1px solid rgba(240,184,64,.25)' },
  grid4:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 16, marginBottom: 24 },
  statCard:  { background: '#fff', border: '1px solid rgba(60,100,40,.1)', borderRadius: 16, padding: 16 },
  statLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: '#7a9070', marginBottom: 8 },
  statVal:   { fontSize: 26, fontWeight: 800, color: '#1a2415' },
  section:   { background: '#fff', border: '1px solid rgba(60,100,40,.1)', borderRadius: 20, padding: '16px', marginBottom: 24 },
  secTitle:  { fontSize: 16, fontWeight: 600, color: '#1a2415', marginBottom: 20 },
  label:     { display: 'block', fontSize: 12, fontWeight: 600, color: '#7a9070', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' },
  input:     { width: '100%', background: '#f5f7f2', border: '1px solid rgba(60,100,40,.1)', borderRadius: 10, padding: '12px 16px', color: '#1a2415', fontSize: 14, outline: 'none', fontFamily: 'Plus Jakarta Sans,sans-serif', boxSizing: 'border-box', marginBottom: 18 },
  row2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  saveBtn:   { background: '#4e9e2a', color: '#fff', border: 'none', borderRadius: 99, padding: '11px 28px', fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  success:   { background: '#e8f5e1', border: '1px solid rgba(90,176,48,.3)', color: '#4e9e2a', borderRadius: 10, padding: '10px 16px', fontSize: 13, marginBottom: 16 },
  error:     { background: 'rgba(224,85,85,.12)', border: '1px solid rgba(224,85,85,.3)', color: '#e05555', borderRadius: 10, padding: '10px 16px', fontSize: 13, marginBottom: 16 },
  orderRow:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(60,100,40,.12)', flexWrap: 'wrap', gap: 8 },
  quickGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 12, marginBottom: 24 },
  quickCard: { background: '#fff', border: '1px solid rgba(60,100,40,.1)', borderRadius: 14, padding: 18, textDecoration: 'none', color: 'inherit', display: 'block', textAlign: 'center' },
  quickIcon: { fontSize: 24, marginBottom: 8 },
  quickLbl:  { fontSize: 13, fontWeight: 600, color: '#1a2415' },
};

const statusColor = { delivered: ['rgba(90,176,48,.2)','#5ab030'], pending: ['rgba(240,184,64,.15)','#f0b840'], cancelled: ['rgba(224,85,85,.12)','#e05555'], confirmed: ['rgba(90,176,48,.1)','#7ed44c'], out_for_delivery: ['rgba(29,158,117,.12)','#1d9e75'] };

export default function FarmerAccountProfile() {
  const navigate = useNavigate();
  const { user, login } = useAuth();

  const [form, setForm]   = useState({ name: '', phone: '', farmName: '', farmSize: '', district: '', address: '' });
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, reviews: 0, rating: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  const [msg, setMsg]       = useState('');
  const [err, setErr]       = useState('');
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm]   = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg]     = useState('');
  const [pwErr, setPwErr]     = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name:     user.name     || '',
        phone:    user.phone    || '',
        farmName: user.farmName || '',
        farmSize: user.farmSize || '',
        district: user.location?.district || '',
        address:  user.location?.address  || '',
      });
    }
    // Load analytics stats
    api.get('/analytics/farmer').then(r => {
      const k = r.data.kpis || r.data;
      setStats({
        products: k.totalProducts   || 0,
        orders:   k.totalOrders     || 0,
        revenue:  k.totalRevenue    || 0,
        reviews:  k.totalReviews    || 0,
        rating:   k.averageRating   || 0,
      });
    }).catch(() => {});
    // Load recent orders
    api.get('/orders/farmer').then(r => {
      const list = Array.isArray(r.data) ? r.data : r.data.orders || [];
      setRecentOrders(list.slice(0, 4));
    }).catch(() => {});
  }, [user]);

  const handleSave = async () => {
    setSaving(true); setMsg(''); setErr('');
    try {
      const { data } = await api.put('/auth/profile', form);
      if (login) login({ ...user, ...data.user });
      setMsg('Profile updated successfully!');
    } catch (e) { setErr(e.response?.data?.message || 'Update failed.'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    setPwMsg(''); setPwErr('');
    if (!pwForm.current || !pwForm.newPw)  { setPwErr('Fill in all password fields.'); return; }
    if (pwForm.newPw !== pwForm.confirm)    { setPwErr('New passwords do not match.'); return; }
    if (pwForm.newPw.length < 6)            { setPwErr('Password must be at least 6 characters.'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwMsg('Password changed successfully!');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (e) { setPwErr(e.response?.data?.message || 'Failed to change password.'); }
    finally { setPwSaving(false); }
  };

  const hc = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  return (
    <div style={s.page}>
      <button style={s.backBtn} onClick={() => navigate(-1)}>← Back</button>

      {/* Top card */}
      <div style={s.topCard}>
        <div style={s.avatar}>{user?.name?.[0]?.toUpperCase() || 'F'}</div>
        <div style={{ flex: 1 }}>
          <div style={s.name}>{user?.name}</div>
          {user?.farmName && <div style={s.farmName}>🌾 {user.farmName}</div>}
          <div style={s.email}>{user?.email}</div>
          <div style={s.badgeRow}>
            <span style={s.roleBadge}>Farmer</span>
            {user?.isVerified
              ? <span style={s.verified}>✓ Verified</span>
              : <span style={s.unverified}>⏳ Pending Verification</span>
            }
            {user?.location?.district && <span style={{ fontSize: 12, color: '#7a9070' }}>📍 {user.location.district}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/dashboard" style={{ background: '#4e9e2a', color: '#fff', borderRadius: 99, padding: '9px 20px', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Dashboard</Link>
          <Link to="/dashboard/analytics" style={{ background: 'transparent', color: '#4e9e2a', border: '1px solid rgba(90,176,48,.3)', borderRadius: 99, padding: '9px 20px', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Analytics</Link>
        </div>
      </div>

      {/* Stats */}
      <div style={s.grid4}>
        <div style={s.statCard}><div style={s.statLabel}>Products</div><div style={s.statVal}>{stats.products}</div></div>
        <div style={s.statCard}><div style={s.statLabel}>Total Orders</div><div style={s.statVal}>{stats.orders}</div></div>
        <div style={s.statCard}><div style={s.statLabel}>Revenue</div><div style={{ ...s.statVal, fontSize: 20, color: '#4e9e2a' }}>BDT {stats.revenue.toLocaleString()}</div></div>
        <div style={s.statCard}><div style={s.statLabel}>Avg Rating</div><div style={{ ...s.statVal, color: '#f0b840' }}>{stats.rating > 0 ? `${stats.rating.toFixed(1)} ★` : '—'}</div></div>
      </div>

      {/* Quick actions */}
      <div style={s.quickGrid}>
        {[
          { to: '/dashboard/products', icon: '🌿', label: 'My Products' },
          { to: '/dashboard/add',      icon: '➕', label: 'Add Product' },
          { to: '/dashboard/orders',   icon: '📦', label: 'Orders' },
          { to: '/dashboard/chat',     icon: '💬', label: 'Messages' },
        ].map(q => (
          <Link key={q.to} to={q.to} style={s.quickCard}>
            <div style={s.quickIcon}>{q.icon}</div>
            <div style={s.quickLbl}>{q.label}</div>
          </Link>
        ))}
      </div>

      {/* Edit profile */}
      <div style={s.section}>
        <div style={s.secTitle}>Edit Profile</div>
        {msg && <div style={s.success}>{msg}</div>}
        {err && <div style={s.error}>{err}</div>}
        <div style={s.row2}>
          <div>
            <label style={s.label}>Full Name</label>
            <input style={s.input} name="name" value={form.name} onChange={hc} placeholder="Your name" />
          </div>
          <div>
            <label style={s.label}>Phone</label>
            <input style={s.input} name="phone" value={form.phone} onChange={hc} placeholder="01XXXXXXXXX" />
          </div>
        </div>
        <div style={s.row2}>
          <div>
            <label style={s.label}>Farm Name</label>
            <input style={s.input} name="farmName" value={form.farmName} onChange={hc} placeholder="e.g. Rahim's Organic Farm" />
          </div>
          <div>
            <label style={s.label}>Farm Size</label>
            <input style={s.input} name="farmSize" value={form.farmSize} onChange={hc} placeholder="e.g. 2 acres" />
          </div>
        </div>
        <div style={s.row2}>
          <div>
            <label style={s.label}>District</label>
            <input style={s.input} name="district" value={form.district} onChange={hc} placeholder="e.g. Manikganj" />
          </div>
          <div>
            <label style={s.label}>Full Address</label>
            <input style={s.input} name="address" value={form.address} onChange={hc} placeholder="Village, Upazila..." />
          </div>
        </div>
        <button style={s.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>

      {/* Recent orders received */}
      <div style={s.section}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={s.secTitle}>Recent Orders Received</div>
          <Link to="/dashboard/orders" style={{ fontSize: 13, color: '#4e9e2a', textDecoration: 'none' }}>View All →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div style={{ color: '#7a9070', fontSize: 14 }}>No orders received yet.</div>
        ) : recentOrders.map(o => {
          const [bg, color] = statusColor[o.status] || statusColor.pending;
          return (
            <div key={o._id} style={s.orderRow}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2415', marginBottom: 2 }}>
                  {o.customer?.name || 'Customer'} — {o.items?.map(i => i.name).join(', ')}
                </div>
                <div style={{ fontSize: 12, color: '#7a9070' }}>
                  {new Date(o.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#4e9e2a' }}>BDT {o.totalAmount?.toLocaleString()}</span>
                <span style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, textTransform: 'capitalize' }}>{o.status?.replace(/_/g,' ')}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Change password */}
      <div style={s.section}>
        <div style={s.secTitle}>Change Password</div>
        {pwMsg && <div style={s.success}>{pwMsg}</div>}
        {pwErr && <div style={s.error}>{pwErr}</div>}
        <div style={s.row2}>
          <div>
            <label style={s.label}>Current Password</label>
            <input style={s.input} type="password" value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} placeholder="........" />
          </div>
          <div>
            <label style={s.label}>New Password</label>
            <input style={s.input} type="password" value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} placeholder="Min 6 characters" />
          </div>
        </div>
        <label style={s.label}>Confirm New Password</label>
        <input style={{ ...s.input, maxWidth: 360 }} type="password" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} placeholder="Repeat new password" />
        <button style={s.saveBtn} onClick={handlePasswordChange} disabled={pwSaving}>{pwSaving ? 'Saving...' : 'Change Password'}</button>
      </div>
    </div>
  );
}
