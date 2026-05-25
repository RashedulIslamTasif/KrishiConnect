import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';

const CATS  = ['vegetables','fruits','fish','poultry','grains','dairy','spices'];
const UNITS = ['kg','g','piece','dozen','litre','bundle'];

const s = {
  page: { minHeight: '100vh', padding: '36px 48px', maxWidth: 640, margin: '0 auto' },
  title: { fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--white)', marginBottom: 28 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' },
  input: { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: 20 },
  select: { width: '100%', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: 20 },
  textarea: { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', color: 'var(--white)', fontSize: 14, outline: 'none', fontFamily: 'Sora,sans-serif', boxSizing: 'border-box', marginBottom: 20, minHeight: 100, resize: 'vertical' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  btn: { background: 'var(--green-hi)', color: '#fff', border: 'none', borderRadius: 99, padding: '14px 36px', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 15, cursor: 'pointer' },
  btnSec: { background: 'transparent', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: 99, padding: '14px 24px', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginLeft: 12 },
  err: { background: 'rgba(224,85,85,.12)', border: '1px solid rgba(224,85,85,.3)', color: '#e05555', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 20 },
  success: { background: 'rgba(90,176,48,.12)', border: '1px solid rgba(90,176,48,.3)', color: 'var(--green-lt)', borderRadius: 10, padding: '12px 16px', fontSize: 13, marginBottom: 20 },
  preview: { width: '100%', height: 200, objectFit: 'cover', borderRadius: 12, marginBottom: 12, border: '1px solid var(--border)' },
  hint: { fontSize: 12, color: 'var(--muted)', marginTop: -16, marginBottom: 20 },
};

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: '', category: CATS[0], price: '', unit: UNITS[0], stock: '', description: '', imageUrl: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(r => {
        const p = r.data.product || r.data;
        setForm({
          name:        p.name        || '',
          category:    p.category    || CATS[0],
          price:       p.price       || '',
          unit:        p.unit        || UNITS[0],
          stock:       p.stock       || '',
          description: p.description || '',
          imageUrl:    p.images?.[0] || '',
        });
      })
      .catch(() => setError('Could not load product.'))
      .finally(() => setFetching(false));
  }, [id]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.stock) { setError('Name, price, and stock are required.'); return; }
    setError(''); setLoading(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        images: form.imageUrl ? [form.imageUrl] : [],
      };
      await api.put(`/products/${id}`, payload);
      setSuccess('Product updated successfully!');
      setTimeout(() => navigate('/dashboard/products'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product.');
    } finally { setLoading(false); }
  };

  if (fetching) return <div style={{ ...s.page, color: 'var(--muted)' }}>Loading product...</div>;

  return (
    <div style={s.page}>
      <div style={s.title}>Edit Product</div>
      {error   && <div style={s.err}>{error}</div>}
      {success && <div style={s.success}>{success}</div>}

      {form.imageUrl && (
        <img src={form.imageUrl} alt="Preview" style={s.preview} onError={e => e.target.style.display='none'} />
      )}

      <label style={s.label}>Product Image URL</label>
      <input style={s.input} name="imageUrl" placeholder="https://images.unsplash.com/..." value={form.imageUrl} onChange={handleChange} />
      <div style={s.hint}>Paste any image URL — from Unsplash, Google Images (right-click copy image address), etc.</div>

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
          <input style={s.input} name="price" type="number" min="0" value={form.price} onChange={handleChange} />
        </div>
        <div>
          <label style={s.label}>Unit</label>
          <select style={s.select} name="unit" value={form.unit} onChange={handleChange}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <label style={s.label}>Stock Available</label>
      <input style={s.input} name="stock" type="number" min="0" value={form.stock} onChange={handleChange} />

      <div>
        <button style={s.btn} onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
        <button style={s.btnSec} onClick={() => navigate('/dashboard/products')}>Cancel</button>
      </div>
    </div>
  );
}
