import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';

const CATS  = ['vegetables','fruits','fish','poultry','grains','dairy','spices'];
const UNITS = ['kg','g','piece','dozen','liter','bundle'];

const s = {
  page: { minHeight: '100vh', padding: '36px 48px', maxWidth: 640, margin: '0 auto' },
  title: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--white)', marginBottom: 28 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' },
  input: { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: 20 },
  select: { width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: 20 },
  textarea: { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: 20, minHeight: 100, resize: 'vertical' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  btn: { background: 'var(--green-hi)', color: '#fff', border: 'none', borderRadius: 99, padding: '14px 36px', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 15, cursor: 'pointer' },
  err: { background: 'rgba(224,85,85,.12)', border: '1px solid rgba(224,85,85,.3)', color: '#e05555', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 20 },
  success: { background: 'rgba(90,176,48,.12)', border: '1px solid rgba(90,176,48,.3)', color: 'var(--green-lt)', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 20 },
};

export default function AddProduct() {
  const [form, setForm] = useState({ name: '', category: CATS[0], price: '', unit: UNITS[0], stock: '', description: '', imageUrl: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.stock) { setError('Name, price, and stock are required.'); return; }
    setError(''); setLoading(true);
    try {
      const payload = { ...form, price: Number(form.price), stock: Number(form.stock), images: form.imageUrl ? [form.imageUrl] : [] };
      await api.post('/products', payload);
      setSuccess('Product added successfully!');
      setTimeout(() => navigate('/dashboard/products'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product.');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.title}>Add New Product</div>
      {error   && <div style={s.err}>{error}</div>}
      {success && <div style={s.success}>{success}</div>}
      <label style={s.label}>Product Name</label>
      <input style={s.input} name="name" placeholder="e.g. Fresh Tomatoes" value={form.name} onChange={handleChange} />
      <label style={s.label}>Description</label>
      <textarea style={s.textarea} name="description" placeholder="Describe your product..." value={form.description} onChange={handleChange} />
      <label style={s.label}>Category</label>
      <select style={s.select} name="category" value={form.category} onChange={handleChange}>
        {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
      </select>
      <div style={s.row}>
        <div>
          <label style={s.label}>Price (BDT)</label>
          <input style={s.input} name="price" type="number" min="0" placeholder="0" value={form.price} onChange={handleChange} />
        </div>
        <div>
          <label style={s.label}>Unit</label>
          <select style={s.select} name="unit" value={form.unit} onChange={handleChange}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <label style={s.label}>Stock Available</label>
      <input style={s.input} name="stock" type="number" min="0" placeholder="0" value={form.stock} onChange={handleChange} />
      <label style={s.label}>Image URL (optional)</label>
      <input style={s.input} name="imageUrl" placeholder="https://..." value={form.imageUrl} onChange={handleChange} />
      <button style={s.btn} onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Add Product'}</button>
    </div>
  );
}
