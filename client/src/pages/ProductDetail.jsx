import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useResponsive } from '../hooks/useResponsive.js';

/* ── Block modal — works for both farmer and admin ── */
function BlockedModal({ role, onClose, navigate }) {
  const isAdmin = role === 'admin';
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(10,25,8,.65)',
      backdropFilter:'blur(6px)', display:'flex', alignItems:'center',
      justifyContent:'center', zIndex:1100, padding:'20px',
    }}>
      <div style={{
        background:'#fff', borderRadius:28, padding:'32px 28px',
        maxWidth:380, width:'100%', textAlign:'center',
        animation:'popIn .3s cubic-bezier(.22,1,.36,1) both',
        boxShadow:'0 24px 64px rgba(10,25,8,.18)',
      }}>
        <style>{`@keyframes popIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}`}</style>

        <div style={{
          width:72, height:72, borderRadius:'50%',
          background: isAdmin ? 'linear-gradient(135deg,#e8eaf6,#c5cae9)' : 'linear-gradient(135deg,#fef3d8,#fde8c0)',
          border: `2px solid ${isAdmin ? 'rgba(80,96,192,.2)' : 'rgba(196,125,10,.15)'}`,
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:34, margin:'0 auto 20px',
        }}>{isAdmin ? '🛡️' : '🌾'}</div>

        <div style={{ fontSize:20, fontWeight:800, color:'#1a2415', marginBottom:10, letterSpacing:'-0.02em' }}>
          {isAdmin ? "Admins Can't Order" : "Farmers Can't Order"}
        </div>
        <div style={{ fontSize:14, color:'#7a9070', lineHeight:1.7, marginBottom:28 }}>
          Your account is registered as an{' '}
          <strong style={{ color: isAdmin ? '#5060c0' : '#c47d0a' }}>
            {isAdmin ? 'Admin' : 'Farmer'}
          </strong>.
          {' '}To buy products, you need a separate{' '}
          <strong style={{ color:'#4e9e2a' }}>Customer account</strong>.
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:'rgba(60,100,40,.1)' }} />
          <span style={{ fontSize:11, color:'#afc09e', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em' }}>What would you like to do?</span>
          <div style={{ flex:1, height:1, background:'rgba(60,100,40,.1)' }} />
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button
            onClick={() => { onClose(); navigate('/register?role=customer'); }}
            style={{
              background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff',
              border:'none', borderRadius:14, padding:'14px',
              fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15,
              cursor:'pointer', boxShadow:'0 4px 14px rgba(78,158,42,.35)',
            }}>
            Create Customer Account →
          </button>
          <button
            onClick={() => { onClose(); navigate('/login?role=customer'); }}
            style={{
              background:'#f0f4ec', color:'#3a7d1e',
              border:'1.5px solid rgba(60,100,40,.15)', borderRadius:14, padding:'13px',
              fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14,
              cursor:'pointer',
            }}>
            Log in with Customer Account
          </button>
          <button
            onClick={onClose}
            style={{
              background:'none', color:'#afc09e',
              border:'none', borderRadius:14, padding:'10px',
              fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600, fontSize:13,
              cursor:'pointer',
            }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderModal({ product, qty, onConfirm, onClose, ordering }) {
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('cash_on_delivery');
  const canPreOrder = product?.harvestDate && new Date(product.harvestDate) > new Date();
  const [isPreOrder, setPreOrder] = useState(false);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'flex-end', justifyContent:'center', zIndex:1000 }}>
      <div style={{ background:'#fff', borderRadius:'20px 20px 0 0', padding:28, width:'100%', maxWidth:500, paddingBottom:'max(28px, env(safe-area-inset-bottom, 28px))' }}>
        <div style={{ fontSize:18, fontWeight:700, color:'#1a2415', marginBottom:4 }}>Confirm Order</div>
        <div style={{ fontSize:13, color:'#7a9070', marginBottom:20 }}>{product.name} x {qty} — <strong style={{ color:'#4e9e2a' }}>BDT {(product.price*qty).toLocaleString()}</strong></div>
        <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#7a9070', marginBottom:6, textTransform:'uppercase' }}>Delivery Address *</label>
        <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="House/Flat, Road, Area, District..."
          style={{ width:'100%', background:'#f5f7f2', border:'1px solid rgba(60,100,40,.12)', borderRadius:10, padding:'12px 16px', color:'#1a2415', fontSize:14, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box', marginBottom:16, minHeight:70, resize:'none' }} />
        <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#7a9070', marginBottom:6, textTransform:'uppercase' }}>Payment Method</label>
        <select value={payment} onChange={e => setPayment(e.target.value)}
          style={{ width:'100%', background:'#fff', border:'1px solid rgba(60,100,40,.12)', borderRadius:10, padding:'12px 16px', color:'#1a2415', fontSize:14, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box', marginBottom: canPreOrder ? 16 : 24 }}>
          <option value="cash_on_delivery">Cash on Delivery</option>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
        </select>
        {canPreOrder && (
          <label style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, cursor:'pointer', fontSize:14, color:'#1a2415' }}>
            <input type="checkbox" checked={isPreOrder} onChange={e => setPreOrder(e.target.checked)} />
            Pre-order (Harvest: {new Date(product.harvestDate).toLocaleDateString()})
          </label>
        )}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => { if (!address.trim()) { alert('Please enter delivery address.'); return; } onConfirm({ address, payment, isPreOrder }); }}
            disabled={ordering}
            style={{ flex:1, background:'#4e9e2a', color:'#fff', border:'none', borderRadius:99, padding:'13px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer' }}>
            {ordering ? 'Placing...' : 'Place Order'}
          </button>
          <button onClick={onClose} style={{ flex:1, background:'transparent', color:'#7a9070', border:'1px solid rgba(60,100,40,.12)', borderRadius:99, padding:'13px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id }     = useParams();
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const { addToCart } = useCart();
  const { isMobile } = useResponsive();

  const [product,  setProduct]  = useState(null);
  const [prices,   setPrices]   = useState([]);
  const [reviews,  setReviews]  = useState([]);
  const [qty,      setQty]      = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [showModal,      setShowModal]      = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        try {
          const pName = data.product.name.toLowerCase().split(' ')[0];
          const pr = await api.get(`/prices/${pName}`);
          setPrices(pr.data.history || []);
        } catch {}
        try {
          const rv = await api.get(`/reviews/product/${data.product._id}`);
          setReviews(rv.data.reviews || []);
        } catch {}
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'#7a9070', fontSize:14 }}>Loading...</div>;
  if (!product) return <div style={{ textAlign:'center', padding:'80px 20px', color:'#7a9070' }}>Product not found</div>;

  const savings = product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;

  const isBlocked = user?.role === 'farmer' || user?.role === 'admin';

  // Centralised guard: farmers and admins are blocked, guests redirect to login
  const guardBuy = () => {
    if (!user)     { navigate('/login'); return false; }
    if (isBlocked) { setShowBlockModal(true); return false; }
    return true;
  };

  const handleOrderClick = () => {
    if (!guardBuy()) return;
    setShowModal(true);
  };

  const handleAddToCart = () => {
    if (!guardBuy()) return;
    addToCart({ ...product }, qty);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleConfirmOrder = async ({ address, payment, isPreOrder }) => {
    setOrdering(true);
    try {
      const { data } = await api.post('/orders', {
        farmerId: product.farmer._id,
        items: [{ product: product._id, quantity: qty }],
        deliveryAddress: address,
        paymentMethod: payment,
        isPreOrder,
      });
      setShowModal(false);
      navigate(`/orders/${data.order._id}`);
    } catch (e) { alert(e.response?.data?.message || 'Order failed. Please try again.'); }
    finally { setOrdering(false); }
  };

  const pad = isMobile ? '16px 12px' : '48px 56px';
  const chartData = prices.map(p => ({
    week: new Date(p.recordedAt).toLocaleDateString('en-BD', { month:'short', day:'numeric' }),
    farmer: p.farmerPrice, market: p.marketPrice,
  }));

  const cartBtnLabel = addedToCart ? '✓ Added!' : '🛒 Cart';

  // Inline notice banner for blocked accounts
  const BlockedBanner = () => isBlocked ? (
    <div style={{
      background: user.role === 'admin' ? 'linear-gradient(135deg,#e8eaf6,#c5cae9)' : 'linear-gradient(135deg,#fef3d8,#fde8c0)',
      border: `1px solid ${user.role === 'admin' ? 'rgba(80,96,192,.2)' : 'rgba(196,125,10,.2)'}`,
      borderRadius:12, padding:'10px 14px', marginBottom:12, display:'flex', alignItems:'center', gap:10,
    }}>
      <span style={{ fontSize:18 }}>{user.role === 'admin' ? '🛡️' : '🌾'}</span>
      <div style={{ fontSize:12, color: user.role === 'admin' ? '#5060c0' : '#c47d0a', fontWeight:600, lineHeight:1.5 }}>
        {user.role === 'admin' ? 'Admin' : 'Farmer'} accounts can't place orders. Log in as a customer to buy.
      </div>
    </div>
  ) : null;

  return (
    <div style={{ minHeight:'100vh', padding: pad }}>
      {showBlockModal && (
        <BlockedModal role={user?.role} onClose={() => setShowBlockModal(false)} navigate={navigate} />
      )}
      {showModal && (
        <OrderModal product={product} qty={qty} onConfirm={handleConfirmOrder} onClose={() => setShowModal(false)} ordering={ordering} />
      )}

      <button onClick={() => navigate(-1)} style={{ background:'transparent', border:'1px solid rgba(60,100,40,.12)', borderRadius:99, padding:'7px 14px', color:'#7a9070', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, cursor:'pointer', marginBottom:16 }}>← Back</button>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 420px', gap: isMobile ? 20 : 48, alignItems:'start', maxWidth:1200, margin:'0 auto' }}>

        {/* LEFT */}
        <div>
          <div style={{ position:'relative', borderRadius:20, overflow:'hidden', height: isMobile ? 240 : 440, marginBottom:20 }}>
            {product.images?.[0]
              ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <div style={{ width:'100%', height:'100%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:80 }}>🥦</div>
            }
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 30%,rgba(10,15,8,.88) 100%)' }} />
            <div style={{ position:'absolute', bottom: isMobile ? 16 : 28, left: isMobile ? 16 : 28, right: isMobile ? 16 : 28 }}>
              <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
                <span style={{ background:'#e8f0e0', color:'#1a2415', fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', padding:'3px 10px', borderRadius:99 }}>{product.category}</span>
                {savings > 0 && <span style={{ background:'#4e9e2a', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:99 }}>Save {savings}%</span>}
              </div>
              <div style={{ fontSize: isMobile ? 24 : 38, fontWeight:700, letterSpacing:'-0.03em', marginBottom:6, color:'#fff' }}>{product.name}</div>
              {product.description && <div style={{ fontSize: isMobile ? 13 : 14, color:'rgba(240,244,236,.65)', lineHeight:1.6 }}>{product.description}</div>}
            </div>
          </div>

          {/* Mobile purchase card */}
          {isMobile && (
            <div style={{ background:'#fff', border:'1px solid rgba(60,100,40,.12)', borderRadius:20, padding:20, marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:16, paddingBottom:16, borderBottom:'1px solid rgba(60,100,40,.12)' }}>
                <div>
                  <div style={{ fontSize:11, color:'#7a9070', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:4 }}>Farmer Price</div>
                  <div style={{ fontSize:32, fontWeight:700, color:'#4e9e2a', lineHeight:1 }}>BDT {product.price} <span style={{ fontSize:14, color:'#7a9070', fontWeight:400 }}>/{product.unit}</span></div>
                </div>
                {product.marketPrice > product.price && (
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:10, color:'#7a9070', textTransform:'uppercase' }}>Market</div>
                    <div style={{ fontSize:18, fontWeight:600, color:'#7a9070', textDecoration:'line-through' }}>BDT {product.marketPrice}</div>
                  </div>
                )}
              </div>
              {savings > 0 && <div style={{ background:'rgba(90,176,48,.1)', border:'1px solid #e8f5e1', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#4e9e2a' }}>You save BDT {product.marketPrice - product.price} per {product.unit}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
                {[['Available',`${product.stock} ${product.unit}`],['Delivery','Home Delivery'],['Unit',product.unit],[`${reviews.length} reviews`,'Reviews']].map(([lbl,val]) => (
                  <div key={lbl} style={{ background:'#f5f7f2', borderRadius:10, padding:12 }}>
                    <div style={{ fontSize:9, color:'#7a9070', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:4 }}>{lbl}</div>
                    <div style={{ fontSize:14, fontWeight:700, color:'#1a2415' }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, padding:12, background:'#f5f7f2', borderRadius:12 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'#e8f5e1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{product.farmer?.name?.[0]||'👨'}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#1a2415' }}>{product.farmer?.name}</div>
                  <div style={{ fontSize:11, color:'#7a9070' }}>📍 {product.farmer?.location?.district||'Bangladesh'}</div>
                </div>
                {product.farmer?.isVerified && <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, color:'#4e9e2a', background:'rgba(90,176,48,.14)', padding:'3px 8px', borderRadius:99 }}>✓ Verified</span>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <span style={{ fontSize:13, color:'#7a9070' }}>Qty ({product.unit})</span>
                <button onClick={() => setQty(q => Math.max(1,q-1))} style={{ width:34,height:34,borderRadius:'50%',background:'#f0f4ec',border:'1px solid rgba(60,100,40,.12)',color:'#1a2415',fontSize:16,cursor:'pointer' }}>−</button>
                <span style={{ fontSize:17,fontWeight:600,minWidth:28,textAlign:'center' }}>{qty}</span>
                <button onClick={() => setQty(q=>q+1)} style={{ width:34,height:34,borderRadius:'50%',background:'#4e9e2a',border:'none',color:'#fff',fontSize:16,cursor:'pointer' }}>+</button>
                <span style={{ marginLeft:'auto',fontSize:18,fontWeight:700,color:'#4e9e2a' }}>BDT {(product.price*qty).toLocaleString()}</span>
              </div>

              <BlockedBanner />

              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleAddToCart} disabled={product.stock===0}
                  style={{ flex:1,padding:13,background:addedToCart?'#e8f5e1':'#f0f4ec',color:addedToCart?'#4e9e2a':'#1a2415',border:'1px solid rgba(60,100,40,.12)',borderRadius:12,fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:13,fontWeight:600,cursor:'pointer' }}>
                  {cartBtnLabel}
                </button>
                <button onClick={handleOrderClick} disabled={ordering||product.stock===0}
                  style={{ flex:2,padding:13,background:product.stock===0?'rgba(60,100,40,.1)':'#4e9e2a',color:'#fff',border:'none',borderRadius:12,fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,fontWeight:600,cursor:product.stock===0?'not-allowed':'pointer' }}>
                  {product.stock===0?'Out of Stock':'Order Now'}
                </button>
              </div>
            </div>
          )}

          {/* Price chart */}
          {chartData.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid rgba(60,100,40,.12)', borderRadius:20, padding: isMobile ? 16 : 28, marginBottom:16 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Price History</div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <XAxis dataKey="week" stroke="#7a9070" tick={{ fontSize:10, fill:'#7a9070' }} />
                  <YAxis stroke="#7a9070" tick={{ fontSize:10, fill:'#7a9070' }} />
                  <Tooltip contentStyle={{ background:'#fff', border:'1px solid rgba(60,100,40,.12)', borderRadius:10, color:'#1a2415', fontSize:11 }} formatter={(v,n) => [`BDT ${v}`,n==='farmer'?'Farmer':'Market']} />
                  <Legend formatter={v=>v==='farmer'?'Farmer Price':'Market Price'} />
                  <Line type="monotone" dataKey="farmer" stroke="#4e9e2a" strokeWidth={2} dot={{ fill:'#4e9e2a', r:3 }} />
                  <Line type="monotone" dataKey="market" stroke="#f0b840" strokeWidth={2} dot={{ fill:'#f0b840', r:3 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div style={{ background:'#fff', border:'1px solid rgba(60,100,40,.12)', borderRadius:20, padding: isMobile ? 16 : 28 }}>
              <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Customer Reviews</div>
              {reviews.slice(0,4).map(r => (
                <div key={r._id} style={{ paddingBottom:14, marginBottom:14, borderBottom:'1px solid rgba(60,100,40,.12)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                    <div style={{ width:32, height:32, borderRadius:'50%', background:'rgba(90,176,48,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:600, color:'#4e9e2a' }}>{r.reviewer?.name?.[0]||'?'}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:500 }}>{r.reviewer?.name}</div>
                      <div style={{ fontSize:11, color:'#f0b840' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize:13, color:'#7a9070', lineHeight:1.6 }}>{r.comment}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Desktop purchase card */}
        {!isMobile && (
          <div style={{ position:'sticky', top:80 }}>
            <div style={{ background:'#fff', border:'1px solid rgba(60,100,40,.12)', borderRadius:20, padding:28 }}>
              <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24, paddingBottom:24, borderBottom:'1px solid rgba(60,100,40,.12)' }}>
                <div>
                  <div style={{ fontSize:11, color:'#7a9070', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:4 }}>Farmer Price</div>
                  <div style={{ fontSize:42, fontWeight:700, letterSpacing:'-0.04em', color:'#4e9e2a', lineHeight:1 }}>BDT {product.price} <span style={{ fontSize:16, color:'#7a9070' }}>/{product.unit}</span></div>
                </div>
                {product.marketPrice > product.price && (
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:11, color:'#7a9070', textTransform:'uppercase' }}>Market</div>
                    <div style={{ fontSize:24, fontWeight:600, color:'#7a9070', textDecoration:'line-through' }}>BDT {product.marketPrice}</div>
                  </div>
                )}
              </div>
              {savings > 0 && <div style={{ background:'rgba(90,176,48,.1)', border:'1px solid rgba(90,176,48,.22)', borderRadius:12, padding:'14px 18px', marginBottom:24, fontSize:13, color:'#4e9e2a' }}>You save BDT {product.marketPrice-product.price} per {product.unit}</div>}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
                {[['Available',`${product.stock} ${product.unit}`],['Delivery','Home Delivery'],['Unit',product.unit],['Reviews',`${reviews.length} reviews`]].map(([lbl,val]) => (
                  <div key={lbl} style={{ background:'#f5f7f2', borderRadius:12, padding:16 }}>
                    <div style={{ fontSize:10, color:'#7a9070', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6 }}>{lbl}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:'#1a2415' }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24, padding:16, background:'#f5f7f2', borderRadius:12 }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'#e8f5e1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>{product.farmer?.name?.[0]||'👨'}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#1a2415' }}>{product.farmer?.name}</div>
                  <div style={{ fontSize:12, color:'#7a9070' }}>📍 {product.farmer?.location?.district||'Bangladesh'}</div>
                </div>
                {product.farmer?.isVerified && <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, color:'#4e9e2a', background:'rgba(90,176,48,.14)', border:'1px solid rgba(90,176,48,.28)', padding:'3px 10px', borderRadius:99 }}>✓ Verified</span>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
                <span style={{ fontSize:13, color:'#7a9070' }}>Qty</span>
                <button onClick={() => setQty(q=>Math.max(1,q-1))} style={{ width:36,height:36,borderRadius:'50%',background:'#f0f4ec',border:'1px solid rgba(60,100,40,.12)',color:'#1a2415',fontSize:18,cursor:'pointer' }}>−</button>
                <span style={{ fontSize:18,fontWeight:600,minWidth:32,textAlign:'center' }}>{qty}</span>
                <button onClick={() => setQty(q=>q+1)} style={{ width:36,height:36,borderRadius:'50%',background:'#4e9e2a',border:'none',color:'#fff',fontSize:18,cursor:'pointer' }}>+</button>
                <div style={{ marginLeft:'auto',fontSize:20,fontWeight:700,color:'#4e9e2a' }}>BDT {(product.price*qty).toLocaleString()}</div>
              </div>

              <BlockedBanner />

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={handleAddToCart} disabled={product.stock===0}
                  style={{ flex:1,padding:15,background:addedToCart?'#e8f5e1':'#f0f4ec',color:addedToCart?'#4e9e2a':'#1a2415',border:'1px solid rgba(60,100,40,.12)',borderRadius:12,fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:14,fontWeight:600,cursor:'pointer',transition:'all .2s' }}>
                  {addedToCart?'✓ Added!':'🛒 Add to Cart'}
                </button>
                <button onClick={handleOrderClick} disabled={ordering||product.stock===0}
                  style={{ flex:1,padding:15,background:product.stock===0?'rgba(60,100,40,.1)':'#4e9e2a',color:'#fff',border:'none',borderRadius:12,fontFamily:'Plus Jakarta Sans,sans-serif',fontSize:15,fontWeight:600,cursor:product.stock===0?'not-allowed':'pointer' }}>
                  {product.stock===0?'Out of Stock':'Order Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}