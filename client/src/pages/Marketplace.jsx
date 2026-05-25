import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import ProductCard from '../components/ProductCard.jsx';

const CATS = ['All', 'vegetables', 'fruits', 'fish', 'poultry', 'grains', 'dairy', 'spices'];
const CAT_ICONS = { All:'🌿', vegetables:'🥦', fruits:'🍌', fish:'🐟', poultry:'🐔', grains:'🌾', dairy:'🥛', spices:'🌶️' };

export default function Marketplace() {
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [category, setCategory]     = useState('All');
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [category, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (category !== 'All') params.category = category;
      if (search) params.search = search;
      const { data } = await api.get('/products', { params });
      setProducts(data.products);
      setTotalPages(data.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  return (
    <div style={{ minHeight: '100vh', padding: '48px 56px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--green-lt)', marginBottom: 8 }}>Fresh Listings</div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <h1 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em' }}>Today's harvest</h1>
          {/* Search */}
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 18px', color: 'var(--white)', fontFamily: 'Sora,sans-serif', fontSize: 13, outline: 'none', width: 240 }}
            />
            <button type="submit" style={{ background: 'var(--green-hi)', border: 'none', borderRadius: 12, padding: '10px 20px', color: '#fff', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Search</button>
          </form>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 36 }}>
        {CATS.map(cat => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPage(1); }}
            style={{
              padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 500,
              fontFamily: 'Sora,sans-serif', cursor: 'pointer', transition: 'all .18s',
              background:   category === cat ? 'var(--green-hi)' : 'transparent',
              border:       category === cat ? '1px solid var(--green-hi)' : '1px solid var(--border)',
              color:        category === cat ? '#fff' : 'var(--muted)',
            }}
          >
            {CAT_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ height: 340, background: 'var(--card)', borderRadius: 20, border: '1px solid var(--border)', opacity: 0.5 }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🌾</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No products found</div>
          <div style={{ fontSize: 14, color: 'var(--muted)' }}>Try a different category or search term</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {products.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              style={{
                width: 38, height: 38, borderRadius: 10, border: '1px solid var(--border)',
                fontFamily: 'Sora,sans-serif', fontWeight: 500, fontSize: 13, cursor: 'pointer',
                background: page === i + 1 ? 'var(--green-hi)' : 'var(--card)',
                color:      page === i + 1 ? '#fff' : 'var(--muted)',
                transition: 'all .18s',
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
