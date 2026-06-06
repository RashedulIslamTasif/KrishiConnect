import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

const STATUS_COLOR = {
  delivered:        { bg:'#e8f5e1', color:'#3a7d1e',  label:'Delivered'     },
  pending:          { bg:'#fef3d8', color:'#c47d0a',   label:'Pending'       },
  confirmed:        { bg:'#e8f5e1', color:'#4e9e2a',   label:'Confirmed'     },
  out_for_delivery: { bg:'#e0f4ef', color:'#1d9e75',   label:'Out for Delivery' },
  cancelled:        { bg:'#fde8e8', color:'#c04040',   label:'Cancelled'     },
  harvested:        { bg:'#fef3d8', color:'#c47d0a',   label:'Harvested'     },
};

function Alert({ type, msg }) {
  if (!msg) return null;
  const ok = type === 'success';
  return (
    <div style={{
      background: ok ? '#e8f5e1' : '#fde8e8',
      border: `1px solid ${ok ? 'rgba(78,158,42,.3)' : 'rgba(192,64,64,.25)'}`,
      color: ok ? '#3a7d1e' : '#c04040',
      borderRadius:12, padding:'12px 16px', fontSize:13, fontWeight:600,
      marginBottom:16, display:'flex', alignItems:'center', gap:8,
      animation:'fadeIn .3s ease both',
    }}>
      {ok ? '✓' : '⚠'} {msg}
    </div>
  );
}

function StatCard({ icon, label, value, color='#1a2415', bg='#e8f5e1', sub, delay=0 }) {
  return (
    <div className="stat-hover" style={{
      background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:20,
      padding:'18px 16px', transition:'all .25s cubic-bezier(.22,1,.36,1)',
      boxShadow:'0 2px 8px rgba(20,50,10,.05)',
      animation:`fadeUp .5s ${delay}ms cubic-bezier(.22,1,.36,1) both`,
    }}>
      <div style={{ width:40, height:40, borderRadius:12, background:bg,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em',
        color:'#afc09e', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color, letterSpacing:'-0.04em', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'#afc09e', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function SectionCard({ title, icon, children, delay=0, action }) {
  return (
    <div style={{
      background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:24,
      overflow:'hidden', marginBottom:20,
      boxShadow:'0 2px 12px rgba(20,50,10,.06)',
      animation:`fadeUp .5s ${delay}ms cubic-bezier(.22,1,.36,1) both`,
    }}>
      <div style={{ padding:'20px 24px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:12, background:'#e8f5e1',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
          <span style={{ fontSize:15, fontWeight:800, color:'#1a2415', letterSpacing:'-0.02em' }}>{title}</span>
        </div>
        {action}
      </div>
      <div style={{ padding:'16px 24px 24px' }}>{children}</div>
    </div>
  );
}

function InputField({ label, name, value, onChange, placeholder, type='text', focus, onFocus, onBlur }) {
  const focused = focus === name;
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a9070',
        textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => onFocus(name)} onBlur={() => onBlur('')}
        style={{
          width:'100%', borderRadius:14, padding:'13px 16px', fontSize:14, outline:'none',
          fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box',
          background: focused ? '#f9faf7' : '#f5f7f2',
          border: `1.5px solid ${focused ? '#4e9e2a' : 'rgba(60,100,40,.12)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(78,158,42,.1)' : 'none',
          color:'#1a2415', transition:'all .2s',
        }} />
    </div>
  );
}

function QuickAction({ to, icon, label, color='#4e9e2a', bg='#e8f5e1' }) {
  return (
    <Link to={to} style={{ textDecoration:'none' }}>
      <div className="quick-action" style={{
        background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:18,
        padding:'18px 14px', textAlign:'center', transition:'all .25s cubic-bezier(.22,1,.36,1)',
        boxShadow:'0 2px 6px rgba(20,50,10,.05)', cursor:'pointer',
      }}>
        <div style={{ width:44, height:44, borderRadius:14, background:bg,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:22, margin:'0 auto 10px' }}>{icon}</div>
        <div style={{ fontSize:12, fontWeight:700, color:'#1a2415' }}>{label}</div>
      </div>
    </Link>
  );
}

const TABS = [
  { key:'profile',  label:'Profile',  icon:'👤' },
  { key:'farm',     label:'Farm',     icon:'🌾' },
  { key:'orders',   label:'Orders',   icon:'📦' },
  { key:'security', label:'Security', icon:'🔒' },
];

export default function FarmerAccountProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [focus,     setFocus]     = useState('');

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [avatarSaving,  setAvatarSaving]  = useState(false);

  const [form,    setForm]    = useState({ name:'', phone:'', farmName:'', farmSize:'', district:'', address:'' });
  const [stats,   setStats]   = useState({ products:0, orders:0, revenue:0, reviews:0, rating:0, customers:0 });
  const [recentOrders, setRecentOrders] = useState([]);

  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');
  const [saving,  setSaving]  = useState(false);

  const [pwForm,   setPwForm]   = useState({ current:'', newPw:'', confirm:'' });
  const [pwMsg,    setPwMsg]    = useState('');
  const [pwErr,    setPwErr]    = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    setForm({
      name:     user.name     || '',
      phone:    user.phone    || '',
      farmName: user.farmName || '',
      farmSize: user.farmSize || '',
      district: user.location?.district || '',
      address:  user.location?.address  || '',
    });
    if (user.avatar) setAvatarPreview(user.avatar);

    api.get('/analytics/farmer').then(r => {
      const k = r.data.kpis || r.data;
      setStats({
        products:  k.totalProducts   || 0,
        orders:    k.totalOrders     || 0,
        revenue:   k.totalRevenue    || 0,
        reviews:   k.totalReviews    || 0,
        rating:    k.avgRating || k.averageRating || 0,
        customers: k.uniqueCustomers || 0,
      });
    }).catch(()=>{});

    api.get('/orders/farmer').then(r => {
      const list = Array.isArray(r.data) ? r.data : r.data.orders||[];
      setRecentOrders(list.slice(0,5));
    }).catch(()=>{});
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;
    setAvatarSaving(true);
    try {
      const fd = new FormData();
      fd.append('avatar', avatarFile);
      const { data } = await api.put('/auth/profile', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      const savedUser = data.user;
      updateUser(savedUser);
      // Replace local blob: URL with the persisted Cloudinary URL
      if (savedUser?.avatar) setAvatarPreview(savedUser.avatar);
      setAvatarFile(null);
      setMsg('Profile picture updated!');
    } catch { setErr('Failed to upload photo.'); }
    finally { setAvatarSaving(false); }
  };

  const handleSave = async () => {
    setSaving(true); setMsg(''); setErr('');
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      setMsg('Profile updated successfully!');
    } catch(e) { setErr(e.response?.data?.message||'Update failed.'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    setPwMsg(''); setPwErr('');
    if (!pwForm.current||!pwForm.newPw)  { setPwErr('Fill in all password fields.'); return; }
    if (pwForm.newPw !== pwForm.confirm)  { setPwErr('New passwords do not match.'); return; }
    if (pwForm.newPw.length < 6)          { setPwErr('Password must be at least 6 characters.'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword:pwForm.current, newPassword:pwForm.newPw });
      setPwMsg('Password changed successfully!');
      setPwForm({ current:'', newPw:'', confirm:'' });
    } catch(e) { setPwErr(e.response?.data?.message||'Failed to change password.'); }
    finally { setPwSaving(false); }
  };

  const hc = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || 'F';
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-BD',{month:'long',year:'numeric'}) : '—';

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
        .avatar-ring:hover .avatar-overlay { opacity:1 !important; }
        .stat-hover:hover  { transform:translateY(-3px); box-shadow:0 8px 24px rgba(20,50,10,.1) !important; }
        .quick-action:hover { transform:translateY(-3px); box-shadow:0 8px 20px rgba(20,50,10,.1) !important; }
        .order-row:hover   { background:#f9faf7 !important; }
        .tab-btn:hover     { background:rgba(78,158,42,.08) !important; }
      `}</style>

      {/* ── Hero banner ── */}
      <div style={{
        background:'linear-gradient(135deg,#0d2408 0%,#1a3a10 45%,#2d5a1e 100%)',
        padding:'0 0 88px', position:'relative', overflow:'hidden',
      }}>
        {/* decorative */}
        <div style={{ position:'absolute', top:-80, right:-80, width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,.03)' }} />
        <div style={{ position:'absolute', bottom:-30, left:60, width:140, height:140, borderRadius:'50%', background:'rgba(78,158,42,.08)' }} />

        <div style={{ maxWidth:900, margin:'0 auto', padding:'24px 20px 0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:12 }}>
            <button onClick={() => navigate(-1)} style={{
              background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)',
              borderRadius:12, padding:'8px 16px', color:'#fff', fontSize:13, fontWeight:600,
              cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', backdropFilter:'blur(8px)',
            }}>← Back</button>
            <div style={{ display:'flex', gap:10 }}>
              <Link to="/dashboard" style={{
                background:'rgba(255,255,255,.15)', color:'#fff',
                borderRadius:12, padding:'8px 18px', textDecoration:'none',
                fontSize:13, fontWeight:600, border:'1px solid rgba(255,255,255,.2)',
                backdropFilter:'blur(8px)',
              }}>Dashboard</Link>
              <Link to="/dashboard/analytics" style={{
                background:'#4e9e2a', color:'#fff', borderRadius:12,
                padding:'8px 18px', textDecoration:'none', fontSize:13, fontWeight:700,
                boxShadow:'0 2px 8px rgba(78,158,42,.4)',
              }}>Analytics →</Link>
            </div>
          </div>

          <div style={{ display:'flex', gap:24, alignItems:'flex-end', flexWrap:'wrap' }}>
            {/* Avatar with upload */}
            <div className="avatar-ring" style={{ position:'relative', flexShrink:0, cursor:'pointer' }}
              onClick={() => fileRef.current?.click()}>
              <div style={{
                width:100, height:100, borderRadius:'50%',
                border:'3px solid rgba(255,255,255,.25)', overflow:'hidden', position:'relative',
                boxShadow:'0 8px 28px rgba(0,0,0,.25)',
              }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <div style={{ width:'100%', height:'100%',
                      background:'linear-gradient(135deg,#4e9e2a,#1a3a10)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:34, fontWeight:800, color:'#fff' }}>{initials}</div>
                }
                <div className="avatar-overlay" style={{
                  position:'absolute', inset:0, background:'rgba(0,0,0,.55)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  opacity:0, transition:'opacity .2s', flexDirection:'column', gap:4,
                }}>
                  <span style={{ fontSize:22 }}>📷</span>
                  <span style={{ fontSize:10, color:'#fff', fontWeight:600 }}>Change</span>
                </div>
              </div>
              {/* Verified badge */}
              {user?.isVerified && (
                <div style={{
                  position:'absolute', bottom:2, right:2, width:26, height:26,
                  borderRadius:'50%', background:'#1d9e75', border:'2px solid #fff',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:12,
                }}>✓</div>
              )}
              {avatarFile && (
                <button onClick={e => { e.stopPropagation(); uploadAvatar(); }} disabled={avatarSaving}
                  style={{
                    position:'absolute', top:-4, right:-4, width:28, height:28,
                    borderRadius:'50%', background:'#4e9e2a', border:'2px solid #fff',
                    color:'#fff', fontSize:12, cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    animation: avatarSaving ? 'pulse 1s infinite' : 'none',
                    zIndex:10,
                  }}>
                  {avatarSaving ? '…' : '✓'}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:'none' }} />

            <div style={{ flex:1, paddingBottom:4 }}>
              <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                <span style={{ background:'rgba(255,255,255,.15)', color:'#fff', fontSize:11, fontWeight:700,
                  padding:'3px 12px', borderRadius:99, border:'1px solid rgba(255,255,255,.2)' }}>🌾 Farmer</span>
                {user?.isVerified
                  ? <span style={{ background:'rgba(29,158,117,.25)', color:'#6ee8c4', fontSize:11, fontWeight:700,
                      padding:'3px 12px', borderRadius:99, border:'1px solid rgba(29,158,117,.3)' }}>✓ Verified</span>
                  : <span style={{ background:'rgba(240,184,64,.15)', color:'#f0b840', fontSize:11, fontWeight:600,
                      padding:'3px 12px', borderRadius:99, border:'1px solid rgba(240,184,64,.25)' }}>⏳ Pending Verification</span>
                }
              </div>
              <div style={{ fontSize:'clamp(22px,4vw,32px)', fontWeight:800, color:'#fff',
                letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:4 }}>{user?.name}</div>
              {user?.farmName && (
                <div style={{ fontSize:15, color:'#a8e07a', fontWeight:600, marginBottom:4 }}>🌿 {user.farmName}</div>
              )}
              <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.55)' }}>{user?.email}</span>
                {user?.location?.district && <span style={{ fontSize:12, color:'rgba(255,255,255,.55)' }}>📍 {user.location.district}</span>}
                <span style={{ fontSize:12, color:'rgba(255,255,255,.45)' }}>Since {memberSince}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:'-64px auto 0', padding:'0 20px 48px', position:'relative', zIndex:2 }}>

        {/* ── Stats ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
          <StatCard icon="🌿" label="Products"   value={stats.products}  bg="#e8f5e1" delay={0}   />
          <StatCard icon="📦" label="Orders"     value={stats.orders}    bg="#e0f4ef" color="#1d9e75" delay={50}  />
          <StatCard icon="💰" label="Revenue"    value={`৳${stats.revenue.toLocaleString()}`} color="#4e9e2a" bg="#e8f5e1" delay={100} />
          <StatCard icon="⭐" label="Avg Rating" value={stats.rating > 0 ? `${stats.rating.toFixed(1)} ★` : '—'} color="#c47d0a" bg="#fef3d8" sub={`${stats.reviews} reviews`} delay={150} />
          <StatCard icon="👥" label="Customers"  value={stats.customers} bg="#eef0fa" color="#5060c0" delay={200} />
          <StatCard icon="💬" label="Reviews"    value={stats.reviews}   bg="#fde8e8" color="#c04040" delay={250} />
        </div>

        {/* ── Quick actions ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24,
          animation:'fadeUp .5s .15s cubic-bezier(.22,1,.36,1) both' }}>
          <QuickAction to="/dashboard/products" icon="🌿" label="My Products" />
          <QuickAction to="/dashboard/add"      icon="➕" label="Add Product"  bg="#fef3d8" />
          <QuickAction to="/dashboard/orders"   icon="📦" label="Orders"       bg="#e0f4ef" />
          <QuickAction to="/dashboard/chat"     icon="💬" label="Messages"     bg="#eef0fa" />
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display:'flex', gap:4, background:'#fff', borderRadius:16, padding:6,
          border:'1px solid rgba(60,100,40,.1)', marginBottom:24,
          boxShadow:'0 2px 8px rgba(20,50,10,.05)',
          animation:'fadeUp .4s .2s cubic-bezier(.22,1,.36,1) both',
        }}>
          {TABS.map(t => (
            <button key={t.key} className="tab-btn" onClick={() => setActiveTab(t.key)}
              style={{
                flex:1, border:'none', borderRadius:12, padding:'10px 6px',
                fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:12,
                cursor:'pointer', transition:'all .2s',
                background: activeTab===t.key ? '#4e9e2a' : 'transparent',
                color: activeTab===t.key ? '#fff' : '#7a9070',
                boxShadow: activeTab===t.key ? '0 2px 8px rgba(78,158,42,.3)' : 'none',
                display:'flex', alignItems:'center', justifyContent:'center', gap:5,
              }}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Profile tab ── */}
        {activeTab === 'profile' && (
          <SectionCard title="Personal Information" icon="✏️" delay={0}
            action={
              <button onClick={handleSave} disabled={saving} style={{
                background:'#4e9e2a', color:'#fff', border:'none', borderRadius:99,
                padding:'8px 20px', fontFamily:'Plus Jakarta Sans,sans-serif',
                fontWeight:700, fontSize:13, cursor:'pointer',
                boxShadow:'0 2px 8px rgba(78,158,42,.3)', opacity: saving ? .7 : 1,
              }}>{saving ? 'Saving…' : 'Save Changes'}</button>
            }>
            <Alert type="success" msg={msg} />
            <Alert type="error"   msg={err} />

            {/* Avatar upload hint */}
            <div style={{
              background:'linear-gradient(135deg,#f0f4ec,#e8f5e1)',
              border:'1px solid rgba(78,158,42,.15)', borderRadius:16,
              padding:'14px 18px', marginBottom:20,
              display:'flex', alignItems:'center', gap:14,
            }}>
              <div style={{ width:52, height:52, borderRadius:'50%', overflow:'hidden', flexShrink:0,
                border:'2px solid rgba(78,158,42,.2)' }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <div style={{ width:'100%', height:'100%', background:'#4e9e2a',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:20, fontWeight:800, color:'#fff' }}>{initials}</div>
                }
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#1a2415', marginBottom:2 }}>Profile Picture</div>
                <div style={{ fontSize:12, color:'#7a9070' }}>Click your avatar above the page to upload a new photo</div>
              </div>
              <button onClick={() => fileRef.current?.click()} style={{
                background:'#fff', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:99,
                padding:'7px 16px', fontSize:12, fontWeight:700, color:'#4e9e2a',
                cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif',
              }}>Upload</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
              <InputField label="Full Name"    name="name"  value={form.name}  onChange={hc} placeholder="Your full name"  focus={focus} onFocus={setFocus} onBlur={setFocus} />
              <InputField label="Phone Number" name="phone" value={form.phone} onChange={hc} placeholder="01XXXXXXXXX" focus={focus} onFocus={setFocus} onBlur={setFocus} />
            </div>

            {/* Read-only info */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, marginTop:4 }}>
              {[['Email', user?.email, '📧'], ['Role', 'Farmer', '🌾'], ['Joined', memberSince, '📅']].map(([lbl,val,icon]) => (
                <div key={lbl} style={{ background:'#f5f7f2', borderRadius:14, padding:'12px 14px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#afc09e', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>{icon} {lbl}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#7a9070', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{val}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Farm tab ── */}
        {activeTab === 'farm' && (
          <SectionCard title="Farm Details" icon="🌾" delay={0}
            action={
              <button onClick={handleSave} disabled={saving} style={{
                background:'#4e9e2a', color:'#fff', border:'none', borderRadius:99,
                padding:'8px 20px', fontFamily:'Plus Jakarta Sans,sans-serif',
                fontWeight:700, fontSize:13, cursor:'pointer',
                boxShadow:'0 2px 8px rgba(78,158,42,.3)', opacity: saving ? .7 : 1,
              }}>{saving ? 'Saving…' : 'Save Changes'}</button>
            }>
            <Alert type="success" msg={msg} />
            <Alert type="error"   msg={err} />

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
              <InputField label="Farm Name" name="farmName" value={form.farmName} onChange={hc}
                placeholder="e.g. Rahim's Organic Farm" focus={focus} onFocus={setFocus} onBlur={setFocus} />
              <InputField label="Farm Size" name="farmSize" value={form.farmSize} onChange={hc}
                placeholder="e.g. 2 acres" focus={focus} onFocus={setFocus} onBlur={setFocus} />
              <InputField label="District"     name="district" value={form.district} onChange={hc}
                placeholder="e.g. Manikganj" focus={focus} onFocus={setFocus} onBlur={setFocus} />
              <InputField label="Full Address" name="address"  value={form.address}  onChange={hc}
                placeholder="Village, Upazila..." focus={focus} onFocus={setFocus} onBlur={setFocus} />
            </div>

            {/* Verification status */}
            <div style={{
              background: user?.isVerified ? 'linear-gradient(135deg,#e8f5e1,#d4edd1)' : 'linear-gradient(135deg,#fef3d8,#fde8c0)',
              border: `1px solid ${user?.isVerified ? 'rgba(78,158,42,.2)' : 'rgba(196,125,10,.2)'}`,
              borderRadius:16, padding:'16px 20px', display:'flex', alignItems:'center', gap:14,
            }}>
              <div style={{ fontSize:28 }}>{user?.isVerified ? '✅' : '⏳'}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color: user?.isVerified ? '#3a7d1e' : '#c47d0a', marginBottom:3 }}>
                  {user?.isVerified ? 'Verified Farmer' : 'Verification Pending'}
                </div>
                <div style={{ fontSize:12, color: user?.isVerified ? '#5a9040' : '#c47d0a', lineHeight:1.5 }}>
                  {user?.isVerified
                    ? 'Your NID has been verified. Customers can see your verified badge.'
                    : "Your NID verification is under review. You'll be notified once approved."
                  }
                </div>
              </div>
            </div>
          </SectionCard>
        )}

        {/* ── Orders tab ── */}
        {activeTab === 'orders' && (
          <SectionCard title="Recent Orders Received" icon="📦" delay={0}
            action={
              <Link to="/dashboard/orders" style={{ fontSize:13, fontWeight:700, color:'#4e9e2a',
                textDecoration:'none', background:'#e8f5e1', padding:'7px 14px', borderRadius:99 }}>View All →</Link>
            }>
            {recentOrders.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 0' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📭</div>
                <div style={{ fontSize:16, fontWeight:800, color:'#1a2415', marginBottom:6 }}>No orders yet</div>
                <div style={{ fontSize:13, color:'#7a9070', marginBottom:20 }}>Orders from customers will appear here</div>
                <Link to="/dashboard/products" style={{
                  background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff',
                  textDecoration:'none', borderRadius:99, padding:'11px 24px',
                  fontSize:13, fontWeight:700, fontFamily:'Plus Jakarta Sans,sans-serif',
                  boxShadow:'0 4px 12px rgba(78,158,42,.3)',
                }}>Manage Products</Link>
              </div>
            ) : recentOrders.map((o, i) => {
              const st = STATUS_COLOR[o.status] || STATUS_COLOR.pending;
              return (
                <div key={o._id} className="order-row" style={{
                  display:'flex', alignItems:'center', gap:14,
                  padding:'14px 12px', borderRadius:14, cursor:'pointer',
                  borderBottom: i < recentOrders.length-1 ? '1px solid rgba(60,100,40,.07)' : 'none',
                  transition:'background .15s',
                }} onClick={() => navigate(`/dashboard/orders`)}>
                  <div style={{ width:44, height:44, borderRadius:12, background:st.bg,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                    {o.status==='delivered' ? '✅' : o.status==='cancelled' ? '❌' : '📦'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#1a2415', marginBottom:2 }}>
                      {o.customer?.name || 'Customer'}
                    </div>
                    <div style={{ fontSize:11, color:'#afc09e', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {o.items?.map(i=>i.name||'Product').join(', ')}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#4e9e2a', marginBottom:4 }}>৳{o.totalAmount?.toLocaleString()}</div>
                    <span style={{ background:st.bg, color:st.color, fontSize:11, fontWeight:700,
                      padding:'3px 10px', borderRadius:99 }}>{st.label}</span>
                  </div>
                  <span style={{ color:'#afc09e', fontSize:18 }}>›</span>
                </div>
              );
            })}
          </SectionCard>
        )}

        {/* ── Security tab ── */}
        {activeTab === 'security' && (
          <SectionCard title="Change Password" icon="🔒" delay={0}
            action={
              <button onClick={handlePasswordChange} disabled={pwSaving} style={{
                background:'#4e9e2a', color:'#fff', border:'none', borderRadius:99,
                padding:'8px 20px', fontFamily:'Plus Jakarta Sans,sans-serif',
                fontWeight:700, fontSize:13, cursor:'pointer',
                boxShadow:'0 2px 8px rgba(78,158,42,.3)', opacity: pwSaving ? .7 : 1,
              }}>{pwSaving ? 'Saving…' : 'Update Password'}</button>
            }>
            <Alert type="success" msg={pwMsg} />
            <Alert type="error"   msg={pwErr} />
            <div style={{ background:'#f5f7f2', borderRadius:16, padding:'14px 18px', marginBottom:20,
              display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:20 }}>ℹ️</span>
              <span style={{ fontSize:12, color:'#7a9070', lineHeight:1.5 }}>
                Use a strong password with at least 8 characters, including numbers and symbols.
              </span>
            </div>
            <InputField label="Current Password" name="cur" type="password" value={pwForm.current}
              onChange={e=>setPwForm(f=>({...f,current:e.target.value}))} placeholder="Your current password"
              focus={focus} onFocus={setFocus} onBlur={setFocus} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
              <InputField label="New Password" name="newpw" type="password" value={pwForm.newPw}
                onChange={e=>setPwForm(f=>({...f,newPw:e.target.value}))} placeholder="Min 6 characters"
                focus={focus} onFocus={setFocus} onBlur={setFocus} />
              <InputField label="Confirm Password" name="conf" type="password" value={pwForm.confirm}
                onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} placeholder="Repeat new password"
                focus={focus} onFocus={setFocus} onBlur={setFocus} />
            </div>
          </SectionCard>
        )}
      </div>

      {/* Responsive overrides */}
      <style>{`
        @media (max-width: 600px) {
          .farmer-stats { grid-template-columns: repeat(2,1fr) !important; }
          .farmer-quick { grid-template-columns: repeat(2,1fr) !important; }
          .farmer-form-row { grid-template-columns: 1fr !important; }
          .farmer-tabs span:last-child { display:none; }
        }
      `}</style>
    </div>
  );
}