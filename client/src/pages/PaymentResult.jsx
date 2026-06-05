import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const status  = searchParams.get('status');   // success | failure | cancel
  const orderId = searchParams.get('orderId');
  const trxID   = searchParams.get('trxID');

  const [order,    setOrder]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(null); // null | true | false

  useEffect(() => {
    if (!orderId) return;
    api.get(`/orders/${orderId}`)
      .then(r => setOrder(r.data.order))
      .catch(()=>{})
      .finally(() => setLoading(false));
  }, [orderId]);

  // If status === success, auto-verify with backend
  useEffect(() => {
    if (status !== 'success' || !orderId || !order) return;
    const gateway = order.paymentTransaction?.gateway;
    if (!gateway || gateway === 'cash_on_delivery') return;

    setVerifying(true);
    api.get(`/payment/${gateway}/verify/${orderId}`)
      .then(r => setVerified(r.data.isPaid === true))
      .catch(() => setVerified(false))
      .finally(() => setVerifying(false));
  }, [status, orderId, order]);

  const isSuccess = status === 'success';
  const isCancel  = status === 'cancel';

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#f5f7f2', fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48, height:48, border:'3px solid #e8f5e1', borderTopColor:'#4e9e2a',
          borderRadius:'50%', animation:'spin .8s linear infinite', margin:'0 auto 16px' }} />
        <div style={{ color:'#7a9070', fontSize:14 }}>Confirming your payment…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'#f5f7f2', display:'flex', alignItems:'center',
      justifyContent:'center', padding:24, fontFamily:'Plus Jakarta Sans,sans-serif' }}>
      <style>{`
        @keyframes pop    { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
      `}</style>

      <div style={{ background:'#fff', borderRadius:28, padding:'40px 32px', maxWidth:440, width:'100%',
        textAlign:'center', boxShadow:'0 8px 40px rgba(20,50,10,.1)',
        animation:'pop .4s cubic-bezier(.22,1,.36,1) both' }}>

        {/* Icon */}
        <div style={{
          width:80, height:80, borderRadius:'50%', margin:'0 auto 20px',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:36,
          background: isSuccess ? 'linear-gradient(135deg,#4e9e2a,#3a7d1e)'
                    : isCancel  ? 'linear-gradient(135deg,#f0b840,#c47d0a)'
                                : 'linear-gradient(135deg,#e05555,#c04040)',
          boxShadow: isSuccess ? '0 8px 24px rgba(78,158,42,.35)'
                   : isCancel  ? '0 8px 24px rgba(240,184,64,.35)'
                               : '0 8px 24px rgba(224,85,85,.35)',
          animation:'pop .4s .1s cubic-bezier(.22,1,.36,1) both',
        }}>
          {isSuccess ? '✓' : isCancel ? '⏸' : '✕'}
        </div>

        {/* Title */}
        <div style={{ fontSize:24, fontWeight:800, color:'#1a2415', letterSpacing:'-0.03em', marginBottom:8,
          animation:'fadeUp .4s .15s cubic-bezier(.22,1,.36,1) both' }}>
          {isSuccess ? 'Payment Successful!' : isCancel ? 'Payment Cancelled' : 'Payment Failed'}
        </div>

        {/* Subtitle */}
        <div style={{ fontSize:14, color:'#7a9070', lineHeight:1.6, marginBottom:24,
          animation:'fadeUp .4s .2s cubic-bezier(.22,1,.36,1) both' }}>
          {isSuccess
            ? 'Your order has been placed and payment confirmed. The farmer will prepare your order shortly.'
            : isCancel
            ? 'You cancelled the payment. Your order is still saved — you can retry.'
            : 'Something went wrong with your payment. Please try again or use a different method.'}
        </div>

        {/* Transaction details */}
        {(isSuccess || order) && (
          <div style={{ background:'#f5f7f2', borderRadius:16, padding:'16px', marginBottom:24,
            textAlign:'left', animation:'fadeUp .4s .25s cubic-bezier(.22,1,.36,1) both' }}>
            {trxID && (
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <span style={{ fontSize:12, color:'#7a9070', fontWeight:600 }}>Transaction ID</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#1a2415', fontFamily:'monospace' }}>{trxID}</span>
              </div>
            )}
            {order && (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:12, color:'#7a9070', fontWeight:600 }}>Order ID</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#1a2415', fontFamily:'monospace' }}>
                    #{order._id.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                  <span style={{ fontSize:12, color:'#7a9070', fontWeight:600 }}>Amount</span>
                  <span style={{ fontSize:13, fontWeight:800, color:'#4e9e2a' }}>৳{order.totalAmount?.toLocaleString()}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:12, color:'#7a9070', fontWeight:600 }}>Method</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#1a2415', textTransform:'capitalize' }}>
                    {order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' : order.paymentMethod}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Verification status */}
        {verifying && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            fontSize:13, color:'#7a9070', marginBottom:20 }}>
            <div style={{ width:16, height:16, border:'2px solid #e8f5e1', borderTopColor:'#4e9e2a',
              borderRadius:'50%', animation:'spin .7s linear infinite' }} />
            Verifying payment with gateway…
          </div>
        )}
        {!verifying && verified === true && (
          <div style={{ background:'#e8f5e1', borderRadius:12, padding:'10px 16px', marginBottom:20,
            fontSize:13, fontWeight:700, color:'#3a7d1e', display:'flex', alignItems:'center', gap:8 }}>
            ✓ Payment verified by gateway
          </div>
        )}
        {!verifying && verified === false && (
          <div style={{ background:'#fde8e8', borderRadius:12, padding:'10px 16px', marginBottom:20,
            fontSize:13, fontWeight:600, color:'#c04040', display:'flex', alignItems:'center', gap:8 }}>
            ⚠ Gateway verification pending — if you were charged, contact support.
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', flexDirection:'column', gap:10,
          animation:'fadeUp .4s .3s cubic-bezier(.22,1,.36,1) both' }}>
          {isSuccess && orderId && (
            <Link to={`/orders/${orderId}`} style={{
              background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff',
              borderRadius:99, padding:'14px', textDecoration:'none',
              fontWeight:800, fontSize:15, fontFamily:'Plus Jakarta Sans,sans-serif',
              boxShadow:'0 4px 14px rgba(78,158,42,.35)',
              display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            }}>Track My Order →</Link>
          )}
          {!isSuccess && orderId && (
            <button onClick={() => navigate(`/orders/${orderId}`)} style={{
              background:'linear-gradient(135deg,#4e9e2a,#3a7d1e)', color:'#fff',
              border:'none', borderRadius:99, padding:'14px',
              fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, fontSize:15,
              cursor:'pointer', boxShadow:'0 4px 14px rgba(78,158,42,.35)',
            }}>Retry Payment</button>
          )}
          <Link to="/marketplace" style={{
            background:'#f5f7f2', color:'#7a9070',
            borderRadius:99, padding:'13px', textDecoration:'none',
            fontWeight:700, fontSize:14, fontFamily:'Plus Jakarta Sans,sans-serif',
            border:'1px solid rgba(60,100,40,.1)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>Continue Shopping</Link>
        </div>

        {/* Support note */}
        <div style={{ marginTop:20, fontSize:11, color:'#afc09e', lineHeight:1.6 }}>
          Questions? Contact us at{' '}
          <a href="mailto:support@krishiconnect.com" style={{ color:'#4e9e2a', textDecoration:'none', fontWeight:700 }}>
            support@krishiconnect.com
          </a>
        </div>
      </div>
    </div>
  );
}