import { Link } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive.js';

export default function ProductCard({ product }) {
  const { isMobile } = useResponsive();
  const savings = product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;
  const isPreOrder = product.harvestDate && new Date(product.harvestDate) > new Date();

  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius: isMobile ? 14 : 20, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      
      {/* Image */}
      <div style={{ height: isMobile ? 130 : 180, background:'var(--card2)', position:'relative', overflow:'hidden' }}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile ? 36 : 56 }}>🥦</div>
        }
        {savings > 0 && (
          <span style={{ position:'absolute', top:8, left:8, background:'var(--green-hi)', color:'#fff', fontSize: isMobile ? 9 : 10, fontWeight:700, padding:'3px 8px', borderRadius:99 }}>
            SAVE {savings}% ✓
          </span>
        )}
        {isPreOrder && (
          <span style={{ position:'absolute', top: savings > 0 ? 30 : 8, left:8, background:'var(--amber)', color:'#fff', fontSize: isMobile ? 9 : 10, fontWeight:700, padding:'3px 8px', borderRadius:99 }}>
            PRE-ORDER
          </span>
        )}
        {product.farmer?.isVerified && (
          <div style={{ position:'absolute', top:8, right:8, width:22, height:22, borderRadius:'50%', background:'rgba(10,15,8,.8)', border:'1px solid var(--green-hi)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:'var(--green-lt)' }}>✓</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: isMobile ? 10 : 16, flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ fontSize: isMobile ? 9 : 10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', marginBottom:3 }}>{product.category}</div>
        <div style={{ fontSize: isMobile ? 13 : 15, fontWeight:600, color:'var(--white)', marginBottom:2, lineHeight:1.3 }}>{product.name}</div>
        <div style={{ fontSize: isMobile ? 10 : 12, color:'var(--muted)', marginBottom: isMobile ? 8 : 12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {product.farmer?.farmName || product.farmer?.name}{product.farmer?.location?.district ? ` · ${product.farmer.location.district}` : ''}
        </div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: isMobile ? 8 : 12 }}>
          <div style={{ fontSize: isMobile ? 16 : 20, fontWeight:700, color:'var(--green-lt)' }}>
            ৳{product.price} <span style={{ fontSize: isMobile ? 10 : 12, fontWeight:400, color:'var(--muted)' }}>/{product.unit}</span>
          </div>
          {product.marketPrice > product.price && (
            <div style={{ fontSize: isMobile ? 10 : 12, color:'var(--muted)', textDecoration:'line-through' }}>৳{product.marketPrice}</div>
          )}
        </div>
        <Link to={`/products/${product._id}`} style={{ display:'block', width:'100%', textAlign:'center', background:'rgba(90,176,48,.12)', border:`1px solid ${isPreOrder?'rgba(212,144,10,.35)':'rgba(90,176,48,.25)'}`, color: isPreOrder?'var(--amber-lt)':'var(--green-lt)', fontFamily:'Sora,sans-serif', fontSize: isMobile ? 12 : 13, fontWeight:500, padding: isMobile ? '8px 0' : '10px 0', borderRadius: isMobile ? 8 : 12, textDecoration:'none' }}>
          {isPreOrder ? 'Pre-Order' : 'View Product'}
        </Link>
      </div>
    </div>
  );
}
