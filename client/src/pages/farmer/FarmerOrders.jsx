import { useState, useEffect } from 'react';
import api from '../../api/axios.js';

const STATUS_OPTIONS = ['pending','confirmed','harvested','out_for_delivery','delivered','cancelled'];
const STATUS_COLOR = {
  pending:          { bg:'rgba(240,184,64,.12)',  color:'#f0b840', border:'rgba(240,184,64,.3)' },
  confirmed:        { bg:'rgba(90,176,48,.12)',   color:'#7ed44c', border:'rgba(90,176,48,.3)' },
  harvested:        { bg:'rgba(29,158,117,.12)',  color:'#1d9e75', border:'rgba(29,158,117,.3)' },
  out_for_delivery: { bg:'rgba(90,176,48,.15)',   color:'#5ab030', border:'rgba(90,176,48,.4)' },
  delivered:        { bg:'rgba(90,176,48,.25)',   color:'#5ab030', border:'rgba(90,176,48,.5)' },
  cancelled:        { bg:'rgba(224,85,85,.12)',   color:'#e05555', border:'rgba(224,85,85,.3)' },
};

const Badge = ({ status }) => {
  const c = STATUS_COLOR[status] || STATUS_COLOR.pending;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: 'capitalize' }}>{status.replace(/_/g,' ')}</span>;
};

const s = {
  page: { minHeight: '100vh', padding: '36px 48px', maxWidth: 1000, margin: '0 auto' },
  title: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--white)', marginBottom: 28 },
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 },
  orderId: { fontSize: 12, color: 'var(--muted)', marginBottom: 4 },
  customer: { fontSize: 15, fontWeight: 600, color: 'var(--white)', marginBottom: 2 },
  phone: { fontSize: 13, color: 'var(--green-lt)', marginBottom: 4 },
  items: { fontSize: 13, color: 'rgba(240,244,236,.6)', marginBottom: 6 },
  address: { fontSize: 12, color: 'var(--muted)', marginBottom: 4 },
  total: { fontSize: 15, fontWeight: 700, color: 'var(--green-lt)' },
  select: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--white)', fontSize: 13, cursor: 'pointer', fontFamily: 'Sora,sans-serif', outline: 'none' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '60px 0' },
  saving: { fontSize: 11, color: 'var(--muted)', marginTop: 4 },
};

export default function FarmerOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(null);

  useEffect(() => {
    api.get('/orders/farmer')
      .then(r => {
        const d = r.data;
        if (Array.isArray(d)) setOrders(d);
        else if (Array.isArray(d.orders)) setOrders(d.orders);
        else setOrders([]);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    setSaving(id);
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.title}>Incoming Orders {orders.length > 0 && `(${orders.length})`}</div>
      {loading ? <div style={s.empty}>Loading...</div> : orders.length === 0 ? (
        <div style={s.empty}>No orders yet. Orders from customers will appear here.</div>
      ) : orders.map(order => (
        <div key={order._id} style={s.card}>
          <div style={s.row}>
            <div style={{ flex: 1 }}>
              <div style={s.orderId}>Order #{order._id?.slice(-8).toUpperCase()}</div>
              <div style={s.customer}>{order.customer?.name || 'Customer'}</div>
              {order.customer?.phone && <div style={s.phone}>📞 {order.customer.phone}</div>}
              <div style={s.items}>
                {order.items?.map(i => `${i.name || 'Item'} x ${i.quantity} ${i.unit || ''}`).join(' | ')}
              </div>
              {order.deliveryAddress && (
                <div style={s.address}>📍 {order.deliveryAddress}</div>
              )}
              <div style={s.total}>BDT {order.totalAmount?.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                {new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
              <Badge status={order.status} />
              <select
                style={s.select}
                value={order.status}
                onChange={e => updateStatus(order._id, e.target.value)}
                disabled={saving === order._id}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
                ))}
              </select>
              {saving === order._id && <div style={s.saving}>Saving...</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
