import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#4e9e2a','#f0b840','#1d9e75','#e05555','#8884d8','#d4900a'];

/* shared styles */
const S = {
  page: { minHeight:'100vh', background:'#f5f7f2', padding:'24px 16px', fontFamily:'Plus Jakarta Sans,sans-serif' },
  label: { fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'#7a9070', marginBottom:6 },
};

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', border:'1px solid rgba(60,100,40,.15)', borderRadius:12, padding:'10px 14px', fontSize:12, boxShadow:'0 4px 16px rgba(20,50,10,.1)' }}>
      <div style={{ color:'#7a9070', marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, fontWeight:700 }}>
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue') ? `৳${p.value.toLocaleString()}` : p.value}
        </div>
      ))}
    </div>
  );
};

function KPICard({ label, value, icon, color, sub, delay=0 }) {
  return (
    <div style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:20, padding:'18px 16px',
      boxShadow:'0 2px 8px rgba(20,50,10,.06)', animation:`fadeUp .45s ${delay}ms cubic-bezier(.22,1,.36,1) both` }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={S.label}>{label}</div>
        <div style={{ fontSize:22 }}>{icon}</div>
      </div>
      <div style={{ fontSize:28, fontWeight:800, letterSpacing:'-0.04em', color: color || '#1a2415', marginBottom:4, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'#7a9070', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

function ChartCard({ title, subtitle, children, delay=0 }) {
  return (
    <div style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:20, padding:'20px 16px',
      boxShadow:'0 2px 8px rgba(20,50,10,.06)', animation:`fadeUp .45s ${delay}ms cubic-bezier(.22,1,.36,1) both` }}>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:15, fontWeight:800, color:'#1a2415', letterSpacing:'-0.02em' }}>{title}</div>
        {subtitle && <div style={{ marginTop:6 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('month');

  useEffect(() => {
    api.get('/analytics/farmer')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ ...S.page }}>
      <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
        {[...Array(6)].map((_,i) => <div key={i} style={{ height:100, borderRadius:20, backgroundImage:'linear-gradient(90deg,#e8ede4 25%,#f0f4ec 50%,#e8ede4 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }} />)}
      </div>
    </div>
  );

  const { kpis, revenueByMonth, topProducts, ordersByStatus, weeklyOrders } = data || {};
  const revenueChart = (revenueByMonth||[]).map(r => ({ month: MONTHS[r._id.month-1], revenue: r.revenue, orders: r.orders }));
  const weeklyChart  = (weeklyOrders||[]).map((w,i) => ({ week:`W${i+1}`, orders:w.count, revenue:w.revenue }));
  const statusPie    = (ordersByStatus||[]).map(s => ({ name: s._id.replace(/_/g,' '), value: s.count }));
  const chartData    = period === 'month' ? revenueChart : weeklyChart;

  return (
    <div className='analytics-page' style={S.page}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24,
        animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', color:'#4e9e2a', marginBottom:6 }}>Analytics</div>
          <h1 style={{ fontSize:'clamp(22px,5vw,30px)', fontWeight:800, letterSpacing:'-0.03em', color:'#1a2415', lineHeight:1.1 }}>Your Farm<br />Performance</h1>
        </div>
        <Link to="/dashboard/add" style={{ background:'#4e9e2a', color:'#fff', textDecoration:'none', padding:'11px 18px', borderRadius:14, fontSize:13, fontWeight:700, fontFamily:'Plus Jakarta Sans,sans-serif', boxShadow:'0 2px 8px rgba(78,158,42,.3)', whiteSpace:'nowrap', flexShrink:0 }}>+ Add Product</Link>
      </div>

      {/* KPI Grid — 2 cols on mobile, 3 on desktop */}
      <div className='analytics-kpi' style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10, marginBottom:16 }}>
        <KPICard label="Total Revenue"    value={`৳${(kpis?.totalRevenue||0).toLocaleString()}`} icon="💰" color="#4e9e2a" sub="From delivered orders" delay={0} />
        <KPICard label="Total Orders"     value={kpis?.totalOrders||0}    icon="📦" sub={`${kpis?.uniqueCustomers||0} unique customers`} delay={50} />
        <KPICard label="Active Products"  value={kpis?.totalProducts||0}  icon="🌾" delay={100} />
        <KPICard label="Avg Rating"       value={`${kpis?.avgRating||0} ★`} icon="⭐" color="#c47d0a" sub={`${kpis?.totalReviews||0} reviews`} delay={150} />
        <KPICard label="Unique Customers" value={kpis?.uniqueCustomers||0} icon="👥" delay={200} />
        <KPICard label="Total Reviews"    value={kpis?.totalReviews||0}   icon="💬" delay={250} />
      </div>

      {/* Revenue chart */}
      <ChartCard title="Revenue Over Time" delay={300}
        subtitle={
          <div style={{ display:'flex', gap:6 }}>
            {['month','week'].map(p => (
              <button key={p} onClick={() => setPeriod(p)} style={{ fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:99, fontFamily:'Plus Jakarta Sans,sans-serif', cursor:'pointer', border:'none',
                background: period===p ? '#4e9e2a' : '#f0f4ec', color: period===p ? '#fff' : '#7a9070' }}>
                By {p}
              </button>
            ))}
          </div>
        }>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <XAxis dataKey={period==='month'?'month':'week'} stroke="#afc09e" tick={{ fontSize:11, fill:'#7a9070' }} />
            <YAxis stroke="#afc09e" tick={{ fontSize:11, fill:'#7a9070' }} />
            <Tooltip content={customTooltip} />
            <Bar dataKey="revenue" name="Revenue (৳)" fill="#4e9e2a" radius={[6,6,0,0]} />
            <Bar dataKey="orders"  name="Orders"      fill="rgba(78,158,42,.2)" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div style={{ height:14 }} />

      {/* Orders by status pie */}
      <ChartCard title="Orders by Status" delay={350}>
        {statusPie.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {statusPie.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip content={customTooltip} />
              <Legend formatter={v => <span style={{ fontSize:11, color:'#7a9070' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign:'center', padding:'40px 0', color:'#7a9070', fontSize:13 }}>No orders yet</div>
        )}
      </ChartCard>

      <div style={{ height:14 }} />

      {/* Weekly trend */}
      <ChartCard title="Weekly Order Trend" delay={400}>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={weeklyChart}>
            <XAxis dataKey="week" stroke="#afc09e" tick={{ fontSize:11, fill:'#7a9070' }} />
            <YAxis stroke="#afc09e" tick={{ fontSize:11, fill:'#7a9070' }} />
            <Tooltip content={customTooltip} />
            <Line type="monotone" dataKey="orders"  name="Orders"      stroke="#4e9e2a" strokeWidth={2.5} dot={{ fill:'#4e9e2a', r:4 }} />
            <Line type="monotone" dataKey="revenue" name="Revenue (৳)" stroke="#f0b840" strokeWidth={2} dot={{ fill:'#f0b840', r:4 }} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div style={{ height:14 }} />

      {/* Top products */}
      <ChartCard title="Top Products by Revenue" delay={450}>
        {(topProducts||[]).length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 0', color:'#7a9070', fontSize:13 }}>No sales data yet</div>
        ) : (
          topProducts.slice(0,5).map((p,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom: i<4 ? '1px solid rgba(60,100,40,.08)' : 'none' }}>
              <div style={{ width:30, height:30, borderRadius:10, background:`${PIE_COLORS[i]}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:PIE_COLORS[i], flexShrink:0 }}>{i+1}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#1a2415' }}>{p._id}</div>
                <div style={{ fontSize:11, color:'#7a9070' }}>{p.qty} units · {p.orders} orders</div>
              </div>
              <div style={{ fontSize:14, fontWeight:800, color:'#4e9e2a' }}>৳{p.revenue.toLocaleString()}</div>
            </div>
          ))
        )}
      </ChartCard>

      <div style={{ height:24 }} />

      {/* Desktop layout override */}
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @media (min-width: 640px) {
          .analytics-kpi { grid-template-columns: repeat(3, 1fr) !important; }
        }
        @media (min-width: 900px) {
          .analytics-page { padding: 36px 48px !important; max-width: 1100px; margin: 0 auto; }
        }
      `}</style>
    </div>
  );
}
