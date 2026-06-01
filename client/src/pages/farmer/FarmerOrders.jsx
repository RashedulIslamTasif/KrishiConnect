import { useState, useEffect } from 'react';
import api from '../../api/axios.js';
import { useResponsive } from '../../hooks/useResponsive.js';

const STATUS_OPTIONS = ['pending','confirmed','harvested','out_for_delivery','delivered','cancelled'];
const STATUS_COLOR = {
  pending:          { bg:'rgba(240,184,64,.12)',  color:'#f0b840' },
  confirmed:        { bg:'rgba(90,176,48,.12)',   color:'#7ed44c' },
  harvested:        { bg:'rgba(29,158,117,.12)',  color:'#1d9e75' },
  out_for_delivery: { bg:'rgba(90,176,48,.15)',   color:'#5ab030' },
  delivered:        { bg:'rgba(90,176,48,.25)',   color:'#5ab030' },
  cancelled:        { bg:'rgba(224,85,85,.12)',   color:'#e05555' },
};

export default function FarmerOrders() {
  const { isMobile } = useResponsive();
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(null);

  useEffect(() => {
    api.get('/orders/farmer').then(r => {
      const d = r.data;
      setOrders(Array.isArray(d) ? d : d.orders || []);
    }).catch(() => setOrders([])).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    setSaving(id);
    try {
      await api.put(`/orders/${id}/status`, { status });
      setOrders(prev => prev.map(o => o._id === id ? { ...o, status } : o));
    } catch (e) { alert(e.response?.data?.message || 'Failed to update'); }
    finally { setSaving(null); }
  };

  const pad = isMobile ? '16px 12px' : '36px 48px';

  return (
    <div style={{ minHeight:'100vh', padding: pad, maxWidth:1000, margin:'0 auto' }}>
      <div style={{ fontSize: isMobile ? 20 : 26, fontWeight:700, color:'var(--white)', marginBottom:24 }}>
        Incoming Orders {orders.length > 0 && `(${orders.length})`}
      </div>

      {loading ? <div style={{ textAlign:'center', color:'var(--muted)', padding:'60px 0' }}>Loading...</div>
      : orders.length === 0 ? <div style={{ textAlign:'center', color:'var(--muted)', padding:'60px 0' }}>No orders yet. Orders from customers will appear here.</div>
      : orders.map(order => {
        const sc = STATUS_COLOR[order.status] || STATUS_COLOR.pending;
        return (
          <div key={order._id} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding: isMobile ? 16 : 24, marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'var(--muted)', marginBottom:2 }}>#{order._id?.slice(-8).toUpperCase()}</div>
                <div style={{ fontSize: isMobile ? 14 : 15, fontWeight:600, color:'var(--white)', marginBottom:2 }}>{order.customer?.name || 'Customer'}</div>
                {order.customer?.phone && <div style={{ fontSize:12, color:'var(--green-lt)', marginBottom:4 }}>📞 {order.customer.phone}</div>}
                <div style={{ fontSize: isMobile ? 12 : 13, color:'rgba(240,244,236,.6)', marginBottom:4 }}>
                  {order.items?.map(i => `${i.name || 'Item'} x${i.quantity}`).join(' · ')}
                </div>
                {order.deliveryAddress && <div style={{ fontSize:11, color:'var(--muted)', marginBottom:4 }}>📍 {order.deliveryAddress}</div>}
                <div style={{ fontSize: isMobile ? 14 : 15, fontWeight:700, color:'var(--green-lt)' }}>BDT {order.totalAmount?.toLocaleString()}</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8, flexShrink:0 }}>
                <span style={{ fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99, background:sc.bg, color:sc.color, textTransform:'capitalize' }}>{order.status?.replace(/_/g,' ')}</span>
                <select value={order.status} onChange={e => updateStatus(order._id, e.target.value)} disabled={saving === order._id}
                  style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:8, padding:'7px 10px', color:'var(--white)', fontSize:12, cursor:'pointer', fontFamily:'Sora,sans-serif', outline:'none' }}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase())}</option>)}
                </select>
                {saving === order._id && <span style={{ fontSize:11, color:'var(--muted)' }}>Saving...</span>}
              </div>
            </div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:8 }}>
              {new Date(order.createdAt).toLocaleDateString('en-BD', { day:'numeric', month:'short', year:'numeric' })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
