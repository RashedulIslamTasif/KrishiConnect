import { useState, useRef } from 'react';
import { useResponsive } from '../../hooks/useResponsive.js';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios.js';

const CATS = [
  { key:'vegetables', label:'Vegetables', icon:'🥦', color:'#3a7d1e', bg:'#e8f5e1' },
  { key:'fruits',     label:'Fruits',     icon:'🍌', color:'#c47d0a', bg:'#fef3d8' },
  { key:'fish',       label:'Fish',       icon:'🐟', color:'#1d9e75', bg:'#e0f4ef' },
  { key:'poultry',    label:'Poultry',    icon:'🐔', color:'#c47010', bg:'#fef0e0' },
  { key:'grains',     label:'Grains',     icon:'🌾', color:'#9a6830', bg:'#f5ede0' },
  { key:'dairy',      label:'Dairy',      icon:'🥛', color:'#5060c0', bg:'#eef0fa' },
  { key:'spices',     label:'Spices',     icon:'🌶️', color:'#c04040', bg:'#fde8e8' },
];
const UNITS = ['kg','g','piece','dozen','litre','bundle'];

/* ── Step indicator ── */
function StepDot({ n, active, done }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0 }}>
      <div style={{
        width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
        background: done ? '#4e9e2a' : active ? 'linear-gradient(135deg,#4e9e2a,#3a7d1e)' : '#e8ede4',
        color: (done||active) ? '#fff' : '#afc09e',
        fontSize: done ? 14 : 13, fontWeight:800,
        boxShadow: active ? '0 2px 10px rgba(78,158,42,.4)' : 'none',
        transition:'all .3s',
        flexShrink:0,
      }}>
        {done ? '✓' : n}
      </div>
    </div>
  );
}

/* ── Photo picker bottom sheet ── */
function PhotoSheet({ onCamera, onGallery, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:200, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
      onClick={onClose}>
      <div style={{ position:'absolute', inset:0, background:'rgba(15,30,10,.55)', backdropFilter:'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()}
        style={{ position:'relative', background:'#fff', borderRadius:'24px 24px 0 0',
          padding:'8px 20px 40px', animation:'slideUp .3s cubic-bezier(.22,1,.36,1) both' }}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ width:40, height:4, background:'#e0e8da', borderRadius:99, margin:'12px auto 24px' }} />
        <div style={{ fontSize:16, fontWeight:800, color:'#1a2415', marginBottom:20, textAlign:'center' }}>Add Product Photo</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          <button onClick={onCamera}
            style={{ background:'linear-gradient(135deg,#1a3a10,#2d5a1e)', border:'none', borderRadius:18,
              padding:'20px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:10,
              cursor:'pointer', transition:'transform .2s' }}>
            <span style={{ fontSize:32 }}>📸</span>
            <span style={{ color:'#fff', fontWeight:800, fontSize:14, fontFamily:'Plus Jakarta Sans,sans-serif' }}>Camera</span>
            <span style={{ color:'rgba(255,255,255,.6)', fontSize:11, fontFamily:'Plus Jakarta Sans,sans-serif' }}>Take a photo now</span>
          </button>
          <button onClick={onGallery}
            style={{ background:'#f0f4ec', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:18,
              padding:'20px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:10,
              cursor:'pointer', transition:'transform .2s' }}>
            <span style={{ fontSize:32 }}>🖼️</span>
            <span style={{ color:'#1a2415', fontWeight:800, fontSize:14, fontFamily:'Plus Jakarta Sans,sans-serif' }}>Gallery</span>
            <span style={{ color:'#7a9070', fontSize:11, fontFamily:'Plus Jakarta Sans,sans-serif' }}>Choose existing photo</span>
          </button>
        </div>
        <button onClick={onClose}
          style={{ width:'100%', background:'#f5f7f2', border:'none', borderRadius:99, padding:'14px',
            color:'#7a9070', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ── Section card wrapper ── */
function Card({ children, style = {} }) {
  return (
    <div style={{ background:'#fff', border:'1px solid rgba(60,100,40,.1)', borderRadius:20,
      padding:'20px 16px', marginBottom:16, boxShadow:'0 2px 8px rgba(20,50,10,.05)', ...style }}>
      {children}
    </div>
  );
}

/* ── Field label ── */
function Label({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:'#7a9070', marginBottom:8,
    textTransform:'uppercase', letterSpacing:'.07em' }}>{children}</div>;
}

const inputStyle = (focus, field) => ({
  width:'100%', background: focus===field ? '#f9faf7' : '#f5f7f2',
  border:`1.5px solid ${focus===field ? '#4e9e2a' : 'rgba(60,100,40,.15)'}`,
  borderRadius:14, padding:'13px 16px', color:'#1a2415', fontSize:15, outline:'none',
  fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box',
  boxShadow: focus===field ? '0 0 0 3px rgba(78,158,42,.1)' : 'none',
  transition:'all .2s',
});

export default function AddProduct() {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const cameraRef  = useRef(null);
  const galleryRef = useRef(null);

  const [step,    setStep]    = useState(1); // 1=photo+name, 2=pricing, 3=review
  const [focus,   setFocus]   = useState('');
  const [sheet,   setSheet]   = useState(false);
  const [form,    setForm]    = useState({ name:'', category:'vegetables', price:'', unit:'kg', stock:'', description:'', marketPrice:'' });
  const [imgFile, setImgFile] = useState(null);
  const [imgPrev, setImgPrev] = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const pickFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImgFile(file);
    setImgPrev(URL.createObjectURL(file));
    setSheet(false);
  };

  const savings = form.marketPrice && form.price
    ? Math.max(0, Math.round(((Number(form.marketPrice) - Number(form.price)) / Number(form.marketPrice)) * 100))
    : 0;

  const activeCat = CATS.find(c => c.key === form.category) || CATS[0];

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.stock) { setError('Product name, price, and stock are required.'); return; }
    setError(''); setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (imgFile) fd.append('images', imgFile);
      await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add product. Please try again.');
    } finally { setLoading(false); }
  };

  const maxWidth = isMobile ? '100%' : 560;

  /* ── Success screen ── */
  if (done) return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ textAlign:'center', maxWidth:320, animation:'scaleIn .45s cubic-bezier(.22,1,.36,1) both' }}>
        <div style={{ width:88, height:88, background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', borderRadius:'50%', margin:'0 auto 20px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:38, boxShadow:'0 8px 28px rgba(78,158,42,.35)' }}>✓</div>
        <div style={{ fontSize:24, fontWeight:800, color:'#1a2415', marginBottom:8, letterSpacing:'-0.03em' }}>Product Listed!</div>
        <div style={{ fontSize:14, color:'#7a9070', marginBottom:8, lineHeight:1.6 }}>
          <strong style={{ color:'#1a2415' }}>{form.name}</strong> is now live on the marketplace.
        </div>
        {imgPrev && <img src={imgPrev} alt="product" style={{ width:120, height:120, borderRadius:16, objectFit:'cover', margin:'12px auto 24px', display:'block', border:'3px solid rgba(78,158,42,.2)', boxShadow:'0 4px 16px rgba(20,50,10,.1)' }} />}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={() => navigate('/dashboard/products')}
            style={{ background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', border:'none', borderRadius:99, padding:'14px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15, cursor:'pointer', boxShadow:'0 4px 14px rgba(78,158,42,.35)' }}>
            View My Products →
          </button>
          <button onClick={() => { setDone(false); setStep(1); setForm({ name:'', category:'vegetables', price:'', unit:'kg', stock:'', description:'', marketPrice:'' }); setImgFile(null); setImgPrev(''); }}
            style={{ background:'#f0f4ec', border:'none', borderRadius:99, padding:'13px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, color:'#4e9e2a', cursor:'pointer' }}>
            + Add Another Product
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif', paddingBottom:40 }}>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {sheet && <PhotoSheet
        onCamera={() => { cameraRef.current?.click(); }}
        onGallery={() => { galleryRef.current?.click(); }}
        onClose={() => setSheet(false)} />}

      {/* Hidden file inputs */}
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" onChange={pickFile} style={{ display:'none' }} />
      <input ref={galleryRef} type="file" accept="image/*" onChange={pickFile} style={{ display:'none' }} />

      {/* ── Top header bar ── */}
      <div style={{ background:'#fff', borderBottom:'1px solid rgba(60,100,40,.1)', padding:'14px 16px',
        display:'flex', alignItems:'center', gap:12, position:'sticky', top:60, zIndex:50,
        boxShadow:'0 2px 8px rgba(20,50,10,.05)' }}>
        <button onClick={() => step > 1 ? setStep(s => s-1) : navigate(-1)}
          style={{ width:36, height:36, borderRadius:12, background:'#f0f4ec', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, cursor:'pointer', flexShrink:0 }}>
          ←
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:800, color:'#1a2415', letterSpacing:'-0.02em' }}>Add New Product</div>
          <div style={{ fontSize:11, color:'#7a9070', marginTop:1 }}>Step {step} of 3 — {['Product Details','Pricing & Stock','Review'][step-1]}</div>
        </div>
        {/* Step dots */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {[1,2,3].map(n => (
            <div key={n} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <StepDot n={n} active={step===n} done={step>n} />
              {n < 3 && <div style={{ width:16, height:2, borderRadius:99, background: step>n ? '#4e9e2a' : '#e0e8da', transition:'background .3s' }} />}
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth, margin:'0 auto', padding:'20px 16px' }}>

        {error && (
          <div style={{ background:'rgba(192,64,64,.08)', border:'1.5px solid rgba(192,64,64,.2)', color:'#c04040',
            borderRadius:14, padding:'12px 16px', fontSize:13, marginBottom:16, display:'flex', gap:8, alignItems:'center',
            animation:'fadeUp .3s ease both' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ══════════ STEP 1 ══════════ */}
        {step === 1 && (
          <div style={{ animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}>

            {/* Photo card */}
            <Card>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'#e8f5e1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📸</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#1a2415' }}>Product Photo</div>
                  <div style={{ fontSize:11, color:'#7a9070' }}>Good photos sell faster</div>
                </div>
              </div>

              {imgPrev ? (
                <div style={{ position:'relative' }}>
                  <img src={imgPrev} alt="preview" style={{ width:'100%', height:220, objectFit:'cover', borderRadius:16, display:'block', border:'1.5px solid rgba(60,100,40,.12)' }} />
                  {/* Edit overlay */}
                  <button onClick={() => setSheet(true)}
                    style={{ position:'absolute', bottom:10, right:10, background:'rgba(0,0,0,.55)', backdropFilter:'blur(6px)', border:'none', borderRadius:99, padding:'7px 14px', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', display:'flex', alignItems:'center', gap:6 }}>
                    ✏️ Change
                  </button>
                  <div style={{ position:'absolute', top:10, left:10, background:'rgba(78,158,42,.9)', borderRadius:99, padding:'4px 10px', fontSize:10, fontWeight:700, color:'#fff' }}>✓ Photo added</div>
                </div>
              ) : (
                <div onClick={() => setSheet(true)}
                  style={{ border:'2px dashed rgba(60,100,40,.2)', borderRadius:18, padding:'32px 16px', textAlign:'center', cursor:'pointer', background:'#f9faf7', transition:'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='#4e9e2a'; e.currentTarget.style.background='#f0f7ea'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(60,100,40,.2)'; e.currentTarget.style.background='#f9faf7'; }}>
                  <div style={{ width:64, height:64, borderRadius:'50%', background:'#e8f5e1', margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>📷</div>
                  <div style={{ fontSize:15, fontWeight:700, color:'#1a2415', marginBottom:4 }}>Tap to add a photo</div>
                  <div style={{ fontSize:12, color:'#7a9070' }}>Camera or Gallery · JPG, PNG, WEBP</div>
                  {/* Mini action pills */}
                  <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:16 }}>
                    <span style={{ background:'linear-gradient(135deg,#1a3a10,#2d5a1e)', color:'#fff', fontSize:11, fontWeight:700, padding:'6px 14px', borderRadius:99, display:'flex', alignItems:'center', gap:4 }}>📸 Camera</span>
                    <span style={{ background:'#f0f4ec', color:'#4e9e2a', fontSize:11, fontWeight:700, padding:'6px 14px', borderRadius:99, border:'1px solid rgba(78,158,42,.2)', display:'flex', alignItems:'center', gap:4 }}>🖼️ Gallery</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Product info card */}
            <Card>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'#e8f5e1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📝</div>
                <div style={{ fontSize:14, fontWeight:800, color:'#1a2415' }}>Product Info</div>
              </div>

              <Label>Product Name *</Label>
              <input name="name" value={form.name} onChange={handleChange}
                onFocus={() => setFocus('name')} onBlur={() => setFocus('')}
                placeholder="e.g. Fresh Tomatoes"
                style={{ ...inputStyle(focus,'name'), width:'100%', marginBottom:16 }} />

              <Label>Description</Label>
              <textarea name="description" value={form.description} onChange={handleChange}
                onFocus={() => setFocus('desc')} onBlur={() => setFocus('')}
                placeholder="Describe freshness, harvest date, farm location..."
                style={{ ...inputStyle(focus,'desc'), width:'100%', minHeight:80, resize:'vertical', marginBottom:0 }} />
            </Card>

            {/* Category card */}
            <Card>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'#e8f5e1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏷️</div>
                <div style={{ fontSize:14, fontWeight:800, color:'#1a2415' }}>Category</div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                {CATS.map(cat => (
                  <button key={cat.key} onClick={() => setForm(f => ({ ...f, category: cat.key }))}
                    style={{ background: form.category===cat.key ? cat.bg : '#f5f7f2',
                      border:`2px solid ${form.category===cat.key ? cat.color : 'transparent'}`,
                      borderRadius:14, padding:'10px 4px', display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                      cursor:'pointer', transition:'all .2s',
                      transform: form.category===cat.key ? 'scale(1.04)' : 'scale(1)',
                      boxShadow: form.category===cat.key ? `0 2px 10px ${cat.color}33` : 'none',
                    }}>
                    <span style={{ fontSize:22 }}>{cat.icon}</span>
                    <span style={{ fontSize:10, fontWeight:700, color: form.category===cat.key ? cat.color : '#7a9070', lineHeight:1.2, textAlign:'center' }}>{cat.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            <button onClick={() => {
              if (!form.name.trim()) { setError('Please enter a product name.'); return; }
              setError(''); setStep(2);
            }}
              style={{ width:'100%', background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', border:'none',
                borderRadius:99, padding:'15px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15,
                cursor:'pointer', boxShadow:'0 4px 14px rgba(78,158,42,.35)' }}>
              Continue → Pricing & Stock
            </button>
          </div>
        )}

        {/* ══════════ STEP 2 ══════════ */}
        {step === 2 && (
          <div style={{ animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}>

            <Card>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'#fef3d8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>💰</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#1a2415' }}>Set Your Price</div>
                  <div style={{ fontSize:11, color:'#7a9070' }}>Customers will see bazar savings</div>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12, marginBottom:0 }}>
                <div>
                  <Label>Your Selling Price (৳) *</Label>
                  <input name="price" type="number" min="0" value={form.price} onChange={handleChange}
                    onFocus={() => setFocus('price')} onBlur={() => setFocus('')}
                    placeholder="0"
                    style={{ ...inputStyle(focus,'price'), width:'100%' }} />
                </div>
                <div>
                  <Label>Unit</Label>
                  <select name="unit" value={form.unit} onChange={handleChange}
                    style={{ width:'100%', background:'#f5f7f2', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:14, padding:'13px 16px', color:'#1a2415', fontSize:15, outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif', cursor:'pointer' }}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ margin:'16px 0' }}>
                <Label>Bazar / Market Price (৳) — optional</Label>
                <input name="marketPrice" type="number" min="0" value={form.marketPrice} onChange={handleChange}
                  onFocus={() => setFocus('market')} onBlur={() => setFocus('')}
                  placeholder="What this sells for in bazar"
                  style={{ ...inputStyle(focus,'market'), width:'100%' }} />
              </div>

              {/* Live savings preview */}
              {savings > 0 && (
                <div style={{ background:'linear-gradient(135deg,#e8f5e1,#f0f9e8)', border:'1.5px solid rgba(78,158,42,.2)', borderRadius:14, padding:'12px 16px', display:'flex', alignItems:'center', gap:10, animation:'fadeUp .3s ease both' }}>
                  <span style={{ fontSize:22 }}>🎉</span>
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:'#3a7d1e' }}>Customers save {savings}% vs bazar!</div>
                    <div style={{ fontSize:11, color:'#7a9070' }}>This makes your listing more attractive</div>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'#e0f4ef', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📦</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#1a2415' }}>Available Stock</div>
                  <div style={{ fontSize:11, color:'#7a9070' }}>How much can you sell right now?</div>
                </div>
              </div>

              <Label>Quantity in Stock *</Label>
              <input name="stock" type="number" min="0" value={form.stock} onChange={handleChange}
                onFocus={() => setFocus('stock')} onBlur={() => setFocus('')}
                placeholder={`e.g. 50 ${form.unit}`}
                style={{ ...inputStyle(focus,'stock'), width:'100%' }} />

              {/* Quick stock presets */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:4 }}>
                {[10,25,50,100,200].map(n => (
                  <button key={n} onClick={() => setForm(f => ({ ...f, stock: String(n) }))}
                    style={{ background: form.stock===String(n) ? '#4e9e2a' : '#f0f4ec',
                      color: form.stock===String(n) ? '#fff' : '#4e9e2a',
                      border:'none', borderRadius:99, padding:'5px 14px', fontSize:12, fontWeight:700,
                      cursor:'pointer', fontFamily:'Plus Jakarta Sans,sans-serif', transition:'all .15s' }}>
                    {n}
                  </button>
                ))}
              </div>
            </Card>

            <button onClick={() => {
              if (!form.price || !form.stock) { setError('Price and stock are required.'); return; }
              setError(''); setStep(3);
            }}
              style={{ width:'100%', background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', border:'none',
                borderRadius:99, padding:'15px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15,
                cursor:'pointer', boxShadow:'0 4px 14px rgba(78,158,42,.35)' }}>
              Continue → Review Listing
            </button>
          </div>
        )}

        {/* ══════════ STEP 3 — REVIEW ══════════ */}
        {step === 3 && (
          <div style={{ animation:'fadeUp .4s cubic-bezier(.22,1,.36,1) both' }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#7a9070', marginBottom:16, textAlign:'center', textTransform:'uppercase', letterSpacing:'.08em' }}>Review Your Listing</div>

            {/* Preview card */}
            <Card style={{ overflow:'hidden', padding:0 }}>
              {imgPrev ? (
                <img src={imgPrev} alt="product" style={{ width:'100%', height:200, objectFit:'cover', display:'block' }} />
              ) : (
                <div style={{ width:'100%', height:160, background:'linear-gradient(135deg,#e8f5e1,#f0f9e8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:60 }}>
                  {activeCat.icon}
                </div>
              )}
              <div style={{ padding:'16px 18px 18px' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, marginBottom:8 }}>
                  <div>
                    <span style={{ background:activeCat.bg, color:activeCat.color, fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:99, marginBottom:8, display:'inline-block' }}>{activeCat.label}</span>
                    <div style={{ fontSize:18, fontWeight:800, color:'#1a2415', marginTop:4 }}>{form.name}</div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontSize:22, fontWeight:800, color:'#4e9e2a' }}>৳{form.price}</div>
                    <div style={{ fontSize:11, color:'#7a9070' }}>per {form.unit}</div>
                  </div>
                </div>
                {form.description && <div style={{ fontSize:13, color:'#7a9070', lineHeight:1.6, marginBottom:10 }}>{form.description}</div>}
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ background:'#f0f4ec', color:'#4e9e2a', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:99 }}>📦 {form.stock} {form.unit} in stock</span>
                  {savings > 0 && <span style={{ background:'#e8f5e1', color:'#3a7d1e', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:99 }}>🎉 Save {savings}% vs bazar</span>}
                </div>
              </div>
            </Card>

            {/* Edit shortcuts */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              <button onClick={() => setStep(1)} style={{ background:'#fff', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:14, padding:'12px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, color:'#7a9070', cursor:'pointer' }}>✏️ Edit Details</button>
              <button onClick={() => setStep(2)} style={{ background:'#fff', border:'1.5px solid rgba(60,100,40,.15)', borderRadius:14, padding:'12px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:13, color:'#7a9070', cursor:'pointer' }}>💰 Edit Pricing</button>
            </div>

            {error && <div style={{ background:'rgba(192,64,64,.08)', border:'1.5px solid rgba(192,64,64,.2)', color:'#c04040', borderRadius:14, padding:'12px 16px', fontSize:13, marginBottom:16 }}>⚠️ {error}</div>}

            <button onClick={handleSubmit} disabled={loading}
              style={{ width:'100%', background: loading ? '#afc09e' : 'linear-gradient(135deg,#4e9e2a,#3a7d1e)',
                color:'#fff', border:'none', borderRadius:99, padding:'16px',
                fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:16,
                cursor: loading ? 'default' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 18px rgba(78,158,42,.4)',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading ? '⏳ Publishing...' : '🚀 Publish Listing'}
            </button>

            <div style={{ textAlign:'center', fontSize:12, color:'#afc09e', marginTop:12 }}>
              Your product will be live on the marketplace immediately
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
