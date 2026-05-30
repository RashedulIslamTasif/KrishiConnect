import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';

const CATS  = ['vegetables','fruits','fish','poultry','grains','dairy','spices'];
const UNITS = ['kg','g','piece','dozen','litre','bundle'];

const s = {
  page:     { minHeight:'100vh', padding:'36px 48px', maxWidth:640, margin:'0 auto' },
  backBtn:  { background:'transparent', border:'1px solid var(--border)', borderRadius:99, padding:'7px 16px', color:'var(--muted)', fontFamily:'Sora,sans-serif', fontSize:13, cursor:'pointer', marginBottom:24, display:'inline-block' },
  title:    { fontSize:26, fontWeight:700, letterSpacing:'-0.03em', color:'var(--white)', marginBottom:28 },
  label:    { display:'block', fontSize:12, fontWeight:600, color:'var(--muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'.06em' },
  input:    { width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', color:'var(--white)', fontSize:14, outline:'none', fontFamily:'Sora,sans-serif', boxSizing:'border-box', marginBottom:20 },
  select:   { width:'100%', background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', color:'var(--white)', fontSize:14, outline:'none', fontFamily:'Sora,sans-serif', boxSizing:'border-box', marginBottom:20 },
  textarea: { width:'100%', background:'rgba(255,255,255,.05)', border:'1px solid var(--border)', borderRadius:10, padding:'12px 16px', color:'var(--white)', fontSize:14, outline:'none', fontFamily:'Sora,sans-serif', boxSizing:'border-box', marginBottom:20, minHeight:90, resize:'vertical' },
  row:      { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  hint:     { fontSize:12, color:'var(--muted)', marginTop:-16, marginBottom:20 },
  btn:      { background:'var(--green-hi)', color:'#fff', border:'none', borderRadius:99, padding:'14px 36px', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize:15, cursor:'pointer' },
  err:      { background:'rgba(224,85,85,.12)', border:'1px solid rgba(224,85,85,.3)', color:'#e05555', borderRadius:10, padding:'12px 16px', fontSize:13, marginBottom:20 },
  success:  { background:'rgba(90,176,48,.12)', border:'1px solid rgba(90,176,48,.3)', color:'var(--green-lt)', borderRadius:10, padding:'12px 16px', fontSize:13, marginBottom:20 },
  uploadBox:{ border:'2px dashed var(--border)', borderRadius:12, padding:24, textAlign:'center', cursor:'pointer', marginBottom:20, transition:'border-color .2s' },
  preview:  { width:'100%', height:200, objectFit:'cover', borderRadius:12, marginBottom:12, border:'1px solid var(--border)' },
};

export default function AddProduct() {
  const [form, setForm]     = useState({ name:'', category:CATS[0], price:'', unit:UNITS[0], stock:'', description:'', marketPrice:'' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.stock) { setError('Name, price, and stock are required.'); return; }
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (imageFile) fd.append('images', imageFile);
      await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Product added successfully!');
      setTimeout(() => navigate('/dashboard/products'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product.');
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <button style={s.backBtn} onClick={() => navigate(-1)}>← Back</button>
      <div style={s.title}>Add New Product</div>
      {error   && <div style={s.err}>{error}</div>}
      {success && <div style={s.success}>{success}</div>}

      {/* Image upload */}
      <label style={s.label}>Product Photo</label>
      {imagePreview ? (
        <div style={{ marginBottom:20 }}>
          <img src={imagePreview} alt="Preview" style={s.preview} />
          <button onClick={() => { setImageFile(null); setImagePreview(''); }} style={{ background:'rgba(224,85,85,.12)', color:'#e05555', border:'1px solid rgba(224,85,85,.25)', borderRadius:8, padding:'6px 16px', fontSize:12, cursor:'pointer', fontFamily:'Sora,sans-serif' }}>Remove Photo</button>
        </div>
      ) : (
        <label style={s.uploadBox}>
          <input type="file" accept="image/*" onChange={handleImagePick} style={{ display:'none' }} />
          <div style={{ fontSize:36, marginBottom:8 }}>📷</div>
          <div style={{ fontSize:14, color:'var(--white)', fontWeight:600, marginBottom:4 }}>Tap to choose a photo</div>
          <div style={{ fontSize:12, color:'var(--muted)' }}>JPG, PNG or WEBP — from your gallery or camera</div>
        </label>
      )}

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
          <label style={s.label}>Your Selling Price (BDT)</label>
          <input style={s.input} name="price" type="number" min="0" placeholder="0" value={form.price} onChange={handleChange} />
        </div>
        <div>
          <label style={s.label}>Unit</label>
          <select style={s.select} name="unit" value={form.unit} onChange={handleChange}>
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <label style={s.label}>Market / Bazar Price (BDT) — optional</label>
      <input style={s.input} name="marketPrice" type="number" min="0" placeholder="What this sells for in bazar" value={form.marketPrice} onChange={handleChange} />
      <div style={s.hint}>Customers will see how much they save compared to bazar price.</div>

      <label style={s.label}>Stock Available</label>
      <input style={s.input} name="stock" type="number" min="0" placeholder="0" value={form.stock} onChange={handleChange} />

      <button style={s.btn} onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Add Product'}</button>
    </div>
  );
}
