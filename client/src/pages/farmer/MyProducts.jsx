import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';

export default function MyProducts() {
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

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif', padding:'24px 16px 40px' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ maxWidth:800, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}>
          <div>
            <div style={{ fontSize:12, fontWeight:700, color:'#4e9e2a', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6 }}>My Listings</div>
            <div style={{ fontSize:22, fontWeight:800, color:'#1a2415', letterSpacing:'-0.03em' }}>My Products</div>
          </div>
          <Link to="/dashboard/add" style={{ background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', border:'none', borderRadius:14, padding:'11px 20px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:14, cursor:'pointer', textDecoration:'none', boxShadow:'0 2px 8px rgba(78,158,42,.3)' }}>+ Add Product</Link>
        </div>

        {loading ? (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[...Array(4)].map((_,i) => <div key={i} style={{ height:88, borderRadius:18, backgroundImage:'linear-gradient(90deg,#e8ede4 25%,#f0f4ec 50%,#e8ede4 75%)', backgroundSize:'400px 100%', animation:'shimmer 1.4s infinite' }} />)}
            <style>{`@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`}</style>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div style={{ fontSize:52, marginBottom:16 }}>🌿</div>
            <div style={{ fontSize:18, fontWeight:800, color:'#1a2415', marginBottom:8 }}>No products yet</div>
            <div style={{ fontSize:13, color:'#7a9070', marginBottom:24 }}>Start listing your farm produce</div>
            <Link to="/dashboard/add" style={{ background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', textDecoration:'none', borderRadius:99, padding:'12px 28px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:14, boxShadow:'0 4px 12px rgba(78,158,42,.3)' }}>Add Your First Product</Link>
          </div>
        ) : (
          products.map((p, idx) => (
            <div key={p._id} style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:18, padding:14, marginBottom:10, display:'flex', gap:14, alignItems:'center', boxShadow:'0 2px 8px rgba(20,50,10,.05)', animation:`fadeUp .4s ${idx*.04}s cubic-bezier(.22,1,.36,1) both` }}>
              <img src={p.images?.[0]||'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100'} alt={p.name}
                style={{ width:64, height:64, borderRadius:14, objectFit:'cover', flexShrink:0, background:'#f0f4ec' }}
                onError={e => e.target.src='https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100'} />
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <div style={{ fontSize:15, fontWeight:800, color:'#1a2415', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                  <span style={{ background:'#e8f5e1', color:'#4e9e2a', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:99, flexShrink:0 }}>{p.category}</span>
                </div>
                <div style={{ fontSize:13, color:'#4e9e2a', fontWeight:800, marginBottom:4 }}>৳{p.price}/{p.unit} <span style={{ fontSize:11, color:'#7a9070', fontWeight:400 }}>· {p.stock} in stock</span></div>
                <div style={{ display:'flex', gap:8 }}>
                  <Link to={`/dashboard/edit/${p._id}`} style={{ background:'#e8f5e1', color:'#4e9e2a', textDecoration:'none', borderRadius:8, padding:'5px 12px', fontSize:12, fontWeight:700, fontFamily:'Plus Jakarta Sans,sans-serif' }}>Edit</Link>
                  <button onClick={() => handleDelete(p._id)} style={{ background:'#fde8e8', color:'#c04040', border:'none', borderRadius:8, padding:'5px 12px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>Delete</button>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ width:10, height:10, borderRadius:'50%', background: p.stock>0?'#4e9e2a':'#c04040', marginLeft:'auto', marginBottom:4 }} />
                <div style={{ fontSize:10, color:'#7a9070', fontWeight:600 }}>{p.stock>0?'In Stock':'Out'}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
