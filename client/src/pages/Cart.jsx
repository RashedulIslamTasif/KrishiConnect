import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';
import PaymentModal from '../components/payment/PaymentModal.jsx';

/* ── Farmer block modal (unchanged) ── */
function FarmerBlockModal({ onClose, navigate }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(10,25,8,.65)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:1100, padding:'20px' }}>
      <div style={{ background:'#fff', borderRadius:28, padding:'32px 28px', maxWidth:380, width:'100%',
        textAlign:'center', animation:'popIn .3s cubic-bezier(.22,1,.36,1) both',
        boxShadow:'0 24px 64px rgba(10,25,8,.18)' }}>
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}`}</style>
        <div style={{ width:72, height:72, borderRadius:'50%',
          background:'linear-gradient(135deg,#fef3d8,#fde8c0)', border:'2px solid rgba(196,125,10,.15)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:34, margin:'0 auto 20px' }}>🌾</div>
        <div style={{ fontSize:20, fontWeight:800, color:'#1a2415', marginBottom:10 }}>Farmers Can't Order</div>
        <div style={{ fontSize:14, color:'#7a9070', lineHeight:1.7, marginBottom:28 }}>
          Your account is registered as a <strong style={{ color:'#c47d0a' }}>Farmer</strong>.
          To buy products, you need a <strong style={{ color:'#4e9e2a' }}>Customer account</strong>.
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={() => { onClose(); navigate('/register?role=customer'); }}
            style={{ background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', border:'none',
              borderRadius:14, padding:'14px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800,
              fontSize:15, cursor:'pointer', boxShadow:'0 4px 14px rgba(78,158,42,.35)' }}>
            Create Customer Account →
          </button>
          <button onClick={() => { onClose(); navigate('/login?role=customer'); }}
            style={{ background:'#f0f4ec', color:'#3a7d1e', border:'1.5px solid rgba(60,100,40,.15)',
              borderRadius:14, padding:'13px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700,
              fontSize:14, cursor:'pointer' }}>
            Log in with Customer Account
          </button>
          <button onClick={onClose} style={{ background:'none', color:'#afc09e', border:'none',
            borderRadius:14, padding:'10px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600,
            fontSize:13, cursor:'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const { cart: items, updateQty, removeFromCart, clearCart } = useCart();
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [pendingOrder,    setPendingOrder]    = useState(null); // order doc returned from POST /orders
  const [showPayment,     setShowPayment]     = useState(false);
  const [showFarmerBlock, setShowFarmerBlock] = useState(false);
  const [creating,        setCreating]        = useState(false);
  const [success,         setSuccess]         = useState(false);

  const total   = items.reduce((s, i) => s + i.price * i.qty, 0);
  const savings = items.reduce((s, i) => s + Math.max(0, (i.marketPrice || i.price) - i.price) * i.qty, 0);

  // Step 1: Guard + create order record → open payment modal
  const handleCheckout = async () => {
    if (!user)                  { navigate('/login'); return; }
    if (user.role === 'farmer') { setShowFarmerBlock(true); return; }

    setCreating(true);
    try {
      // Group by farmer
      const byFarmer = {};
      items.forEach(i => {
        const fid = i.farmer?._id || i.farmer;
        if (!byFarmer[fid]) byFarmer[fid] = [];
        byFarmer[fid].push({ product: i._id, name: i.name, quantity: i.qty, price: i.price, image: i.images?.[0] || '' });
      });

      // Create orders (one per farmer) — returns first one for payment
      const results = await Promise.all(
        Object.entries(byFarmer).map(([farmerId, orderItems]) =>
          api.post('/orders', {
            farmerId,
            items: orderItems,
            deliveryAddress: '',        // will be filled in PaymentModal
            paymentMethod:   'bkash',   // will be overridden in PaymentModal
            totalAmount: orderItems.reduce((s, i) => s + i.quantity * i.price, 0),
          }).then(r => r.data.order)
        )
      );

      // For simplicity show payment for the first (and usually only) order
      // Multi-farmer carts are split automatically above
      setPendingOrder(results[0]);
      setShowPayment(true);
    } catch (e) {
      alert(e.response?.data?.message || 'Could not create order. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  // COD path — called by PaymentModal when user picks cash_on_delivery
  const handleCodConfirmed = async ({ address, payment }) => {
    try {
      await api.put(`/orders/${pendingOrder._id}/payment-method`, {
        deliveryAddress: address,
        paymentMethod:   payment,
      });
      clearCart();
      setShowPayment(false);
      setSuccess(true);
    } catch {
      alert('Order confirmation failed. Please contact support.');
    }
  };

  if (success) return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', display:'flex', alignItems:'center',
      justifyContent:'center', padding:24, fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <div style={{ textAlign:'center', animation:'scaleIn .4s cubic-bezier(.22,1,.36,1) both' }}>
        <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}`}</style>
        <div style={{ width:80, height:80, background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', borderRadius:'50%',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 20px',
          boxShadow:'0 8px 24px rgba(78,158,42,.3)' }}>✓</div>
        <div style={{ fontSize:24, fontWeight:800, color:'#1a2415', marginBottom:8 }}>Order Placed!</div>
        <div style={{ fontSize:14, color:'#7a9070', marginBottom:28 }}>Your order has been successfully placed.</div>
        <button onClick={() => navigate('/orders')} style={{ background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)',
          color:'#fff', border:'none', borderRadius:99, padding:'14px 32px',
          fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15,
          cursor:'pointer', boxShadow:'0 4px 16px rgba(78,158,42,.35)' }}>
          Track My Orders →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {showFarmerBlock && <FarmerBlockModal onClose={() => setShowFarmerBlock(false)} navigate={navigate} />}
      {showPayment && pendingOrder && (
        <PaymentModal
          order={pendingOrder}
          onClose={() => setShowPayment(false)}
          onCodConfirmed={handleCodConfirmed}
        />
      )}

      <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 16px 100px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24,
          animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}>
          <button onClick={() => navigate(-1)} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.15)',
            borderRadius:12, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', fontSize:16, boxShadow:'0 1px 4px rgba(20,50,10,.06)', flexShrink:0 }}>←</button>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:'#1a2415', letterSpacing:'-0.02em' }}>My Cart</div>
            <div style={{ fontSize:12, color:'#7a9070' }}>{items.length} item{items.length !== 1 ? 's' : ''}</div>
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🛒</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#1a2415', marginBottom:8 }}>Your cart is empty</div>
            <div style={{ fontSize:13, color:'#7a9070', marginBottom:24 }}>Browse fresh produce from local farmers</div>
            <button onClick={() => navigate('/marketplace')} style={{ background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)',
              color:'#fff', border:'none', borderRadius:99, padding:'13px 32px',
              fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:14,
              cursor:'pointer', boxShadow:'0 4px 16px rgba(78,158,42,.3)' }}>Browse Marketplace</button>
          </div>
        ) : (
          <>
            {items.map((item, idx) => (
              <div key={item._id} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)',
                borderRadius:18, padding:14, marginBottom:10,
                display:'flex', gap:14, alignItems:'center', boxShadow:'0 2px 8px rgba(20,50,10,.05)',
                animation:`fadeUp .4s ${idx*.05}s cubic-bezier(.22,1,.36,1) both` }}>
                <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=120'}
                  alt={item.name}
                  style={{ width:68, height:68, borderRadius:14, objectFit:'cover', flexShrink:0, background:'#f0f4ec' }}
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=120'; }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#1a2415', marginBottom:2,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize:11, color:'#7a9070', marginBottom:8 }}>{item.farmer?.farmName || item.farmer?.name || 'Farm'}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, background:'#f5f7f2', borderRadius:99, padding:'4px 4px' }}>
                      <button onClick={() => updateQty(item._id, item.qty-1)}
                        style={{ width:26, height:26, borderRadius:'50%',
                          background: item.qty<=1 ? '#e8ede4' : '#4e9e2a', border:'none',
                          color: item.qty<=1 ? '#afc09e' : '#fff', fontSize:14,
                          cursor: item.qty<=1 ? 'default' : 'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>−</button>
                      <span style={{ fontSize:13, fontWeight:800, color:'#1a2415', minWidth:20, textAlign:'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item._id, item.qty+1)}
                        style={{ width:26, height:26, borderRadius:'50%', background:'#4e9e2a', border:'none',
                          color:'#fff', fontSize:14, cursor:'pointer',
                          display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>+</button>
                    </div>
                    <span style={{ fontSize:14, fontWeight:800, color:'#4e9e2a' }}>৳{(item.price*item.qty).toLocaleString()}</span>
                    {item.marketPrice > item.price && (
                      <span style={{ fontSize:11, color:'#afc09e', textDecoration:'line-through' }}>৳{(item.marketPrice*item.qty).toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <button onClick={() => removeFromCart(item._id)}
                  style={{ background:'none', border:'none', color:'#e07070', fontSize:20, cursor:'pointer', padding:'4px', flexShrink:0 }}>🗑</button>
              </div>
            ))}

            {user?.role === 'farmer' && (
              <div style={{ background:'linear-gradient(135deg,#fef3d8,#fde8c0)', border:'1px solid rgba(196,125,10,.2)',
                borderRadius:16, padding:'14px 18px', marginTop:8, display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:24, flexShrink:0 }}>🌾</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:'#c47d0a', marginBottom:2 }}>Farmer Account Detected</div>
                  <div style={{ fontSize:12, color:'#c47d0a', lineHeight:1.5 }}>You can't checkout with a farmer account.</div>
                </div>
              </div>
            )}

            <div style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:20, padding:20,
              marginTop:16, boxShadow:'0 2px 8px rgba(20,50,10,.05)',
              animation:'fadeUp .4s .3s cubic-bezier(.22,1,.36,1) both' }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#1a2415', marginBottom:14 }}>Order Summary</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#7a9070', marginBottom:8 }}>
                <span>Subtotal ({items.length} item{items.length!==1?'s':''})</span>
                <span style={{ color:'#1a2415', fontWeight:600 }}>৳{total.toLocaleString()}</span>
              </div>
              {savings > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#4e9e2a', marginBottom:8 }}>
                  <span>You save</span><span style={{ fontWeight:700 }}>-৳{savings.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#7a9070',
                marginBottom:14, paddingBottom:14, borderBottom:'1px dashed rgba(60,100,40,.12)' }}>
                <span>Delivery</span><span style={{ color:'#4e9e2a', fontWeight:700 }}>Free</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:800, color:'#1a2415', marginBottom:16 }}>
                <span>Total</span><span style={{ color:'#4e9e2a' }}>৳{total.toLocaleString()}</span>
              </div>

              {/* Payment method preview icons */}
              <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
                <span style={{ fontSize:11, color:'#afc09e', fontWeight:600 }}>Pay with:</span>
                {[['#E2136E','🟣','bKash'],['#F16522','🟠','Nagad'],['#4e9e2a','💵','COD']].map(([c,logo,lbl]) => (
                  <div key={lbl} style={{ display:'flex', alignItems:'center', gap:4,
                    background:'#f5f7f2', borderRadius:99, padding:'4px 10px', fontSize:11, fontWeight:600, color:c }}>
                    {logo} {lbl}
                  </div>
                ))}
              </div>

              <button onClick={handleCheckout} disabled={creating}
                style={{ width:'100%', background: creating ? 'rgba(60,100,40,.2)' : 'linear-gradient(135deg,#4e9e2a,#3a7d1e)',
                  color:'#fff', border:'none', borderRadius:99, padding:'15px',
                  fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15,
                  cursor: creating ? 'not-allowed' : 'pointer', boxShadow:'0 4px 16px rgba(78,158,42,.35)',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                {creating ? (
                  <><span style={{ display:'inline-block', width:18, height:18, border:'2px solid rgba(255,255,255,.4)',
                    borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} /> Creating order…</>
                ) : (
                  user?.role === 'farmer' ? '🌾 Switch to Customer Account' : 'Select Payment Method →'
                )}
              </button>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          </>
        )}
      </div>
    </div>
  );
}