import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useCart } from '../context/CartContext.jsx';
import { useResponsive } from '../hooks/useResponsive.js';

const CATS = [
  { key:'vegetables', label:'Fresh Vegetables', bg:'rgba(90,176,48,.15)',  color:'var(--green-lt)', img:'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=60' },
  { key:'fruits',     label:'Fruits',           bg:'rgba(240,184,64,.15)', color:'#f0b840',         img:'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=60' },
  { key:'fish',       label:'Fish',             bg:'rgba(29,158,117,.15)', color:'#1d9e75',         img:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&q=60' },
  { key:'poultry',    label:'Poultry & Eggs',   bg:'rgba(212,144,10,.15)', color:'var(--amber-lt)', img:'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=300&q=60' },
  { key:'grains',     label:'Grains & Rice',    bg:'rgba(180,140,80,.15)', color:'#d4a060',         img:'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=300&q=60' },
  { key:'dairy',      label:'Dairy',            bg:'rgba(200,200,240,.12)',color:'#aab4e8',         img:'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=60' },
  { key:'spices',     label:'Spices',           bg:'rgba(224,85,85,.15)',  color:'#e07070',         img:'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=60' },
];

function MiniCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const savings = product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;

  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', flexShrink:0, width:160, cursor:'pointer' }}
      onClick={() => navigate(`/products/${product._id}`)}>
      <div style={{ height:120, background:'var(--card2)', position:'relative', overflow:'hidden' }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44 }}>🥦</div>
        }
        {savings > 0 && <span style={{ position:'absolute', top:6, left:6, background:'var(--green-hi)', color:'#fff', fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:99 }}>SAVE {savings}%</span>}
        <button onClick={e => { e.stopPropagation(); addToCart(product, 1); setAdded(true); setTimeout(() => setAdded(false), 1500); }}
          style={{ position:'absolute', bottom:6, right:6, width:28, height:28, borderRadius:'50%', background: added ? 'var(--green-lt)' : 'var(--green-hi)', border:'none', color:'#fff', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
          {added ? '✓' : '+'}
        </button>
      </div>
      <div style={{ padding:'10px 10px 12px' }}>
        <div style={{ fontSize:12, fontWeight:600, color:'var(--white)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{product.name}</div>
        <div style={{ fontSize:10, color:'var(--muted)', marginBottom:6 }}>{product.farmer?.location?.district || 'Bangladesh'}</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--green-lt)' }}>৳{product.price}<span style={{ fontSize:10, color:'var(--muted)', fontWeight:400 }}>/{product.unit}</span></div>
          {product.marketPrice > product.price && <div style={{ fontSize:10, color:'var(--muted)', textDecoration:'line-through' }}>৳{product.marketPrice}</div>}
        </div>
      </div>
    </div>
  );
}

function ProductRow({ title, products, onViewAll }) {
  const rowRef = useRef(null);
  if (!products?.length) return null;
  return (
    <div style={{ marginBottom:32 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <span style={{ fontSize:16, fontWeight:700, color:'var(--white)' }}>{title}</span>
        <button onClick={onViewAll} style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:99, padding:'5px 14px', fontSize:12, color:'var(--green-lt)', cursor:'pointer', fontFamily:'Sora,sans-serif', whiteSpace:'nowrap' }}>
          View All →
        </button>
      </div>
      <div ref={rowRef} style={{ display:'flex', gap:10, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none', msOverflowStyle:'none' }}>
        <style>{`div::-webkit-scrollbar{display:none}`}</style>
        {products.map(p => <MiniCard key={p._id} product={p} />)}
      </div>
    </div>
  );
}

export default function Marketplace() {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  const [allProducts,    setAllProducts]    = useState({});
  const [filtered,       setFiltered]       = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [search,         setSearch]         = useState('');
  const [searchResults,  setSearchResults]  = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [searching,      setSearching]      = useState(false);

  useEffect(() => { loadAll(); }, []);

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
    setActiveCategory(cat);
    setSearchResults(null);
    setSearch('');
    try {
      const { data } = await api.get('/products', { params: { category: cat, limit: 40 } });
      setFiltered(data.products || []);
    } catch (e) { console.error(e); }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!search.trim()) { setSearchResults(null); setActiveCategory(null); return; }
    setSearching(true);
    try {
      const { data } = await api.get('/products', { params: { search: search.trim(), limit: 40 } });
      setSearchResults(data.products || []);
      setActiveCategory(null);
    } catch (e) { console.error(e); }
    finally { setSearching(false); }
  };

  const pad = isMobile ? '12px' : '36px 48px';
  const activeCat = CATS.find(c => c.key === activeCategory);

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)' }}>

      {/* Search bar */}
      <div style={{ padding: isMobile ? '12px 12px 0' : '24px 48px 0', position:'sticky', top:56, zIndex:50, background:'var(--bg)', borderBottom:'1px solid var(--border)', paddingBottom:12 }}>
        <form onSubmit={handleSearch} style={{ display:'flex', gap:8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search products, farmers..."
            style={{ flex:1, background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, padding:'11px 16px', color:'var(--white)', fontFamily:'Sora,sans-serif', fontSize:14, outline:'none' }} />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchResults(null); }}
              style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:12, padding:'11px 14px', color:'var(--muted)', cursor:'pointer', fontFamily:'Sora,sans-serif', fontSize:13 }}>✕</button>
          )}
          <button type="submit" style={{ background:'var(--green-hi)', border:'none', borderRadius:12, padding:'11px 18px', color:'#fff', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:14, cursor:'pointer', whiteSpace:'nowrap' }}>
            🔍{!isMobile && ' Search'}
          </button>
        </form>
      </div>

      <div style={{ padding: pad }}>

        {/* Category Cards — no icons */}
        {!searchResults && (
          <div style={{ marginBottom:28 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'var(--muted)', marginBottom:14, textTransform:'uppercase', letterSpacing:'.08em' }}>Shop by Category</div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(7, 1fr)', gap: isMobile ? 10 : 14 }}>
              {CATS.map(cat => (
                <div key={cat.key} onClick={() => handleCategoryClick(cat.key)}
                  style={{ background: activeCategory === cat.key ? cat.bg : 'var(--card)', border: `2px solid ${activeCategory === cat.key ? cat.color : 'var(--border)'}`, borderRadius: isMobile ? 14 : 16, padding: isMobile ? '14px 8px' : '20px 12px', textAlign:'center', cursor:'pointer', transition:'all .2s', overflow:'hidden', position:'relative', minHeight: isMobile ? 64 : 80 }}>
                  <div style={{ position:'absolute', inset:0, backgroundImage:`url(${cat.img})`, backgroundSize:'cover', backgroundPosition:'center', opacity: activeCategory === cat.key ? 0.25 : 0.12, borderRadius: isMobile ? 12 : 14 }} />
                  <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
                    <div style={{ fontSize: isMobile ? 11 : 13, fontWeight:600, color: activeCategory === cat.key ? cat.color : 'var(--white)', lineHeight:1.3 }}>{cat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ fontSize:16, fontWeight:700, color:'var(--white)' }}>
                {searching ? 'Searching...' : `${searchResults.length} results for "${search}"`}
              </div>
              <button onClick={() => { setSearchResults(null); setSearch(''); }} style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:99, padding:'6px 14px', fontSize:12, color:'var(--muted)', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>← Back</button>
            </div>
            {searching ? (
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12 }}>
                {[...Array(8)].map((_,i) => <div key={i} style={{ height:260, background:'var(--card)', borderRadius:14, opacity:0.5 }} />)}
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'var(--muted)' }}>No products found for "{search}"</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12 }}>
                {searchResults.map(p => <FullCard key={p._id} product={p} />)}
              </div>
            )}
          </div>
        )}

        {/* Category filtered view */}
        {activeCategory && !searchResults && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <button onClick={() => { setActiveCategory(null); setFiltered([]); }} style={{ background:'transparent', border:'1px solid var(--border)', borderRadius:99, padding:'6px 14px', fontSize:12, color:'var(--muted)', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>← All</button>
              <span style={{ fontSize:18, fontWeight:700, color:'var(--white)' }}>{activeCat?.label}</span>
              <span style={{ fontSize:13, color:'var(--muted)' }}>({filtered.length} products)</span>
            </div>
            {filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:'60px 0', color:'var(--muted)' }}>No products in this category yet.</div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap:12 }}>
                {filtered.map(p => <FullCard key={p._id} product={p} />)}
              </div>
            )}
          </div>
        )}

        {/* All sections home view */}
        {!activeCategory && !searchResults && (
          <div>
            {loading ? (
              <div style={{ display:'flex', gap:10, overflowX:'hidden' }}>
                {[...Array(5)].map((_,i) => <div key={i} style={{ width:160, height:220, background:'var(--card)', borderRadius:14, flexShrink:0, opacity:0.5 }} />)}
              </div>
            ) : (
              CATS.map(cat => (
                <ProductRow
                  key={cat.key}
                  title={cat.label}
                  products={allProducts[cat.key] || []}
                  onViewAll={() => handleCategoryClick(cat.key)}
                />
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function FullCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isMobile } = useResponsive();
  const [added, setAdded] = useState(false);
  const savings = product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;

  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, overflow:'hidden', display:'flex', flexDirection:'column', cursor:'pointer' }}
      onClick={() => navigate(`/products/${product._id}`)}>
      <div style={{ height: isMobile ? 130 : 170, background:'var(--card2)', position:'relative' }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:50 }}>🥦</div>
        }
        {savings > 0 && <span style={{ position:'absolute', top:7, left:7, background:'var(--green-hi)', color:'#fff', fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:99 }}>SAVE {savings}%</span>}
        <button onClick={e => { e.stopPropagation(); addToCart(product,1); setAdded(true); setTimeout(()=>setAdded(false),1500); }}
          style={{ position:'absolute', bottom:7, right:7, width:30, height:30, borderRadius:'50%', background: added ? 'var(--green-lt)' : 'var(--green-hi)', border:'none', color:'#fff', fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
          {added ? '✓' : '+'}
        </button>
      </div>
      <div style={{ padding:'10px 12px 14px', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ fontSize:9, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:3 }}>{product.category}</div>
        <div style={{ fontSize: isMobile ? 13 : 14, fontWeight:600, color:'var(--white)', marginBottom:2, lineHeight:1.3 }}>{product.name}</div>
        <div style={{ fontSize:11, color:'var(--muted)', marginBottom:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {product.farmer?.farmName || product.farmer?.name} · {product.farmer?.location?.district}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:'auto' }}>
          <div style={{ fontSize: isMobile ? 15 : 17, fontWeight:700, color:'var(--green-lt)' }}>৳{product.price}<span style={{ fontSize:10, color:'var(--muted)', fontWeight:400 }}>/{product.unit}</span></div>
          {product.marketPrice > product.price && <div style={{ fontSize:11, color:'var(--muted)', textDecoration:'line-through' }}>৳{product.marketPrice}</div>}
        </div>
      </div>
    </div>
  );
}
