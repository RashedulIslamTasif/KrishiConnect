import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const DISTRICTS = ['Dhaka','Chittagong','Rajshahi','Khulna','Sylhet','Barishal','Rangpur','Mymensingh','Comilla','Gazipur','Narayanganj','Bogura','Dinajpur','Jessore','Cox\'s Bazar','Tangail','Faridpur'];

export default function Register() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'customer', district:'' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [focusField, setFocusField] = useState('');
  const navigate  = useNavigate();
  const { register } = useAuth();

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      navigate(user.role === 'farmer' ? '/dashboard' : '/marketplace');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => ({
    width:'100%', background: focusField===field ? '#f9faf7' : '#f5f7f2',
    border: `1.5px solid ${focusField===field ? '#4e9e2a' : 'rgba(60,100,40,.15)'}`,
    borderRadius:14, padding:'13px 18px', color:'#1a2415', fontSize:15,
    outline:'none', fontFamily:'Plus Jakarta Sans,sans-serif',
    boxShadow: focusField===field ? '0 0 0 3px rgba(78,158,42,.1)' : 'none',
    transition:'all .2s ease', boxSizing:'border-box', marginBottom:18,
  });

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ width:'100%', maxWidth:440, animation:'fadeUp .5s cubic-bezier(.22,1,.36,1) both' }}>

        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:36 }}>
          <img src="/icons/icon-192.png" alt="KrishiConnect" style={{ width:40, height:40, borderRadius:12, objectFit:"cover" }} />
          <span style={{ fontSize:18, fontWeight:800, color:'#1a2415', letterSpacing:'-0.03em' }}>KrishiConnect</span>
        </div>

        <div style={{ fontSize:28, fontWeight:800, color:'#1a2415', marginBottom:6, letterSpacing:'-0.03em' }}>Create your account</div>
        <div style={{ fontSize:14, color:'#7a9070', marginBottom:32 }}>Join thousands of farmers and customers on KrishiConnect</div>

        {/* Role selector */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:24 }}>
          {['customer','farmer'].map(r => (
            <button key={r} onClick={() => setForm(f => ({ ...f, role:r }))}
              style={{ padding:'14px', borderRadius:14, border:`2px solid ${form.role===r ? '#4e9e2a' : 'rgba(60,100,40,.15)'}`,
                background: form.role===r ? '#e8f5e1' : '#fff',
                color: form.role===r ? '#3a7d1e' : '#7a9070',
                fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:700, fontSize:14, cursor:'pointer',
                transition:'all .2s', display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:24 }}>{r==='customer' ? '🛒' : '👨‍🌾'}</span>
              {r==='customer' ? 'I\'m a Customer' : 'I\'m a Farmer'}
            </button>
          ))}
        </div>

        {error && <div style={{ background:'rgba(192,64,64,.08)', border:'1.5px solid rgba(192,64,64,.2)', color:'#c04040', borderRadius:12, padding:'13px 16px', fontSize:13, marginBottom:20, display:'flex', gap:8 }}>⚠️ {error}</div>}

        {[
          { name:'name', label:'Full Name', placeholder:'Your full name', type:'text' },
          { name:'email', label:'Email Address', placeholder:'you@example.com', type:'email' },
          { name:'password', label:'Password', placeholder:'Min. 8 characters', type:'password' },
        ].map(f => (
          <div key={f.name}>
            <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#7a9070', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>{f.label}</label>
            <input
              style={inputStyle(f.name)} type={f.type} name={f.name} placeholder={f.placeholder}
              value={form[f.name]} onChange={handleChange}
              onFocus={() => setFocusField(f.name)} onBlur={() => setFocusField('')}
            />
          </div>
        ))}

        <label style={{ display:'block', fontSize:12, fontWeight:700, color:'#7a9070', marginBottom:8, textTransform:'uppercase', letterSpacing:'.06em' }}>District</label>
        <select name="district" value={form.district} onChange={handleChange}
          style={{ ...inputStyle('location'), background:'#f5f7f2', cursor:'pointer' }}
          onFocus={() => setFocusField('district')} onBlur={() => setFocusField('')}>
          <option value="">Select your district</option>
          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <button onClick={handleSubmit} disabled={loading}
          style={{ width:'100%', background: loading ? '#afc09e' : 'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff', border:'none', borderRadius:99, padding:'15px', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15, cursor: loading ? 'default' : 'pointer', boxShadow: loading ? 'none' : '0 4px 16px rgba(78,158,42,.4)', transition:'all .2s', marginTop:4 }}>
          {loading ? '⏳ Creating account...' : `Create ${form.role==='farmer' ? 'Farmer' : 'Customer'} Account →`}
        </button>

        <div style={{ textAlign:'center', marginTop:24, fontSize:14, color:'#7a9070' }}>
          Already have an account? <Link to="/login" style={{ color:'#4e9e2a', textDecoration:'none', fontWeight:700 }}>Sign In →</Link>
        </div>
      </div>
    </div>
  );
}
