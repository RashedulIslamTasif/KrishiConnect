import { useState, useEffect } from 'react';
import api from '../../api/axios.js';

const STATUS_OPTIONS = ['pending','confirmed','harvested','out_for_delivery','delivered','cancelled'];
const STATUS_STYLE = {
  pending:          { bg:'#fef3d8', color:'#c47d0a' },
  confirmed:        { bg:'#e8f5e1', color:'#4e9e2a' },
  harvested:        { bg:'#e0f4ef', color:'#1d9e75' },
  out_for_delivery: { bg:'#e8f5e1', color:'#3a7d1e' },
  delivered:        { bg:'#e8f5e1', color:'#3a7d1e' },
  cancelled:        { bg:'#fde8e8', color:'#c04040' },
};

export default function FarmerOrders() {
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
      setOrders(prev => prev.map(o => o._id===id ? {...o, status} : o));
    } catch (e) { alert(e.response?.data?.message || 'Failed to update'); }
    finally { setSaving(null); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif', padding:'24px 16px 40px' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ maxWidth:700, margin:'0 auto' }}>
        <div style={{ marginBottom:24, animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#4e9e2a', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6 }}>Farmer Panel</div>
          <div style={{ fontSize:22, fontWeight:800, color:'#1a2415', letterSpacing:'-0.03em' }}>
            Incoming Orders {orders.length>0 && <span style={{ fontSize:14, background:'#e8f5e1', color:'#4e9e2a', borderRadius:99, padding:'3px 10px', fontWeight:700, marginLeft:8, verticalAlign:'middle' }}>{orders.length}</span>}
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[...Array(3)].map((_,i) => <div key={i} style={{ height:120, borderRadius:18, backgroundImage:'linear-gradient(90deg,#e8ede4 25%,#f0f4ec 50%,#e8ede4 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }} />)}
            <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>📭</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#1a2415', marginBottom:8 }}>No orders yet</div>
            <div style={{ fontSize:13, color:'#7a9070' }}>Orders from customers will appear here.</div>
          </div>
        ) : (
          orders.map((order, idx) => {
            const sc = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
            return (
              <div key={order._id} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:20, padding:16, marginBottom:12, boxShadow:'0 2px 8px rgba(20,50,10,.05)', animation:`fadeUp .4s ${idx*.05}s cubic-bezier(.22,1,.36,1) both` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:11, color:'#7a9070', marginBottom:3, fontWeight:600 }}>#{order._id?.slice(-8).toUpperCase()}</div>
                    <div style={{ fontSize:15, fontWeight:800, color:'#1a2415', marginBottom:2 }}>{order.customer?.name || 'Customer'}</div>
                    {order.customer?.phone && <div style={{ fontSize:12, color:'#4e9e2a', fontWeight:600 }}>📞 {order.customer.phone}</div>}
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, padding:'5px 12px', borderRadius:99, background:sc.bg, color:sc.color, whiteSpace:'nowrap', flexShrink:0 }}>{order.status?.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>
                </div>

                <div style={{ background:'#f5f7f2', borderRadius:12, padding:'10px 12px', marginBottom:12 }}>
                  <div style={{ fontSize:12, color:'#7a9070', marginBottom:4, fontWeight:600 }}>Items</div>
                  <div style={{ fontSize:13, color:'#1a2415', fontWeight:600 }}>{order.items?.map(i=>`${i.name||'Item'} ×${i.quantity||i.qty}`).join(' · ')}</div>
                </div>

                {order.deliveryAddress && <div style={{ fontSize:12, color:'#7a9070', marginBottom:12 }}>📍 {order.deliveryAddress}</div>}

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
                  <div style={{ fontSize:16, fontWeight:800, color:'#4e9e2a' }}>৳{order.totalAmount?.toLocaleString()}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    {saving===order._id && <span style={{ fontSize:11, color:'#7a9070' }}>Saving...</span>}
                    <select value={order.status} onChange={e => updateStatus(order._id, e.target.value)} disabled={saving===order._id}
                      style={{ background:'#f5f7f2', border:'1.5px solid rgba(60,100,40,.2)', borderRadius:10, padding:'8px 12px', color:'#1a2415', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', outline:'none' }}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ fontSize:11, color:'#afc09e', marginTop:10 }}>{new Date(order.createdAt).toLocaleDateString('en-BD',{day:'numeric',month:'short',year:'numeric'})}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
