import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import ProductCard from '../components/ProductCard.jsx';
import { useResponsive } from '../hooks/useResponsive.js';

const CATS = ['All','vegetables','fruits','fish','poultry','grains','dairy','spices'];
const CAT_ICONS = { All:'🌿', vegetables:'🥦', fruits:'🍌', fish:'🐟', poultry:'🐔', grains:'🌾', dairy:'🥛', spices:'🌶️' };

export default function Marketplace() {
  const { isMobile } = useResponsive();
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [category, setCategory]     = useState('All');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchProducts(); }, [category, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (category !== 'All') params.category = category;
      if (search) params.search = search;
      const { data } = await api.get('/products', { params });
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const cols = isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(240px, 1fr))';
  const pad  = isMobile ? '16px 12px' : '36px 48px';

  return (
    <div style={{ minHeight: '100vh', padding: pad }}>

      {/* Header */}
      <div style={{ marginBottom: isMobile ? 16 : 28 }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--green-lt)', marginBottom: 6 }}>Fresh Listings</div>
        <h1 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: isMobile ? 12 : 0 }}>Today's harvest</h1>
      </div>

      {/* Search bar — full width on mobile */}
      <form onSubmit={e => { e.preventDefault(); setPage(1); fetchProducts(); }}
        style={{ display: 'flex', gap: 8, marginBottom: isMobile ? 16 : 24 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          style={{ flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '11px 16px', color: 'var(--white)', fontFamily: 'Sora,sans-serif', fontSize: 14, outline: 'none' }}
        />
        <button type="submit" style={{ background: 'var(--green-hi)', border: 'none', borderRadius: 12, padding: '11px 18px', color: '#fff', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>Search</button>
      </form>

      {/* Category pills — horizontal scroll on mobile */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: isMobile ? 16 : 28, scrollbarWidth: 'none' }}>
        {CATS.map(cat => (
          <button key={cat} onClick={() => { setCategory(cat); setPage(1); }}
            style={{ padding: isMobile ? '7px 14px' : '8px 18px', borderRadius: 99, fontSize: isMobile ? 12 : 13, fontWeight: 500, fontFamily: 'Sora,sans-serif', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all .18s', background: category === cat ? 'var(--green-hi)' : 'transparent', border: category === cat ? '1px solid var(--green-hi)' : '1px solid var(--border)', color: category === cat ? '#fff' : 'var(--muted)' }}>
            {CAT_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Product grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: isMobile ? 10 : 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ background: 'var(--card)', borderRadius: 20, height: isMobile ? 260 : 320, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontSize: 15 }}>No products found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: isMobile ? 10 : 16 }}>
          {products.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32, flexWrap: 'wrap' }}>
          {[...Array(totalPages)].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: page === i + 1 ? 'var(--green-hi)' : 'transparent', color: page === i + 1 ? '#fff' : 'var(--muted)', cursor: 'pointer', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 13 }}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
