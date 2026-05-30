import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/axios.js';

// ── Order Modal ────────────────────────────────────────────────
function CheckoutModal({ onConfirm, onClose, ordering, total }) {
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('cash_on_delivery');
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:24 }}>
      <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:32, width:'100%', maxWidth:460 }}>
        <div style={{ fontSize:20, fontWeight:700, color:'var(--white)', marginBottom:6 }}>Confirm Order</div>
        <div style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>Total: <strong style={{ color:'var(--green-lt)' }}>BDT {total.toLocaleString()}</strong></div>

        <label style={lbl}>Delivery Address *</label>
        <textarea value={address} onChange={e => setAddress(e.target.value)}
          placeholder="House/Flat, Road, Area, District..."
          style={{ width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', color:'var(--white)', fontSize:14, outline:'none', fontFamily:'Sora,sans-serif', boxSizing:'border-box', marginBottom:20, minHeight:80, resize:'vertical' }}
        />
        <label style={lbl}>Payment Method</label>
        <select value={payment} onChange={e => setPayment(e.target.value)}
          style={{ width:'100%', background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', color:'var(--white)', fontSize:14, outline:'none', fontFamily:'Sora,sans-serif', boxSizing:'border-box', marginBottom:28 }}>
          <option value="cash_on_delivery">Cash on Delivery</option>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
        </select>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={() => { if (!address.trim()) { alert('Please enter delivery address.'); return; } onConfirm({ address, payment }); }}
            disabled={ordering}
            style={{ flex:1, background:'var(--green-hi)', color:'#fff', border:'none', borderRadius:99, padding:'13px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer' }}>
            {ordering ? 'Placing...' : 'Place Order'}
          </button>
          <button onClick={onClose} style={{ flex:1, background:'transparent', color:'var(--muted)', border:'1px solid var(--border)', borderRadius:99, padding:'13px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

const lbl = { display:'block', fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' };

const s = {
  page:    { minHeight:'100vh', padding:'36px 48px', maxWidth:900, margin:'0 auto' },
  backBtn: { background:'transparent', border:'1px solid var(--border)', borderRadius:99, padding:'7px 16px', color:'var(--muted)', fontFamily:'Sora,sans-serif', fontSize:13, cursor:'pointer', marginBottom:24, display:'inline-block' },
  title:   { fontSize:28, fontWeight:700, letterSpacing:'-0.03em', color:'var(--white)', marginBottom:28 },
  card:    { background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:20, marginBottom:12, display:'flex', gap:16, alignItems:'center' },
  img:     { width:72, height:72, borderRadius:12, objectFit:'cover', background:'var(--border)', flexShrink:0 },
  name:    { fontSize:15, fontWeight:600, color:'var(--white)', marginBottom:2 },
  farmer:  { fontSize:12, color:'var(--muted)', marginBottom:6 },
  price:   { fontSize:14, fontWeight:700, color:'var(--green-lt)' },
  qtyRow:  { display:'flex', alignItems:'center', gap:10, marginTop:8 },
  qtyBtn:  (bg) => ({ width:30, height:30, borderRadius:'50%', background: bg, border:'none', color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }),
  del:     { background:'none', border:'none', color:'#e05555', fontSize:18, cursor:'pointer', marginLeft:'auto', padding:'4px 8px' },
  summary: { background:'var(--card)', border:'1px solid var(--border)', borderRadius:16, padding:24, marginTop:24 },
  row:     { display:'flex', justifyContent:'space-between', fontSize:14, color:'var(--muted)', marginBottom:10 },
  total:   { display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:700, color:'var(--white)', paddingTop:12, borderTop:'1px solid var(--border)', marginTop:4 },
  orderBtn:{ width:'100%', background:'var(--green-hi)', color:'#fff', border:'none', borderRadius:12, padding:'14px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer', marginTop:16 },
  empty:   { textAlign:'center', color:'var(--muted)', padding:'80px 0', fontSize:15 },
};

export default function Cart() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, removeFromCart, updateQty, clearCart, cartTotal } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [ordering, setOrdering]  = useState(false);
  const [error, setError]        = useState('');

  // Group cart by farmer so we create one order per farmer
  const byFarmer = cart.reduce((acc, item) => {
    const fid = item.farmer?._id || item.farmer || 'unknown';
    if (!acc[fid]) acc[fid] = { farmer: item.farmer, items: [] };
    acc[fid].items.push(item);
    return acc;
  }, {});

  const handleCheckout = () => {
    if (!user) { navigate('/login'); return; }
    if (cart.length === 0) return;
    setShowModal(true);
  };

  const handleConfirm = async ({ address, payment }) => {
    setOrdering(true); setError('');
    try {
      const orderPromises = Object.entries(byFarmer).map(([farmerId, group]) =>
        api.post('/orders', {
          farmerId,
          items: group.items.map(i => ({ product: i._id, quantity: i.qty })),
          deliveryAddress: address,
          paymentMethod: payment,
        })
      );
      await Promise.all(orderPromises);
      clearCart();
      setShowModal(false);
      navigate('/orders');
    } catch (e) {
      setError(e.response?.data?.message || 'Order failed. Please try again.');
    } finally { setOrdering(false); }
  };

  return (
    <div style={s.page}>
      <button style={s.backBtn} onClick={() => navigate(-1)}>← Back</button>
      <div style={s.title}>🛒 My Cart {cart.length > 0 && `(${cart.length} items)`}</div>
      {error && <div style={{ background:'rgba(224,85,85,.12)', border:'1px solid rgba(224,85,85,.3)', color:'#e05555', borderRadius:10, padding:'12px 16px', marginBottom:20, fontSize:13 }}>{error}</div>}

      {showModal && <CheckoutModal onConfirm={handleConfirm} onClose={() => setShowModal(false)} ordering={ordering} total={cartTotal} />}

      {cart.length === 0 ? (
        <div style={s.empty}>
          Your cart is empty.<br />
          <button onClick={() => navigate('/marketplace')} style={{ marginTop:16, background:'var(--green-hi)', color:'#fff', border:'none', borderRadius:99, padding:'10px 24px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:14, cursor:'pointer' }}>
            Browse Marketplace
          </button>
        </div>
      ) : (
        <>
          {cart.map(item => (
            <div key={item._id} style={s.card}>
              <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200'} alt={item.name} style={s.img} onError={e => e.target.src='https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200'} />
              <div style={{ flex:1 }}>
                <div style={s.name}>{item.name}</div>
                <div style={s.farmer}>by {item.farmer?.name || 'Farmer'} · {item.category}</div>
                <div style={s.price}>BDT {item.price}/{item.unit}</div>
                <div style={s.qtyRow}>
                  <button style={s.qtyBtn('rgba(255,255,255,.1)')} onClick={() => updateQty(item._id, item.qty - 1)}>−</button>
                  <span style={{ fontSize:15, fontWeight:600, color:'var(--white)', minWidth:28, textAlign:'center' }}>{item.qty}</span>
                  <button style={s.qtyBtn('var(--green-hi)')} onClick={() => updateQty(item._id, item.qty + 1)}>+</button>
                  <span style={{ fontSize:13, color:'var(--muted)', marginLeft:8 }}>= BDT {(item.price * item.qty).toLocaleString()}</span>
                  <button style={s.del} onClick={() => removeFromCart(item._id)} title="Remove">🗑</button>
                </div>
              </div>
            </div>
          ))}

          <div style={s.summary}>
            <div style={{ fontSize:15, fontWeight:600, color:'var(--white)', marginBottom:14 }}>Order Summary</div>
            {Object.values(byFarmer).map((g, i) => (
              <div key={i} style={s.row}>
                <span>Items from {g.farmer?.name || 'Farmer'}</span>
                <span>BDT {g.items.reduce((s,i) => s + i.price*i.qty, 0).toLocaleString()}</span>
              </div>
            ))}
            <div style={s.total}>
              <span>Total</span>
              <span style={{ color:'var(--green-lt)' }}>BDT {cartTotal.toLocaleString()}</span>
            </div>
            <button style={s.orderBtn} onClick={handleCheckout}>Proceed to Order</button>
            <button onClick={clearCart} style={{ width:'100%', background:'transparent', border:'none', color:'var(--muted)', fontFamily:'Sora,sans-serif', fontSize:13, cursor:'pointer', marginTop:10, padding:8 }}>Clear Cart</button>
          </div>
        </>
      )}
    </div>
  );
}
