import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios.js';
import { useCart } from '../context/CartContext.jsx';
import { useResponsive } from '../hooks/useResponsive.js';

const CATS = [
  { key:'vegetables', label:'Fresh Vegetables', bg:'#e8f5e1', color:'#3a7d1e', img:'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=70' },
  { key:'fruits',     label:'Fruits',           bg:'#fef3d8', color:'#c47d0a', img:'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=70' },
  { key:'fish',       label:'Fish',             bg:'#e0f4ef', color:'#1d9e75', img:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=70' },
  { key:'poultry',    label:'Poultry & Eggs',   bg:'#fef0e0', color:'#c47010', img:'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&q=70' },
  { key:'grains',     label:'Grains & Rice',    bg:'#f5ede0', color:'#9a6830', img:'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=70' },
  { key:'dairy',      label:'Dairy',            bg:'#eef0fa', color:'#5060c0', img:'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=70' },
  { key:'spices',     label:'Spices',           bg:'#fde8e8', color:'#c04040', img:'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=70' },
];

const DISTRICTS = [
  'Dhaka','Chittagong','Rajshahi','Khulna','Sylhet','Barisal','Rangpur','Mymensingh',
  'Comilla','Narayanganj','Gazipur','Tangail','Bogra','Dinajpur','Jessore','Faridpur',
];

/* ── Shared card styles ── */
function MiniCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [hover, setHover] = useState(false);
  const savings = product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/products/${product._id}`)}
      style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:18, overflow:'hidden',
        flexShrink:0, width:158, cursor:'pointer',
        boxShadow: hover ? '0 8px 24px rgba(20,50,10,.12)' : '0 2px 8px rgba(20,50,10,.06)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition:'all .25s cubic-bezier(.22,1,.36,1)',
      }}>
      <div style={{ height:118, background:'#f0f4ec', position:'relative', overflow:'hidden' }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover', transform: hover ? 'scale(1.06)' : 'scale(1)', transition:'transform .4s ease' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, background:'#f0f4ec' }}>🌿</div>
        }
        {savings > 0 && <span style={{ position:'absolute', top:7, left:7, background:'#4e9e2a', color:'#fff', fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:99 }}>SAVE {savings}%</span>}
        <button onClick={e => { e.stopPropagation(); addToCart(product,1); setAdded(true); setTimeout(()=>setAdded(false),1500); }}
          style={{ position:'absolute', bottom:7, right:7, width:28, height:28, borderRadius:'50%',
            background: added ? '#4e9e2a' : '#fff', border: added ? 'none' : '1px solid rgba(60,100,40,.2)',
            color: added ? '#fff' : '#4e9e2a', fontSize:15, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700,
            boxShadow:'0 2px 6px rgba(0,0,0,.1)', transition:'all .2s',
          }}>{added ? '✓' : '+'}</button>
      </div>
      <div style={{ padding:'10px 12px 13px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#1a2415', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.name}</div>
        <div style={{ fontSize:10, color:'#7a9070', marginBottom:6 }}>{product.farmer?.location?.district || 'Bangladesh'}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#4e9e2a' }}>৳{product.price}<span style={{ fontSize:10, color:'#7a9070', fontWeight:400 }}>/{product.unit}</span></div>
          {product.marketPrice > product.price && <div style={{ fontSize:10, color:'#afc09e', textDecoration:'line-through' }}>৳{product.marketPrice}</div>}
        </div>
      </div>
    </div>
  );
}

function ProductRow({ title, products, onViewAll }) {
  if (!products?.length) return null;
  return (
    <div style={{ marginBottom:32 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontSize:16, fontWeight:800, color:'#1a2415', letterSpacing:'-0.02em' }}>{title}</span>
        <button onClick={onViewAll} style={{ background:'#e8f5e1', border:'none', borderRadius:99, padding:'6px 14px', fontSize:12, fontWeight:600, color:'#4e9e2a', cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>View All →</button>
      </div>
      <div style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none' }}>
        {products.map(p => <MiniCard key={p._id} product={p} />)}
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  // FIX: read URL search params to pre-activate category / search / recommended
  const [searchParams] = useSearchParams();

  const [allProducts,    setAllProducts]    = useState({});
  const [filtered,       setFiltered]       = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search,         setSearch]         = useState('');
  const [searchResults,  setSearchResults]  = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [searching,      setSearching]      = useState(false);
  const [searchFocus,    setSearchFocus]    = useState(false);
  const [showRecommended, setShowRecommended] = useState(false);

  // Filter state
  const [showFilters,  setShowFilters]  = useState(false);
  const [filterLocation, setFilterLocation] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [activeFilters,  setActiveFilters]  = useState(false);

  const initDone = useRef(false);

  useEffect(() => { loadAll(); }, []);

  // FIX: on mount, read URL params and activate the right view
  useEffect(() => {
    if (initDone.current) return;
    const catParam    = searchParams.get('cat');
    const searchParam = searchParams.get('search');
    const recParam    = searchParams.get('recommended');

    if (catParam) {
      initDone.current = true;
      handleCategoryClick(catParam);
    } else if (searchParam) {
      initDone.current = true;
      setSearch(searchParam);
      runSearch(searchParam);
    } else if (recParam === 'true') {
      initDone.current = true;
      setShowRecommended(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        CATS.map(c => api.get('/products', { params: { category: c.key, limit: 10 } }).then(r => ({ key: c.key, products: r.data.products || [] })))
      );
      const map = {};
      results.forEach(r => { map[r.key] = r.products; });
      setAllProducts(map);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCategoryClick = async (cat) => {
    if (activeCategory === cat) { setActiveCategory(null); setFiltered([]); return; }
    setActiveCategory(cat); setSearchResults(null); setSearch(''); setShowRecommended(false);
    try {
      const params = { category: cat, limit: 40 };
      if (filterLocation) params.location = filterLocation;
      if (filterMinPrice) params.minPrice = filterMinPrice;
      if (filterMaxPrice) params.maxPrice = filterMaxPrice;
      const { data } = await api.get('/products', { params });
      setFiltered(data.products || []);
    } catch (e) { console.error(e); }
  };

  // Separated so it can be called programmatically with a value
  const runSearch = async (term) => {
    if (!term?.trim()) { setSearchResults(null); setActiveCategory(null); return; }
    setSearching(true); setShowRecommended(false);
    try {
      const params = { search: term.trim(), limit: 40 };
      if (filterLocation) params.location = filterLocation;
      if (filterMinPrice) params.minPrice = filterMinPrice;
      if (filterMaxPrice) params.maxPrice = filterMaxPrice;
      const { data } = await api.get('/products', { params });
      setSearchResults(data.products || []);
      setActiveCategory(null);
    } catch (e) { console.error(e); }
    finally { setSearching(false); }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    runSearch(search);
  };

  // Apply filters to current view
  const applyFilters = async () => {
    setActiveFilters(!!(filterLocation || filterMinPrice || filterMaxPrice));
    setShowFilters(false);
    if (activeCategory) {
      await handleCategoryClick(activeCategory);
    } else if (search.trim()) {
      await runSearch(search);
    } else if (showRecommended) {
      // re-load recommended with filters — nothing to do since recommended derives from allProducts
    }
  };

  const clearFilters = () => {
    setFilterLocation(''); setFilterMinPrice(''); setFilterMaxPrice('');
    setActiveFilters(false);
  };

  // Recommended: flat mix of all products, randomised
  const recommendedProducts = Object.values(allProducts).flat().sort(() => Math.random() - 0.5);

  const activeCat = CATS.find(c => c.key === activeCategory);
  const pad = isMobile ? '12px' : '28px 48px';

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Search + Filter bar */}
      <div style={{ padding: isMobile ? '12px 12px 12px' : '18px 48px', position:'sticky', top:60, zIndex:50,
        background:'rgba(245,247,242,.96)', backdropFilter:'blur(16px)',
        borderBottom:'1px solid rgba(60,100,40,.1)', boxShadow:'0 2px 8px rgba(20,50,10,.04)' }}>
        <form onSubmit={handleSearch} style={{ display:'flex', gap:8 }}>
          <div style={{ flex:1, display:'flex', alignItems:'center',
            background:'#fff', borderRadius:14,
            border: `1.5px solid ${searchFocus ? '#4e9e2a' : 'rgba(60,100,40,.12)'}`,
            boxShadow: searchFocus ? '0 0 0 3px rgba(78,158,42,.1)' : '0 1px 4px rgba(20,50,10,.06)',
            transition:'all .2s', overflow:'hidden' }}>
            <span style={{ padding:'0 12px', fontSize:16, color:'#afc09e' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
              placeholder="Search products, farmers..."
              style={{ flex:1, border:'none', outline:'none', background:'transparent', padding:'12px 0', color:'#1a2415', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:14 }} />
            {search && <button type="button" onClick={() => { setSearch(''); setSearchResults(null); }}
              style={{ padding:'0 12px', background:'none', border:'none', color:'#afc09e', cursor:'pointer', fontSize:16 }}>✕</button>}
          </div>
          <button type="submit" style={{ background:'#4e9e2a', border:'none', borderRadius:14, padding:'12px 18px', color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 2px 8px rgba(78,158,42,.3)' }}>
            {isMobile ? '🔍' : 'Search'}
          </button>
          {/* Filter button */}
          <button type="button" onClick={() => setShowFilters(f => !f)}
            style={{ background: activeFilters ? '#4e9e2a' : '#fff', border: activeFilters ? 'none' : '1.5px solid rgba(60,100,40,.15)', borderRadius:14, padding:'12px 16px', color: activeFilters ? '#fff' : '#4e9e2a', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 1px 4px rgba(20,50,10,.06)', display:'flex', alignItems:'center', gap:6 }}>
            {isMobile ? '⚙️' : '⚙️ Filters'}{activeFilters && !isMobile ? ' ●' : ''}
          </button>
        </form>

        {/* Filter panel */}
        {showFilters && (
          <div style={{ marginTop:12, background:'#fff', borderRadius:16, padding:'16px 20px', border:'1px solid rgba(60,100,40,.12)', boxShadow:'0 4px 16px rgba(20,50,10,.08)', display:'flex', flexWrap:'wrap', gap:14, alignItems:'flex-end' }}>
            {/* Location filter */}
            <div style={{ flex:1, minWidth:160 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#7a9070', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>📍 Location</div>
              <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
                style={{ width:'100%', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:10, padding:'9px 12px', color:'#1a2415', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, outline:'none', background:'#f9faf7', cursor:'pointer' }}>
                <option value="">All Districts</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            {/* Price range */}
            <div style={{ flex:1, minWidth:120 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#7a9070', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>৳ Min Price</div>
              <input type="number" value={filterMinPrice} onChange={e => setFilterMinPrice(e.target.value)}
                placeholder="0" min="0"
                style={{ width:'100%', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:10, padding:'9px 12px', color:'#1a2415', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, outline:'none', background:'#f9faf7', boxSizing:'border-box' }} />
            </div>
            <div style={{ flex:1, minWidth:120 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#7a9070', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>৳ Max Price</div>
              <input type="number" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)}
                placeholder="Any" min="0"
                style={{ width:'100%', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:10, padding:'9px 12px', color:'#1a2415', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, outline:'none', background:'#f9faf7', boxSizing:'border-box' }} />
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={applyFilters}
                style={{ background:'#4e9e2a', border:'none', borderRadius:10, padding:'9px 18px', color:'#fff', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>Apply</button>
              {activeFilters && (
                <button onClick={clearFilters}
                  style={{ background:'#fde8e8', border:'none', borderRadius:10, padding:'9px 14px', color:'#c04040', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, cursor:'pointer' }}>Clear</button>
              )}
            </div>
          </div>
        )}

        {/* Active filter pills */}
        {activeFilters && (
          <div style={{ display:'flex', gap:8, marginTop:10, flexWrap:'wrap' }}>
            {filterLocation && <span style={{ background:'#e8f5e1', color:'#3a7d1e', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:99, display:'flex', alignItems:'center', gap:4 }}>📍 {filterLocation} <button onClick={() => setFilterLocation('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#3a7d1e', fontSize:11, padding:0, lineHeight:1 }}>✕</button></span>}
            {filterMinPrice && <span style={{ background:'#e8f5e1', color:'#3a7d1e', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:99, display:'flex', alignItems:'center', gap:4 }}>৳≥{filterMinPrice} <button onClick={() => setFilterMinPrice('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#3a7d1e', fontSize:11, padding:0, lineHeight:1 }}>✕</button></span>}
            {filterMaxPrice && <span style={{ background:'#e8f5e1', color:'#3a7d1e', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:99, display:'flex', alignItems:'center', gap:4 }}>৳≤{filterMaxPrice} <button onClick={() => setFilterMaxPrice('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#3a7d1e', fontSize:11, padding:0, lineHeight:1 }}>✕</button></span>}
          </div>
        )}
      </div>

      <div style={{ padding: pad }}>

        {/* Category Cards — no icons, photo backgrounds only */}
        {!searchResults && !showRecommended && (
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#7a9070', marginBottom:14, textTransform:'uppercase', letterSpacing:'.08em' }}>Shop by Category</div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(7, 1fr)', gap: isMobile ? 10 : 14 }}>
              {CATS.map((cat, i) => (
                <div key={cat.key} onClick={() => handleCategoryClick(cat.key)}
                  style={{ borderRadius: isMobile ? 16 : 18, overflow:'hidden', cursor:'pointer', position:'relative', height: isMobile ? 90 : 110,
                    border: `2px solid ${activeCategory === cat.key ? cat.color : 'transparent'}`,
                    boxShadow: activeCategory === cat.key ? `0 4px 16px ${cat.color}33` : '0 2px 8px rgba(20,50,10,.08)',
                    transition:'all .25s cubic-bezier(.22,1,.36,1)',
                    transform: activeCategory === cat.key ? 'scale(1.04)' : 'scale(1)',
                    animation:`fadeUp .4s ${i*.04}s cubic-bezier(.22,1,.36,1) both`,
                  }}>
                  {/* Photo background — no icons */}
                  <img src={cat.img} alt={cat.label} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
                  {/* Gradient overlay */}
                  <div style={{ position:'absolute', inset:0, background: activeCategory === cat.key
                    ? `linear-gradient(160deg,${cat.color}88,${cat.color}cc)`
                    : 'linear-gradient(160deg,rgba(10,30,5,.25),rgba(10,30,5,.6))' }} />
                  {/* Label only — no emoji icon */}
                  <div style={{ position:'absolute', bottom:0, left:0, right:0, padding: isMobile ? '6px 8px' : '8px 10px' }}>
                    <div style={{ fontSize: isMobile ? 10 : 12, fontWeight:800, color:'#fff', lineHeight:1.2, textShadow:'0 1px 4px rgba(0,0,0,.5)' }}>{cat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Recommended For You view ── */}
        {/* FIX: when navigated from home page "View All Recommended", show this section */}
        {showRecommended && !searchResults && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontSize:18, fontWeight:800, color:'#1a2415' }}>⭐ Recommended For You</div>
              <button onClick={() => setShowRecommended(false)} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.15)', borderRadius:99, padding:'7px 16px', fontSize:12, fontWeight:600, color:'#7a9070', cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', boxShadow:'0 1px 4px rgba(20,50,10,.06)' }}>← Browse All</button>
            </div>
            {loading ? (
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12 }}>
                {[...Array(8)].map((_,i) => <div key={i} style={{ height:260, borderRadius:18, backgroundImage:'linear-gradient(90deg,#e8ede4 25%,#f0f4ec 50%,#e8ede4 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }} />)}
                <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
              </div>
            ) : recommendedProducts.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#7a9070', fontSize:15 }}>No products available yet.</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12 }}>
                {recommendedProducts.map(p => <FullCard key={p._id} product={p} />)}
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:800, color:'#1a2415' }}>
                {searching ? 'Searching...' : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} for "${search}"`}
              </div>
              <button onClick={() => { setSearchResults(null); setSearch(''); }} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.15)', borderRadius:99, padding:'7px 16px', fontSize:12, fontWeight:600, color:'#7a9070', cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', boxShadow:'0 1px 4px rgba(20,50,10,.06)' }}>← Back</button>
            </div>
            {searching ? (
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12 }}>
                {[...Array(8)].map((_,i) => <div key={i} style={{ height:260, borderRadius:18, backgroundImage:'linear-gradient(90deg,#e8ede4 25%,#f0f4ec 50%,#e8ede4 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }} />)}
                <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#7a9070', fontSize:15 }}>No products found for "{search}"</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12 }}>
                {searchResults.map(p => <FullCard key={p._id} product={p} />)}
              </div>
            )}
          </div>
        )}

        {/* Category filtered view */}
        {activeCategory && !searchResults && !showRecommended && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <button onClick={() => { setActiveCategory(null); setFiltered([]); }} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.15)', borderRadius:99, padding:'7px 16px', fontSize:12, fontWeight:600, color:'#7a9070', cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', boxShadow:'0 1px 4px rgba(20,50,10,.06)' }}>← All</button>
              <span style={{ fontSize:18, fontWeight:800, color:'#1a2415' }}>{activeCat?.label}</span>
              <span style={{ fontSize:13, color:'#7a9070' }}>({filtered.length} products)</span>
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'#7a9070' }}>No products in this category yet.</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12 }}>
                {filtered.map(p => <FullCard key={p._id} product={p} />)}
              </div>
            )}
          </div>
        )}

        {/* All sections (default) */}
        {!activeCategory && !searchResults && !showRecommended && (
          <div>
            {loading ? (
              <div style={{ display:'flex', gap:10, overflow:'hidden' }}>
                {[...Array(5)].map((_,i) => <div key={i} style={{ width:158, height:210, borderRadius:18, flexShrink:0, backgroundImage:'linear-gradient(90deg,#e8ede4 25%,#f0f4ec 50%,#e8ede4 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }} />)}
                <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
              </div>
            ) : (
              CATS.map(cat => (
                <ProductRow key={cat.key} title={cat.label} products={allProducts[cat.key] || []} onViewAll={() => handleCategoryClick(cat.key)} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Full card (search/filter views) ── */
function FullCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isMobile } = useResponsive();
  const [added, setAdded] = useState(false);
  const [hover, setHover] = useState(false);
  const savings = product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/products/${product._id}`)}
      style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:18, overflow:'hidden',
        display:'flex', flexDirection:'column', cursor:'pointer',
        boxShadow: hover ? '0 10px 28px rgba(20,50,10,.12)' : '0 2px 8px rgba(20,50,10,.06)',
        transform: hover ? 'translateY(-4px)' : 'translateY(0)',
        transition:'all .25s cubic-bezier(.22,1,.36,1)',
        animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both',
      }}>
      <div style={{ height: isMobile ? 130 : 170, background:'#f0f4ec', position:'relative', overflow:'hidden' }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover', transform: hover ? 'scale(1.06)' : 'scale(1)', transition:'transform .4s ease' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:50 }}>🌿</div>
        }
        {savings > 0 && <span style={{ position:'absolute', top:8, left:8, background:'#4e9e2a', color:'#fff', fontSize:9, fontWeight:700, padding:'3px 9px', borderRadius:99 }}>SAVE {savings}%</span>}
        <button onClick={e => { e.stopPropagation(); addToCart(product,1); setAdded(true); setTimeout(()=>setAdded(false),1500); }}
          style={{ position:'absolute', bottom:8, right:8, width:30, height:30, borderRadius:'50%',
            background: added ? '#4e9e2a' : '#fff', border: added ? 'none' : '1px solid rgba(60,100,40,.2)',
            color: added ? '#fff' : '#4e9e2a', fontSize:16, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700,
            boxShadow:'0 2px 6px rgba(0,0,0,.1)', transition:'all .2s',
          }}>{added ? '✓' : '+'}</button>
      </div>
      <div style={{ padding:'11px 13px 14px', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ fontSize:9, color:'#afc09e', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:3, fontWeight:700 }}>{product.category}</div>
        <div style={{ fontSize: isMobile ? 13 : 15, fontWeight:800, color:'#1a2415', marginBottom:3, lineHeight:1.3 }}>{product.name}</div>
        <div style={{ fontSize:11, color:'#7a9070', marginBottom:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {product.farmer?.farmName || product.farmer?.name}{product.farmer?.location?.district ? ` · ${product.farmer.location.district}` : ''}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
          <div style={{ fontSize: isMobile ? 15 : 18, fontWeight:800, color:'#4e9e2a' }}>৳{product.price}<span style={{ fontSize:10, color:'#7a9070', fontWeight:400 }}>/{product.unit}</span></div>
          {product.marketPrice > product.price && <div style={{ fontSize:11, color:'#afc09e', textDecoration:'line-through' }}>৳{product.marketPrice}</div>}
        </div>
      </div>
    </div>
  );
}