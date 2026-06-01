import { Link } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive.js';

const features = [
  { icon:'📊', title:'Price Comparison',   desc:'See exactly how much you save vs local market on every product.' },
  { icon:'📅', title:'Harvest Pre-Order',  desc:'Book crops before harvest. Guaranteed freshness, guaranteed income.' },
  { icon:'🗺️', title:'Find Local Farmers', desc:'Browse verified farmers near you across Bangladesh.' },
  { icon:'✅', title:'Verified Farmers',   desc:'NID-verified badge gives you confidence in every purchase.' },
  { icon:'📈', title:'Price History',      desc:'Track price trends over weeks so you always buy at the right time.' },
  { icon:'📱', title:'QR Order Receipt',   desc:'Unique QR code for every order — simple delivery verification.' },
];

export default function Home() {
  const { isMobile } = useResponsive();

  return (
    <div>
      {/* Hero */}
      <div style={{ position:'relative', minHeight: isMobile ? '100svh' : '100vh', display:'flex', flexDirection:'column' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:"url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=70&fit=crop')", backgroundSize:'cover', backgroundPosition:'center 30%', filter:'brightness(0.32) saturate(0.7)' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(10,15,8,.25) 0%, rgba(10,15,8,.55) 55%, rgba(10,15,8,1) 100%)' }} />
        <div style={{ position:'relative', zIndex:5, flex:1, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding: isMobile ? '0 20px 60px' : '0 56px 80px', maxWidth: isMobile ? '100%' : 700 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(90,176,48,.14)', border:'1px solid rgba(90,176,48,.3)', color:'var(--green-lt)', fontSize:11, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', padding:'6px 16px', borderRadius:99, marginBottom:20 }}>
            🌱 Farm Fresh · Direct to You
          </div>
          <h1 style={{ fontSize: isMobile ? 36 : 64, fontWeight:700, lineHeight:1.06, letterSpacing:'-0.03em', marginBottom:16 }}>
            Buy directly from<br />
            <span style={{ color:'var(--green-lt)' }}>the farmer.</span>
          </h1>
          <p style={{ fontSize: isMobile ? 14 : 16, fontWeight:300, lineHeight:1.7, color:'rgba(240,244,236,.58)', marginBottom:28 }}>
            Fresh produce, fair prices. Cut out the middleman and connect with verified farmers across Bangladesh — right from your home.
          </p>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
            <Link to="/marketplace" style={{ background:'var(--green-hi)', color:'#fff', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize: isMobile ? 14 : 15, padding: isMobile ? '13px 24px' : '14px 32px', borderRadius:99, textDecoration:'none' }}>Browse Marketplace</Link>
            <Link to="/register" style={{ background:'rgba(255,255,255,.07)', color:'var(--white)', fontFamily:'Sora,sans-serif', fontWeight:500, fontSize: isMobile ? 14 : 15, padding: isMobile ? '13px 24px' : '14px 32px', borderRadius:99, border:'1px solid rgba(255,255,255,.15)', textDecoration:'none' }}>I'm a Farmer →</Link>
          </div>
          <div style={{ display:'flex', gap: isMobile ? 24 : 48, marginTop:40, paddingTop:28, borderTop:'1px solid var(--border)', flexWrap:'wrap' }}>
            {[['2,400+','Verified Farmers'],['৳18 Cr+','Saved by Customers'],['64','Districts Covered']].map(([num,lbl]) => (
              <div key={lbl}>
                <div style={{ fontSize: isMobile ? 22 : 30, fontWeight:700, color:'var(--white)', lineHeight:1 }}>{num}</div>
                <div style={{ fontSize: isMobile ? 11 : 12, color:'var(--muted)', marginTop:4 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: isMobile ? '48px 20px' : '80px 56px' }}>
        <div style={{ textAlign:'center', marginBottom: isMobile ? 32 : 56 }}>
          <div style={{ fontSize: isMobile ? 24 : 36, fontWeight:700, letterSpacing:'-0.03em', marginBottom:12 }}>
            Built for Bangladesh farmers
          </div>
          <div style={{ fontSize: isMobile ? 13 : 15, color:'var(--muted)', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
            Every feature designed for the needs of Bangladeshi farmers and customers.
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 20 }}>
          {features.map(f => (
            <div key={f.title} style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius: isMobile ? 14 : 20, padding: isMobile ? 16 : 28 }}>
              <div style={{ fontSize: isMobile ? 28 : 36, marginBottom: isMobile ? 10 : 16 }}>{f.icon}</div>
              <div style={{ fontSize: isMobile ? 13 : 16, fontWeight:700, marginBottom: isMobile ? 6 : 10 }}>{f.title}</div>
              <div style={{ fontSize: isMobile ? 11 : 13, color:'var(--muted)', lineHeight:1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: isMobile ? '40px 20px' : '80px 56px', textAlign:'center', background:'linear-gradient(180deg, transparent, rgba(90,176,48,.06))' }}>
        <div style={{ fontSize: isMobile ? 24 : 40, fontWeight:700, marginBottom:16 }}>Ready to buy fresh?</div>
        <div style={{ fontSize: isMobile ? 13 : 16, color:'var(--muted)', marginBottom:28 }}>Join thousands of customers buying directly from farmers.</div>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <Link to="/marketplace" style={{ background:'var(--green-hi)', color:'#fff', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize: isMobile ? 14 : 15, padding: isMobile ? '13px 24px' : '14px 32px', borderRadius:99, textDecoration:'none' }}>Shop Now</Link>
          <Link to="/register" style={{ background:'transparent', color:'var(--green-lt)', fontFamily:'Sora,sans-serif', fontWeight:600, fontSize: isMobile ? 14 : 15, padding: isMobile ? '13px 24px' : '14px 32px', borderRadius:99, border:'1px solid rgba(90,176,48,.3)', textDecoration:'none' }}>Create Account</Link>
        </div>
      </div>
    </div>
  );
}
