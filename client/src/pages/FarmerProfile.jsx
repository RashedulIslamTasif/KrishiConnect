import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';

const s = {
  page: { minHeight: '100vh', padding: '40px 48px', maxWidth: 1100, margin: '0 auto' },
  banner: { background: 'linear-gradient(135deg,rgba(90,176,48,.12),rgba(29,158,117,.08))', border: '1px solid var(--border)', borderRadius: 20, padding: 36, marginBottom: 36, display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' },
  avatar: { width: 80, height: 80, borderRadius: '50%', background: 'rgba(90,176,48,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: 'var(--green-lt)', flexShrink: 0 },
  name: { fontSize: 26, fontWeight: 700, color: 'var(--white)', marginBottom: 4 },
  farm: { fontSize: 15, color: 'var(--green-lt)', marginBottom: 8 },
  meta: { fontSize: 13, color: 'var(--muted)', display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 8 },
  verified: { display: 'inline-block', background: 'rgba(29,158,117,.15)', color: '#1d9e75', fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99, border: '1px solid rgba(29,158,117,.3)', marginBottom: 12 },
  chatBtn: { background: 'var(--green-hi)', color: '#fff', border: 'none', borderRadius: 99, padding: '10px 24px', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'inline-block', marginLeft: 'auto', alignSelf: 'center' },
  chatBtnDisabled: { background: 'var(--border)', color: 'var(--muted)', border: 'none', borderRadius: 99, padding: '10px 24px', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'not-allowed', display: 'inline-block', marginLeft: 'auto', alignSelf: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: 'var(--white)', marginBottom: 20 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 },
  productCard: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', color: 'inherit', display: 'block' },
  productImg: { width: '100%', height: 160, objectFit: 'cover', background: 'var(--border)' },
  productBody: { padding: 16 },
  productName: { fontSize: 14, fontWeight: 600, color: 'var(--white)', marginBottom: 4 },
  productPrice: { fontSize: 15, fontWeight: 700, color: 'var(--green-lt)' },
  empty: { color: 'var(--muted)', fontSize: 14, padding: '40px 0' },
};

export default function FarmerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [farmer, setFarmer]     = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/auth/farmers/${id}`),
      api.get(`/products?farmer=${id}&limit=20`),
    ]).then(([fr, pr]) => {
      const fd = fr.data;
      setFarmer(fd.farmer || fd);
      const pd = pr.data;
      if (Array.isArray(pd)) setProducts(pd);
      else if (Array.isArray(pd.products)) setProducts(pd.products);
      else setProducts([]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleMessage = async () => {
    setChatLoading(true);
    try {
      const { data } = await api.post('/chat/start', { recipientId: id });
      const convoId = data.conversation?._id || data._id;
      navigate(`/chat/${convoId}`);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        alert('Could not start conversation. Please make sure you are logged in.');
      }
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return <div style={{ ...s.page, color: 'var(--muted)' }}>Loading...</div>;
  if (!farmer) return <div style={{ ...s.page, color: 'var(--muted)' }}>Farmer not found.</div>;

  return (
    <div style={s.page}>
      <div style={s.banner}>
        <div style={s.avatar}>{farmer.name?.[0]?.toUpperCase() || 'F'}</div>
        <div style={{ flex: 1 }}>
          {farmer.isVerified && <div style={s.verified}>Verified Farmer</div>}
          <div style={s.name}>{farmer.name}</div>
          {farmer.farmName && <div style={s.farm}>{farmer.farmName}</div>}
          <div style={s.meta}>
            {farmer.location?.district && <span>📍 {farmer.location.district}</span>}
            {farmer.farmSize && <span>🌾 {farmer.farmSize}</span>}
            {farmer.phone && <span>📞 {farmer.phone}</span>}
          </div>
        </div>
        <button
          style={chatLoading ? s.chatBtnDisabled : s.chatBtn}
          onClick={handleMessage}
          disabled={chatLoading}
        >
          {chatLoading ? 'Starting...' : '💬 Message'}
        </button>
      </div>

      <div style={s.sectionTitle}>Products by {farmer.name}</div>
      {products.length === 0 ? (
        <div style={s.empty}>No products listed yet.</div>
      ) : (
        <div style={s.grid}>
          {products.map(p => (
            <Link key={p._id} to={`/products/${p._id}`} style={s.productCard}>
              <img
                src={p.images?.[0] || 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400'}
                alt={p.name} style={s.productImg}
                onError={e => e.target.src = 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400'}
              />
              <div style={s.productBody}>
                <div style={s.productName}>{p.name}</div>
                <div style={s.productPrice}>BDT {p.price}/{p.unit}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
