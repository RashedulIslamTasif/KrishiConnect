import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import { useResponsive } from '../../hooks/useResponsive.js';

const navItems = [
  { to: '/dashboard/products',  icon: '🌿', title: 'My Products',  desc: 'Manage listings' },
  { to: '/dashboard/add',       icon: '➕', title: 'Add Product',  desc: 'List a new product' },
  { to: '/dashboard/orders',    icon: '📦', title: 'Orders',       desc: 'Manage orders' },
  { to: '/dashboard/analytics', icon: '📊', title: 'Analytics',    desc: 'Sales insights' },
  { to: '/dashboard/chat',      icon: '💬', title: 'Messages',     desc: 'Chat with customers' },
];

export default function Dashboard() {
  const { isMobile } = useResponsive();
  const [kpis, setKpis] = useState({ totalProducts: 0, totalOrders: 0, totalRevenue: 0 });

  useEffect(() => {
    api.get('/analytics/farmer').then(r => {
      const k = r.data.kpis || r.data;
      setKpis({ totalProducts: k.totalProducts ?? 0, totalOrders: k.totalOrders ?? 0, totalRevenue: k.totalRevenue ?? 0 });
    }).catch(() => {
      api.get('/products/farmer/mine').then(r => {
        const prods = r.data.products || r.data || [];
        setKpis(p => ({ ...p, totalProducts: Array.isArray(prods) ? prods.length : 0 }));
      }).catch(() => {});
    });
  }, []);

  const pad = isMobile ? '20px 16px' : '36px 48px';

  return (
    <div style={{ minHeight: '100vh', padding: pad, maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--white)', marginBottom: 4 }}>Farmer Dashboard</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>Welcome back! Here is a snapshot of your activity.</div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: isMobile ? 10 : 20, marginBottom: 28 }}>
        {[
          { label: 'Products',     value: kpis.totalProducts, color: 'var(--white)' },
          { label: 'Total Orders', value: kpis.totalOrders,   color: 'var(--white)' },
          { label: 'Revenue',      value: `BDT ${kpis.totalRevenue.toLocaleString()}`, color: 'var(--green-lt)' },
        ].map(k => (
          <div key={k.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? '16px 14px' : 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)', marginBottom: 14 }}>Quick Actions</div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(200px, 1fr))', gap: isMobile ? 10 : 16 }}>
        {navItems.map(n => (
          <Link key={n.to} to={n.to} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? '16px 14px' : 24, textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div style={{ fontSize: isMobile ? 22 : 28, marginBottom: 8 }}>{n.icon}</div>
            <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: 'var(--white)', marginBottom: 3 }}>{n.title}</div>
            <div style={{ fontSize: isMobile ? 11 : 13, color: 'var(--muted)' }}>{n.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
