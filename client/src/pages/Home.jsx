import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useCart } from '../context/CartContext.jsx';
import { useResponsive } from '../hooks/useResponsive.js';

const CATS = [
  { key:'vegetables', label:'Vegetables', bg:'#e8f5e1',  color:'#3a7d1e' },
  { key:'fruits',     label:'Fruits',     bg:'#fef3d8',  color:'#c47d0a' },
  { key:'fish',       label:'Fish',       bg:'#e0f4ef',  color:'#1d9e75' },
  { key:'poultry',    label:'Poultry',    bg:'#fef0e0',  color:'#c47010' },
  { key:'grains',     label:'Grains',     bg:'#f5ede0',  color:'#9a6830' },
  { key:'dairy',      label:'Dairy',      bg:'#eef0fa',  color:'#5060c0' },
  { key:'spices',     label:'Spices',     bg:'#fde8e8',  color:'#c04040' },
];


const CAT_IMGS = {
  vegetables: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&q=60',
  fruits:     'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=200&q=60',
  fish:       'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200&q=60',
  poultry:    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=200&q=60',
  grains:     'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=200&q=60',
  dairy:      'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=200&q=60',
  spices:     'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=200&q=60',
};

const FEATURES = [
  { icon:'📊', title:'Price Comparison',  desc:'See exactly how much you save vs local bazar on every product.' },
  { icon:'📅', title:'Harvest Pre-Order', desc:'Book crops before harvest. Guaranteed freshness at farm price.' },
  { icon:'✅', title:'Verified Farmers',  desc:'NID-verified badge gives you confidence every purchase.' },
  { icon:'📈', title:'Price History',     desc:'Track price trends so you always buy at the right time.' },
];

/* ── Animated counter ── */
function Counter({ target, suffix='' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const num = parseInt(target.replace(/[^0-9]/g,''));
        const dur = 1200;
        const step = dur / 60;
        const inc = num / 60;
        const t = setInterval(() => {
          start += inc;
          if (start >= num) { setVal(num); clearInterval(t); }
          else setVal(Math.floor(start));
        }, step);
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  const display = target.includes(',')
    ? val.toLocaleString('en-US')
    : val.toString();
  return <span ref={ref}>{display}{suffix}</span>;
}

/* ── HomeProductCard ── */
function HomeProductCard({ product, delay=0 }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [hover, setHover] = useState(false);
  const savings = product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/products/${product._id}`)}
      style={{
        background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:18, overflow:'hidden',
        flexShrink:0, width:152, cursor:'pointer',
        boxShadow: hover ? '0 8px 24px rgba(20,50,10,.12)' : '0 2px 8px rgba(20,50,10,.06)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition:'all .25s cubic-bezier(.22,1,.36,1)',
        animation:`fadeUp .45s cubic-bezier(.22,1,.36,1) ${delay}ms both`,
      }}>
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }`}</style>
      <div style={{ height:110, background:'#f0f4ec', position:'relative', overflow:'hidden' }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover', transform: hover ? 'scale(1.06)' : 'scale(1)', transition:'transform .4s ease' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>🥦</div>
        }
        {savings > 0 && <span style={{ position:'absolute', top:7, left:7, background:'#4e9e2a', color:'#fff', fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:99, letterSpacing:'.04em' }}>SAVE {savings}%</span>}
        <button
          onClick={e => { e.stopPropagation(); addToCart(product,1); setAdded(true); setTimeout(()=>setAdded(false),1500); }}
          style={{ position:'absolute', bottom:7, right:7, width:28, height:28, borderRadius:'50%',
            background: added ? '#4e9e2a' : '#fff',
            border: added ? 'none' : '1px solid rgba(60,100,40,.2)',
            color: added ? '#fff' : '#4e9e2a',
            fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700,
            boxShadow:'0 2px 6px rgba(0,0,0,.1)',
            transform: added ? 'scale(1.12)' : 'scale(1)',
            transition:'all .2s cubic-bezier(.22,1,.36,1)',
          }}>
          {added ? '✓' : '+'}
        </button>
      </div>
      <div style={{ padding:'10px 11px 13px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#1a2415', marginBottom:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.name}</div>
        <div style={{ fontSize:10, color:'#7a9070', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.farmer?.location?.district || 'Bangladesh'}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:13, fontWeight:800, color:'#4e9e2a' }}>৳{product.price}<span style={{ fontSize:9, fontWeight:400, color:'#7a9070' }}>/{product.unit}</span></span>
          {product.marketPrice > product.price && <span style={{ fontSize:9, color:'#afc09e', textDecoration:'line-through' }}>৳{product.marketPrice}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Section row ── */
function Section({ title, icon, products, onViewAll }) {
  if (!products?.length) return null;
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, padding:'0 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>{icon}</span>
          <span style={{ fontSize:15, fontWeight:800, color:'#1a2415', letterSpacing:'-0.02em' }}>{title}</span>
        </div>
        <button onClick={onViewAll} style={{ background:'#e8f5e1', border:'none', color:'#4e9e2a', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', padding:'5px 12px', borderRadius:99 }}>See all →</button>
      </div>
      <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'4px 16px 8px', scrollbarWidth:'none' }}>
        {products.map((p,i) => <HomeProductCard key={p._id} product={p} delay={i*40} />)}
      </div>
    </div>
  );
}

/* ── MOBILE HOME ── */
function MobileHome() {
  const navigate = useNavigate();
  const [products, setProducts] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [searchFocus, setSearchFocus] = useState(false);

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

  // FIX: search navigates with the query param so marketplace shows results
  const handleSearch = e => {
    e.preventDefault();
    if (search.trim()) navigate(`/marketplace?search=${encodeURIComponent(search.trim())}`);
  };

  const allProds = Object.values(products).flat().sort(() => Math.random() - 0.5).slice(0, 8);

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', paddingBottom:32 }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ position:'relative', height:240, overflow:'hidden', borderRadius:'0 0 28px 28px', margin:'0 0 0 0' }}>
        <div style={{ position:'absolute', inset:0,
          backgroundImage:"url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=70')",
          backgroundSize:'cover', backgroundPosition:'center 35%' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,rgba(10,30,5,.25) 0%,rgba(10,30,5,.7) 100%)' }} />
        <div style={{ position:'relative', zIndex:2, padding:'20px 20px 24px', display:'flex', flexDirection:'column', justifyContent:'flex-end', height:'100%' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,.25)', borderRadius:99, padding:'4px 12px', marginBottom:10, alignSelf:'flex-start',
            animation:'fadeIn .6s ease both' }}>
            <span style={{ fontSize:11 }}>🌱</span>
            <span style={{ fontSize:10, fontWeight:700, color:'#fff', letterSpacing:'.08em', textTransform:'uppercase' }}>Farm Fresh · Direct to You</span>
          </div>
          <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.03em', color:'#fff', lineHeight:1.2, marginBottom:6,
            animation:'fadeUp .5s .1s cubic-bezier(.22,1,.36,1) both' }}>
            Farming Made<br /><span style={{ color:'#a8e07a' }}>Simple, Smart &</span><br /><span style={{ color:'#a8e07a' }}>Sustainable</span>
          </div>
        </div>
      </div>

      {/* ── Search bar (floated over hero bottom) ── */}
      <div style={{ padding:'0 16px', marginTop:-20, position:'relative', zIndex:10,
        animation:'fadeUp .5s .25s cubic-bezier(.22,1,.36,1) both' }}>
        <form onSubmit={handleSearch}>
          <div style={{
            display:'flex', alignItems:'center', gap:0,
            background:'#fff', borderRadius:16,
            border: searchFocus ? '1.5px solid #4e9e2a' : '1.5px solid rgba(60,100,40,.12)',
            boxShadow: searchFocus ? '0 0 0 3px rgba(78,158,42,.12), 0 4px 16px rgba(20,50,10,.1)' : '0 4px 16px rgba(20,50,10,.1)',
            transition:'all .2s ease', overflow:'hidden',
          }}>
            <span style={{ padding:'0 14px', fontSize:18, color:'#afc09e' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)}
              onBlur={() => setSearchFocus(false)}
              placeholder="Search products, farmers..."
              style={{ flex:1, border:'none', outline:'none', background:'transparent', padding:'14px 0', color:'#1a2415', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:14 }}
            />
            {/* FIX: map icon stays, search submits the form */}
            <button type="button" onClick={() => navigate('/map')} style={{ padding:'0 14px', background:'none', border:'none', cursor:'pointer', fontSize:20 }}>📍</button>
            <button type="submit" style={{ padding:'0 16px', background:'#4e9e2a', border:'none', cursor:'pointer', color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, height:'100%', minHeight:48 }}>Go</button>
          </div>
        </form>
      </div>

      {/* ── Weather-style info strip ── */}
      <div style={{ margin:'16px 16px 0', background:'#fff', borderRadius:18, padding:'14px 16px',
        border:'1px solid rgba(60,100,40,.1)', boxShadow:'0 2px 8px rgba(20,50,10,.05)',
        animation:'fadeUp .5s .35s cubic-bezier(.22,1,.36,1) both' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:10, color:'#7a9070', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:2 }}>📊 Market Insight</div>
            <div style={{ fontSize:13, fontWeight:700, color:'#1a2415' }}>Good time to buy vegetables</div>
            <div style={{ fontSize:11, color:'#7a9070' }}>Prices 12% below avg today</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#4e9e2a' }}>↓12%</div>
            <div style={{ fontSize:10, color:'#afc09e' }}>vs last week</div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display:'flex', justifyContent:'space-around', margin:'14px 16px 0',
        background:'#fff', borderRadius:18, padding:'16px',
        border:'1px solid rgba(60,100,40,.1)', boxShadow:'0 2px 8px rgba(20,50,10,.05)',
        animation:'fadeUp .5s .4s cubic-bezier(.22,1,.36,1) both' }}>
        {[['2,400','Farmers'],['30+','Products'],['64','Districts']].map(([n,l],i) => (
          <div key={l} style={{ textAlign:'center', flex:1, borderRight: i<2 ? '1px solid rgba(60,100,40,.1)' : 'none' }}>
            <div style={{ fontSize:20, fontWeight:800, color:'#4e9e2a', lineHeight:1 }}>{n}</div>
            <div style={{ fontSize:10, color:'#7a9070', marginTop:3, fontWeight:500 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── Category pills (horizontal scroll) ── */}
      <div style={{ padding:'20px 0 0', animation:'fadeUp .5s .45s cubic-bezier(.22,1,.36,1) both' }}>
        <div style={{ padding:'0 16px', fontSize:14, fontWeight:800, color:'#1a2415', marginBottom:12, letterSpacing:'-0.02em' }}>Shop by Category</div>
        <div style={{ display:'flex', gap:10, overflowX:'auto', padding:'4px 16px 6px', scrollbarWidth:'none' }}>
          {CATS.map((cat,i) => (
            // FIX: navigate to marketplace with category param so it pre-filters
            <div key={cat.key} onClick={() => navigate(`/marketplace?cat=${cat.key}`)}
              style={{ borderRadius:14, flexShrink:0, minWidth:80, height:80, position:'relative', overflow:'hidden', cursor:'pointer',
                border:`2px solid transparent`,
                boxShadow:'0 2px 8px rgba(20,50,10,.08)',
                transition:'all .25s cubic-bezier(.22,1,.36,1)',
                animation:`fadeUp .4s ${.45 + i*.05}s cubic-bezier(.22,1,.36,1) both`,
              }}>
              <img src={CAT_IMGS[cat.key]} alt={cat.label} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,rgba(10,30,5,.15),rgba(10,30,5,.65))' }} />
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'5px 7px' }}>
                <div style={{ fontSize:9, fontWeight:800, color:'#fff', lineHeight:1.2, textShadow:'0 1px 3px rgba(0,0,0,.5)' }}>{cat.label}</div>
              </div>
            </div>
          ))}
          <div onClick={() => navigate('/marketplace')}
            style={{ background:'#f0f4ec', borderRadius:16, padding:'12px 14px', textAlign:'center', cursor:'pointer', border:'1.5px solid rgba(60,100,40,.12)', flexShrink:0, minWidth:72, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#7a9070' }}>All</div>
          </div>
        </div>
      </div>

      {/* ── My Fields card (premium feel) ── */}
      <div style={{ margin:'20px 16px 0', animation:'fadeUp .5s .55s cubic-bezier(.22,1,.36,1) both' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:14, fontWeight:800, color:'#1a2415', letterSpacing:'-0.02em' }}>🌾 Featured Farms</span>
          <button onClick={() => navigate('/map')} style={{ background:'none', border:'none', color:'#4e9e2a', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>See all →</button>
        </div>
        <div style={{ background:'linear-gradient(135deg,#e8f5e1,#f5f9f0)', borderRadius:20, padding:'16px', border:'1px solid rgba(78,158,42,.15)', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, background:'rgba(78,158,42,.06)', borderRadius:'50%' }} />
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:52, height:52, borderRadius:14, overflow:'hidden', flexShrink:0, border:'2px solid rgba(78,158,42,.2)' }}>
              <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=100&q=60" alt="farm" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#1a2415' }}>Emerald Valley Farm</div>
              <div style={{ fontSize:11, color:'#7a9070', marginTop:1 }}>📍 Rajshahi · Verified ✓</div>
              <div style={{ display:'flex', gap:6, marginTop:6 }}>
                <span style={{ background:'#4e9e2a', color:'#fff', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:99 }}>🌾 Wheat</span>
                <span style={{ background:'#e8f5e1', color:'#4e9e2a', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:99 }}>🌽 Corn</span>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#4e9e2a' }}>4.8 ⭐</div>
              <div style={{ fontSize:10, color:'#7a9070' }}>240+ orders</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Products ── */}
      <div style={{ marginTop:24 }}>
        {loading ? (
          <div style={{ display:'flex', gap:10, padding:'0 16px' }}>
            {[...Array(4)].map((_,i) => <div key={i} style={{ width:152, height:200, background:'#e8ede4', borderRadius:18, flexShrink:0, backgroundSize:'400px 100%', backgroundImage:'linear-gradient(90deg,#e8ede4 25%,#f0f4ec 50%,#e8ede4 75%)', animation:`shimmer 1.4s ${i*.15}s infinite` }} />)}
            <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
          </div>
        ) : (
          <>
            {/* FIX: Recommended For You "See all" goes to marketplace with recommended param */}
            {allProds.length > 0 && <Section title="Recommended For You" icon="⭐" products={allProds} onViewAll={() => navigate('/marketplace?recommended=true')} />}
            {CATS.map(cat => (
              // FIX: each category "See all" navigates with the correct category param
              <Section key={cat.key} title={cat.label} icon="🌿" products={products[cat.key] || []} onViewAll={() => navigate(`/marketplace?cat=${cat.key}`)} />
            ))}
          </>
        )}
      </div>

      {/* ── Farmer CTA ── */}
      <div style={{ margin:'28px 16px 0', borderRadius:20, overflow:'hidden', position:'relative',
        animation:'fadeUp .5s .6s cubic-bezier(.22,1,.36,1) both' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=60')", backgroundSize:'cover', backgroundPosition:'center' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(20,60,10,.75),rgba(10,40,5,.9))' }} />
        <div style={{ position:'relative', padding:'24px 20px', textAlign:'center' }}>
          <div style={{ fontSize:28, marginBottom:8 }}>👨‍🌾</div>
          <div style={{ fontSize:17, fontWeight:800, color:'#fff', marginBottom:6, letterSpacing:'-0.02em' }}>Are you a Farmer?</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.7)', marginBottom:16, lineHeight:1.6 }}>Join KrishiConnect and sell directly to thousands of customers.</div>
          <Link to="/register" style={{ background:'#fff', color:'#3a7d1e', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:14, padding:'12px 28px', borderRadius:99, textDecoration:'none', display:'inline-block', boxShadow:'0 4px 12px rgba(0,0,0,.2)' }}>Register as Farmer →</Link>
        </div>
      </div>
    </div>
  );
}

/* ── DESKTOP HOME ── */
function DesktopHome() {
  const navigate = useNavigate();
  const [products, setProducts] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [searchFocus, setSearchFocus] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const results = await Promise.all(
          CATS.map(c => api.get('/products', { params: { category: c.key, limit: 6 } }).then(r => ({ key: c.key, products: r.data.products || [] })))
        );
        const map = {};
        results.forEach(r => { map[r.key] = r.products; });
        setProducts(map);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const allProds = Object.values(products).flat().sort(() => Math.random() - 0.5).slice(0, 6);

  // FIX: desktop search handler properly navigates with the search query
  const handleDesktopSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/marketplace?search=${encodeURIComponent(search.trim())}`);
    else navigate('/marketplace');
  };

  return (
    <div style={{ background:'#f5f7f2' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes shimmer{ 0%{background-position:-600px 0}100%{background-position:600px 0} }
        .cat-card:hover { transform:translateY(-5px) scale(1.03) !important; box-shadow:0 8px 24px rgba(20,50,10,.12) !important; }
        .feat-card:hover { transform:translateY(-4px) !important; box-shadow:0 8px 28px rgba(20,50,10,.12) !important; }
        .prod-card-d:hover .prod-img-d { transform:scale(1.06); }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ position:'relative', minHeight:'90vh', display:'flex', flexDirection:'column', borderRadius:'0 0 40px 40px', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=80')", backgroundSize:'cover', backgroundPosition:'center 30%' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,rgba(5,20,2,.2) 0%,rgba(5,20,2,.65) 60%,rgba(5,20,2,.9) 100%)' }} />

        {/* Floating badges */}
        <div style={{ position:'absolute', top:'30%', right:'8%', background:'rgba(255,255,255,.12)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,.2)', borderRadius:20, padding:'16px 20px', animation:'float 3s ease-in-out infinite', color:'#fff' }}>
          <div style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,.7)' }}>Today's Best Pick</div>
          <div style={{ fontSize:18, fontWeight:800, marginTop:2 }}>🥦 Fresh Vegetables</div>
          <div style={{ fontSize:13, color:'#a8e07a', marginTop:2 }}>↓15% vs yesterday</div>
        </div>

        <div style={{ position:'absolute', top:'55%', right:'12%', background:'rgba(255,255,255,.1)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,.15)', borderRadius:20, padding:'14px 18px', animation:'float 3.5s 1s ease-in-out infinite', color:'#fff' }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,.7)' }}>✅ Verified Farmers</div>
          <div style={{ fontSize:22, fontWeight:800, marginTop:2 }}>2,400+</div>
        </div>

        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'60px 64px 80px', maxWidth:720 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,.12)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,.2)', color:'#fff', fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', padding:'7px 18px', borderRadius:99, marginBottom:24, alignSelf:'flex-start',
            animation:'fadeIn .6s ease both' }}>
            🌱 Farm Fresh · Direct to You
          </div>
          <h1 style={{ fontSize:'clamp(40px,5vw,72px)', fontWeight:800, lineHeight:1.06, letterSpacing:'-0.04em', marginBottom:20, color:'#fff',
            animation:'fadeUp .6s .1s cubic-bezier(.22,1,.36,1) both' }}>
            Farming Made<br /><span style={{ color:'#a8e07a', fontFamily:'Fraunces,serif', fontStyle:'italic' }}>Simple, Smarter,</span><br />and Sustainable
          </h1>
          <p style={{ fontSize:16, fontWeight:400, lineHeight:1.7, color:'rgba(255,255,255,.6)', maxWidth:460, marginBottom:36,
            animation:'fadeUp .6s .2s cubic-bezier(.22,1,.36,1) both' }}>
            Fresh produce, fair prices. Cut out the middleman and connect with verified farmers across Bangladesh — right from your home.
          </p>
          <div style={{ display:'flex', gap:14, animation:'fadeUp .6s .3s cubic-bezier(.22,1,.36,1) both' }}>
            <Link to="/marketplace" style={{ background:'#4e9e2a', color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:15, padding:'15px 34px', borderRadius:99, textDecoration:'none', boxShadow:'0 4px 16px rgba(78,158,42,.45)', display:'flex', alignItems:'center', gap:8 }}>Browse Marketplace →</Link>
            <Link to="/register" style={{ background:'rgba(255,255,255,.1)', backdropFilter:'blur(8px)', color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600, fontSize:15, padding:'15px 34px', borderRadius:99, border:'1px solid rgba(255,255,255,.2)', textDecoration:'none' }}>I'm a Farmer</Link>
          </div>
          <div style={{ display:'flex', gap:48, marginTop:56, paddingTop:32, borderTop:'1px solid rgba(255,255,255,.15)',
            animation:'fadeUp .6s .4s cubic-bezier(.22,1,.36,1) both' }}>
            {[['2,400+','Verified Farmers'],['৳18 Cr+','Saved by Customers'],['64','Districts Covered']].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontSize:28, fontWeight:800, color:'#fff', lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.5)', marginTop:5, fontWeight:500 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Search bar section ── */}
      {/* FIX: desktop search is now a proper form that navigates with the query */}
      <div style={{ padding:'48px 64px 0' }}>
        <form onSubmit={handleDesktopSearch} style={{ background:'#fff', borderRadius:24, padding:'28px 32px', boxShadow:'0 4px 24px rgba(20,50,10,.08)', border:'1px solid rgba(60,100,40,.1)' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#7a9070', marginBottom:14, textTransform:'uppercase', letterSpacing:'.06em' }}>🔍 Search Products & Farms</div>
          <div style={{ display:'flex', gap:12 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={e => { setSearchFocus(true); e.target.style.borderColor='#4e9e2a'; }}
              onBlur={e => { setSearchFocus(false); e.target.style.borderColor='rgba(60,100,40,.15)'; }}
              placeholder="Search vegetables, fruits, fish, farmers..."
              style={{ flex:1, border:'1.5px solid rgba(60,100,40,.15)', borderRadius:14, padding:'14px 20px', color:'#1a2415', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:15, outline:'none', background:'#f9faf7', transition:'border .2s' }}
            />
            {/* FIX: Search button submits the form instead of being a plain link */}
            <button type="submit" style={{ background:'#4e9e2a', color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, padding:'14px 28px', borderRadius:14, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 2px 8px rgba(78,158,42,.3)' }}>Search</button>
          </div>
        </form>
      </div>

      {/* ── Features ── */}
      <div style={{ padding:'64px 64px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:40 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'#4e9e2a', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:10 }}>Why KrishiConnect</div>
            <div style={{ fontSize:36, fontWeight:800, letterSpacing:'-0.03em', color:'#1a2415', lineHeight:1.1 }}>Built for Bangladesh<br /><span style={{ fontFamily:'Fraunces,serif', fontStyle:'italic', color:'#4e9e2a', fontWeight:600 }}>farmers & families</span></div>
          </div>
          <Link to="/marketplace" style={{ background:'#4e9e2a', color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, padding:'12px 24px', borderRadius:99, textDecoration:'none', boxShadow:'0 2px 8px rgba(78,158,42,.3)' }}>Browse Market →</Link>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
          {FEATURES.map((f,i) => (
            <div key={f.title} className="feat-card" style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:24, padding:28, transition:'all .25s cubic-bezier(.22,1,.36,1)',
              animation:`fadeUp .5s ${.1+i*.08}s cubic-bezier(.22,1,.36,1) both` }}>
              <div style={{ width:52, height:52, background:'#e8f5e1', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, marginBottom:18 }}>{f.icon}</div>
              <div style={{ fontSize:16, fontWeight:800, marginBottom:10, color:'#1a2415' }}>{f.title}</div>
              <div style={{ fontSize:13, color:'#7a9070', lineHeight:1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Categories ── */}
      <div style={{ padding:'64px 64px 0' }}>
        <div style={{ fontSize:28, fontWeight:800, letterSpacing:'-0.03em', color:'#1a2415', marginBottom:32 }}>Shop by Category</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:14 }}>
          {CATS.map((cat,i) => (
            // FIX: category cards are Links with the correct cat param — no icons added, photo-only style preserved
            <Link key={cat.key} to={`/marketplace?cat=${cat.key}`} className="cat-card"
              style={{ borderRadius:18, overflow:'hidden', position:'relative', height:110, cursor:'pointer', textDecoration:'none',
                boxShadow:'0 2px 8px rgba(20,50,10,.08)',
                transition:'all .28s cubic-bezier(.22,1,.36,1)',
                animation:`fadeUp .4s ${.05+i*.05}s cubic-bezier(.22,1,.36,1) both` }}>
              <img src={CAT_IMGS[cat.key]} alt={cat.label} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(160deg,rgba(10,30,5,.15),rgba(10,30,5,.6))' }} />
              <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 10px' }}>
                <div style={{ fontSize:12, fontWeight:800, color:'#fff', textShadow:'0 1px 4px rgba(0,0,0,.5)', lineHeight:1.2 }}>{cat.label}</div>
              </div>
            </Link>
          ))}
          <Link to="/marketplace" className="cat-card"
            style={{ borderRadius:18, overflow:'hidden', position:'relative', height:110, cursor:'pointer', textDecoration:'none',
              background:'linear-gradient(135deg,#3a7d1e,#4e9e2a)',
              boxShadow:'0 2px 8px rgba(20,50,10,.1)',
              transition:'all .28s cubic-bezier(.22,1,.36,1)',
              display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:4 }}>
            <div style={{ fontSize:12, fontWeight:800, color:'#fff' }}>All</div>
          </Link>
        </div>
      </div>

      {/* ── Featured Products ── */}
      <div style={{ padding:'64px 64px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
          <div style={{ fontSize:28, fontWeight:800, letterSpacing:'-0.03em', color:'#1a2415' }}>⭐ Recommended For You</div>
          {/* FIX: View All goes to marketplace with recommended param so it pre-filters */}
          <Link to="/marketplace?recommended=true" style={{ background:'#e8f5e1', color:'#4e9e2a', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, padding:'10px 22px', borderRadius:99, textDecoration:'none' }}>View All →</Link>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:16 }}>
          {loading ? [...Array(6)].map((_,i) => (
            <div key={i} style={{ height:260, borderRadius:20, backgroundImage:'linear-gradient(90deg,#e8ede4 25%,#f0f4ec 50%,#e8ede4 75%)', backgroundSize:'600px 100%', animation:`shimmer 1.4s ${i*.1}s infinite` }} />
          )) : allProds.map((p,i) => (
            <DesktopProductCard key={p._id} product={p} delay={i*60} />
          ))}
        </div>
      </div>

      {/* ── Farmer CTA ── */}
      <div style={{ padding:'64px 64px 80px' }}>
        <div style={{ borderRadius:32, overflow:'hidden', position:'relative', minHeight:280, display:'flex', alignItems:'center' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1400&q=70')", backgroundSize:'cover', backgroundPosition:'center' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(10,40,5,.8),rgba(5,25,3,.7))' }} />
          <div style={{ position:'relative', zIndex:2, padding:'48px 64px', flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'rgba(168,224,122,.8)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:14 }}>For Farmers</div>
            <div style={{ fontSize:40, fontWeight:800, color:'#fff', letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:18, maxWidth:500 }}>
              Ready to grow your <span style={{ fontFamily:'Fraunces,serif', fontStyle:'italic', color:'#a8e07a' }}>income</span> directly?
            </div>
            <div style={{ fontSize:15, color:'rgba(255,255,255,.6)', marginBottom:32, maxWidth:420, lineHeight:1.7 }}>
              Join thousands of farmers selling directly to consumers. Higher prices, zero middlemen.
            </div>
            <div style={{ display:'flex', gap:14 }}>
              <Link to="/register" style={{ background:'#fff', color:'#3a7d1e', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15, padding:'15px 36px', borderRadius:99, textDecoration:'none', boxShadow:'0 4px 16px rgba(0,0,0,.2)' }}>Register as Farmer →</Link>
              <Link to="/marketplace" style={{ background:'rgba(255,255,255,.1)', backdropFilter:'blur(8px)', color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:600, fontSize:15, padding:'15px 36px', borderRadius:99, border:'1px solid rgba(255,255,255,.2)', textDecoration:'none' }}>Browse First</Link>
            </div>
          </div>
          <div style={{ position:'relative', zIndex:2, padding:'48px 64px 48px 0', display:'flex', flexDirection:'column', gap:16 }}>
            {[['2,400+','Verified Farmers'],['৳18 Cr+','Customer Savings'],['64','Districts'],['4.9★','Average Rating']].map(([n,l]) => (
              <div key={l} style={{ background:'rgba(255,255,255,.08)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,.15)', borderRadius:16, padding:'14px 22px', minWidth:160 }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{n}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.55)', marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Desktop product card ── */
function DesktopProductCard({ product, delay=0 }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [hover, setHover] = useState(false);
  const savings = product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/products/${product._id}`)}
      style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:22, overflow:'hidden', cursor:'pointer',
        boxShadow: hover ? '0 12px 32px rgba(20,50,10,.12)' : '0 2px 8px rgba(20,50,10,.06)',
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        transition:'all .3s cubic-bezier(.22,1,.36,1)',
        animation:`fadeUp .5s ${delay}ms cubic-bezier(.22,1,.36,1) both`,
      }}>
      <div className="prod-img-d" style={{ height:180, background:'#f0f4ec', position:'relative', overflow:'hidden' }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .4s ease', transform: hover ? 'scale(1.07)' : 'scale(1)' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:56 }}>🥦</div>
        }
        {savings > 0 && <span style={{ position:'absolute', top:10, left:10, background:'#4e9e2a', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:99 }}>SAVE {savings}%</span>}
        {product.farmer?.isVerified && <div style={{ position:'absolute', top:10, right:10, width:24, height:24, borderRadius:'50%', background:'#fff', border:'1.5px solid #4e9e2a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#4e9e2a', boxShadow:'0 1px 4px rgba(0,0,0,.1)' }}>✓</div>}
      </div>
      <div style={{ padding:'16px 18px 18px' }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#afc09e', marginBottom:4 }}>{product.category}</div>
        <div style={{ fontSize:15, fontWeight:800, color:'#1a2415', marginBottom:4, lineHeight:1.3 }}>{product.name}</div>
        <div style={{ fontSize:12, color:'#7a9070', marginBottom:12 }}>{product.farmer?.farmName || product.farmer?.name}{product.farmer?.location?.district ? ` · ${product.farmer.location.district}` : ''}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ fontSize:20, fontWeight:800, color:'#4e9e2a' }}>৳{product.price} <span style={{ fontSize:12, fontWeight:400, color:'#7a9070' }}>/{product.unit}</span></div>
          {product.marketPrice > product.price && <div style={{ fontSize:12, color:'#afc09e', textDecoration:'line-through' }}>৳{product.marketPrice}</div>}
        </div>
        <button
          onClick={e => { e.stopPropagation(); addToCart(product,1); setAdded(true); setTimeout(()=>setAdded(false),1500); }}
          style={{ width:'100%', background: added ? '#4e9e2a' : '#e8f5e1', border:'none', borderRadius:12, padding:'10px', color: added ? '#fff' : '#4e9e2a', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
          {added ? '✓ Added!' : '+ Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const { isMobile } = useResponsive();
  return isMobile ? <MobileHome /> : <DesktopHome />;
}
