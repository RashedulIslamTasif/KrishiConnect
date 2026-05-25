import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProductDetail() {
  const { id }         = useParams();
  const { user }       = useAuth();
  const navigate       = useNavigate();
  const [product, setProduct]   = useState(null);
  const [prices, setPrices]     = useState([]);
  const [qty, setQty]           = useState(1);
  const [loading, setLoading]   = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [reviews, setReviews]   = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        // Fetch price history
        const pName = data.product.name.toLowerCase().split(' ')[0];
        const pr    = await api.get(`/prices/${pName}`);
        setPrices(pr.data.history);
        // Fetch reviews
        if (data.product.farmer?._id) {
          const rv = await api.get(`/reviews/farmer/${data.product.farmer._id}`);
          setReviews(rv.data.reviews);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const savings = product && product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;

  const isPreOrder = product?.harvestDate && new Date(product.harvestDate) > new Date();

  const handleOrder = async (pre = false) => {
    if (!user) return navigate('/login');
    setOrdering(true);
    try {
      const { data } = await api.post('/orders', {
        farmerId:        product.farmer._id,
        items:           [{ product: product._id, quantity: qty }],
        deliveryAddress: 'Please update in your profile',
        isPreOrder:      pre,
      });
      navigate(`/orders/${data.order._id}`);
    } catch (e) { alert(e.response?.data?.message || 'Order failed'); }
    finally { setOrdering(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', fontSize: 14, color: 'var(--muted)' }}>Loading…</div>
  );
  if (!product) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--muted)' }}>Product not found</div>
  );

  const chartData = prices.map(p => ({
    week: new Date(p.recordedAt).toLocaleDateString('en-BD', { month: 'short', day: 'numeric' }),
    farmer: p.farmerPrice,
    market: p.marketPrice,
  }));

  return (
    <div style={{ minHeight: '100vh', padding: '48px 56px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 48, alignItems: 'start', maxWidth: 1200, margin: '0 auto' }}>

        {/* LEFT — image + info */}
        <div>
          {/* Hero image */}
          <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', height: 440, marginBottom: 32 }}>
            {product.images?.[0]
              ? <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: 'var(--card2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100 }}>🥦</div>
            }
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 30%,rgba(10,15,8,.88) 100%)' }} />
            <div style={{ position: 'absolute', bottom: 28, left: 28, right: 28 }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <span style={{ background: 'rgba(255,255,255,.12)', color: 'var(--white)', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 99 }}>
                  {product.category}
                </span>
                {savings > 0 && <span style={{ background: 'var(--green-hi)', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', padding: '4px 10px', borderRadius: 99 }}>Save {savings}%</span>}
                {isPreOrder && <span style={{ background: 'var(--amber)', color: '#fff', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '4px 10px', borderRadius: 99 }}>Pre-Order</span>}
              </div>
              <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>{product.name}</div>
              <div style={{ fontSize: 14, color: 'rgba(240,244,236,.65)', lineHeight: 1.6 }}>{product.description || `Fresh ${product.name} from ${product.farmer?.farmName || product.farmer?.name}.`}</div>
            </div>
          </div>

          {/* Price History Chart */}
          {chartData.length > 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, marginBottom: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Price History — Last 8 Records</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="week" stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <YAxis stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                  <Tooltip
                    contentStyle={{ background: 'var(--card2)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--white)', fontSize: 12 }}
                    formatter={(val, name) => [`৳${val}`, name === 'farmer' ? 'Farmer Price' : 'Market Price']}
                  />
                  <Legend formatter={v => v === 'farmer' ? 'Farmer Price' : 'Market Price'} />
                  <Line type="monotone" dataKey="farmer" stroke="var(--green-hi)"  strokeWidth={2} dot={{ fill: 'var(--green-hi)', r: 4 }} />
                  <Line type="monotone" dataKey="market" stroke="var(--amber-lt)"  strokeWidth={2} dot={{ fill: 'var(--amber-lt)', r: 4 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Customer Reviews</div>
              {reviews.slice(0, 4).map(r => (
                <div key={r._id} style={{ paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(90,176,48,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--green-lt)' }}>
                      {r.reviewer?.name?.[0] || '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{r.reviewer?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--amber-lt)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
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

            {/* Price row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4 }}>Farmer Price</div>
                <div style={{ fontSize: 42, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--green-lt)', lineHeight: 1 }}>
                  ৳{product.price} <span style={{ fontSize: 16, color: 'var(--muted)' }}>/{product.unit}</span>
                </div>
              </div>
              {product.marketPrice > product.price && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em' }}>Market Price</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--muted)', textDecoration: 'line-through' }}>৳{product.marketPrice}</div>
                </div>
              )}
            </div>

            {/* Savings bar */}
            {savings > 0 && (
              <div style={{ background: 'rgba(90,176,48,.1)', border: '1px solid rgba(90,176,48,.22)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--green-lt)' }}>You save on every {product.unit}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>vs. local bazaar price</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green-hi)' }}>৳{product.marketPrice - product.price} off</div>
              </div>
            )}

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {[
                ['Available', `${product.stock} ${product.unit}`, 'In stock'],
                ['Delivery', 'Same day', 'Within Dhaka'],
                ['Unit', product.unit, `Min: 0.5 ${product.unit}`],
                ['Rating', `${product.avgRating || '4.8'} ★`, `${product.totalReviews || 0} reviews`],
              ].map(([lbl, val, sub]) => (
                <div key={lbl} style={{ background: 'var(--card2)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>{lbl}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: lbl === 'Rating' ? 'var(--amber-lt)' : 'var(--white)' }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* Farmer row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, padding: 16, background: 'var(--card2)', borderRadius: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(90,176,48,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {product.farmer?.avatar ? <img src={product.farmer.avatar} alt="Farmer" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : '👨‍🌾'}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{product.farmer?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>📍 {product.farmer?.location?.district || 'Bangladesh'}</div>
              </div>
              {product.farmer?.isVerified && (
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: 'var(--green-lt)', background: 'rgba(90,176,48,.14)', border: '1px solid rgba(90,176,48,.28)', padding: '3px 10px', borderRadius: 99 }}>✓ Verified</span>
              )}
            </div>

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginRight: 4 }}>Qty ({product.unit})</div>
              <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--card2)', border: '1px solid var(--border)', color: 'var(--white)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
              <span style={{ fontSize: 18, fontWeight: 600, minWidth: 32, textAlign: 'center' }}>{qty}</span>
              <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--green-hi)', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
              <div style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 700, color: 'var(--green-lt)' }}>৳{(product.price * qty).toLocaleString()}</div>
            </div>

            <button onClick={() => handleOrder(false)} disabled={ordering} style={{ width: '100%', padding: 15, background: 'var(--green-hi)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10, transition: 'background .2s' }}>
              {ordering ? 'Placing Order…' : 'Order Now'}
            </button>
            {isPreOrder && (
              <button onClick={() => handleOrder(true)} disabled={ordering} style={{ width: '100%', padding: 15, background: 'transparent', color: 'var(--amber-lt)', border: '1px solid var(--amber)', borderRadius: 12, fontFamily: 'Sora,sans-serif', fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
                Pre-Order (Harvest: {new Date(product.harvestDate).toLocaleDateString('en-BD')})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
