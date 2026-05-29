import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

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
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, background: c.bg, color: c.color, border: `1px solid ${c.border}`, textTransform: 'capitalize' }}>{status?.replace(/_/g,' ')}</span>;
};

function ReviewModal({ order, onClose, onSubmitted }) {
  const [rating, setRating]   = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const firstItem = order.items?.[0];

  const handleSubmit = async () => {
    if (!comment.trim()) { setError('Please write a comment.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/reviews', {
        farmerId:  order.farmer?._id || order.farmer,
        productId: firstItem?.product?._id || firstItem?.product,
        orderId:   order._id,
        rating,
        comment,
      });
      onSubmitted(order._id);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to submit review.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }}>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:32, width:'100%', maxWidth:440 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--white)', marginBottom:4 }}>Write a Review</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>for {firstItem?.name}</div>

        {error && <div style={{ background:'rgba(224,85,85,.12)', border:'1px solid rgba(224,85,85,.3)', color:'#e05555', borderRadius:10, padding:'10px 14px', fontSize:13, marginBottom:16 }}>{error}</div>}

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Rating</div>
          <div style={{ display:'flex', gap:8 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setRating(n)} style={{ fontSize:28, background:'none', border:'none', cursor:'pointer', color: n <= rating ? '#f0b840' : 'var(--muted)', transition:'color .15s' }}>★</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' }}>Your Comment</div>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience with this product and farmer..."
            style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', color:'var(--white)', fontSize:14, outline:'none', fontFamily:'Sora,sans-serif', boxSizing:'border-box', minHeight:100, resize:'vertical' }}
          />
        </div>

        <div style={{ display:'flex', gap:12 }}>
          <button onClick={handleSubmit} disabled={loading} style={{ flex:1, background:'var(--green-hi)', color:'#fff', border:'none', borderRadius:99, padding:'13px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer' }}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
          <button onClick={onClose} style={{ flex:1, background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:99, padding:'13px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight:'100vh', padding:'40px 48px', maxWidth:900, margin:'0 auto' },
  backBtn:   { background:'transparent', border:'1px solid var(--border)', borderRadius:99, padding:'7px 16px', color:'var(--muted)', fontFamily:'Sora,sans-serif', fontSize:13, cursor:'pointer', marginBottom:20, display:'inline-block' },
  title:     { fontSize:28, fontWeight:700, letterSpacing:'-0.03em', color:'var(--white)', marginBottom:28 },
  card:      { background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:24, marginBottom:16 },
  row:       { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12, flexWrap:'wrap', gap:12 },
  orderId:   { fontSize:12, color:'var(--muted)', marginBottom:4 },
  items:     { fontSize:14, color:'var(--white)', marginBottom:8 },
  total:     { fontSize:16, fontWeight:700, color:'var(--green-lt)' },
  trackBtn:  { background:'rgba(90,176,48,.12)', color:'var(--green-lt)', border:'1px solid rgba(90,176,48,.25)', borderRadius:99, padding:'8px 18px', fontSize:13, fontWeight:600, textDecoration:'none', display:'inline-block' },
  reviewBtn: { background:'rgba(240,184,64,.1)', color:'#f0b840', border:'1px solid rgba(240,184,64,.3)', borderRadius:99, padding:'8px 18px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Sora,sans-serif' },
  doneTag:   { fontSize:12, color:'var(--green-lt)', display:'flex', alignItems:'center', gap:4 },
  empty:     { textAlign:'center', color:'var(--muted)', padding:'80px 0', fontSize:15 },
};

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [reviewOrder, setReviewOrder] = useState(null);
  // Set of order IDs already reviewed — loaded from server so it survives refresh
  const [reviewedIds, setReviewedIds] = useState(new Set());

  useEffect(() => {
    Promise.all([
      api.get('/orders/my'),
      api.get('/reviews/my'),
    ]).then(([ordersRes, reviewsRes]) => {
      const d = ordersRes.data;
      setOrders(Array.isArray(d) ? d : d.orders || []);
      const ids = reviewsRes.data.reviewedOrderIds || [];
      setReviewedIds(new Set(ids));
    }).catch(() => {
      setError('Could not load orders.');
    }).finally(() => setLoading(false));
  }, []);

  const handleReviewSubmitted = (orderId) => {
    setReviewedIds(prev => new Set([...prev, orderId]));
  };

  return (
    <div style={s.page}>
      <button style={s.backBtn} onClick={() => navigate(-1)}>← Back</button>
      <div style={s.title}>My Orders</div>

      {reviewOrder && (
        <ReviewModal
          order={reviewOrder}
          onClose={() => setReviewOrder(null)}
          onSubmitted={handleReviewSubmitted}
        />
      )}

      {error && <div style={{ color:'#e05555', marginBottom:20, fontSize:14 }}>{error}</div>}

      {loading ? (
        <div style={s.empty}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div style={s.empty}>You have not placed any orders yet. <Link to="/marketplace" style={{ color:'var(--green-lt)' }}>Shop now</Link></div>
      ) : (
        orders.map(order => {
          const alreadyReviewed = reviewedIds.has(order._id);
          return (
            <div key={order._id} style={s.card}>
              <div style={s.row}>
                <div>
                  <div style={s.orderId}>Order #{order._id?.slice(-8).toUpperCase()}</div>
                  <div style={s.items}>{order.items?.map(i => `${i.name || 'Product'} x ${i.quantity}`).join(', ')}</div>
                  <div style={s.total}>BDT {order.totalAmount?.toLocaleString()}</div>
                  {order.deliveryAddress && <div style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>📍 {order.deliveryAddress}</div>}
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:10 }}>
                  <Badge status={order.status} />
                  <Link to={`/orders/${order._id}`} style={s.trackBtn}>Track Order</Link>
                  {order.status === 'delivered' && !alreadyReviewed && (
                    <button style={s.reviewBtn} onClick={() => setReviewOrder(order)}>★ Write Review</button>
                  )}
                  {order.status === 'delivered' && alreadyReviewed && (
                    <span style={s.doneTag}>✓ Reviewed</span>
                  )}
                </div>
              </div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>
                Placed: {new Date(order.createdAt).toLocaleDateString('en-BD', { day:'numeric', month:'short', year:'numeric' })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
