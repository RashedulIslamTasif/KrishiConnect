import { Link } from 'react-router-dom';

const s = {
  hero: { position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  bg: { position: 'absolute', inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=70&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center 30%', filter: 'brightness(0.32) saturate(0.7)' },
  overlay: { position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,15,8,.25) 0%, rgba(10,15,8,.55) 55%, rgba(10,15,8,1) 100%)' },
  content: { position: 'relative', zIndex: 5, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 56px 80px', maxWidth: 700 },
  tag: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(90,176,48,.14)', border: '1px solid rgba(90,176,48,.3)', color: 'var(--green-lt)', fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: 99, marginBottom: 24 },
  title: { fontSize: 'clamp(40px,5.5vw,74px)', fontWeight: 700, lineHeight: 1.06, letterSpacing: '-0.03em', marginBottom: 20 },
  desc: { fontSize: 16, fontWeight: 300, lineHeight: 1.7, color: 'rgba(240,244,236,.58)', maxWidth: 440, marginBottom: 36 },
  actions: { display: 'flex', gap: 14, alignItems: 'center' },
  btnMain: { background: 'var(--green-hi)', color: '#fff', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 15, padding: '14px 32px', borderRadius: 99, border: 'none', cursor: 'pointer', transition: 'all .2s', textDecoration: 'none', display: 'inline-block' },
  btnSecond: { background: 'rgba(255,255,255,.07)', color: 'var(--white)', fontFamily: 'Sora,sans-serif', fontWeight: 500, fontSize: 15, padding: '14px 32px', borderRadius: 99, border: '1px solid rgba(255,255,255,.15)', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
  stats: { display: 'flex', gap: 48, marginTop: 60, paddingTop: 36, borderTop: '1px solid var(--border)' },
  statNum: { fontSize: 30, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--white)', lineHeight: 1 },
  statLbl: { fontSize: 12, color: 'var(--muted)', marginTop: 5, fontWeight: 400 },
};

const features = [
  { icon: '📊', title: 'Price Comparison', desc: 'See exactly how much you save vs local market — on every product.' },
  { icon: '📅', title: 'Harvest Pre-Order', desc: 'Book crops before harvest. Guaranteed freshness, guaranteed income.' },
  { icon: '🗺️', title: 'Find Local Farmers', desc: 'Interactive map of verified farmers near you across Bangladesh.' },
  { icon: '✅', title: 'Verified Farmers', desc: 'NID-verified badge gives you confidence in every purchase.' },
  { icon: '📈', title: 'Price History', desc: 'Track price trends over weeks so you always buy at the right time.' },
  { icon: '📱', title: 'QR Order Receipt', desc: 'Unique QR code for every order — simple delivery verification.' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.bg} />
        <div style={s.overlay} />
        <div style={s.content}>
          <div style={s.tag}>🌱 Farm Fresh · Direct to You</div>
          <h1 style={s.title}>
            Buy directly from<br />
            <span style={{ color: 'var(--green-lt)' }}>the farmer.</span>
          </h1>
          <p style={s.desc}>
            Fresh produce, fair prices. Cut out the middleman and connect with verified farmers across Bangladesh — right from your home.
          </p>
          <div style={s.actions}>
            <Link to="/marketplace" style={s.btnMain}>Browse Marketplace</Link>
            <Link to="/register?role=farmer" style={s.btnSecond}>I'm a Farmer →</Link>
          </div>
          <div style={s.stats}>
            {[['2,400+', 'Verified Farmers'], ['৳18 Cr+', 'Saved by Customers'], ['64', 'Districts Covered']].map(([num, lbl]) => (
              <div key={lbl}>
                <div style={s.statNum}>{num}</div>
                <div style={s.statLbl}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '80px 56px', background: 'var(--surface)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--green-lt)', marginBottom: 10 }}>Why KrishiConnect</div>
          <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1 }}>Built for Bangladesh farmers</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, maxWidth: 900, margin: '0 auto' }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 20, padding: 28, transition: 'border-color .2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(90,176,48,.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA banner */}
      <div style={{ padding: '72px 56px', background: 'var(--bg)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 16 }}>
          Ready to eat <span style={{ color: 'var(--green-lt)' }}>fresh</span>?
        </h2>
        <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 32 }}>Join 12,000+ customers buying direct from farmers today.</p>
        <Link to="/marketplace" style={{ ...s.btnMain, fontSize: 16, padding: '16px 40px' }}>Explore the Marketplace →</Link>
      </div>
    </div>
  );
}
