import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';
import { useResponsive } from '../../hooks/useResponsive.js';

export default function MyProducts() {
  const { isMobile } = useResponsive();
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchProducts = () => {
    setLoading(true);
    api.get('/products/farmer/mine').then(r => {
      const d = r.data;
      setProducts(Array.isArray(d) ? d : d.products || []);
    }).catch(() => setProducts([])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async id => {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`).catch(() => {});
    fetchProducts();
  };

  const pad = isMobile ? '16px 12px' : '36px 48px';

  return (
    <div style={{ minHeight:'100vh', padding: pad }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div style={{ fontSize: isMobile ? 20 : 24, fontWeight:700, color:'var(--white)' }}>My Products</div>
        <Link to="/dashboard/add" style={{ background:'var(--green-hi)', color:'#fff', border:'none', borderRadius:99, padding: isMobile ? '8px 16px' : '10px 22px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize: isMobile ? 13 : 14, cursor:'pointer', textDecoration:'none' }}>+ Add</Link>
      </div>

      {loading ? <div style={{ textAlign:'center', color:'var(--muted)', padding:'60px 0' }}>Loading...</div>
      : products.length === 0 ? <div style={{ textAlign:'center', color:'var(--muted)', padding:'60px 0' }}>No products yet. <Link to="/dashboard/add" style={{ color:'var(--green-lt)' }}>Add your first one</Link></div>
      : isMobile ? (
        // Mobile: card list
        products.map(p => (
          <div key={p._id} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:14, padding:14, marginBottom:10, display:'flex', gap:12, alignItems:'center' }}>
            <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100'} alt={p.name}
              style={{ width:60, height:60, borderRadius:10, objectFit:'cover', flexShrink:0 }}
              onError={e => e.target.src='https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100'} />
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--white)', marginBottom:2 }}>{p.name}</div>
              <div style={{ fontSize:12, color:'var(--green-lt)', marginBottom:6 }}>BDT {p.price}/{p.unit} · {p.stock} in stock</div>
              <div style={{ display:'flex', gap:8 }}>
                <Link to={`/dashboard/edit/${p._id}`} style={{ background:'rgba(90,176,48,.12)', color:'var(--green-lt)', border:'1px solid rgba(90,176,48,.25)', borderRadius:8, padding:'4px 12px', fontSize:12, textDecoration:'none' }}>Edit</Link>
                <button onClick={() => handleDelete(p._id)} style={{ background:'rgba(224,85,85,.12)', color:'#e05555', border:'1px solid rgba(224,85,85,.25)', borderRadius:8, padding:'4px 12px', fontSize:12, cursor:'pointer', fontFamily:'Sora,sans-serif' }}>Delete</button>
              </div>
            </div>
          </div>
        ))
      ) : (
        // Desktop: table
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{['Image','Name','Category','Price','Stock','Actions'].map(h => <th key={h} style={{ textAlign:'left', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', padding:'10px 16px', borderBottom:'1px solid var(--border)' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p._id}>
                  <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
                    <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100'} alt={p.name} style={{ width:48, height:48, borderRadius:10, objectFit:'cover' }} onError={e => e.target.src='https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100'} />
                  </td>
                  <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontSize:14, color:'var(--white)' }}>{p.name}</td>
                  <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontSize:14, color:'var(--white)' }}>{p.category}</td>
                  <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontSize:14, color:'var(--green-lt)' }}>BDT {p.price}/{p.unit}</td>
                  <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontSize:14, color:'var(--white)' }}>{p.stock} {p.unit}</td>
                  <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)' }}>
                    <Link to={`/dashboard/edit/${p._id}`} style={{ background:'rgba(90,176,48,.12)', color:'var(--green-lt)', border:'1px solid rgba(90,176,48,.25)', borderRadius:8, padding:'5px 14px', fontSize:12, textDecoration:'none', marginRight:8, display:'inline-block' }}>Edit</Link>
                    <button onClick={() => handleDelete(p._id)} style={{ background:'rgba(224,85,85,.12)', color:'#e05555', border:'1px solid rgba(224,85,85,.25)', borderRadius:8, padding:'5px 14px', fontSize:12, cursor:'pointer', fontFamily:'Sora,sans-serif' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
