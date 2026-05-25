import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios.js';

const s = {
  page: { minHeight: '100vh', padding: '36px 48px', maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--white)' },
  addBtn: { background: 'var(--green-hi)', color: '#fff', border: 'none', borderRadius: 99, padding: '10px 22px', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', textDecoration: 'none' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', padding: '10px 16px', borderBottom: '1px solid var(--border)' },
  td: { padding: '14px 16px', borderBottom: '1px solid var(--border)', fontSize: 14, color: 'var(--white)', verticalAlign: 'middle' },
  img: { width: 48, height: 48, borderRadius: 10, objectFit: 'cover', background: 'var(--border)' },
  editBtn: { background: 'rgba(90,176,48,.12)', color: 'var(--green-lt)', border: '1px solid rgba(90,176,48,.25)', borderRadius: 8, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'Sora,sans-serif', textDecoration: 'none', marginRight: 8, display: 'inline-block' },
  delBtn: { background: 'rgba(224,85,85,.12)', color: '#e05555', border: '1px solid rgba(224,85,85,.25)', borderRadius: 8, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'Sora,sans-serif' },
  empty: { textAlign: 'center', color: 'var(--muted)', padding: '60px 0' },
};

export default function MyProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchProducts = () => {
    setLoading(true);
    api.get('/products/farmer/mine')
      .then(r => {
        const d = r.data;
        if (Array.isArray(d)) setProducts(d);
        else if (Array.isArray(d.products)) setProducts(d.products);
        else setProducts([]);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async id => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    await api.delete(`/products/${id}`).catch(() => {});
    fetchProducts();
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.title}>My Products</div>
        <Link to="/dashboard/add" style={s.addBtn}>+ Add Product</Link>
      </div>
      {loading ? <div style={s.empty}>Loading...</div> : products.length === 0 ? (
        <div style={s.empty}>No products yet. <Link to="/dashboard/add" style={{ color: 'var(--green-lt)' }}>Add your first one</Link></div>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Image</th>
              <th style={s.th}>Name</th>
              <th style={s.th}>Category</th>
              <th style={s.th}>Price</th>
              <th style={s.th}>Stock</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id}>
                <td style={s.td}>
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100'}
                    alt={p.name} style={s.img}
                    onError={e => e.target.src = 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100'}
                  />
                </td>
                <td style={s.td}>{p.name}</td>
                <td style={s.td}>{p.category}</td>
                <td style={{ ...s.td, color: 'var(--green-lt)' }}>BDT {p.price}/{p.unit}</td>
                <td style={s.td}>{p.stock} {p.unit}</td>
                <td style={s.td}>
                  <Link to={`/dashboard/edit/${p._id}`} style={s.editBtn}>Edit</Link>
                  <button style={s.delBtn} onClick={() => handleDelete(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
