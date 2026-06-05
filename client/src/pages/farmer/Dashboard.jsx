import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

const NAV = [
  { to:'/dashboard/products',  icon:'🌿', title:'My Products',  desc:'Manage listings',     color:'#e8f5e1', accent:'#4e9e2a' },
  { to:'/dashboard/add',       icon:'➕', title:'Add Product',  desc:'List a new product',  color:'#e8f5e1', accent:'#4e9e2a' },
  { to:'/dashboard/orders',    icon:'📦', title:'Orders',       desc:'Manage orders',        color:'#fef3d8', accent:'#c47d0a' },
  { to:'/dashboard/analytics', icon:'📊', title:'Analytics',    desc:'Sales insights',       color:'#eef0fa', accent:'#5060c0' },
  { to:'/dashboard/chat',      icon:'💬', title:'Messages',     desc:'Chat with customers',  color:'#e0f4ef', accent:'#1d9e75' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState({ totalProducts:0, totalOrders:0, totalRevenue:0 });

  useEffect(() => {
    api.get('/analytics/farmer').then(r => {
      const k = r.data.kpis || r.data;
      setKpis({ totalProducts: k.totalProducts??0, totalOrders: k.totalOrders??0, totalRevenue: k.totalRevenue??0 });
    }).catch(() => {
      api.get('/products/farmer/mine').then(r => {
        const prods = r.data.products || r.data || [];
        setKpis(p => ({ ...p, totalProducts: Array.isArray(prods) ? prods.length : 0 }));
      }).catch(() => {});
    });
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'Farmer';
  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .dash-nav-card:hover{transform:translateY(-4px)!important;box-shadow:0 10px 28px rgba(20,50,10,.12)!important;}
      `}</style>

      {/* Hero header */}
      <div style={{ position:'relative', overflow:'hidden', borderRadius:'0 0 28px 28px',
        background:'linear-gradient(135deg,#1a3a10,#2d5a1e)', padding:'32px 20px 40px',
        animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}>
        {/* decorative circles */}
        <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.05)' }} />
        <div style={{ position:'absolute', bottom:-30, left:-30, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.04)' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <div style={{ fontSize:11, color:'rgba(168,224,122,.8)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6 }}>🌾 Farmer Dashboard</div>
              <div style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.03em', lineHeight:1.15 }}>Hello, {firstName} 👋</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:4 }}>{today}</div>
            </div>
            <div style={{ width:52, height:52, borderRadius:16, overflow:'hidden', border:'2px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>👨‍🌾</div>
          </div>
          {/* KPI strip */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[
              { label:'Products',  value: kpis.totalProducts, icon:'🌿' },
              { label:'Orders',    value: kpis.totalOrders,   icon:'📦' },
              { label:'Revenue',   value:`৳${kpis.totalRevenue.toLocaleString()}`, icon:'💰', green:true },
            ].map((k,i) => (
              <div key={k.label} style={{ background:'rgba(255,255,255,.08)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,.12)', borderRadius:16, padding:'12px 14px', animation:`fadeUp .4s ${50+i*60}ms cubic-bezier(.22,1,.36,1) both` }}>
                <div style={{ fontSize:16, marginBottom:4 }}>{k.icon}</div>
                <div style={{ fontSize:20, fontWeight:800, color: k.green ? '#a8e07a' : '#fff', lineHeight:1 }}>{k.value}</div>
                <div style={{ fontSize:10, color:'rgba(255,255,255,.5)', marginTop:3, fontWeight:600 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'24px 16px' }}>
        {/* Quick actions */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16,
          animation:'fadeUp .4s .2s cubic-bezier(.22,1,.36,1) both' }}>
          <span style={{ fontSize:16, fontWeight:800, color:'#1a2415', letterSpacing:'-0.02em' }}>Quick Actions</span>
          <Link to="/dashboard/analytics" style={{ background:'#e8f5e1', color:'#4e9e2a', textDecoration:'none', fontSize:12, fontWeight:700, padding:'6px 14px', borderRadius:99, fontFamily:'Plus Jakarta Sans,sans-serif' }}>View Analytics →</Link>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
          {NAV.map((n,i) => (
            <Link key={n.to} to={n.to} className="dash-nav-card"
              style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:18, padding:'18px 16px', textDecoration:'none',
                boxShadow:'0 2px 8px rgba(20,50,10,.06)', transition:'all .25s cubic-bezier(.22,1,.36,1)',
                animation:`fadeUp .45s ${.25+i*.06}s cubic-bezier(.22,1,.36,1) both`,
                display:'block', gridColumn: i===4 ? 'span 2' : 'auto',
              }}>
              <div style={{ width:44, height:44, borderRadius:14, background:n.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, marginBottom:12 }}>{n.icon}</div>
              <div style={{ fontSize:14, fontWeight:800, color:'#1a2415', marginBottom:3 }}>{n.title}</div>
              <div style={{ fontSize:12, color:'#7a9070' }}>{n.desc}</div>
            </Link>
          ))}
        </div>

        {/* Farm tip card */}
        <div style={{ marginTop:20, background:'linear-gradient(135deg,#e8f5e1,#f0f9e8)', border:'1px solid rgba(78,158,42,.2)', borderRadius:20, padding:'18px 16px',
          animation:'fadeUp .45s .6s cubic-bezier(.22,1,.36,1) both' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#4e9e2a', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>💡 Daily Tip</div>
          <div style={{ fontSize:14, fontWeight:700, color:'#1a2415', marginBottom:4 }}>Keep your stock updated</div>
          <div style={{ fontSize:12, color:'#7a9070', lineHeight:1.6 }}>Customers can't buy what they can't see. Update your product stock levels regularly for better sales.</div>
        </div>
      </div>
    </div>
  );
}
