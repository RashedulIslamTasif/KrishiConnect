import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';

const s = {
  page: { minHeight: '100vh', padding: '32px 48px', maxWidth: 1200, margin: '0 auto' },
  title: { fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--white)', marginBottom: 8 },
  sub: { fontSize: 14, color: 'var(--muted)', marginBottom: 28 },
  search: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 18px', color: 'var(--white)', fontSize: 14, outline: 'none', width: '100%', maxWidth: 380, marginBottom: 28, fontFamily: 'Sora,sans-serif', boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 },
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textDecoration: 'none', color: 'inherit', display: 'block' },
  avatar: { width: 56, height: 56, borderRadius: '50%', background: 'rgba(90,176,48,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16, fontWeight: 700, color: 'var(--green-lt)' },
  name: { fontSize: 16, fontWeight: 600, color: 'var(--white)', marginBottom: 2 },
  farm: { fontSize: 13, color: 'var(--green-lt)', marginBottom: 6 },
  loc: { fontSize: 13, color: 'var(--muted)', marginBottom: 12 },
  badge: { display: 'inline-block', background: 'rgba(90,176,48,.15)', color: 'var(--green-lt)', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(90,176,48,.25)' },
  verified: { display: 'inline-block', background: 'rgba(29,158,117,.15)', color: '#1d9e75', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99, border: '1px solid rgba(29,158,117,.25)', marginLeft: 6 },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '80px 0', fontSize: 15 },
};

export default function FarmerMap() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/auth/farmers')
      .then(r => {
        const data = r.data;
        if (Array.isArray(data)) setFarmers(data);
        else if (Array.isArray(data.farmers)) setFarmers(data.farmers);
        else setFarmers([]);
      })
      .catch(() => setFarmers([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = farmers.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.farmName?.toLowerCase().includes(search.toLowerCase()) ||
    f.location?.district?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={s.page}>
      <h1 style={s.title}>Find Farmers</h1>
      <p style={s.sub}>Browse all farmers on KrishiConnect and explore their fresh products.</p>
      <input
        style={s.search}
        placeholder="Search by name, farm or district..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {loading ? (
        <div style={s.empty}>Loading farmers...</div>
      ) : filtered.length === 0 ? (
        <div style={s.empty}>No farmers found matching your search.</div>
      ) : (
        <div style={s.grid}>
          {filtered.map(f => (
            <Link key={f._id} to={`/farmer/${f._id}`} style={s.card}>
              <div style={s.avatar}>{f.name?.[0]?.toUpperCase() || 'F'}</div>
              <div style={s.name}>{f.name}</div>
              {f.farmName && <div style={s.farm}>{f.farmName}</div>}
              <div style={s.loc}>📍 {f.location?.district || f.location?.address || 'Bangladesh'}</div>
              <span style={s.badge}>View Products</span>
              {f.isVerified && <span style={s.verified}>✓ Verified</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
