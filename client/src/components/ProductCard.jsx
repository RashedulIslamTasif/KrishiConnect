import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const savings = product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;
  const isPreOrder = product.harvestDate && new Date(product.harvestDate) > new Date();

  return (
    <div
      style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:20, overflow:'hidden', cursor:'pointer', transition:'transform .22s, border-color .22s', display:'flex', flexDirection:'column' }}
      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-4px)';e.currentTarget.style.borderColor='rgba(90,176,48,.4)'}}
      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.borderColor='var(--border)'}}
    >
      <div style={{ height:180, background:'var(--card2)', position:'relative', overflow:'hidden' }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:56 }}>🥦</div>
        }
        <div style={{ position:'absolute', top:10, left:10, display:'flex', flexDirection:'column', gap:6 }}>
          {savings > 0   && <span style={{ background:'var(--green-hi)', color:'#fff', fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', padding:'4px 10px', borderRadius:99 }}>Save {savings}%</span>}
          {isPreOrder    && <span style={{ background:'var(--amber)', color:'#fff', fontSize:10, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', padding:'4px 10px', borderRadius:99 }}>Pre-Order</span>}
        </div>
        {product.farmer?.isVerified && (
          <div style={{ position:'absolute', top:10, right:10, width:26, height:26, borderRadius:'50%', background:'rgba(10,15,8,.75)', border:'1px solid var(--green-hi)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'var(--green-lt)' }}>✓</div>
        )}
      </div>
      <div style={{ padding:16, flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', color:'var(--muted)', marginBottom:5 }}>{product.category}</div>
        <div style={{ fontSize:15, fontWeight:600, color:'var(--white)', marginBottom:4 }}>{product.name}</div>
        <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>
          {product.farmer?.farmName || product.farmer?.name}{product.farmer?.location?.district ? ` · ${product.farmer.location.district}` : ''}
        </div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
          <div style={{ fontSize:20, fontWeight:700, color:'var(--green-lt)' }}>৳{product.price} <span style={{ fontSize:12, fontWeight:400, color:'var(--muted)' }}>/{product.unit}</span></div>
          {product.marketPrice > product.price && <div style={{ fontSize:12, color:'var(--muted)', textDecoration:'line-through' }}>৳{product.marketPrice}</div>}
        </div>
        <Link to={`/products/${product._id}`} style={{
          marginTop:12, display:'block', width:'100%', textAlign:'center',
          background:'rgba(90,176,48,.12)', border:`1px solid ${isPreOrder?'rgba(212,144,10,.35)':'rgba(90,176,48,.25)'}`,
          color: isPreOrder?'var(--amber-lt)':'var(--green-lt)',
          fontFamily:'Sora,sans-serif', fontSize:13, fontWeight:500,
          padding:'10px 0', borderRadius:12, textDecoration:'none', transition:'all .18s',
        }}>
          {isPreOrder ? 'Pre-Order Now' : 'View Product'}
        </Link>
      </div>
    </div>
  );
}
