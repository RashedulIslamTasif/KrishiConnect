import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

/* ── tiny helpers ── */
const STATUS = {
  delivered:        { bg:'#e8f5e1', color:'#3a7d1e',  label:'Delivered'    },
  pending:          { bg:'#fef3d8', color:'#c47d0a',   label:'Pending'      },
  confirmed:        { bg:'#e8f5e1', color:'#4e9e2a',   label:'Confirmed'    },
  out_for_delivery: { bg:'#e0f4ef', color:'#1d9e75',   label:'On the Way'   },
  cancelled:        { bg:'#fde8e8', color:'#c04040',   label:'Cancelled'    },
};
const badge = (status) => {
  const s = STATUS[status] || STATUS.pending;
  return { background: s.bg, color: s.color, fontSize:11, fontWeight:700,
    padding:'3px 10px', borderRadius:99, whiteSpace:'nowrap', display:'inline-block' };
};

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

function StatCard({ icon, label, value, color='#1a2415', bg='#e8f5e1', delay=0 }) {
  return (
    <div style={{
      background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:20,
      padding:'18px 16px', boxShadow:'0 2px 8px rgba(20,50,10,.05)',
      animation:`fadeUp .5s ${delay}ms cubic-bezier(.22,1,.36,1) both`,
    }}>
      <div style={{ width:40, height:40, borderRadius:12, background:bg,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, marginBottom:12 }}>{icon}</div>
      <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#afc09e', marginBottom:4 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800, color, letterSpacing:'-0.04em', lineHeight:1 }}>{value}</div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type='text', focus, fieldKey, onFocus, onBlur }) {
  const focused = focus === fieldKey;
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a9070',
        textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={() => onFocus(fieldKey)} onBlur={() => onBlur('')}
        style={{
          width:'100%', borderRadius:14, padding:'13px 16px', fontSize:14, outline:'none',
          fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box',
          background: focused ? '#f9faf7' : '#f5f7f2',
          border: `1.5px solid ${focused ? '#4e9e2a' : 'rgba(60,100,40,.12)'}`,
          boxShadow: focused ? '0 0 0 3px rgba(78,158,42,.1)' : 'none',
          color:'#1a2415', transition:'all .2s',
        }}
      />
    </div>
  );
}

function Alert({ type, msg }) {
  if (!msg) return null;
  const isOk = type === 'success';
  return (
    <div style={{
      background: isOk ? '#e8f5e1' : '#fde8e8',
      border: `1px solid ${isOk ? 'rgba(78,158,42,.3)' : 'rgba(192,64,64,.25)'}`,
      color: isOk ? '#3a7d1e' : '#c04040',
      borderRadius:12, padding:'12px 16px', fontSize:13, fontWeight:600,
      marginBottom:16, display:'flex', alignItems:'center', gap:8,
      animation:'fadeIn .3s ease both',
    }}>
      {isOk ? '✓' : '⚠'} {msg}
    </div>
  );
}

export default function CustomerProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const fileRef = useRef(null);

  const [activeTab, setActiveTab] = useState('profile');
  const [focus,     setFocus]     = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [avatarSaving,  setAvatarSaving]  = useState(false);

  const [form,    setForm]    = useState({ name:'', phone:'', location:'' });
  const [orders,  setOrders]  = useState([]);
  const [stats,   setStats]   = useState({ total:0, delivered:0, spent:0, pending:0 });
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');
  const [saving,  setSaving]  = useState(false);

  const [pwForm,   setPwForm]   = useState({ current:'', newPw:'', confirm:'' });
  const [pwMsg,    setPwMsg]    = useState('');
  const [pwErr,    setPwErr]    = useState('');
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name||'', phone: user.phone||'', location: user.location?.district||user.location?.address||'' });
    if (user.avatar) setAvatarPreview(user.avatar);

    api.get('/orders/mine').then(r => {
      const list = Array.isArray(r.data) ? r.data : r.data.orders||[];
      setOrders(list.slice(0, 5));
      setStats({
        total:     list.length,
        delivered: list.filter(o => o.status==='delivered').length,
        pending:   list.filter(o => o.status==='pending').length,
        spent:     list.filter(o => o.status==='delivered').reduce((s,o) => s+(o.totalAmount||0), 0),
      });
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
      // data.user is the full updated user — extract avatar URL and persist
      const savedUser = data.user;
      updateUser(savedUser);
      // Show the persisted cloud URL (not the local blob: preview)
      if (savedUser?.avatar) setAvatarPreview(savedUser.avatar);
      setAvatarFile(null);
      setMsg('Profile picture updated!');
    } catch { setErr('Failed to upload photo.'); }
    finally { setAvatarSaving(false); }
  };

  const handleSave = async () => {
    setSaving(true); setMsg(''); setErr('');
    try {
      const { data } = await api.put('/auth/profile', { name:form.name, phone:form.phone, district:form.location });
      updateUser(data.user);
      setMsg('Profile updated successfully!');
    } catch(e) { setErr(e.response?.data?.message||'Update failed.'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async () => {
    setPwMsg(''); setPwErr('');
    if (!pwForm.current||!pwForm.newPw) { setPwErr('Fill in all password fields.'); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwErr('New passwords do not match.'); return; }
    if (pwForm.newPw.length < 6)        { setPwErr('Password must be at least 6 characters.'); return; }
    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword:pwForm.current, newPassword:pwForm.newPw });
      setPwMsg('Password changed successfully!');
      setPwForm({ current:'', newPw:'', confirm:'' });
    } catch(e) { setPwErr(e.response?.data?.message||'Failed to change password.'); }
    finally { setPwSaving(false); }
  };

  const initials = user?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) || '?';
  const memberSince = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-BD',{month:'long',year:'numeric'}) : '—';

  const TABS = [
    { key:'profile',  label:'Profile',  icon:'👤' },
    { key:'orders',   label:'Orders',   icon:'📦' },
    { key:'security', label:'Security', icon:'🔒' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.5} }
        .avatar-ring:hover .avatar-overlay { opacity:1 !important; }
        .tab-btn:hover { background: rgba(78,158,42,.08) !important; }
        .order-row:hover { background: #f9faf7 !important; }
        .stat-card-hover:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(20,50,10,.1) !important; }
      `}</style>

      {/* ── Hero header ── */}
      <div style={{
        background:'linear-gradient(135deg,#1a3a10 0%,#2d5a1e 60%,#3a7d1e 100%)',
        padding:'0 0 80px', position:'relative', overflow:'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position:'absolute', top:-60, right:-60, width:240, height:240, borderRadius:'50%', background:'rgba(255,255,255,.04)' }} />
        <div style={{ position:'absolute', bottom:-40, left:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.03)' }} />

        <div style={{ maxWidth:860, margin:'0 auto', padding:'24px 20px 0' }}>
          <button onClick={() => navigate(-1)} style={{
            background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)',
            borderRadius:12, padding:'8px 16px', color:'#fff', fontSize:13, fontWeight:600,
            cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', marginBottom:28,
            backdropFilter:'blur(8px)',
          }}>← Back</button>

          <div style={{ display:'flex', gap:24, alignItems:'flex-end', flexWrap:'wrap' }}>
            {/* Avatar */}
            <div className="avatar-ring" style={{ position:'relative', flexShrink:0, cursor:'pointer' }}
              onClick={() => fileRef.current?.click()}>
              <div style={{
                width:96, height:96, borderRadius:'50%',
                border:'3px solid rgba(255,255,255,.3)',
                overflow:'hidden', position:'relative',
                boxShadow:'0 8px 24px rgba(0,0,0,.2)',
              }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <div style={{ width:'100%', height:'100%', background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:32, fontWeight:800, color:'#fff' }}>{initials}</div>
                }
                <div className="avatar-overlay" style={{
                  position:'absolute', inset:0, background:'rgba(0,0,0,.5)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  opacity:0, transition:'opacity .2s',
                }}>
                  <span style={{ fontSize:22 }}>📷</span>
                </div>
              </div>
              {avatarFile && (
                <button onClick={e => { e.stopPropagation(); uploadAvatar(); }} disabled={avatarSaving}
                  style={{
                    position:'absolute', bottom:-4, right:-4, width:28, height:28,
                    borderRadius:'50%', background:'#4e9e2a', border:'2px solid #fff',
                    color:'#fff', fontSize:12, cursor:'pointer', display:'flex',
                    alignItems:'center', justifyContent:'center',
                    animation: avatarSaving ? 'pulse 1s infinite' : 'none',
                  }}>
                  {avatarSaving ? '…' : '✓'}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:'none' }} />

            <div style={{ flex:1, paddingBottom:4 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase',
                color:'rgba(255,255,255,.5)', marginBottom:6 }}>Customer Account</div>
              <div style={{ fontSize:'clamp(22px,4vw,32px)', fontWeight:800, color:'#fff',
                letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:6 }}>{user?.name}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,.6)', marginBottom:10 }}>{user?.email}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ background:'rgba(255,255,255,.15)', color:'#fff', fontSize:11,
                  fontWeight:600, padding:'3px 12px', borderRadius:99,
                  border:'1px solid rgba(255,255,255,.2)', backdropFilter:'blur(8px)' }}>🛒 Customer</span>
                <span style={{ background:'rgba(255,255,255,.1)', color:'rgba(255,255,255,.7)', fontSize:11,
                  fontWeight:500, padding:'3px 12px', borderRadius:99 }}>Member since {memberSince}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:860, margin:'-56px auto 0', padding:'0 20px 48px', position:'relative', zIndex:2 }}>

        {/* ── Stats row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:24 }}>
          <StatCard icon="📦" label="Total Orders"  value={stats.total}     bg="#e8f5e1" delay={0}   />
          <StatCard icon="✅" label="Delivered"     value={stats.delivered} bg="#e0f4ef" color="#1d9e75" delay={60}  />
          <StatCard icon="⏳" label="Pending"       value={stats.pending}   bg="#fef3d8" color="#c47d0a" delay={120} />
          <StatCard icon="💰" label="Total Spent"   value={`৳${stats.spent.toLocaleString()}`} bg="#fef3d8" color="#c47d0a" delay={180} />
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display:'flex', gap:4, background:'#fff', borderRadius:16, padding:6,
          border:'1px solid rgba(60,100,40,.1)', marginBottom:24,
          boxShadow:'0 2px 8px rgba(20,50,10,.05)',
          animation:'fadeUp .4s .1s cubic-bezier(.22,1,.36,1) both',
        }}>
          {TABS.map(t => (
            <button key={t.key} className="tab-btn" onClick={() => setActiveTab(t.key)}
              style={{
                flex:1, border:'none', borderRadius:12, padding:'10px 8px',
                fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13,
                cursor:'pointer', transition:'all .2s',
                background: activeTab===t.key ? '#4e9e2a' : 'transparent',
                color: activeTab===t.key ? '#fff' : '#7a9070',
                boxShadow: activeTab===t.key ? '0 2px 8px rgba(78,158,42,.3)' : 'none',
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
              }}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
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
                boxShadow:'0 2px 8px rgba(78,158,42,.3)',
                opacity: saving ? .7 : 1,
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
                <div style={{ fontSize:12, color:'#7a9070' }}>Click the photo above to upload a new picture</div>
              </div>
              <button onClick={() => fileRef.current?.click()} style={{
                background:'#fff', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:99,
                padding:'7px 16px', fontSize:12, fontWeight:700, color:'#4e9e2a',
                cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif',
              }}>Upload</button>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              <div style={{ paddingRight:8 }}>
                <InputField label="Full Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                  placeholder="Your full name" focus={focus} fieldKey="name" onFocus={setFocus} onBlur={setFocus} />
              </div>
              <div style={{ paddingLeft:8 }}>
                <InputField label="Phone Number" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}
                  placeholder="01XXXXXXXXX" focus={focus} fieldKey="phone" onFocus={setFocus} onBlur={setFocus} />
              </div>
            </div>
            <InputField label="Location / District" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}
              placeholder="e.g. Dhaka, Chittagong..." focus={focus} fieldKey="location" onFocus={setFocus} onBlur={setFocus} />

            {/* Read-only info */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:4 }}>
              {[['Email Address', user?.email, '📧'], ['Account Type', 'Customer', '🛒'], ['Member Since', memberSince, '📅']].map(([lbl, val, icon]) => (
                <div key={lbl} style={{ background:'#f5f7f2', borderRadius:14, padding:'12px 16px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#afc09e', textTransform:'uppercase', letterSpacing:'.07em', marginBottom:4 }}>{icon} {lbl}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#7a9070' }}>{val}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* ── Orders tab ── */}
        {activeTab === 'orders' && (
          <SectionCard title="Recent Orders" icon="📦" delay={0}
            action={
              <Link to="/orders" style={{ fontSize:13, fontWeight:700, color:'#4e9e2a', textDecoration:'none',
                background:'#e8f5e1', padding:'7px 14px', borderRadius:99 }}>View All →</Link>
            }>
            {orders.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px 0' }}>
                <div style={{ fontSize:44, marginBottom:12 }}>📦</div>
                <div style={{ fontSize:16, fontWeight:800, color:'#1a2415', marginBottom:6 }}>No orders yet</div>
                <div style={{ fontSize:13, color:'#7a9070', marginBottom:20 }}>Your order history will appear here</div>
                <Link to="/marketplace" style={{
                  background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff',
                  textDecoration:'none', borderRadius:99, padding:'11px 24px',
                  fontSize:13, fontWeight:700, fontFamily:'Plus Jakarta Sans,sans-serif',
                  boxShadow:'0 4px 12px rgba(78,158,42,.3)',
                }}>Browse Marketplace</Link>
              </div>
            ) : orders.map((o, i) => {
              const st = STATUS[o.status] || STATUS.pending;
              return (
                <div key={o._id} className="order-row" style={{
                  display:'flex', alignItems:'center', gap:14,
                  padding:'14px 12px', borderRadius:14, cursor:'pointer',
                  borderBottom: i < orders.length-1 ? '1px solid rgba(60,100,40,.07)' : 'none',
                  transition:'background .15s',
                }} onClick={() => navigate(`/orders/${o._id}`)}>
                  <div style={{
                    width:44, height:44, borderRadius:12, background: st.bg,
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0,
                  }}>
                    {o.status==='delivered' ? '✅' : o.status==='cancelled' ? '❌' : '📦'}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#1a2415', marginBottom:2,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {o.items?.map(i=>i.name||'Product').join(', ')}
                    </div>
                    <div style={{ fontSize:11, color:'#afc09e' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-BD',{day:'numeric',month:'short',year:'numeric'})}
                      {' · '}Order #{o._id.slice(-6).toUpperCase()}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:'#4e9e2a', marginBottom:4 }}>৳{o.totalAmount?.toLocaleString()}</div>
                    <span style={badge(o.status)}>{st.label}</span>
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
            <InputField label="Current Password" type="password" value={pwForm.current}
              onChange={e=>setPwForm(f=>({...f,current:e.target.value}))} placeholder="Your current password"
              focus={focus} fieldKey="cur" onFocus={setFocus} onBlur={setFocus} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              <div style={{ paddingRight:8 }}>
                <InputField label="New Password" type="password" value={pwForm.newPw}
                  onChange={e=>setPwForm(f=>({...f,newPw:e.target.value}))} placeholder="Min 6 characters"
                  focus={focus} fieldKey="newpw" onFocus={setFocus} onBlur={setFocus} />
              </div>
              <div style={{ paddingLeft:8 }}>
                <InputField label="Confirm New Password" type="password" value={pwForm.confirm}
                  onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} placeholder="Repeat new password"
                  focus={focus} fieldKey="conf" onFocus={setFocus} onBlur={setFocus} />
              </div>
            </div>
          </SectionCard>
        )}
      </div>

      {/* Mobile responsive fix */}
      <style>{`
        @media (max-width: 560px) {
          .krishi-stats-grid { grid-template-columns: repeat(2,1fr) !important; }
          .krishi-form-row   { grid-template-columns: 1fr !important; }
          .krishi-info-row   { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}