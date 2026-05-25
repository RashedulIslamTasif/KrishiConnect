import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';

const STATUS_COLOR = {
  pending:   { bg: 'rgba(240,184,64,.12)',  color: '#f0b840', border: 'rgba(240,184,64,.3)' },
  confirmed: { bg: 'rgba(90,176,48,.12)',   color: '#7ed44c', border: 'rgba(90,176,48,.3)' },
  shipped:   { bg: 'rgba(29,158,117,.12)',  color: '#1d9e75', border: 'rgba(29,158,117,.3)' },
  delivered: { bg: 'rgba(90,176,48,.18)',   color: '#5ab030', border: 'rgba(90,176,48,.4)' },
  cancelled: { bg: 'rgba(224,85,85,.12)',   color: '#e05555', border: 'rgba(224,85,85,.3)' },
};

const Badge = ({ status }) => {
  const c = STATUS_COLOR[status] || STATUS_COLOR.pending;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: 'capitalize' }}>
      {status}
    </span>
  );
};

const s = {
  page: { minHeight: '100vh', padding: '40px 48px', maxWidth: 900, margin: '0 auto' },
  title: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--white)', marginBottom: 28 },
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 16 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 12 },
  orderId: { fontSize: 12, color: 'var(--muted)', marginBottom: 4 },
  items: { fontSize: 14, color: 'var(--white)', marginBottom: 8 },
  total: { fontSize: 16, fontWeight: 700, color: 'var(--green-lt)' },
  trackBtn: { background: 'rgba(90,176,48,.12)', color: 'var(--green-lt)', border: '1px solid rgba(90,176,48,.25)', borderRadius: 99, padding: '8px 18px', fontSize: 13, fontWeight: 600, textDecoration: 'none' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '80px 0', fontSize: 15 },
};

export default function MyOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api.get('/orders/my')
      .then(r => {
        const data = r.data;
        if (Array.isArray(data)) setOrders(data);
        else if (Array.isArray(data.orders)) setOrders(data.orders);
        else setOrders([]);
      })
      .catch(() => setError('Could not load orders. Make sure the server is running.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.page}>
      <div style={s.title}>My Orders</div>
      {error && <div style={{ color: '#e05555', marginBottom: 20, fontSize: 14 }}>{error}</div>}
      {loading ? (
        <div style={s.empty}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={s.empty}>
          You have not placed any orders yet.{' '}
          <Link to="/marketplace" style={{ color: 'var(--green-lt)' }}>Shop now</Link>
        </div>
      ) : (
        orders.map(order => (
          <div key={order._id} style={s.card}>
            <div style={s.row}>
              <div>
                <div style={s.orderId}>Order #{order._id?.slice(-8).toUpperCase()}</div>
                <div style={s.items}>
                  {order.items?.map(i => `${i.product?.name || i.name || 'Product'} x ${i.quantity}`).join(', ')}
                </div>
                <div style={s.total}>BDT {order.totalAmount?.toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                <Badge status={order.status} />
                <Link to={`/orders/${order._id}`} style={s.trackBtn}>Track Order</Link>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Placed: {new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
