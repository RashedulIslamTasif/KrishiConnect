import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useResponsive } from '../hooks/useResponsive.js';

export default function FarmerMap() {
  const { isMobile } = useResponsive();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    api.get('/auth/farmers').then(r => {
      const d = r.data;
      setFarmers(Array.isArray(d) ? d : d.farmers || []);
    }).catch(() => setFarmers([])).finally(() => setLoading(false));
  }, []);

  const filtered = farmers.filter(f =>
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.farmName?.toLowerCase().includes(search.toLowerCase()) ||
    f.location?.district?.toLowerCase().includes(search.toLowerCase())
  );

  const pad = isMobile ? '16px 12px' : '32px 48px';

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif', padding: pad }}>
      <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight:700, color:'#1a2415', marginBottom:4 }}>Find Farmers</h1>
      <p style={{ fontSize:13, color:'#7a9070', marginBottom:20 }}>Browse all farmers on KrishiConnect</p>

      <input style={{ width:'100%', background:'#fff', border:'1px solid rgba(60,100,40,.12)', borderRadius:12, padding:'12px 16px', color:'#1a2415', fontSize:14, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box', marginBottom:20 }}
        placeholder="Search by name, farm or district..."
        value={search} onChange={e => setSearch(e.target.value)} />

      {loading ? <div style={{ textAlign:'center', color:'#7a9070', padding:'60px 0' }}>Loading farmers...</div>
      : filtered.length === 0 ? <div style={{ textAlign:'center', color:'#7a9070', padding:'60px 0' }}>No farmers found.</div>
      : (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fill, minmax(260px, 1fr))', gap: isMobile ? 10 : 20 }}>
          {filtered.map(f => (
            <Link key={f._id} to={`/farmer/${f._id}`} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.12)', borderRadius:16, padding: isMobile ? 14 : 24, textDecoration:'none', color:'inherit', display:'block' }}>
              <div style={{ width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, borderRadius:'50%', background:'rgba(90,176,48,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile ? 18 : 22, fontWeight:700, color:'#4e9e2a', marginBottom:12, overflow:'hidden', flexShrink:0 }}>
                {f.avatar
                  ? <img src={f.avatar} alt={f.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : f.name?.[0]?.toUpperCase() || 'F'
                }
              </div>
              <div style={{ fontSize: isMobile ? 13 : 15, fontWeight:600, color:'#1a2415', marginBottom:2 }}>{f.name}</div>
              {f.farmName && <div style={{ fontSize: isMobile ? 11 : 13, color:'#4e9e2a', marginBottom:4 }}>{f.farmName}</div>}
              <div style={{ fontSize: isMobile ? 11 : 13, color:'#7a9070', marginBottom:10 }}>📍 {f.location?.district || 'Bangladesh'}</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                <span style={{ background:'rgba(90,176,48,.12)', color:'#4e9e2a', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99 }}>View</span>
                {f.isVerified && <span style={{ background:'rgba(29,158,117,.12)', color:'#1d9e75', fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:99 }}>✓ Verified</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}