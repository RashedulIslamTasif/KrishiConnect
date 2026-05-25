import { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#5ab030','#f0b840','#1d9e75','#e05555','#8884d8','#d4900a'];

const KPICard = ({ label, value, change, icon, color }) => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)' }}>{label}</div>
      <div style={{ fontSize: 22 }}>{icon}</div>
    </div>
    <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.04em', color: color || 'var(--white)', marginBottom: 6 }}>{value}</div>
    {change && <div style={{ fontSize: 12, color: 'var(--green-lt)' }}>{change}</div>}
  </div>
);

const ChartCard = ({ title, subtitle, children }) => (
  <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{subtitle}</div>}
    </div>
    {children}
  </div>
);

const customTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue') ? `৳${p.value.toLocaleString()}` : p.value}
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState('month'); // month | week

  useEffect(() => {
    api.get('/analytics/farmer')
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', padding: '48px 56px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[...Array(6)].map((_, i) => <div key={i} style={{ height: 120, background: 'var(--card)', borderRadius: 20, border: '1px solid var(--border)', opacity: 0.5 }} />)}
      </div>
    </div>
  );

  const { kpis, revenueByMonth, topProducts, ordersByStatus, weeklyOrders } = data || {};

  // Format monthly revenue for chart
  const revenueChart = (revenueByMonth || []).map(r => ({
    month: MONTHS[r._id.month - 1],
    revenue: r.revenue,
    orders: r.orders,
  }));

  // Format weekly orders for chart
  const weeklyChart = (weeklyOrders || []).map((w, i) => ({
    week: `W${i + 1}`,
    orders: w.count,
    revenue: w.revenue,
  }));

  // Format status pie
  const statusPie = (ordersByStatus || []).map(s => ({
    name: s._id.replace(/_/g, ' '),
    value: s.count,
  }));

  const chartData = period === 'month' ? revenueChart : weeklyChart;

  return (
    <div style={{ minHeight: '100vh', padding: '48px 56px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--green-lt)', marginBottom: 8 }}>Analytics</div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em' }}>Your Farm Performance</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/dashboard/add" style={{ background: 'var(--green-hi)', color: '#fff', textDecoration: 'none', padding: '10px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600 }}>+ Add Product</Link>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <KPICard label="Total Revenue"     value={`৳${(kpis?.totalRevenue || 0).toLocaleString()}`} icon="💰" color="var(--green-lt)" change="From delivered orders" />
        <KPICard label="Total Orders"      value={kpis?.totalOrders || 0}     icon="📦" change={`${kpis?.uniqueCustomers || 0} unique customers`} />
        <KPICard label="Active Products"   value={kpis?.totalProducts || 0}   icon="🌾" />
        <KPICard label="Average Rating"    value={`${kpis?.avgRating || 0} ★`} icon="⭐" color="var(--amber-lt)" change={`${kpis?.totalReviews || 0} total reviews`} />
        <KPICard label="Unique Customers"  value={kpis?.uniqueCustomers || 0} icon="👥" />
        <KPICard label="Total Reviews"     value={kpis?.totalReviews || 0}    icon="💬" />
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Revenue chart */}
        <ChartCard
          title="Revenue Over Time"
          subtitle={
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {['month', 'week'].map(p => (
                <button key={p} onClick={() => setPeriod(p)} style={{
                  fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 99,
                  fontFamily: 'Sora,sans-serif', cursor: 'pointer', border: 'none',
                  background: period === p ? 'var(--green-hi)' : 'var(--card2)',
                  color: period === p ? '#fff' : 'var(--muted)',
                }}>
                  By {p}
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey={period === 'month' ? 'month' : 'week'} stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <Tooltip content={customTooltip} />
              <Bar dataKey="revenue" name="Revenue (৳)" fill="var(--green-hi)" radius={[6,6,0,0]} />
              <Bar dataKey="orders"  name="Orders"     fill="rgba(90,176,48,.25)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Orders by status pie */}
        <ChartCard title="Orders by Status" subtitle="Distribution across all statuses">
          {statusPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={3}>
                  {statusPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip content={customTooltip} />
                <Legend formatter={(v) => <span style={{ fontSize: 12, color: 'var(--muted)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontSize: 13 }}>No orders yet</div>
          )}
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* Weekly trend line */}
        <ChartCard title="Weekly Order Trend" subtitle="Orders and revenue — last 8 weeks">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyChart}>
              <XAxis dataKey="week" stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <YAxis stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
              <Tooltip content={customTooltip} />
              <Line type="monotone" dataKey="orders"  name="Orders"      stroke="var(--green-hi)"  strokeWidth={2} dot={{ fill: 'var(--green-hi)', r: 4 }} />
              <Line type="monotone" dataKey="revenue" name="Revenue (৳)" stroke="var(--amber-lt)"  strokeWidth={2} dot={{ fill: 'var(--amber-lt)', r: 4 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top products table */}
        <ChartCard title="Top Products" subtitle="By revenue generated">
          {(topProducts || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 13 }}>No sales data yet</div>
          ) : (
            <div>
              {topProducts.slice(0, 5).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < 4 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${PIE_COLORS[i]}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: PIE_COLORS[i], flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p._id}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.qty} units · {p.orders} orders</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-lt)' }}>৳{p.revenue.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
