import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';

const CATS = [
  { key:'vegetables', label:'Vegetables', img:'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=70', color:'#3a7d1e', bg:'#e8f5e1' },
  { key:'fruits',     label:'Fruits',     img:'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=70', color:'#c47d0a', bg:'#fef3d8' },
  { key:'fish',       label:'Fish',       img:'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&q=70', color:'#1d9e75', bg:'#e0f4ef' },
  { key:'poultry',    label:'Poultry',    img:'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=300&q=70', color:'#c47010', bg:'#fef0e0' },
  { key:'grains',     label:'Grains',     img:'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=300&q=70', color:'#9a6830', bg:'#f5ede0' },
  { key:'dairy',      label:'Dairy',      img:'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=70', color:'#5060c0', bg:'#eef0fa' },
  { key:'spices',     label:'Spices',     img:'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&q=70', color:'#c04040', bg:'#fde8e8' },
];

const UNITS = ['kg','g','piece','dozen','litre','bundle'];

function CatCard({ cat, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      borderRadius:16, overflow:'hidden', cursor:'pointer', position:'relative',
      height:80, border:`2px solid ${selected ? cat.color : 'transparent'}`,
      boxShadow: selected ? `0 4px 14px ${cat.color}33` : '0 2px 6px rgba(20,50,10,.07)',
      transform: selected ? 'scale(1.04)' : 'scale(1)',
      transition:'all .2s cubic-bezier(.22,1,.36,1)',
      padding:0, background:'transparent',
    }}>
      <img src={cat.img} alt={cat.label} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
      <div style={{ position:'absolute', inset:0, background: selected
        ? `linear-gradient(160deg,${cat.color}88,${cat.color}cc)`
        : 'linear-gradient(160deg,rgba(10,30,5,.2),rgba(10,30,5,.6))' }} />
      {selected && (
        <div style={{ position:'absolute', top:6, right:6, width:18, height:18, borderRadius:'50%', background:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:cat.color }} />
        </div>
      )}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'5px 8px' }}>
        <div style={{ fontSize:10, fontWeight:800, color:'#fff', textShadow:'0 1px 3px rgba(0,0,0,.5)', lineHeight:1.2 }}>{cat.label}</div>
      </div>
    </button>
  );
}

function Label({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:'#7a9070', marginBottom:8, textTransform:'uppercase', letterSpacing:'.07em' }}>{children}</div>;
}

function SectionCard({ title, icon, children }) {
  return (
    <div style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:20, overflow:'hidden', marginBottom:16, boxShadow:'0 2px 8px rgba(20,50,10,.05)' }}>
      <div style={{ padding:'16px 20px 0', display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:'#e8f5e1', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{icon}</div>
        <span style={{ fontSize:14, fontWeight:800, color:'#1a2415' }}>{title}</span>
      </div>
      <div style={{ padding:'0 20px 20px' }}>{children}</div>
    </div>
  );
}

const inputStyle = (focus, field) => ({
  width:'100%', borderRadius:14, padding:'13px 16px', color:'#1a2415', fontSize:14, outline:'none',
  fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box', marginBottom:16,
  background: focus===field ? '#f9faf7' : '#f5f7f2',
  border:`1.5px solid ${focus===field ? '#4e9e2a' : 'rgba(60,100,40,.15)'}`,
  boxShadow: focus===field ? '0 0 0 3px rgba(78,158,42,.1)' : 'none',
  transition:'all .2s',
});

export default function EditProduct() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [form,          setForm]          = useState({ name:'', category:'vegetables', price:'', unit:'kg', stock:'', description:'', marketPrice:'' });
  const [existingImage, setExistingImage] = useState('');
  const [imageFile,     setImageFile]     = useState(null);
  const [imagePreview,  setImagePreview]  = useState('');
  const [focus,         setFocus]         = useState('');
  const [error,         setError]         = useState('');
  const [success,       setSuccess]       = useState('');
  const [loading,       setLoading]       = useState(false);
  const [fetching,      setFetching]      = useState(true);

  useEffect(() => {
    api.get(`/products/${id}`).then(r => {
      const p = r.data.product || r.data;
      setForm({ name: p.name||'', category: p.category||'vegetables', price: p.price||'', unit: p.unit||'kg', stock: p.stock||'', description: p.description||'', marketPrice: p.marketPrice||'' });
      setExistingImage(p.images?.[0] || '');
    }).catch(() => setError('Could not load product.')).finally(() => setFetching(false));
  }, [id]);

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
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== undefined) fd.append(k, v); });
      if (imageFile) fd.append('images', imageFile);
      else if (existingImage) fd.append('images', existingImage);
      await api.put(`/products/${id}`, fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      setSuccess('Product updated successfully!');
      setTimeout(() => navigate('/dashboard/products'), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update product.');
    } finally { setLoading(false); }
  };

  const currentPreview = imagePreview || existingImage;
  const activeCat = CATS.find(c => c.key === form.category) || CATS[0];
  const savings = form.marketPrice && form.price
    ? Math.max(0, Math.round(((Number(form.marketPrice) - Number(form.price)) / Number(form.marketPrice)) * 100)) : 0;

  if (fetching) return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid #e8f5e1', borderTopColor:'#4e9e2a', borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 12px' }} />
        <div style={{ color:'#7a9070', fontSize:14 }}>Loading product...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
      `}</style>

      {/* ── Hero header ── */}
      <div style={{ background:'linear-gradient(135deg,#1a3a10,#2d5a1e)', padding:'0 0 72px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.04)' }} />
        <div style={{ maxWidth:640, margin:'0 auto', padding:'20px 20px 0' }}>
          <button onClick={() => navigate(-1)} style={{ background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.2)', borderRadius:12, padding:'8px 16px', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', marginBottom:24, backdropFilter:'blur(8px)' }}>← Back</button>
          <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', color:'rgba(255,255,255,.5)', marginBottom:6 }}>Farmer Dashboard</div>
          <div style={{ fontSize:28, fontWeight:800, color:'#fff', letterSpacing:'-0.03em', marginBottom:6 }}>Edit Product</div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.55)' }}>Update your listing details below</div>
        </div>
      </div>

      <div style={{ maxWidth:640, margin:'-52px auto 0', padding:'0 20px 48px', position:'relative', zIndex:2 }}>

        {/* Alerts */}
        {error && (
          <div style={{ background:'#fde8e8', border:'1px solid rgba(192,64,64,.25)', color:'#c04040', borderRadius:14, padding:'12px 16px', fontSize:13, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8, animation:'fadeUp .3s ease both' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background:'#e8f5e1', border:'1px solid rgba(78,158,42,.25)', color:'#3a7d1e', borderRadius:14, padding:'12px 16px', fontSize:13, fontWeight:600, marginBottom:16, display:'flex', alignItems:'center', gap:8, animation:'fadeUp .3s ease both' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            {success}
          </div>
        )}

        {/* ── Product Photo ── */}
        <SectionCard title="Product Photo" icon={
          <svg width="16" height="16" fill="none" stroke="#4e9e2a" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        }>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display:'none' }} />
          {currentPreview ? (
            <div>
              <div style={{ position:'relative', marginBottom:12 }}>
                <img src={currentPreview} alt="Preview" style={{ width:'100%', height:200, objectFit:'cover', borderRadius:16, display:'block', border:'1.5px solid rgba(60,100,40,.12)' }} onError={e => e.target.style.display='none'} />
                {imagePreview && (
                  <div style={{ position:'absolute', top:10, left:10, background:'rgba(78,158,42,.9)', borderRadius:99, padding:'4px 10px', fontSize:10, fontWeight:700, color:'#fff' }}>New photo</div>
                )}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => fileRef.current?.click()} style={{ background:'#e8f5e1', color:'#4e9e2a', border:'1px solid rgba(78,158,42,.2)', borderRadius:10, padding:'8px 18px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', display:'flex', alignItems:'center', gap:6 }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Change Photo
                </button>
                {imagePreview && (
                  <button onClick={() => { setImageFile(null); setImagePreview(''); }} style={{ background:'#fde8e8', color:'#c04040', border:'1px solid rgba(192,64,64,.2)', borderRadius:10, padding:'8px 16px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()}
              style={{ border:'2px dashed rgba(60,100,40,.2)', borderRadius:16, padding:'28px 16px', textAlign:'center', cursor:'pointer', background:'#f9faf7', transition:'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='#4e9e2a'; e.currentTarget.style.background='#f0f7ea'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(60,100,40,.2)'; e.currentTarget.style.background='#f9faf7'; }}>
              <div style={{ width:56, height:56, borderRadius:'50%', background:'#e8f5e1', margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <svg width="24" height="24" fill="none" stroke="#4e9e2a" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
              <div style={{ fontSize:14, fontWeight:700, color:'#1a2415', marginBottom:4 }}>Tap to choose a photo</div>
              <div style={{ fontSize:12, color:'#7a9070' }}>JPG, PNG or WEBP from your gallery</div>
            </div>
          )}
        </SectionCard>

        {/* ── Product Info ── */}
        <SectionCard title="Product Info" icon={
          <svg width="16" height="16" fill="none" stroke="#4e9e2a" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        }>
          <Label>Product Name *</Label>
          <input name="name" value={form.name} onChange={handleChange}
            onFocus={() => setFocus('name')} onBlur={() => setFocus('')}
            placeholder="e.g. Fresh Tomatoes"
            style={inputStyle(focus,'name')} />

          <Label>Description</Label>
          <textarea name="description" value={form.description} onChange={handleChange}
            onFocus={() => setFocus('desc')} onBlur={() => setFocus('')}
            placeholder="Describe freshness, harvest date, farm location..."
            style={{ ...inputStyle(focus,'desc'), minHeight:90, resize:'vertical' }} />
        </SectionCard>

        {/* ── Category — photo cards ── */}
        <SectionCard title="Category" icon={
          <svg width="16" height="16" fill="none" stroke="#4e9e2a" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        }>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
            {CATS.map(cat => (
              <CatCard key={cat.key} cat={cat} selected={form.category===cat.key} onClick={() => setForm(f => ({ ...f, category: cat.key }))} />
            ))}
          </div>
          {/* Selected badge */}
          <div style={{ padding:'10px 14px', background:activeCat.bg, borderRadius:12, display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, overflow:'hidden', flexShrink:0 }}>
              <img src={activeCat.img} alt={activeCat.label} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:activeCat.color }}>{activeCat.label}</div>
              <div style={{ fontSize:10, color:'#7a9070' }}>Selected category</div>
            </div>
          </div>
        </SectionCard>

        {/* ── Pricing ── */}
        <SectionCard title="Pricing & Unit" icon={
          <svg width="16" height="16" fill="none" stroke="#c47d0a" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        }>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <Label>Selling Price (৳) *</Label>
              <input name="price" type="number" min="0" value={form.price} onChange={handleChange}
                onFocus={() => setFocus('price')} onBlur={() => setFocus('')}
                style={inputStyle(focus,'price')} />
            </div>
            <div>
              <Label>Unit</Label>
              <select name="unit" value={form.unit} onChange={handleChange}
                style={{ width:'100%', background:'#f5f7f2', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:14, padding:'13px 16px', color:'#1a2415', fontSize:14, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', cursor:'pointer', marginBottom:16 }}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <Label>Bazar / Market Price (৳) — optional</Label>
          <input name="marketPrice" type="number" min="0" value={form.marketPrice} onChange={handleChange}
            onFocus={() => setFocus('market')} onBlur={() => setFocus('')}
            placeholder="What this sells for at bazar"
            style={inputStyle(focus,'market')} />
          <div style={{ fontSize:12, color:'#7a9070', marginTop:-12, marginBottom:4 }}>Customers see how much they save vs bazar price.</div>

          {savings > 0 && (
            <div style={{ background:'linear-gradient(135deg,#e8f5e1,#f0f9e8)', border:'1.5px solid rgba(78,158,42,.2)', borderRadius:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:10, marginTop:8 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:'#4e9e2a', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:800, color:'#3a7d1e' }}>Customers save {savings}% vs bazar!</div>
                <div style={{ fontSize:11, color:'#7a9070' }}>This makes your listing more attractive</div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* ── Stock ── */}
        <SectionCard title="Available Stock" icon={
          <svg width="16" height="16" fill="none" stroke="#1d9e75" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        }>
          <Label>Quantity in Stock *</Label>
          <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange}
            onFocus={() => setFocus('stock')} onBlur={() => setFocus('')}
            placeholder={`e.g. 50 ${form.unit}`}
            style={inputStyle(focus,'stock')} />
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:-8 }}>
            {[10,25,50,100,200].map(n => (
              <button key={n} onClick={() => setForm(f => ({ ...f, stock: String(n) }))}
                style={{ background: form.stock===String(n) ? '#4e9e2a' : '#f0f4ec', color: form.stock===String(n) ? '#fff' : '#4e9e2a', border:'none', borderRadius:99, padding:'5px 14px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', transition:'all .15s' }}>
                {n}
              </button>
            ))}
          </div>
        </SectionCard>

        {/* ── Actions ── */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex:2, background: loading ? '#afc09e' : 'linear-gradient(135deg,#4e9e2a,#3a7d1e)',
            color:'#fff', border:'none', borderRadius:99, padding:'15px',
            fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(78,158,42,.35)',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
            {loading ? (
              <><span style={{ display:'inline-block', width:18, height:18, border:'2px solid rgba(255,255,255,.4)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} /> Saving...</>
            ) : 'Save Changes'}
          </button>
          <button onClick={() => navigate('/dashboard/products')} style={{
            flex:1, background:'#fff', color:'#7a9070',
            border:'1.5px solid rgba(60,100,40,.15)', borderRadius:99, padding:'15px',
            fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer',
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}