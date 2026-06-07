import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const STATUS_COLORS = {
  pending:  { bg:'#fef3d8', color:'#c47d0a', label:'Pending Review' },
  approved: { bg:'#e8f5e1', color:'#3a7d1e', label:'Approved' },
  rejected: { bg:'#fde8e8', color:'#c04040', label:'Rejected' },
  none:     { bg:'#f0f0f0', color:'#888',    label:'Not Submitted' },
};

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [farmers,   setFarmers]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null); // farmer being reviewed
  const [reason,    setReason]    = useState('');
  const [acting,    setActing]    = useState(false);
  const [msg,       setMsg]       = useState('');
  const [tab,       setTab]       = useState('pending'); // pending | approved | rejected | all
  const [zoom,      setZoom]      = useState(null); // image URL to zoom

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') { navigate('/'); return; }
    fetchFarmers();
  }, [user]);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/auth/admin/verifications');
      setFarmers(data.farmers);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleAction = async (action) => {
    if (action === 'reject' && !reason.trim()) {
      alert('Please enter a rejection reason.'); return;
    }
    setActing(true);
    try {
      await api.patch(`/auth/admin/farmers/${selected._id}/verify`, { action, reason });
      setMsg(`Farmer ${action === 'approve' ? 'approved ✅' : 'rejected ❌'} successfully.`);
      setSelected(null);
      setReason('');
      fetchFarmers();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) {
      alert(e?.response?.data?.message || 'Action failed.');
    } finally { setActing(false); }
  };

  const filtered = farmers.filter(f => tab === 'all' ? true : (f.verificationStatus || 'none') === tab);
  const counts = {
    pending:  farmers.filter(f => f.verificationStatus === 'pending').length,
    approved: farmers.filter(f => f.verificationStatus === 'approved').length,
    rejected: farmers.filter(f => f.verificationStatus === 'rejected').length,
    all:      farmers.length,
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif' }}>

      {/* Header */}
      <div style={{ background:'#fff', borderBottom:'1px solid rgba(60,100,40,.12)', padding:'0 20px', display:'flex', alignItems:'center', gap:12, height:60, position:'sticky', top:0, zIndex:100 }}>
        <button onClick={() => navigate('/')} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'#4e9e2a', padding:0 }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:'#1a2415' }}>Admin Panel</div>
          <div style={{ fontSize:11, color:'#7a9070' }}>Farmer NID Verification</div>
        </div>
        {msg && <div style={{ fontSize:12, fontWeight:600, color:'#3a7d1e', background:'rgba(78,158,42,.1)', padding:'6px 14px', borderRadius:99 }}>{msg}</div>}
      </div>

      <div style={{ padding:'20px 16px', maxWidth:800, margin:'0 auto' }}>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
          {[
            { key:'all',      label:'Total',    icon:'👥', color:'#5060c0' },
            { key:'pending',  label:'Pending',  icon:'⏳', color:'#c47d0a' },
            { key:'approved', label:'Approved', icon:'✅', color:'#3a7d1e' },
            { key:'rejected', label:'Rejected', icon:'❌', color:'#c04040' },
          ].map(s => (
            <div key={s.key} onClick={() => setTab(s.key)}
              style={{ background: tab===s.key ? s.color : '#fff', borderRadius:14, padding:'14px 10px', textAlign:'center', cursor:'pointer', border:`1px solid ${tab===s.key ? s.color : 'rgba(60,100,40,.1)'}`, transition:'all .2s' }}>
              <div style={{ fontSize:22 }}>{s.icon}</div>
              <div style={{ fontSize:20, fontWeight:800, color: tab===s.key ? '#fff' : s.color }}>{counts[s.key]}</div>
              <div style={{ fontSize:10, fontWeight:600, color: tab===s.key ? 'rgba(255,255,255,.8)' : '#7a9070', textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Farmer list */}
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#7a9070' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:'#7a9070' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🌾</div>
            <div style={{ fontSize:15, fontWeight:600 }}>No farmers in this category</div>
          </div>
        ) : filtered.map(farmer => {
          const st = STATUS_COLORS[farmer.verificationStatus || 'none'];
          return (
            <div key={farmer._id} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:18, marginBottom:12, overflow:'hidden' }}>
              {/* Farmer row */}
              <div style={{ padding:'16px 18px', display:'flex', alignItems:'center', gap:12 }}>
                {/* Avatar */}
                <div style={{ width:48, height:48, borderRadius:'50%', background:'rgba(78,158,42,.1)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700, color:'#4e9e2a' }}>
                  {farmer.avatar ? <img src={farmer.avatar} alt={farmer.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : farmer.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:15, fontWeight:700, color:'#1a2415', marginBottom:2 }}>{farmer.name}</div>
                  <div style={{ fontSize:12, color:'#7a9070', marginBottom:4 }}>{farmer.email} · {farmer.location?.district || '—'}</div>
                  <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:99, background:st.bg, color:st.color }}>
                    {st.label}
                  </span>
                </div>
                {/* Review button — only for pending */}
                {farmer.verificationStatus === 'pending' && (
                  <button onClick={() => { setSelected(farmer); setReason(''); }}
                    style={{ background:'#4e9e2a', color:'#fff', border:'none', borderRadius:10, padding:'8px 16px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                    Review →
                  </button>
                )}
                {farmer.verificationStatus === 'rejected' && (
                  <button onClick={() => { setSelected(farmer); setReason(''); }}
                    style={{ background:'rgba(200,60,60,.1)', color:'#c04040', border:'1px solid rgba(200,60,60,.2)', borderRadius:10, padding:'8px 16px', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                    Re-review
                  </button>
                )}
              </div>

              {/* Rejection reason if rejected */}
              {farmer.verificationStatus === 'rejected' && farmer.rejectionReason && (
                <div style={{ padding:'10px 18px', background:'rgba(200,60,60,.05)', borderTop:'1px solid rgba(200,60,60,.1)', fontSize:12, color:'#c04040' }}>
                  Rejection reason: {farmer.rejectionReason}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Review Modal ── */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', padding:'24px 20px 32px' }}>

            {/* Handle */}
            <div style={{ width:40, height:4, background:'#ddd', borderRadius:99, margin:'0 auto 20px' }} />

            <div style={{ fontSize:17, fontWeight:800, color:'#1a2415', marginBottom:4 }}>Review: {selected.name}</div>
            <div style={{ fontSize:12, color:'#7a9070', marginBottom:20 }}>{selected.email} · {selected.location?.district}</div>

            {/* Check: name match */}
            <div style={{ background:'rgba(78,158,42,.06)', border:'1px solid rgba(78,158,42,.15)', borderRadius:12, padding:'12px 14px', marginBottom:16, fontSize:13, color:'#3a7d1e' }}>
              <strong>Account name:</strong> {selected.name}<br/>
              <span style={{ fontSize:11, color:'#7a9070' }}>Verify this matches the name on the NID card below</span>
            </div>

            {/* NID photos */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#3a7d1e', marginBottom:6 }}>📄 NID Card</div>
                {selected.nidImage ? (
                  <img onClick={() => setZoom(selected.nidImage)} src={selected.nidImage} alt="NID"
                    style={{ width:'100%', borderRadius:12, border:'1px solid rgba(60,100,40,.15)', cursor:'zoom-in', objectFit:'cover', height:160 }} />
                ) : <div style={{ height:160, background:'#f5f5f5', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'#bbb', fontSize:12 }}>Not submitted</div>}
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:'#3a7d1e', marginBottom:6 }}>🤳 Selfie with NID</div>
                {selected.selfieImage ? (
                  <img onClick={() => setZoom(selected.selfieImage)} src={selected.selfieImage} alt="Selfie"
                    style={{ width:'100%', borderRadius:12, border:'1px solid rgba(60,100,40,.15)', cursor:'zoom-in', objectFit:'cover', height:160 }} />
                ) : <div style={{ height:160, background:'#f5f5f5', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'#bbb', fontSize:12 }}>Not submitted</div>}
              </div>
            </div>

            <div style={{ fontSize:11, color:'#7a9070', marginBottom:20, background:'#f9faf7', borderRadius:10, padding:'10px 14px', lineHeight:1.7 }}>
              <strong style={{ color:'#1a2415' }}>Checklist:</strong><br/>
              ☐ Name on NID matches account name<br/>
              ☐ NID card looks like a real Bangladesh NID<br/>
              ☐ Face in selfie matches face on NID card<br/>
              ☐ Photos are clear and readable
            </div>

            {/* Rejection reason input */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#c04040', marginBottom:6 }}>Rejection reason (required only if rejecting):</div>
              <textarea value={reason} onChange={e => setReason(e.target.value)} rows={2}
                placeholder="e.g. NID card photo is blurry, face in selfie doesn't match NID..."
                style={{ width:'100%', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:10, padding:'10px 12px', fontFamily:'inherit', fontSize:13, color:'#1a2415', outline:'none', resize:'none', background:'#f9faf7', boxSizing:'border-box' }} />
            </div>

            {/* Action buttons */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <button onClick={() => handleAction('reject')} disabled={acting}
                style={{ padding:'14px', background:'rgba(200,60,60,.08)', color:'#c04040', border:'1px solid rgba(200,60,60,.2)', borderRadius:14, fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
                ❌ Reject
              </button>
              <button onClick={() => handleAction('approve')} disabled={acting}
                style={{ padding:'14px', background:'#4e9e2a', color:'#fff', border:'none', borderRadius:14, fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit' }}>
                ✅ Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image zoom modal ── */}
      {zoom && (
        <div onClick={() => setZoom(null)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.9)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <img src={zoom} alt="Zoomed" style={{ maxWidth:'100%', maxHeight:'100%', borderRadius:12, objectFit:'contain' }} />
          <button onClick={() => setZoom(null)} style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,.2)', border:'none', borderRadius:'50%', width:40, height:40, color:'#fff', fontSize:20, cursor:'pointer' }}>✕</button>
        </div>
      )}
    </div>
  );
}