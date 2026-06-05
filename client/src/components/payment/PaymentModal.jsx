import { useState } from 'react';
import api from '../../api/axios.js';

const METHODS = [
  {
    key:   'bkash',
    label: 'bKash',
    color: '#E2136E',
    bg:    '#fff0f7',
    border:'#E2136E',
    logo:  '🟣',
    desc:  'Pay instantly with bKash mobile wallet',
    tag:   'Most Popular',
  },
  {
    key:   'nagad',
    label: 'Nagad',
    color: '#F16522',
    bg:    '#fff5f0',
    border:'#F16522',
    logo:  '🟠',
    desc:  'Pay instantly with Nagad mobile wallet',
    tag:   null,
  },
  {
    key:   'cash_on_delivery',
    label: 'Cash on Delivery',
    color: '#4e9e2a',
    bg:    '#f0f9eb',
    border:'rgba(78,158,42,.3)',
    logo:  '💵',
    desc:  'Pay in cash when your order arrives',
    tag:   null,
  },
];

export default function PaymentModal({ order, onClose, onCodConfirmed }) {
  const [selected,  setSelected]  = useState('bkash');
  const [address,   setAddress]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [addrFocus, setAddrFocus] = useState(false);

  const method = METHODS.find(m => m.key === selected);

  const handlePay = async () => {
    if (!address.trim()) { setError('Please enter a delivery address.'); return; }
    setError('');
    setLoading(true);

    try {
      // First update the order with address + payment method if needed
      if (order.deliveryAddress !== address || order.paymentMethod !== selected) {
        await api.put(`/orders/${order._id}/payment-method`, {
          deliveryAddress: address,
          paymentMethod:   selected,
        }).catch(() => {}); // best-effort — order already exists
      }

      if (selected === 'cash_on_delivery') {
        onCodConfirmed?.({ address, payment: 'cash_on_delivery' });
        return;
      }

      // bKash
      if (selected === 'bkash') {
        const { data } = await api.post('/payment/bkash/create', { orderId: order._id });
        // Redirect to bKash hosted page
        window.location.href = data.bkashURL;
        return;
      }

      // Nagad
      if (selected === 'nagad') {
        const { data } = await api.post('/payment/nagad/create', { orderId: order._id });
        window.location.href = data.callURL;
        return;
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Payment initiation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position:'fixed', inset:0,
      background:'rgba(10,20,8,.7)', backdropFilter:'blur(8px)',
      display:'flex', alignItems:'flex-end', justifyContent:'center',
      zIndex:1200, padding:0,
    }}>
      <div style={{
        background:'#fff', borderRadius:'28px 28px 0 0',
        width:'100%', maxWidth:520,
        maxHeight:'92vh', overflowY:'auto',
        animation:'slideUp .35s cubic-bezier(.22,1,.36,1) both',
        boxShadow:'0 -8px 40px rgba(0,0,0,.2)',
      }}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(60px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* Handle */}
        <div style={{ width:40, height:4, background:'#e0e8da', borderRadius:99, margin:'14px auto 0' }} />

        {/* Header */}
        <div style={{ padding:'16px 24px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:'#1a2415', letterSpacing:'-0.02em' }}>Choose Payment</div>
            <div style={{ fontSize:13, color:'#7a9070', marginTop:2 }}>
              Total: <strong style={{ color:'#4e9e2a', fontSize:16 }}>৳{order.totalAmount?.toLocaleString()}</strong>
            </div>
          </div>
          <button onClick={onClose} style={{
            background:'#f5f7f2', border:'none', borderRadius:'50%',
            width:36, height:36, fontSize:18, cursor:'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', color:'#7a9070',
          }}>✕</button>
        </div>

        <div style={{ padding:'20px 24px 40px' }}>
          {/* Order summary strip */}
          <div style={{
            background:'#f5f7f2', borderRadius:16, padding:'12px 16px',
            display:'flex', gap:12, marginBottom:20, overflowX:'auto',
          }}>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                {item.image
                  ? <img src={item.image} alt={item.name} style={{ width:36, height:36, borderRadius:10, objectFit:'cover' }} />
                  : <div style={{ width:36, height:36, borderRadius:10, background:'#e8f5e1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🌿</div>
                }
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'#1a2415' }}>{item.name}</div>
                  <div style={{ fontSize:11, color:'#7a9070' }}>×{item.quantity} · ৳{(item.price * item.quantity).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Delivery address */}
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#7a9070',
            textTransform:'uppercase', letterSpacing:'.07em', marginBottom:8 }}>
            📍 Delivery Address *
          </label>
          <textarea
            value={address} onChange={e => setAddress(e.target.value)}
            placeholder="House/Flat, Road, Area, District..."
            onFocus={() => setAddrFocus(true)} onBlur={() => setAddrFocus(false)}
            rows={3}
            style={{
              width:'100%', borderRadius:16, padding:'13px 16px', fontSize:14, outline:'none',
              fontFamily:'Plus Jakarta Sans,sans-serif', boxSizing:'border-box', resize:'none',
              background: addrFocus ? '#f9faf7' : '#f5f7f2',
              border: `1.5px solid ${addrFocus ? '#4e9e2a' : 'rgba(60,100,40,.12)'}`,
              boxShadow: addrFocus ? '0 0 0 3px rgba(78,158,42,.1)' : 'none',
              color:'#1a2415', transition:'all .2s', marginBottom:20,
            }}
          />

          {/* Payment method cards */}
          <div style={{ fontSize:11, fontWeight:700, color:'#7a9070',
            textTransform:'uppercase', letterSpacing:'.07em', marginBottom:10 }}>
            💳 Payment Method
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
            {METHODS.map(m => {
              const isSelected = selected === m.key;
              return (
                <button key={m.key} onClick={() => setSelected(m.key)} style={{
                  background: isSelected ? m.bg : '#f9faf7',
                  border: `2px solid ${isSelected ? m.border : 'rgba(60,100,40,.1)'}`,
                  borderRadius:18, padding:'14px 18px',
                  display:'flex', alignItems:'center', gap:14,
                  cursor:'pointer', textAlign:'left', fontFamily:'Plus Jakarta Sans,sans-serif',
                  transition:'all .2s cubic-bezier(.22,1,.36,1)',
                  boxShadow: isSelected ? `0 4px 16px ${m.color}22` : 'none',
                  transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                }}>
                  {/* Logo circle */}
                  <div style={{
                    width:48, height:48, borderRadius:14, flexShrink:0,
                    background: isSelected ? m.color : '#f0f4ec',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:24, transition:'background .2s',
                  }}>{m.logo}</div>

                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                      <span style={{ fontSize:15, fontWeight:800, color: isSelected ? m.color : '#1a2415' }}>{m.label}</span>
                      {m.tag && (
                        <span style={{ background: m.color, color:'#fff', fontSize:9, fontWeight:700,
                          padding:'2px 8px', borderRadius:99, letterSpacing:'.05em' }}>{m.tag}</span>
                      )}
                    </div>
                    <div style={{ fontSize:12, color:'#7a9070', lineHeight:1.4 }}>{m.desc}</div>
                  </div>

                  {/* Radio dot */}
                  <div style={{
                    width:20, height:20, borderRadius:'50%', flexShrink:0,
                    border: `2px solid ${isSelected ? m.color : 'rgba(60,100,40,.2)'}`,
                    background: isSelected ? m.color : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all .2s',
                  }}>
                    {isSelected && <div style={{ width:8, height:8, borderRadius:'50%', background:'#fff' }} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background:'#fde8e8', border:'1px solid rgba(192,64,64,.2)', color:'#c04040',
              borderRadius:12, padding:'11px 16px', fontSize:13, fontWeight:600,
              marginBottom:16, display:'flex', alignItems:'center', gap:8,
            }}>⚠ {error}</div>
          )}

          {/* Gateway notice */}
          {(selected === 'bkash' || selected === 'nagad') && (
            <div style={{
              background: selected === 'bkash' ? '#fff0f7' : '#fff5f0',
              border: `1px solid ${selected === 'bkash' ? 'rgba(226,19,110,.15)' : 'rgba(241,101,34,.15)'}`,
              borderRadius:14, padding:'12px 16px', marginBottom:16,
              display:'flex', alignItems:'flex-start', gap:10,
            }}>
              <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>ℹ️</span>
              <div style={{ fontSize:12, color:'#555', lineHeight:1.6 }}>
                You'll be securely redirected to {selected === 'bkash' ? 'bKash' : 'Nagad'} to complete payment.
                After payment, you'll return here automatically.
              </div>
            </div>
          )}

          {/* Pay button */}
          <button onClick={handlePay} disabled={loading} style={{
            width:'100%',
            background: loading
              ? 'rgba(60,100,40,.2)'
              : selected === 'bkash'  ? 'linear-gradient(135deg,#E2136E,#b50d57)'
              : selected === 'nagad'  ? 'linear-gradient(135deg,#F16522,#c44d10)'
              : 'linear-gradient(135deg,#4e9e2a,#3a7d1e)',
            color:'#fff', border:'none', borderRadius:99, padding:'16px',
            fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:16,
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none'
              : selected === 'bkash' ? '0 4px 18px rgba(226,19,110,.4)'
              : selected === 'nagad' ? '0 4px 18px rgba(241,101,34,.4)'
              : '0 4px 18px rgba(78,158,42,.4)',
            transition:'all .2s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          }}>
            {loading ? (
              <>
                <span style={{ display:'inline-block', width:18, height:18, border:'2px solid rgba(255,255,255,.4)',
                  borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
                Redirecting…
              </>
            ) : (
              selected === 'cash_on_delivery'
                ? '✓ Confirm Order'
                : `Pay ৳${order.totalAmount?.toLocaleString()} with ${method.label} →`
            )}
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

          {/* Security note */}
          <div style={{ textAlign:'center', marginTop:14, fontSize:11, color:'#afc09e',
            display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            🔒 Secured by SSL. Your payment is 100% safe.
          </div>
        </div>
      </div>
    </div>
  );
}