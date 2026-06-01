import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useResponsive } from '../hooks/useResponsive.js';

const STATUS_COLOR = {
  pending:          { bg:'rgba(240,184,64,.12)', color:'#f0b840', border:'rgba(240,184,64,.3)' },
  confirmed:        { bg:'rgba(90,176,48,.12)',  color:'#7ed44c', border:'rgba(90,176,48,.3)' },
  harvested:        { bg:'rgba(29,158,117,.12)', color:'#1d9e75', border:'rgba(29,158,117,.3)' },
  out_for_delivery: { bg:'rgba(90,176,48,.15)',  color:'#5ab030', border:'rgba(90,176,48,.4)' },
  delivered:        { bg:'rgba(90,176,48,.25)',  color:'#5ab030', border:'rgba(90,176,48,.5)' },
  cancelled:        { bg:'rgba(224,85,85,.12)',  color:'#e05555', border:'rgba(224,85,85,.3)' },
};

const Badge = ({ status }) => {
  const c = STATUS_COLOR[status] || STATUS_COLOR.pending;
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{status?.replace(/_/g,' ')}</span>;
};

function ReviewModal({ order, onClose, onSubmitted }) {
  const [rating, setRating]   = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const firstItem = order.items?.[0];

  const handleSubmit = async () => {
    if (!comment.trim()) { setError('Please write a comment.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/reviews', { farmerId: order.farmer?._id || order.farmer, productId: firstItem?.product?._id || firstItem?.product, orderId: order._id, rating, comment });
      onSubmitted(order._id); onClose();
    } catch (e) { setError(e.response?.data?.message || 'Failed to submit review.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'var(--card)', borderRadius:'20px 20px 0 0', padding:28, width:'100%', maxWidth:500 }}>
        <div style={{ fontSize:18, fontWeight:700, color:'var(--white)', marginBottom:4 }}>Write a Review</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:20 }}>for {firstItem?.name}</div>
        {error && <div style={{ background:'rgba(224,85,85,.12)', color:'#e05555', borderRadius:10, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{error}</div>}
        <div style={{ display:'flex', gap:6, marginBottom:20 }}>
          {[1,2,3,4,5].map(n => <button key={n} onClick={() => setRating(n)} style={{ fontSize:28, background:'none', border:'none', cursor:'pointer', color: n <= rating ? '#f0b840' : 'var(--muted)' }}>★</button>)}
        </div>
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..."
          style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', color:'var(--white)', fontSize:14, outline:'none', fontFamily:'Sora,sans-serif', boxSizing:'border-box', minHeight:90, resize:'vertical', marginBottom:20 }} />
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={handleSubmit} disabled={loading} style={{ flex:1, background:'var(--green-hi)', color:'#fff', border:'none', borderRadius:99, padding:'13px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer' }}>{loading ? 'Submitting...' : 'Submit'}</button>
          <button onClick={onClose} style={{ flex:1, background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:99, padding:'13px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewedIds, setReviewedIds] = useState(new Set());

  useEffect(() => {
    Promise.all([api.get('/orders/my'), api.get('/reviews/my')])
      .then(([o, r]) => {
        const d = o.data;
        setOrders(Array.isArray(d) ? d : d.orders || []);
        setReviewedIds(new Set(r.data.reviewedOrderIds || []));
      }).catch(() => setError('Could not load orders.')).finally(() => setLoading(false));
  }, []);

  const pad = isMobile ? '16px 12px' : '40px 48px';

  return (
    <div style={{ minHeight:'100vh', padding: pad, maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => navigate(-1)} style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:99, padding:'7px 16px', color:'var(--muted)', fontFamily:'Sora,sans-serif', fontSize:13, cursor:'pointer', marginBottom:20 }}>← Back</button>
      <div style={{ fontSize: isMobile ? 22 : 28, fontWeight:700, color:'var(--white)', marginBottom:24 }}>My Orders</div>

      {reviewOrder && <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} onSubmitted={id => setReviewedIds(p => new Set([...p, id]))} />}
      {error && <div style={{ color:'#e05555', marginBottom:20, fontSize:14 }}>{error}</div>}

      {loading ? <div style={{ textAlign:'center', color:'var(--muted)', padding:'60px 0' }}>Loading orders...</div>
      : orders.length === 0 ? <div style={{ textAlign:'center', color:'var(--muted)', padding:'60px 0' }}>No orders yet. <Link to="/marketplace" style={{ color:'var(--green-lt)' }}>Shop now</Link></div>
      : orders.map(order => {
        const done = reviewedIds.has(order._id);
        return (
          <div key={order._id} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding: isMobile ? 16 : 24, marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, flexWrap:'wrap' }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'var(--muted)', marginBottom:3 }}>Order #{order._id?.slice(-8).toUpperCase()}</div>
                <div style={{ fontSize: isMobile ? 13 : 14, color:'var(--white)', marginBottom:4 }}>{order.items?.map(i => `${i.name || 'Product'} x${i.quantity}`).join(', ')}</div>
                <div style={{ fontSize: isMobile ? 15 : 16, fontWeight:700, color:'var(--green-lt)', marginBottom: order.deliveryAddress ? 4 : 0 }}>BDT {order.totalAmount?.toLocaleString()}</div>
                {order.deliveryAddress && <div style={{ fontSize:11, color:'var(--muted)' }}>📍 {order.deliveryAddress}</div>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
                <Badge status={order.status} />
                <Link to={`/orders/${order._id}`} style={{ background:'rgba(90,176,48,.12)', color:'var(--green-lt)', border:'1px solid rgba(90,176,48,.25)', borderRadius:99, padding:'7px 14px', fontSize:12, fontWeight:600, textDecoration:'none' }}>Track</Link>
                {order.status === 'delivered' && !done && (
                  <button onClick={() => setReviewOrder(order)} style={{ background:'rgba(240,184,64,.1)', color:'#f0b840', border:'1px solid rgba(240,184,64,.3)', borderRadius:99, padding:'7px 14px', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Sora,sans-serif' }}>★ Review</button>
                )}
                {order.status === 'delivered' && done && <span style={{ fontSize:11, color:'var(--green-lt)' }}>✓ Reviewed</span>}
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
