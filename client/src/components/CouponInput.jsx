import { useState } from 'react';
import api from '../api/axios.js';

/**
 * CouponInput — drop this into your checkout page
 *
 * Props:
 *   orderAmount   (number)   — current cart total
 *   onApply       (fn)       — called with { discount, finalAmount, code } when valid
 *   onRemove      (fn)       — called when coupon is removed
 */
export default function CouponInput({ orderAmount, onApply, onRemove }) {
  const [code,     setCode]     = useState('');
  const [result,   setResult]   = useState(null);   // { discount, finalAmount, message, code }
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [applied,  setApplied]  = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/coupons/validate', {
        code: code.trim(),
        orderAmount,
      });
      setResult(data);
      setApplied(true);
      onApply({ discount: data.discount, finalAmount: data.finalAmount, code: code.trim().toUpperCase() });
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid coupon');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setResult(null);
    setError('');
    setApplied(false);
    onRemove();
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--white)' }}>
        🏷️ Have a coupon code?
      </div>

      {!applied ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleValidate()}
            placeholder="e.g. KRISHI20"
            style={{
              flex: 1, background: 'var(--card2)', border: `1px solid ${error ? '#e05555' : 'var(--border)'}`,
              borderRadius: 10, padding: '11px 16px', color: 'var(--white)',
              fontFamily: 'DM Mono, monospace', fontSize: 13, outline: 'none',
              letterSpacing: '0.1em',
            }}
          />
          <button
            onClick={handleValidate}
            disabled={loading || !code.trim()}
            style={{
              background: loading ? 'var(--card2)' : 'var(--green-hi)',
              border: 'none', borderRadius: 10, padding: '11px 20px',
              color: '#fff', fontFamily: 'Sora, sans-serif',
              fontWeight: 600, fontSize: 13, cursor: loading ? 'wait' : 'pointer',
              opacity: !code.trim() ? 0.5 : 1,
            }}
          >
            {loading ? '…' : 'Apply'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(90,176,48,.1)', border: '1px solid rgba(90,176,48,.28)', borderRadius: 10, padding: '12px 16px' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--green-lt)', letterSpacing: '0.08em' }}>{result?.coupon?.code}</div>
            <div style={{ fontSize: 12, color: 'var(--green-hi)', marginTop: 2 }}>{result?.message}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green-lt)' }}>-৳{result?.discount}</div>
            <button onClick={handleRemove} style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora,sans-serif', marginTop: 2 }}>Remove</button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: '#e05555', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
}
