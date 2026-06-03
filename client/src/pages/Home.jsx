import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useCart } from '../context/CartContext.jsx';
import { useResponsive } from '../hooks/useResponsive.js';

const CATS = [
  { key:'vegetables', label:'Vegetables', bg:'rgba(90,176,48,.18)',  color:'var(--green-lt)', img:'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=60' },
  { key:'fruits',     label:'Fruits',     bg:'rgba(240,184,64,.18)', color:'#f0b840',         img:'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=60' },
  { key:'fish',       label:'Fish',       bg:'rgba(29,158,117,.18)', color:'#1d9e75',         img:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&q=60' },
  { key:'poultry',    label:'Poultry',    bg:'rgba(212,144,10,.18)', color:'var(--amber-lt)', img:'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=300&q=60' },
  { key:'grains',     label:'Grains',     bg:'rgba(180,140,80,.18)', color:'#d4a060',         img:'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=300&q=60' },
  { key:'dairy',      label:'Dairy',      bg:'rgba(150,150,220,.15)',color:'#aab4e8',         img:'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=60' },
  { key:'spices',     label:'Spices',     bg:'rgba(224,85,85,.18)',  color:'#e07070',         img:'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=60' },
];

const FEATURES = [
  { icon:'📊', title:'Price Comparison',  desc:'See how much you save vs local bazar on every product.' },
  { icon:'📅', title:'Harvest Pre-Order', desc:'Book crops before harvest. Guaranteed freshness.' },
  { icon:'✅', title:'Verified Farmers',  desc:'NID-verified badge gives you confidence every time.' },
  { icon:'📈', title:'Price History',     desc:'Track price trends so you always buy at the right time.' },
];

// ── Mini product card — same style as Marketplace MiniCard ────
function HomeProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const savings = product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;

  return (
    <div onClick={() => navigate(`/products/${product._id}`)}
      style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', flexShrink:0, width:148, cursor:'pointer' }}>
      <div style={{ height:120, background:'var(--card2)', position:'relative', overflow:'hidden' }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>🥦</div>
        }
        {savings > 0 && <span style={{ position:'absolute', top:5, left:5, background:'var(--green-hi)', color:'#fff', fontSize:8, fontWeight:700, padding:'2px 6px', borderRadius:99 }}>SAVE {savings}%</span>}
        <button onClick={e => { e.stopPropagation(); addToCart(product,1); setAdded(true); setTimeout(()=>setAdded(false),1500); }}
          style={{ position:'absolute', bottom:5, right:5, width:26, height:26, borderRadius:'50%', background: added?'var(--green-lt)':'var(--green-hi)', border:'none', color:'#fff', fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
          {added ? '✓' : '+'}
        </button>
      </div>
      <div style={{ padding:'9px 10px 11px' }}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--white)', marginBottom:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.name}</div>
        <div style={{ fontSize:10, color:'var(--muted)', marginBottom:5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.farmer?.location?.district || 'Bangladesh'}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--green-lt)' }}>৳{product.price}<span style={{ fontSize:9, fontWeight:400, color:'var(--muted)' }}>/{product.unit}</span></span>
          {product.marketPrice > product.price && <span style={{ fontSize:9, color:'var(--muted)', textDecoration:'line-through' }}>৳{product.marketPrice}</span>}
        </div>
      </div>
    </div>
  );
}

// ── Horizontal row section — no icon in title ─────────────────
function Section({ title, products, onViewAll }) {
  if (!products?.length) return null;
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, padding:'0 12px' }}>
        <span style={{ fontSize:15, fontWeight:700, color:'var(--white)' }}>{title}</span>
        <button onClick={onViewAll} style={{ background:'transparent', border:'none', color:'var(--green-lt)', fontSize:13, cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:500 }}>View All →</button>
      </div>
      <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'0 12px 6px', scrollbarWidth:'none' }}>
        {products.map(p => <HomeProductCard key={p._id} product={p} />)}
      </div>
    </div>
  );
}

// ── MOBILE HOME ───────────────────────────────────────────────
function MobileHome() {
  const navigate = useNavigate();
  const [products, setProducts] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const results = await Promise.all(
          CATS.map(c => api.get('/products', { params: { category: c.key, limit: 8 } }).then(r => ({ key: c.key, products: r.data.products || [] })))
        );
        const map = {};
        results.forEach(r => { map[r.key] = r.products; });
        setProducts(map);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSearch = e => {
    e.preventDefault();
    if (search.trim()) navigate(`/marketplace?search=${encodeURIComponent(search.trim())}`);
  };

  const allProds = Object.values(products).flat().sort(() => Math.random() - 0.5).slice(0, 8);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', paddingBottom:24 }}>

      {/* Hero banner */}
      <div style={{ position:'relative', height:200, overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=60')", backgroundSize:'cover', backgroundPosition:'center 40%', filter:'brightness(0.35)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(10,15,8,.1) 0%,rgba(10,15,8,.9) 100%)' }} />
        <div style={{ position:'relative', zIndex:2, padding:'20px 16px', display:'flex', flexDirection:'column', justifyContent:'flex-end', height:'100%' }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--green-lt)', marginBottom:6 }}>🌱 Farm Fresh · Direct to You</div>
          <div style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.03em', marginBottom:4, lineHeight:1.2 }}>
            Buy directly from<br /><span style={{ color:'var(--green-lt)' }}>the farmer.</span>
          </div>
          <div style={{ fontSize:12, color:'rgba(240,244,236,.6)', marginBottom:14, lineHeight:1.5 }}>Fresh produce, fair prices — right from your home.</div>
          <div style={{ display:'flex', gap:8 }}>
            <Link to="/marketplace" style={{ background:'var(--green-hi)', color:'#fff', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:13, padding:'9px 18px', borderRadius:99, textDecoration:'none' }}>Browse Market</Link>
            <Link to="/register" style={{ background:'rgba(255,255,255,.1)', color:'var(--white)', fontFamily:'Sora,sans-serif', fontWeight:500, fontSize:13, padding:'9px 18px', borderRadius:99, border:'1px solid rgba(255,255,255,.2)', textDecoration:'none' }}>Join Free →</Link>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding:'14px 12px 0' }}>
        <form onSubmit={handleSearch} style={{ display:'flex', gap:8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search vegetables, fruits, fish..."
            style={{ flex:1, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'11px 16px', color:'var(--white)', fontFamily:'Sora,sans-serif', fontSize:14, outline:'none' }} />
          <button type="submit" style={{ background:'var(--green-hi)', border:'none', borderRadius:12, padding:'11px 14px', color:'#fff', fontSize:18, cursor:'pointer' }}>🔍</button>
        </form>
      </div>

      {/* Stats strip */}
      <div style={{ display:'flex', justifyContent:'space-around', padding:'16px 12px', borderBottom:'1px solid var(--border)', marginBottom:20 }}>
        {[['2,400+','Farmers'],['30+','Products'],['64','Districts']].map(([n,l]) => (
          <div key={l} style={{ textAlign:'center' }}>
            <div style={{ fontSize:18, fontWeight:700, color:'var(--green-lt)' }}>{n}</div>
            <div style={{ fontSize:10, color:'var(--muted)' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Category cards — no icons, with background images */}
      <div style={{ padding:'0 12px', marginBottom:24 }}>
        <div style={{ fontSize:13, fontWeight:700, color:'var(--white)', marginBottom:12 }}>Shop by Category</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8 }}>
          {CATS.map(cat => (
            <div key={cat.key} onClick={() => navigate(`/marketplace?cat=${cat.key}`)}
              style={{ borderRadius:12, overflow:'hidden', cursor:'pointer', position:'relative', minHeight:56, border:`1px solid ${cat.color}30` }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:`url(${cat.img})`, backgroundSize:'cover', backgroundPosition:'center', opacity:0.18 }} />
              <div style={{ position:'absolute', inset:0, background: cat.bg }} />
              <div style={{ position:'relative', zIndex:1, padding:'12px 6px', textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
                <div style={{ fontSize:10, fontWeight:600, color: cat.color, lineHeight:1.2 }}>{cat.label}</div>
              </div>
            </div>
          ))}
          {/* All card */}
          <div onClick={() => navigate('/marketplace')}
            style={{ background:'rgba(255,255,255,.06)', borderRadius:12, padding:'12px 6px', textAlign:'center', cursor:'pointer', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', minHeight:56 }}>
            <div style={{ fontSize:10, fontWeight:600, color:'var(--muted)' }}>All</div>
          </div>
        </div>
      </div>

      {/* Product sections */}
      {loading ? (
        <div style={{ display:'flex', gap:10, padding:'0 12px', overflowX:'hidden' }}>
          {[...Array(4)].map((_,i) => <div key={i} style={{ width:148, height:200, background:'var(--card)', borderRadius:14, flexShrink:0, opacity:0.5 }} />)}
        </div>
      ) : (
        <>
          {allProds.length > 0 && (
            <Section title="Recommended For You" products={allProds} onViewAll={() => navigate('/marketplace')} />
          )}
          {CATS.map(cat => (
            <Section key={cat.key} title={cat.label} products={products[cat.key] || []} onViewAll={() => navigate(`/marketplace?cat=${cat.key}`)} />
          ))}
        </>
      )}

      {/* Bottom CTA */}
      <div style={{ margin:'24px 12px 0', background:'linear-gradient(135deg,rgba(90,176,48,.15),rgba(29,158,117,.1))', border:'1px solid rgba(90,176,48,.2)', borderRadius:16, padding:'20px 16px', textAlign:'center' }}>
        <div style={{ fontSize:16, fontWeight:700, color:'var(--white)', marginBottom:6 }}>Are you a farmer?</div>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14, lineHeight:1.6 }}>Join KrishiConnect and sell directly to thousands of customers.</div>
        <Link to="/register" style={{ background:'var(--green-hi)', color:'#fff', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:14, padding:'11px 28px', borderRadius:99, textDecoration:'none', display:'inline-block' }}>Register as Farmer</Link>
      </div>
    </div>
  );
}

// ── DESKTOP HOME ──────────────────────────────────────────────
function DesktopHome() {
  return (
    <div>
      {/* Hero */}
      <div style={{ position:'relative', minHeight:'100vh', display:'flex', flexDirection:'column' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=70&fit=crop')", backgroundSize:'cover', backgroundPosition:'center 30%', filter:'brightness(0.32) saturate(0.7)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,rgba(10,15,8,.25) 0%,rgba(10,15,8,.55) 55%,rgba(10,15,8,1) 100%)' }} />
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'0 56px 80px', maxWidth:700 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(90,176,48,.14)', border:'1px solid rgba(90,176,48,.3)', color:'var(--green-lt)', fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', padding:'6px 16px', borderRadius:99, marginBottom:24 }}>🌱 Farm Fresh · Direct to You</div>
          <h1 style={{ fontSize:'clamp(40px,5.5vw,74px)', fontWeight:700, lineHeight:1.06, letterSpacing:'-0.03em', marginBottom:20 }}>
            Buy directly from<br /><span style={{ color:'var(--green-lt)' }}>the farmer.</span>
          </h1>
          <p style={{ fontSize:16, fontWeight:300, lineHeight:1.7, color:'rgba(240,244,236,.58)', maxWidth:440, marginBottom:36 }}>
            Fresh produce, fair prices. Cut out the middleman and connect with verified farmers across Bangladesh — right from your home.
          </p>
          <div style={{ display:'flex', gap:14 }}>
            <Link to="/marketplace" style={{ background:'var(--green-hi)', color:'#fff', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, padding:'14px 32px', borderRadius:99, textDecoration:'none' }}>Browse Marketplace</Link>
            <Link to="/register" style={{ background:'rgba(255,255,255,.07)', color:'var(--white)', fontFamily:'Sora,sans-serif', fontWeight:500, fontSize:15, padding:'14px 32px', borderRadius:99, border:'1px solid rgba(255,255,255,.15)', textDecoration:'none' }}>I'm a Farmer →</Link>
          </div>
          <div style={{ display:'flex', gap:48, marginTop:60, paddingTop:36, borderTop:'1px solid var(--border)' }}>
            {[['2,400+','Verified Farmers'],['৳18 Cr+','Saved by Customers'],['64','Districts Covered']].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontSize:30, fontWeight:700, color:'var(--white)', lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:5 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding:'80px 56px' }}>
        <div style={{ textAlign:'center', marginBottom:56 }}>
          <div style={{ fontSize:36, fontWeight:700, letterSpacing:'-0.03em', marginBottom:12 }}>Built for Bangladesh farmers</div>
          <div style={{ fontSize:15, color:'var(--muted)', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>Every feature designed for Bangladeshi farmers and customers.</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, padding:28 }}>
              <div style={{ fontSize:36, marginBottom:16 }}>{f.icon}</div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:10 }}>{f.title}</div>
              <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category cards — no icons, with background images */}
      <div style={{ padding:'0 56px 80px' }}>
        <div style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.03em', marginBottom:32 }}>Shop by Category</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:16 }}>
          {CATS.map(cat => (
            <Link key={cat.key} to={`/marketplace?cat=${cat.key}`}
              style={{ borderRadius:20, overflow:'hidden', cursor:'pointer', border:`1px solid ${cat.color}40`, textDecoration:'none', transition:'transform .2s', position:'relative', minHeight:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <div style={{ position:'absolute', inset:0, backgroundImage:`url(${cat.img})`, backgroundSize:'cover', backgroundPosition:'center', opacity:0.2 }} />
              <div style={{ position:'absolute', inset:0, background: cat.bg }} />
              <div style={{ position:'relative', zIndex:1, padding:'24px 16px', textAlign:'center' }}>
                <div style={{ fontSize:13, fontWeight:600, color: cat.color }}>{cat.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding:'60px 56px 80px', textAlign:'center', background:'linear-gradient(180deg,transparent,rgba(90,176,48,.06))' }}>
        <div style={{ fontSize:40, fontWeight:700, marginBottom:16 }}>Ready to buy fresh?</div>
        <div style={{ fontSize:16, color:'var(--muted)', marginBottom:32 }}>Join thousands of customers buying directly from farmers.</div>
        <div style={{ display:'flex', gap:14, justifyContent:'center' }}>
          <Link to="/marketplace" style={{ background:'var(--green-hi)', color:'#fff', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, padding:'14px 36px', borderRadius:99, textDecoration:'none' }}>Shop Now</Link>
          <Link to="/register" style={{ background:'transparent', color:'var(--green-lt)', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, padding:'14px 36px', borderRadius:99, border:'1px solid rgba(90,176,48,.3)', textDecoration:'none' }}>Create Account</Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { isMobile } = useResponsive();
  return isMobile ? <MobileHome /> : <DesktopHome />;
}
