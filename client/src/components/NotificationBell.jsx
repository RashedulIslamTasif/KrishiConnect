import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import useSocket from '../hooks/useSocket.js';

const ICONS = {
  order_placed:    '📦',
  order_confirmed: '✅',
  order_harvested: '🌾',
  order_delivered: '🎉',
  new_message:     '💬',
  new_review:      '⭐',
  low_stock:       '⚠️',
};

export default function NotificationBell() {
  const [open,   setOpen]   = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [count,  setCount]  = useState(0);
  const socket    = useSocket();
  const dropRef   = useRef(null);
  const navigate  = useNavigate();

  useEffect(() => {
    fetchCount();
    fetchNotifications();
  }, []);

  // Real-time: listen for new notifications via socket
  useEffect(() => {
    if (!socket) return;
    const handler = (notif) => {
      setNotifs(prev => [notif, ...prev]);
      setCount(c => c + 1);
    };
    socket.on('notification', handler);
    return () => socket.off('notification', handler);
  }, [socket]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setCount(data.count);
    } catch {}
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data.notifications);
    } catch {}
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      await api.put(`/notifications/${notif._id}/read`);
      setNotifs(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setCount(c => Math.max(0, c - 1));
    }
    setOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const markAll = async () => {
    await api.put('/notifications/read-all');
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    setCount(0);
  };

  const formatTime = (date) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1)   return 'just now';
    if (mins < 60)  return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 10, width: 38, height: 38, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
          transition: 'border-color .2s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--green-hi)'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        🔔
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#e05555', color: '#fff',
            fontSize: 10, fontWeight: 700,
            width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg)',
          }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 48, right: 0, zIndex: 999,
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 16, width: 340, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Notifications</div>
            {count > 0 && (
              <button onClick={markAll} style={{ fontSize: 11, color: 'var(--green-lt)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Sora,sans-serif' }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifs.length === 0 && (
              <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                🎉 You're all caught up!
              </div>
            )}
            {notifs.map(n => (
              <div
                key={n._id}
                onClick={() => handleClick(n)}
                style={{
                  padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
                  cursor: 'pointer', background: n.isRead ? 'transparent' : 'rgba(90,176,48,.06)',
                  borderBottom: '1px solid rgba(80,130,50,.1)',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(90,176,48,.1)'}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(90,176,48,.06)'}
              >
                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{ICONS[n.type] || '🔔'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: n.isRead ? 400 : 600, marginBottom: 3, lineHeight: 1.4 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 5 }}>{formatTime(n.createdAt)}</div>
                </div>
                {!n.isRead && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green-hi)', flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
