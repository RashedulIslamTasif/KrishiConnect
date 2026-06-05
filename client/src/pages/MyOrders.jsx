import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';

const STATUS_STYLE = {
  pending:          { bg:'#fef3d8', color:'#c47d0a', label:'Pending' },
  confirmed:        { bg:'#e8f5e1', color:'#4e9e2a', label:'Confirmed' },
  harvested:        { bg:'#e0f4ef', color:'#1d9e75', label:'Harvested' },
  out_for_delivery: { bg:'#e8f5e1', color:'#3a7d1e', label:'On the way' },
  delivered:        { bg:'#e8f5e1', color:'#3a7d1e', label:'Delivered ✓' },
  cancelled:        { bg:'#fde8e8', color:'#c04040', label:'Cancelled' },
};

function Badge({ status }) {
  const c = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return <span style={{ fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:99, background:c.bg, color:c.color, whiteSpace:'nowrap' }}>{c.label}</span>;
}

function ReviewModal({ order, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const firstItem = order.items?.[0];
  const handleSubmit = async () => {
    if (!comment.trim()) { setError('Please write a comment.'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/reviews', { farmerId: order.farmer?._id||order.farmer, productId: firstItem?.product?._id||firstItem?.product, orderId: order._id, rating, comment });
      onSubmitted(order._id); onClose();
    } catch (e) { setError(e.response?.data?.message || 'Failed to submit.'); }
    finally { setLoading(false); }
  };
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,30,10,.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:'24px 20px 40px', width:'100%', maxWidth:480, animation:'slideUp .3s cubic-bezier(.22,1,.36,1) both' }}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ width:40, height:4, background:'#e0e8da', borderRadius:99, margin:'0 auto 18px' }} />
        <div style={{ fontSize:18, fontWeight:800, color:'#1a2415', marginBottom:4 }}>Write a Review</div>
        <div style={{ fontSize:13, color:'#7a9070', marginBottom:18 }}>for {firstItem?.name}</div>
        {error && <div style={{ background:'#fde8e8', color:'#c04040', borderRadius:12, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{error}</div>}
        <div style={{ display:'flex', gap:4, marginBottom:18 }}>
          {[1,2,3,4,5].map(n => <button key={n} onClick={() => setRating(n)} style={{ fontSize:28, background:'none', border:'none', cursor:'pointer', color: n<=rating?'#f0b840':'#e0e8da', transition:'transform .15s' }}>★</button>)}
        </div>
        <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience..."
          style={{ width:'100%', background:'#f5f7f2', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:14, padding:'12px 16px', color:'#1a2415', fontSize:14, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box', minHeight:90, resize:'vertical', marginBottom:18 }} />
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={handleSubmit} disabled={loading} style={{ flex:1, background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', border:'none', borderRadius:99, padding:'13px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer', boxShadow:'0 4px 12px rgba(78,158,42,.3)' }}>{loading?'Submitting...':'Submit Review'}</button>
          <button onClick={onClose} style={{ flex:1, background:'#f5f7f2', color:'#7a9070', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:99, padding:'13px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const navigate = useNavigate();
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [reviewed, setReviewed] = useState({});
  const [reviewOrder, setReviewOrder] = useState(null);

  useEffect(() => {
    api.get('/orders/mine').then(r => setOrders(r.data.orders||r.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {reviewOrder && <ReviewModal order={reviewOrder} onClose={() => setReviewOrder(null)} onSubmitted={id => setReviewed(r=>({...r,[id]:true}))} />}

      <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 16px 40px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}>
          <button onClick={() => navigate(-1)} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.15)', borderRadius:12, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16, boxShadow:'0 1px 4px rgba(20,50,10,.06)', flexShrink:0 }}>←</button>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:'#1a2415', letterSpacing:'-0.02em' }}>My Orders</div>
            <div style={{ fontSize:12, color:'#7a9070' }}>{orders.length} order{orders.length!==1?'s':''}</div>
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[...Array(3)].map((_,i)=><div key={i} style={{ height:110, borderRadius:18, backgroundImage:'linear-gradient(90deg,#e8ede4 25%,#f0f4ec 50%,#e8ede4 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }}/>)}
            <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>📦</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#1a2415', marginBottom:8 }}>No orders yet</div>
            <div style={{ fontSize:13, color:'#7a9070', marginBottom:24 }}>Start shopping fresh farm produce</div>
            <Link to="/marketplace" style={{ background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', textDecoration:'none', borderRadius:99, padding:'13px 28px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:14, boxShadow:'0 4px 12px rgba(78,158,42,.3)' }}>Browse Market</Link>
          </div>
        ) : (
          orders.map((order, idx) => {
            const st = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
            const canReview = order.status==='delivered' && !reviewed[order._id] && !order.reviewed;
            return (
              <div key={order._id} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:20, padding:16, marginBottom:12, boxShadow:'0 2px 8px rgba(20,50,10,.05)', animation:`fadeUp .4s ${idx*.05}s cubic-bezier(.22,1,.36,1) both` }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <div>
                    <div style={{ fontSize:11, color:'#7a9070', fontWeight:600, marginBottom:2 }}>Order #{order._id.slice(-6).toUpperCase()}</div>
                    <div style={{ fontSize:11, color:'#afc09e' }}>{new Date(order.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
                  </div>
                  <Badge status={order.status} />
                </div>
                {/* Items */}
                <div style={{ display:'flex', gap:8, marginBottom:12, overflowX:'auto', scrollbarWidth:'none', paddingBottom:4 }}>
                  {(order.items||[]).map((item,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:8, background:'#f5f7f2', borderRadius:12, padding:'8px 10px', flexShrink:0 }}>
                      <div style={{ width:32, height:32, borderRadius:8, background:'#e8ede4', overflow:'hidden', flexShrink:0 }}>
                        {item.product?.images?.[0] && <img src={item.product.images[0]} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:700, color:'#1a2415', whiteSpace:'nowrap' }}>{item.name}</div>
                        <div style={{ fontSize:10, color:'#7a9070' }}>x{item.qty} · ৳{item.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontSize:15, fontWeight:800, color:'#4e9e2a' }}>৳{(order.totalAmount||0).toLocaleString()}</div>
                  <div style={{ display:'flex', gap:8 }}>
                    <Link to={`/orders/${order._id}`} style={{ background:'#e8f5e1', color:'#4e9e2a', textDecoration:'none', borderRadius:99, padding:'7px 14px', fontSize:12, fontWeight:700, fontFamily:'Plus Jakarta Sans,sans-serif' }}>Track →</Link>
                    {canReview && <button onClick={() => setReviewOrder(order)} style={{ background:'#fef3d8', color:'#c47d0a', border:'none', borderRadius:99, padding:'7px 14px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>⭐ Review</button>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
