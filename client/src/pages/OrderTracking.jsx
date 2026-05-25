import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios.js';

const STEPS = [
  { key: 'pending',          label: 'Order Placed',      icon: '📦', desc: 'Your order has been received' },
  { key: 'confirmed',        label: 'Confirmed',         icon: '✅', desc: 'Farmer confirmed your order' },
  { key: 'harvested',        label: 'Harvested',         icon: '🌾', desc: 'Produce freshly harvested' },
  { key: 'out_for_delivery', label: 'Out for Delivery',  icon: '🚚', desc: 'On the way to you' },
  { key: 'delivered',        label: 'Delivered',         icon: '🎉', desc: 'Enjoy your fresh produce!' },
];

const STATUS_ORDER = ['pending','confirmed','harvested','out_for_delivery','delivered'];

export default function OrderTracking() {
  const { id }               = useParams();
  const [order, setOrder]    = useState(null);
  const [loading, setLoading]= useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.order))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ textAlign:'center', padding:'80px', color:'var(--muted)', fontSize:14 }}>Loading order…</div>;
  if (!order)  return <div style={{ textAlign:'center', padding:'80px', color:'var(--muted)', fontSize:14 }}>Order not found</div>;

  const currentIdx  = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  const qrValue = JSON.stringify({
    orderId:  order._id,
    customer: order.customer?.name,
    amount:   order.totalAmount,
    items:    order.items?.length,
  });

  return (
    <div style={{ minHeight:'100vh', padding:'48px 56px', maxWidth:860, margin:'0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom:36 }}>
        <Link to="/orders" style={{ fontSize:13, color:'var(--muted)', textDecoration:'none' }}>← My Orders</Link>
        <h1 style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.03em', marginTop:12 }}>Order Tracking</h1>
        <div style={{ fontSize:13, color:'var(--muted)', marginTop:4 }}>
          Order ID: <span style={{ fontFamily:'DM Mono,monospace', color:'var(--green-lt)' }}>#{order._id?.slice(-8).toUpperCase()}</span>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:24 }}>
        <div>
          {/* Timeline */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:28, marginBottom:20 }}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:28 }}>Delivery Progress</div>

            {isCancelled ? (
              <div style={{ textAlign:'center', padding:'32px 0', color:'#e05555' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>❌</div>
                <div style={{ fontSize:16, fontWeight:600 }}>Order Cancelled</div>
              </div>
            ) : (
              <div style={{ position:'relative' }}>
                {/* Vertical line */}
                <div style={{
                  position:'absolute', left:20, top:24, bottom:24,
                  width:2, background:'var(--border)',
                }} />
                {/* Progress line */}
                <div style={{
                  position:'absolute', left:20, top:24,
                  width:2,
                  height:`${(currentIdx / (STEPS.length - 1)) * 100}%`,
                  background:'var(--green-hi)',
                  transition:'height 1s ease',
                }} />

                {STEPS.map((step, idx) => {
                  const done    = idx <= currentIdx;
                  const current = idx === currentIdx;
                  const history = order.statusHistory?.find(h => h.status === step.key);

                  return (
                    <div key={step.key} style={{ display:'flex', gap:20, marginBottom: idx < STEPS.length - 1 ? 32 : 0, position:'relative' }}>
                      {/* Circle */}
                      <div style={{
                        width:42, height:42, borderRadius:'50%', flexShrink:0,
                        background: done ? 'var(--green-hi)' : 'var(--card2)',
                        border: current ? '3px solid var(--green-lt)' : done ? '3px solid var(--green-hi)' : '2px solid var(--border)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize: done ? 18 : 16,
                        boxShadow: current ? '0 0 0 6px rgba(90,176,48,.2)' : 'none',
                        transition:'all .4s',
                        zIndex:1,
                      }}>
                        {done ? step.icon : <span style={{ opacity:0.3 }}>{step.icon}</span>}
                      </div>

                      {/* Text */}
                      <div style={{ flex:1, paddingTop:8 }}>
                        <div style={{ fontSize:14, fontWeight: done ? 600 : 400, color: done ? 'var(--white)' : 'var(--muted)' }}>
                          {step.label}
                          {current && <span style={{ marginLeft:8, fontSize:10, fontWeight:700, background:'rgba(90,176,48,.18)', color:'var(--green-lt)', padding:'2px 8px', borderRadius:99 }}>CURRENT</span>}
                        </div>
                        <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{step.desc}</div>
                        {history && (
                          <div style={{ fontSize:11, color:'var(--green-lt)', marginTop:4 }}>
                            {new Date(history.updatedAt).toLocaleString('en-BD')}
                            {history.note && ` · ${history.note}`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order items */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:28 }}>
            <div style={{ fontSize:15, fontWeight:600, marginBottom:20 }}>Order Items</div>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom: i < order.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width:46, height:46, borderRadius:10, overflow:'hidden', background:'var(--card2)', flexShrink:0 }}>
                  {item.image ? <img src={item.image} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>🥦</div>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:500 }}>{item.name}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{item.quantity} {item.unit} × ৳{item.price}</div>
                </div>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--green-lt)' }}>৳{item.price * item.quantity}</div>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:16, paddingTop:16, borderTop:'1px solid var(--border)' }}>
              <div style={{ fontSize:14, fontWeight:600 }}>Total</div>
              <div style={{ fontSize:20, fontWeight:700, color:'var(--green-lt)' }}>৳{order.totalAmount?.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* QR Code */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:24, textAlign:'center' }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:16 }}>Order QR Code</div>
            <div style={{ background:'#fff', borderRadius:12, padding:16, display:'inline-block' }}>
              <QRCodeSVG value={qrValue} size={140} bgColor="#ffffff" fgColor="#0a0f08" />
            </div>
            <div style={{ fontSize:11, color:'var(--muted)', marginTop:12 }}>Show this to verify delivery</div>
          </div>

          {/* Farmer info */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Farmer</div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:38, height:38, borderRadius:'50%', background:'rgba(90,176,48,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>👨‍🌾</div>
              <div>
                <div style={{ fontSize:13, fontWeight:600 }}>{order.farmer?.name}</div>
                <div style={{ fontSize:11, color:'var(--muted)' }}>📍 {order.farmer?.location?.district || 'Bangladesh'}</div>
              </div>
            </div>
            {order.farmer?.phone && (
              <a href={`tel:${order.farmer.phone}`} style={{ display:'block', textAlign:'center', padding:'10px', background:'rgba(90,176,48,.1)', border:'1px solid rgba(90,176,48,.2)', borderRadius:10, fontSize:13, color:'var(--green-lt)', textDecoration:'none' }}>
                📞 Call Farmer
              </a>
            )}
          </div>

          {/* Delivery info */}
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:24 }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:14 }}>Delivery Info</div>
            <div style={{ fontSize:12, color:'var(--muted)', lineHeight:1.7 }}>
              <div>📍 {order.deliveryAddress || 'Not specified'}</div>
              <div style={{ marginTop:6 }}>💳 {order.paymentMethod?.replace(/_/g,' ')}</div>
              {order.isPreOrder && <div style={{ marginTop:6, color:'var(--amber-lt)' }}>📅 Pre-Order</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
