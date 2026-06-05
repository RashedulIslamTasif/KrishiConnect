import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive.js';
import { useCart } from '../context/CartContext.jsx';

export default function ProductCard({ product }) {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [hover, setHover] = useState(false);
  const savings = product.marketPrice > product.price
    ? Math.round(((product.marketPrice - product.price) / product.marketPrice) * 100) : 0;
  const isPreOrder = product.harvestDate && new Date(product.harvestDate) > new Date();

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background:'#fff',
        border:'1px solid rgba(60,100,40,.1)',
        borderRadius: isMobile ? 18 : 22,
        overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow: hover ? '0 10px 30px rgba(20,50,10,.12)' : '0 2px 8px rgba(20,50,10,.06)',
        transform: hover ? 'translateY(-5px)' : 'translateY(0)',
        transition:'all .28s cubic-bezier(.22,1,.36,1)',
      }}>

      {/* Image */}
      <div style={{ height: isMobile ? 140 : 190, background:'#f0f4ec', position:'relative', overflow:'hidden', cursor:'pointer' }}
        onClick={() => navigate(`/products/${product._id}`)}>
        {product.images?.[0]
          ? <img src={product.images[0]} alt={product.name} style={{ width:'100%', height:'100%', objectFit:'cover', transform: hover ? 'scale(1.07)' : 'scale(1)', transition:'transform .4s ease' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile ? 40 : 60 }}>🥦</div>
        }
        {savings > 0 && (
          <span style={{ position:'absolute', top:9, left:9, background:'#4e9e2a', color:'#fff', fontSize: isMobile ? 9 : 10, fontWeight:700, padding:'3px 9px', borderRadius:99, letterSpacing:'.04em', boxShadow:'0 1px 4px rgba(0,0,0,.15)' }}>
            SAVE {savings}%
          </span>
        )}
        {isPreOrder && (
          <span style={{ position:'absolute', top: savings > 0 ? 30 : 9, left:9, background:'#d4900a', color:'#fff', fontSize: isMobile ? 9 : 10, fontWeight:700, padding:'3px 9px', borderRadius:99 }}>
            PRE-ORDER
          </span>
        )}
        {product.farmer?.isVerified && (
          <div style={{ position:'absolute', top:9, right:9, width:24, height:24, borderRadius:'50%', background:'#fff', border:'1.5px solid #4e9e2a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:'#4e9e2a', boxShadow:'0 1px 4px rgba(0,0,0,.1)' }}>✓</div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: isMobile ? 12 : 18, flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ fontSize: isMobile ? 9 : 10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'#afc09e', marginBottom:4 }}>{product.category}</div>
        <div style={{ fontSize: isMobile ? 14 : 16, fontWeight:800, color:'#1a2415', marginBottom:3, lineHeight:1.3 }}>{product.name}</div>
        <div style={{ fontSize: isMobile ? 11 : 12, color:'#7a9070', marginBottom: isMobile ? 10 : 14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {product.farmer?.farmName || product.farmer?.name}{product.farmer?.location?.district ? ` · ${product.farmer.location.district}` : ''}
        </div>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: isMobile ? 10 : 14 }}>
          <div style={{ fontSize: isMobile ? 17 : 22, fontWeight:800, color:'#4e9e2a' }}>
            ৳{product.price} <span style={{ fontSize: isMobile ? 11 : 13, fontWeight:400, color:'#7a9070' }}>/{product.unit}</span>
          </div>
          {product.marketPrice > product.price && (
            <div style={{ fontSize: isMobile ? 10 : 12, color:'#afc09e', textDecoration:'line-through' }}>৳{product.marketPrice}</div>
          )}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Link to={`/products/${product._id}`} style={{ flex:1, textAlign:'center', background: isPreOrder ? '#fef3d8' : '#e8f5e1', border:'none', color: isPreOrder ? '#c47d0a' : '#4e9e2a', fontFamily:'Plus Jakarta Sans,sans-serif', fontSize: isMobile ? 12 : 13, fontWeight:700, padding: isMobile ? '9px 0' : '11px 0', borderRadius: isMobile ? 10 : 12, textDecoration:'none', transition:'all .2s' }}>
            {isPreOrder ? '📅 Pre-Order' : 'View →'}
          </Link>
          {!isPreOrder && (
            <button
              onClick={() => { addToCart(product,1); setAdded(true); setTimeout(()=>setAdded(false),1500); }}
              style={{ width: isMobile ? 36 : 42, borderRadius: isMobile ? 10 : 12, background: added ? '#4e9e2a' : '#fff', border:'1.5px solid rgba(60,100,40,.2)', color: added ? '#fff' : '#4e9e2a', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s', flexShrink:0 }}>
              {added ? '✓' : '+'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
