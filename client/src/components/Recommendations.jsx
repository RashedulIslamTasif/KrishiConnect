import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import ProductCard from './ProductCard.jsx';

/**
 * Recommendations — drop into Home or Marketplace
 * Props: userId (string)
 */
export default function Recommendations({ userId }) {
  const [products,  setProducts]  = useState([]);
  const [basedOn,   setBasedOn]   = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!userId) return;
    api.get(`/analytics/recommendations/${userId}`)
      .then(({ data }) => {
        setProducts(data.recommended);
        setBasedOn(data.basedOn);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div style={{ padding: '48px 56px' }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: '#4e9e2a', marginBottom: 8 }}>Recommended</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{ height: 310, background: '#fff', borderRadius: 20, border: '1px solid rgba(60,100,40,.12)', opacity: 0.4, animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    </div>
  );

  if (products.length === 0) return null;

  return (
    <div style={{ padding: '0 56px 64px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: '#4e9e2a', marginBottom: 8 }}>
            🎯 Just for You
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em' }}>Recommended Products</h2>
          {basedOn.length > 0 && (
            <div style={{ fontSize: 12, color: '#7a9070', marginTop: 4 }}>
              Based on your interest in: {basedOn.map(c => <span key={c} style={{ marginRight: 6, color: '#4e9e2a' }}>{c}</span>)}
            </div>
          )}
        </div>
        <Link to="/marketplace" style={{ fontSize: 13, color: '#7a9070', textDecoration: 'none', border: '1px solid rgba(60,100,40,.12)', padding: '8px 18px', borderRadius: 99, transition: 'all .2s' }}>
          View all →
        </Link>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {products.slice(0, 4).map(p => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </div>
  );
}
