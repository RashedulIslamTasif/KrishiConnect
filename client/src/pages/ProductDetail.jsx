import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// ── Address Modal ─────────────────────────────────────────────
function OrderModal({ product, qty, onConfirm, onClose, ordering }) {
  const [address, setAddress]   = useState('');
  const [payment, setPayment]   = useState('cash_on_delivery');
  const [isPreOrder, setPreOrder] = useState(false);

  const canPreOrder = product?.harvestDate && new Date(product.harvestDate) > new Date();

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 460 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--white)', marginBottom: 6 }}>Confirm Your Order</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
          {product.name} x {qty} {product.unit} — <strong style={{ color: 'var(--green-lt)' }}>BDT {(product.price * qty).toLocaleString()}</strong>
        </div>

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Delivery Address *
        </label>
        <textarea
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="House/Flat no, Road, Area, District..."
          style={{ width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: 20, minHeight: 80, resize: 'vertical' }}
        />

        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Payment Method
        </label>
        <select
          value={payment}
          onChange={e => setPayment(e.target.value)}
          style={{ width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: canPreOrder ? 20 : 28 }}
        >
          <option value="cash_on_delivery">Cash on Delivery</option>
          <option value="bkash">bKash</option>
          <option value="nagad">Nagad</option>
        </select>

        {canPreOrder && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, cursor: 'pointer', fontSize: 14, color: 'var(--white)' }}>
            <input type="checkbox" checked={isPreOrder} onChange={e => setPreOrder(e.target.checked)} />
            Pre-order (Harvest: {new Date(product.harvestDate).toLocaleDateString('en-BD')})
          </label>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => { if (!address.trim()) { alert('Please enter your delivery address.'); return; } onConfirm({ address, payment, isPreOrder }); }}
            disabled={ordering}
            style={{ flex: 1, background: 'var(--green-hi)', color: '#fff', border: 'none', borderRadius: 99, padding: '13px', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
          >
            {ordering ? 'Placing...' : 'Place Order'}
          </button>
          <button
            onClick={onClose}
            style={{ flex: 1, background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 99, padding: '13px', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { id }       = useParams();
  const { user }     = useAuth();
  const { addToCart, cart } = useCart();
  const [addedToCart, setAddedToCart] = useState(false);
  const navigate     = useNavigate();
  const [product, setProduct]     = useState(null);
  const [prices, setPrices]       = useState([]);
  const [qty, setQty]             = useState(1);
  const [loading, setLoading]     = useState(true);
  const [ordering, setOrdering]   = useState(false);
  const [reviews, setReviews]     = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        const pName = data.product.name.toLowerCase().split(' ')[0];
        try {
          const pr = await api.get(`/prices/${pName}`);
          setPrices(pr.data.history || []);
        } catch {}
        if (data.product.farmer?._id) {
          try {
            const rv = await api.get(`/reviews/product/${data.product._id}`);
            setReviews(rv.data.reviews || []);
          } catch {}
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const savings = product && product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;

  const handleOrderClick = () => {
    if (!user) return navigate('/login');
    setShowModal(true);
  };

  const handleConfirmOrder = async ({ address, payment, isPreOrder }) => {
    setOrdering(true);
    try {
      const { data } = await api.post('/orders', {
        farmerId:        product.farmer._id,
        items:           [{ product: product._id, quantity: qty }],
        deliveryAddress: address,
        paymentMethod:   payment,
        isPreOrder:      isPreOrder,
      });
      setShowModal(false);
      navigate(`/orders/${data.order._id}`);
    } catch (e) {
      alert(e.response?.data?.message || 'Order failed. Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', fontSize: 14, color: 'var(--muted)' }}>Loading...</div>;
  if (!product) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>Product not found</div>;

  const chartData = prices.map(p => ({
    week: new Date(p.recordedAt).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' }),
    farmer: p.farmerPrice,
    market: p.marketPrice,
  }));

  return (
    <div style={{ minHeight: '100vh', padding: '48px 56px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 8 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 99, padding: '7px 16px', color: 'var(--muted)', fontFamily: 'Sora,sans-serif', fontSize: 13, cursor: 'pointer' }}>← Back</button>
      </div>
      {showModal && (
        <OrderModal
          product={product}
          qty={qty}
          onConfirm={handleConfirmOrder}
          onClose={() => setShowModal(false)}
          ordering={ordering}
        />
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 48, alignItems: 'start', maxWidth: 1200, margin: '0 auto' }}>

        {/* LEFT */}
        <div>
          <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', height: 440, marginBottom: 32 }}>
            {product.images?.[0]
              ? <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100 }}>🥦</div>
            }
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 30%,rgba(10,15,8,.88) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 28, left: 28, right: 28 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <span style={{ background: 'rgba(255,255,255,.12)', color: 'var(--white)', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 99 }}>{product.category}</span>
                {savings > 0 && <span style={{ background: 'var(--green-hi)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 99 }}>Save {savings}%</span>}
              </div>
              <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>{product.name}</div>
              <div style={{ fontSize: 14, color: 'rgba(240,244,236,.65)', lineHeight: 1.6 }}>{product.description || `Fresh ${product.name} from ${product.farmer?.farmName || product.farmer?.name}.`}</div>
            </div>
          </div>

          {chartData.length > 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Price History</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="week" stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <YAxis stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--white)', fontSize: 12 }} formatter={(val, name) => [`BDT ${val}`, name === 'farmer' ? 'Farmer Price' : 'Market Price']} />
                  <Legend formatter={v => v === 'farmer' ? 'Farmer Price' : 'Market Price'} />
                  <Line type="monotone" dataKey="farmer" stroke="var(--green-hi)" strokeWidth={2} dot={{ fill: 'var(--green-hi)', r: 4 }} />
                  <Line type="monotone" dataKey="market" stroke="#f0b840" strokeWidth={2} dot={{ fill: '#f0b840', r: 4 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {reviews.length > 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Customer Reviews</div>
              {reviews.slice(0, 4).map(r => (
                <div key={r._id} style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(90,176,48,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--green-lt)' }}>{r.reviewer?.name?.[0] || '?'}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.reviewer?.name}</div>
                      <div style={{ fontSize: 12, color: '#f0b840' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{r.comment}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — purchase card */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Farmer Price</div>
                <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--green-lt)', lineHeight: 1 }}>
                  BDT {product.price} <span style={{ fontSize: 16, color: 'var(--muted)' }}>/{product.unit}</span>
                </div>
              </div>
              {product.marketPrice > product.price && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase' }}>Market Price</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--muted)', textDecoration: 'line-through' }}>BDT {product.marketPrice}</div>
                </div>
              )}
            </div>

            {savings > 0 && (
              <div style={{ background: 'rgba(90,176,48,.1)', border: '1px solid rgba(90,176,48,.22)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--green-lt)' }}>You save BDT {product.marketPrice - product.price} per {product.unit}</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                ['Available', `${product.stock} ${product.unit}`],
                ['Delivery', 'Home Delivery'],
                ['Unit', product.unit],
                ['Reviews', `${reviews.length} reviews`],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{lbl}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: 16, background: 'rgba(255,255,255,.04)', borderRadius: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(90,176,48,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {product.farmer?.name?.[0] || '👨'}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--white)' }}>{product.farmer?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>📍 {product.farmer?.location?.district || 'Bangladesh'}</div>
              </div>
              {product.farmer?.isVerified && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'var(--green-lt)', background: 'rgba(90,176,48,.14)', border: '1px solid rgba(90,176,48,.28)', padding: '3px 10px', borderRadius: 99 }}>✓ Verified</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Qty ({product.unit})</div>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.06)', border: '1px solid var(--border)', color: 'var(--white)', fontSize: 18, cursor: 'pointer' }}>−</button>
              <span style={{ fontSize: 18, fontWeight: 600, minWidth: 32, textAlign: 'center' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green-hi)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>+</button>
              <div style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, color: 'var(--green-lt)' }}>BDT {(product.price * qty).toLocaleString()}</div>
            </div>

            <button
              onClick={() => {
                if (!user) { navigate('/login'); return; }
                addToCart(product, qty);
                setAddedToCart(true);
                setTimeout(() => setAddedToCart(false), 2000);
              }}
              disabled={product.stock === 0}
              style={{ width: '100%', padding: 15, marginBottom: 10, background: addedToCart ? 'rgba(90,176,48,.2)' : 'transparent', color: addedToCart ? 'var(--green-lt)' : 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600, cursor: product.stock === 0 ? 'not-allowed' : 'pointer', transition: 'all .2s' }}
            >
              {addedToCart ? '✓ Added to Cart' : '🛒 Add to Cart'}
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  if (!user) return navigate('/login');
                  addToCart({ ...product, farmer: product.farmer }, qty);
                  setAddedToCart(true);
                  setTimeout(() => setAddedToCart(false), 2000);
                }}
                disabled={product.stock === 0}
                style={{ flex: 1, padding: 15, background: addedToCart ? 'rgba(90,176,48,.2)' : 'rgba(255,255,255,.06)', color: addedToCart ? 'var(--green-lt)' : 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, fontFamily: 'Sora,sans-serif', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
              >
                {addedToCart ? '✓ Added!' : '🛒 Add to Cart'}
              </button>
              <button
                onClick={handleOrderClick}
                disabled={ordering || product.stock === 0}
                style={{ flex: 1, padding: 15, background: product.stock === 0 ? 'var(--border)' : 'var(--green-hi)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600, cursor: product.stock === 0 ? 'not-allowed' : 'pointer' }}
              >
                {product.stock === 0 ? 'Out of Stock' : 'Order Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
