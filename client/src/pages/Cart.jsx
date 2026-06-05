import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';

function CheckoutModal({ onConfirm, onClose, ordering, total }) {
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('cash_on_delivery');
  const [focus, setFocus] = useState('');
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,30,10,.6)', backdropFilter:'blur(6px)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000, padding:'0' }}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', padding:'28px 20px 40px', width:'100%', maxWidth:480,
        animation:'slideUp .35s cubic-bezier(.22,1,.36,1) both' }}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ width:40, height:4, background:'#e0e8da', borderRadius:99, margin:'0 auto 20px' }} />
        <div style={{ fontSize:20, fontWeight:800, color:'#1a2415', marginBottom:4 }}>Confirm Order</div>
        <div style={{ fontSize:13, color:'#7a9070', marginBottom:24 }}>Total: <strong style={{ color:'#4e9e2a', fontSize:16 }}>৳{total.toLocaleString()}</strong></div>

        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a9070', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Delivery Address *</label>
        <textarea value={address} onChange={e => setAddress(e.target.value)}
          placeholder="House/Flat, Road, Area, District..."
          onFocus={() => setFocus('addr')} onBlur={() => setFocus('')}
          style={{ width:'100%', background: focus==='addr' ? '#f9faf7' : '#f5f7f2', border:`1.5px solid ${focus==='addr'?'#4e9e2a':'rgba(60,100,40,.15)'}`, borderRadius:14, padding:'12px 16px', color:'#1a2415', fontSize:14, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box', marginBottom:16, minHeight:80, resize:'vertical', transition:'all .2s', boxShadow: focus==='addr' ? '0 0 0 3px rgba(78,158,42,.1)' : 'none' }} />

        <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a9070', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>Payment Method</label>
        <select value={payment} onChange={e => setPayment(e.target.value)}
          style={{ width:'100%', background:'#f5f7f2', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:14, padding:'12px 16px', color:'#1a2415', fontSize:14, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box', marginBottom:24, cursor:'pointer' }}>
          <option value="cash_on_delivery">Cash on Delivery</option>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
        </select>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => { if (!address.trim()) { alert('Please enter delivery address.'); return; } onConfirm({ address, payment }); }}
            disabled={ordering}
            style={{ flex:1, background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', border:'none', borderRadius:99, padding:'14px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer', boxShadow:'0 4px 16px rgba(78,158,42,.35)' }}>
            {ordering ? '⏳ Placing...' : 'Place Order →'}
          </button>
          <button onClick={onClose} style={{ flex:1, background:'#f5f7f2', color:'#7a9070', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:99, padding:'14px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:15, cursor:'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function Cart() {
  const { items, updateQty, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [ordering,  setOrdering]  = useState(false);
  const [success,   setSuccess]   = useState(false);

  const total    = items.reduce((s, i) => s + i.price * i.qty, 0);
  const savings  = items.reduce((s, i) => s + Math.max(0, (i.marketPrice||i.price) - i.price) * i.qty, 0);

  const placeOrder = async ({ address, payment }) => {
    if (!user) { navigate('/login'); return; }
    setOrdering(true);
    try {
      const byFarmer = {};
      items.forEach(i => {
        const fid = i.farmer?._id || i.farmer;
        if (!byFarmer[fid]) byFarmer[fid] = [];
        byFarmer[fid].push({ product: i._id, name: i.name, qty: i.qty, price: i.price });
      });
      await Promise.all(Object.entries(byFarmer).map(([farmerId, orderItems]) =>
        api.post('/orders', { farmerId, items: orderItems, deliveryAddress: address, paymentMethod: payment, totalAmount: orderItems.reduce((s,i)=>s+i.qty*i.price,0) })
      ));
      clearCart(); setShowModal(false); setSuccess(true);
    } catch (e) { alert(e.response?.data?.message || 'Order failed.'); }
    finally { setOrdering(false); }
  };

  if (success) return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <div style={{ textAlign:'center', animation:'scaleIn .4s cubic-bezier(.22,1,.36,1) both' }}>
        <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}`}</style>
        <div style={{ width:80, height:80, background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 20px', boxShadow:'0 8px 24px rgba(78,158,42,.3)' }}>✓</div>
        <div style={{ fontSize:24, fontWeight:800, color:'#1a2415', marginBottom:8 }}>Order Placed!</div>
        <div style={{ fontSize:14, color:'#7a9070', marginBottom:28 }}>Your order has been successfully placed.</div>
        <button onClick={() => navigate('/orders')} style={{ background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', border:'none', borderRadius:99, padding:'14px 32px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer', boxShadow:'0 4px 16px rgba(78,158,42,.35)' }}>
          Track My Orders →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
      {showModal && <CheckoutModal onConfirm={placeOrder} onClose={() => setShowModal(false)} ordering={ordering} total={total} />}

      <div style={{ maxWidth:680, margin:'0 auto', padding:'24px 16px 100px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}>
          <button onClick={() => navigate(-1)} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.15)', borderRadius:12, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:16, boxShadow:'0 1px 4px rgba(20,50,10,.06)', flexShrink:0 }}>←</button>
          <div>
            <div style={{ fontSize:20, fontWeight:800, color:'#1a2415', letterSpacing:'-0.02em' }}>My Cart</div>
            <div style={{ fontSize:12, color:'#7a9070' }}>{items.length} item{items.length!==1?'s':''}</div>
          </div>
        </div>

        {items.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0', animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🛒</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#1a2415', marginBottom:8 }}>Your cart is empty</div>
            <div style={{ fontSize:13, color:'#7a9070', marginBottom:24 }}>Browse fresh produce from local farmers</div>
            <button onClick={() => navigate('/marketplace')} style={{ background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', border:'none', borderRadius:99, padding:'13px 32px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:14, cursor:'pointer', boxShadow:'0 4px 16px rgba(78,158,42,.3)' }}>Browse Marketplace</button>
          </div>
        ) : (
          <>
            {/* Items */}
            {items.map((item, idx) => (
              <div key={item._id} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:18, padding:14, marginBottom:10,
                display:'flex', gap:14, alignItems:'center', boxShadow:'0 2px 8px rgba(20,50,10,.05)',
                animation:`fadeUp .4s ${idx*.05}s cubic-bezier(.22,1,.36,1) both` }}>
                <img src={item.images?.[0]||'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=120'} alt={item.name}
                  style={{ width:68, height:68, borderRadius:14, objectFit:'cover', flexShrink:0, background:'#f0f4ec' }}
                  onError={e => e.target.src='https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=120'} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:'#1a2415', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                  <div style={{ fontSize:11, color:'#7a9070', marginBottom:8 }}>{item.farmer?.farmName || item.farmer?.name || 'Farm'}</div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6, background:'#f5f7f2', borderRadius:99, padding:'4px 4px' }}>
                      <button onClick={() => updateQty(item._id, item.qty-1)} style={{ width:26, height:26, borderRadius:'50%', background: item.qty<=1?'#e8ede4':'#4e9e2a', border:'none', color: item.qty<=1?'#afc09e':'#fff', fontSize:14, cursor: item.qty<=1?'default':'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>-</button>
                      <span style={{ fontSize:13, fontWeight:800, color:'#1a2415', minWidth:20, textAlign:'center' }}>{item.qty}</span>
                      <button onClick={() => updateQty(item._id, item.qty+1)} style={{ width:26, height:26, borderRadius:'50%', background:'#4e9e2a', border:'none', color:'#fff', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>+</button>
                    </div>
                    <span style={{ fontSize:14, fontWeight:800, color:'#4e9e2a' }}>৳{(item.price*item.qty).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => removeFromCart(item._id)} style={{ background:'none', border:'none', color:'#e07070', fontSize:20, cursor:'pointer', padding:'4px', flexShrink:0 }}>🗑</button>
              </div>
            ))}

            {/* Summary */}
            <div style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:20, padding:20, marginTop:16, boxShadow:'0 2px 8px rgba(20,50,10,.05)', animation:'fadeUp .4s .3s cubic-bezier(.22,1,.36,1) both' }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#1a2415', marginBottom:14, letterSpacing:'-0.02em' }}>Order Summary</div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#7a9070', marginBottom:8 }}>
                <span>Subtotal ({items.length} items)</span>
                <span style={{ color:'#1a2415', fontWeight:600 }}>৳{total.toLocaleString()}</span>
              </div>
              {savings > 0 && (
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#4e9e2a', marginBottom:8 }}>
                  <span>You save</span>
                  <span style={{ fontWeight:700 }}>-৳{savings.toLocaleString()}</span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'#7a9070', marginBottom:14, paddingBottom:14, borderBottom:'1px dashed rgba(60,100,40,.12)' }}>
                <span>Delivery</span><span style={{ color:'#4e9e2a', fontWeight:700 }}>Free</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:800, color:'#1a2415', marginBottom:16 }}>
                <span>Total</span><span style={{ color:'#4e9e2a' }}>৳{total.toLocaleString()}</span>
              </div>
              <button onClick={() => { if (!user) { navigate('/login'); return; } setShowModal(true); }}
                style={{ width:'100%', background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', border:'none', borderRadius:99, padding:'15px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer', boxShadow:'0 4px 16px rgba(78,158,42,.35)' }}>
                Checkout →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
