import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';

const s = {
  page: { minHeight: '100vh', padding: '36px 48px', maxWidth: 1100, margin: '0 auto' },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--white)', marginBottom: 6 },
  sub: { fontSize: 14, color: 'var(--muted)', marginBottom: 36 },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20, marginBottom: 36 },
  kpi: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 },
  kpiLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 12 },
  kpiValue: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--white)' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 },
  navCard: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textDecoration: 'none', color: 'inherit', display: 'block' },
  navIcon: { fontSize: 28, marginBottom: 12 },
  navTitle: { fontSize: 15, fontWeight: 600, color: 'var(--white)', marginBottom: 4 },
  navDesc: { fontSize: 13, color: 'var(--muted)' },
};

const navItems = [
  { to: '/dashboard/products',  icon: '🌿', title: 'My Products',  desc: 'Manage your product listings' },
  { to: '/dashboard/add',       icon: '+',  title: 'Add Product',  desc: 'List a new product for sale' },
  { to: '/dashboard/orders',    icon: '📦', title: 'Orders',       desc: 'View and manage incoming orders' },
  { to: '/dashboard/analytics', icon: '📊', title: 'Analytics',    desc: 'Sales data and insights' },
  { to: '/dashboard/chat',      icon: '💬', title: 'Messages',     desc: 'Chat with your customers' },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0 });

  useEffect(() => {
    api.get('/analytics/farmer')
      .then(r => {
        const d = r.data;
        // analytics returns data.kpis object
        const k = d.kpis || d;
        setKpis({
          totalProducts: k.totalProducts ?? 0,
          totalOrders:   k.totalOrders   ?? 0,
          totalRevenue:  k.totalRevenue  ?? 0,
        });
      })
      .catch(() => {
        // fallback: count products directly
        api.get('/products/farmer/mine').then(r => {
          const prods = r.data.products || r.data || [];
          setKpis(prev => ({ ...prev, totalProducts: Array.isArray(prods) ? prods.length : 0 }));
        }).catch(() => {});
      });
  }, []);

  return (
    <div style={s.page}>
      <div style={s.title}>Farmer Dashboard</div>
      <div style={s.sub}>Welcome back! Here is a snapshot of your activity.</div>
      <div style={s.kpiRow}>
        <div style={s.kpi}><div style={s.kpiLabel}>Products</div><div style={s.kpiValue}>{kpis.totalProducts}</div></div>
        <div style={s.kpi}><div style={s.kpiLabel}>Total Orders</div><div style={s.kpiValue}>{kpis.totalOrders}</div></div>
        <div style={s.kpi}><div style={s.kpiLabel}>Revenue</div><div style={{ ...s.kpiValue, color: 'var(--green-lt)' }}>BDT {kpis.totalRevenue.toLocaleString()}</div></div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--white)', marginBottom: 16 }}>Quick Actions</div>
      <div style={s.grid}>
        {navItems.map(n => (
          <Link key={n.to} to={n.to} style={s.navCard}>
            <div style={s.navIcon}>{n.icon}</div>
            <div style={s.navTitle}>{n.title}</div>
            <div style={s.navDesc}>{n.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
