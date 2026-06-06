import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useResponsive } from '../hooks/useResponsive.js';
import useSocket from '../hooks/useSocket.js';

/* ─── tiny style tag injected once ─────────────────────────── */
const CHAT_STYLES = `
  .chat-root {
    --nav-h: 60px;
    position: fixed;
    top: var(--nav-h);
    left: 0; right: 0; bottom: 0;
    display: flex;
    flex-direction: column;
    background: #f5f7f2;
    overflow: hidden;
  }
  /* iOS viewport fix – fills real visible area */
  @supports (height: 100dvh) {
    .chat-root { top: var(--nav-h); height: calc(100dvh - var(--nav-h)); position: fixed; }
  }
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .chat-input-bar {
    flex-shrink: 0;
    display: flex;
    gap: 8px;
    padding: 10px 12px;
    padding-bottom: max(10px, env(safe-area-inset-bottom, 10px));
    background: #fff;
    border-top: 1px solid rgba(60,100,40,.1);
  }
  .chat-input {
    flex: 1;
    background: #f5f7f2;
    border: 1.5px solid rgba(60,100,40,.15);
    border-radius: 24px;
    padding: 11px 16px;
    color: #1a2415;
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 15px;
    outline: none;
    min-width: 0;
  }
  .chat-input:focus { border-color: #4e9e2a; }
  .chat-send-btn {
    background: #4e9e2a;
    border: none;
    border-radius: 50%;
    width: 44px; height: 44px;
    flex-shrink: 0;
    color: #fff;
    font-size: 20px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s;
  }
  .chat-send-btn:active { background: #3d7f22; }
  .bubble-me {
    background: #4e9e2a; color: #fff;
    border-radius: 18px 18px 4px 18px;
    padding: 10px 14px;
    max-width: 78%;
    font-size: 15px;
    line-height: 1.5;
    word-break: break-word;
  }
  .bubble-other {
    background: #eef2ea; color: #1a2415;
    border-radius: 18px 18px 18px 4px;
    padding: 10px 14px;
    max-width: 78%;
    font-size: 15px;
    line-height: 1.5;
    word-break: break-word;
  }
  .chat-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: #fff;
    border-bottom: 1px solid rgba(60,100,40,.1);
    flex-shrink: 0;
  }
  .avatar-circle {
    width: 40px; height: 40px;
    border-radius: 50%;
    background: rgba(90,176,48,.18);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; color: #4e9e2a; font-size: 16px;
    flex-shrink: 0;
  }
  .convo-item {
    padding: 14px 16px;
    display: flex; gap: 12px; align-items: center;
    cursor: pointer;
    border-bottom: 1px solid rgba(60,100,40,.07);
    transition: background .12s;
  }
  .convo-item:active { background: rgba(90,176,48,.1); }
  .back-btn {
    background: transparent;
    border: none;
    color: #4e9e2a;
    font-size: 26px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
    flex-shrink: 0;
  }
`;

function injectStyles() {
  if (document.getElementById('chat-styles')) return;
  const el = document.createElement('style');
  el.id = 'chat-styles';
  el.textContent = CHAT_STYLES;
  document.head.appendChild(el);
}

export default function Chat() {
  const { conversationId: urlConvoId } = useParams();
  const { user }     = useAuth();
  const { isMobile } = useResponsive();
  const socket       = useSocket();
  const navigate     = useNavigate();
  const bottomRef    = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeConvo,   setActiveConvo]   = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState('');
  const [typing,        setTyping]        = useState(false);
  const [isTyping,      setIsTyping]      = useState(false);
  const [mobileView,    setMobileView]    = useState('list');
  const typingTimeout = useRef(null);

  useEffect(() => { injectStyles(); fetchConversations(); }, []);

  useEffect(() => {
    if (!activeConvo) return;
    fetchMessages(activeConvo._id);
    if (isMobile) setMobileView('chat');
    socket?.emit('join_conversation', activeConvo._id);

    const handleMsg = ({ conversationId, message }) => {
      if (conversationId !== activeConvo._id) return;
      const senderId = message.sender?._id || message.sender;
      if (senderId === user._id) return;
      setMessages(prev => prev.some(m => m._id === message._id) ? prev : [...prev, message]);
    };
    const handleTyping_    = () => setIsTyping(true);
    const handleStopTyping = () => setIsTyping(false);

    socket?.on('new_message', handleMsg);
    socket?.on('typing', handleTyping_);
    socket?.on('stop_typing', handleStopTyping);
    return () => {
      socket?.off('new_message', handleMsg);
      socket?.off('typing', handleTyping_);
      socket?.off('stop_typing', handleStopTyping);
    };
  }, [activeConvo, socket, user._id, isMobile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations);
      if (urlConvoId) {
        const found = data.conversations.find(c => c._id === urlConvoId);
        if (found) { setActiveConvo(found); if (isMobile) setMobileView('chat'); }
      } else if (data.conversations.length > 0 && !isMobile) {
        setActiveConvo(data.conversations[0]);
      }
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async (id) => {
    try {
      const { data } = await api.get(`/chat/${id}/messages`);
      setMessages(data.messages);
    } catch (e) { console.error(e); }
  };

  const getOther = (c) => c?.participants?.find(p => p._id !== user._id);

  const handleSend = async () => {
    if (!text.trim() || !activeConvo) return;
    const msgText = text.trim();
    setText('');
    socket?.emit('stop_typing', activeConvo._id);
    try {
      const { data } = await api.post(`/chat/${activeConvo._id}/messages`, { text: msgText });
      setMessages(prev => prev.some(m => m._id === data.message._id) ? prev : [...prev, data.message]);
    } catch (e) { console.error(e); }
  };

  const handleTypingInput = (val) => {
    setText(val);
    if (!activeConvo) return;
    if (!typing) {
      setTyping(true);
      socket?.emit('typing', { conversationId: activeConvo._id, userName: user.name });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setTyping(false);
      socket?.emit('stop_typing', activeConvo._id);
    }, 1500);
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });
  const other = getOther(activeConvo);

  /* ── MOBILE: conversation list ────────────────────────────── */
  if (isMobile && mobileView === 'list') {
    return (
      <div className="chat-root">
        {/* Header */}
        <div className="chat-header">
          <button className="back-btn" onClick={() => navigate(-1)}>‹</button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2415' }}>Messages</div>
            <div style={{ fontSize: 11, color: '#7a9070' }}>{conversations.length} conversations</div>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#7a9070' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a2415', marginBottom: 6 }}>No messages yet</div>
              <div style={{ fontSize: 13 }}>Message a farmer from any product page.</div>
            </div>
          ) : conversations.map(c => {
            const o = getOther(c);
            return (
              <div key={c._id} className="convo-item"
                style={{ background: activeConvo?._id === c._id ? 'rgba(90,176,48,.1)' : 'transparent' }}
                onClick={() => setActiveConvo(c)}>
                <div className="avatar-circle" style={{ width: 48, height: 48, fontSize: 20 }}>{o?.name?.[0] || '?'}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1a2415', marginBottom: 2 }}>{o?.name}</div>
                  <div style={{ fontSize: 12, color: '#7a9070', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.lastMessage || 'Start a conversation'}
                  </div>
                </div>
                <span style={{ color: '#b0bfaa', fontSize: 20 }}>›</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── MOBILE: active chat ──────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="chat-root">
        {/* Header */}
        <div className="chat-header">
          <button className="back-btn" onClick={() => setMobileView('list')}>‹</button>
          {other?.avatar
            ? <img src={other.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div className="avatar-circle">{other?.name?.[0]}</div>}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1a2415', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other?.name}</div>
            <div style={{ fontSize: 11, color: '#4e9e2a' }}>{other?.role === 'farmer' ? '🌾 Farmer' : '🛒 Customer'}</div>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#b0bfaa', fontSize: 13, marginTop: 32 }}>
              Say hello to {other?.name}! 👋
            </div>
          )}
          {messages.map(msg => {
            const isMe = (msg.sender?._id || msg.sender) === user._id;
            return (
              <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <div className={isMe ? 'bubble-me' : 'bubble-other'}>{msg.text}</div>
                <div style={{ fontSize: 10, color: '#a0b090', marginTop: 3 }}>{formatTime(msg.createdAt)}</div>
              </div>
            );
          })}
          {isTyping && (
            <div style={{ alignSelf: 'flex-start', fontSize: 12, color: '#7a9070', fontStyle: 'italic', padding: '4px 8px' }}>
              {other?.name} is typing…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="chat-input-bar">
          <input
            className="chat-input"
            value={text}
            onChange={e => handleTypingInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
            placeholder={`Message ${other?.name || ''}…`}
          />
          <button className="chat-send-btn" onClick={handleSend} aria-label="Send">↑</button>
        </div>
      </div>
    );
  }

  /* ── DESKTOP LAYOUT ───────────────────────────────────────── */
  const h = 'calc(100vh - 60px)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: h, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ background: '#fff', borderRight: '1px solid rgba(60,100,40,.1)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(60,100,40,.1)' }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>Messages</div>
          <div style={{ fontSize: 12, color: '#7a9070', marginTop: 2 }}>{conversations.length} conversations</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#7a9070', fontSize: 13 }}>No conversations yet.</div>}
          {conversations.map(c => {
            const o = getOther(c);
            const act = activeConvo?._id === c._id;
            return (
              <div key={c._id} onClick={() => setActiveConvo(c)}
                style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', background: act ? 'rgba(90,176,48,.12)' : 'transparent', borderLeft: `3px solid ${act ? '#4e9e2a' : 'transparent'}`, transition: 'background .12s' }}>
                <div className="avatar-circle">{o?.name?.[0] || '?'}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2415' }}>{o?.name}</div>
                  <div style={{ fontSize: 11, color: '#7a9070', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage || 'Start a conversation'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat panel */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {!activeConvo ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a9070', fontSize: 14, flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 48 }}>💬</div>
            <div>Select a conversation to start chatting</div>
          </div>
        ) : (
          <>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(60,100,40,.1)', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', flexShrink: 0 }}>
              <div className="avatar-circle" style={{ fontSize: 14 }}>{other?.name?.[0]}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{other?.name}</div>
                <div style={{ fontSize: 11, color: '#4e9e2a' }}>{other?.role === 'farmer' ? '🌾 Farmer' : '🛒 Customer'}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map(msg => {
                const isMe = (msg.sender?._id || msg.sender) === user._id;
                return (
                  <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <div className={isMe ? 'bubble-me' : 'bubble-other'} style={{ maxWidth: '65%' }}>{msg.text}</div>
                    <div style={{ fontSize: 10, color: '#7a9070', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>{formatTime(msg.createdAt)}</div>
                  </div>
                );
              })}
              {isTyping && <div style={{ alignSelf: 'flex-start', fontSize: 12, color: '#7a9070', fontStyle: 'italic' }}>{other?.name} is typing…</div>}
              <div ref={bottomRef} />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(60,100,40,.1)', display: 'flex', gap: 10, background: '#fff', flexShrink: 0 }}>
              <input value={text} onChange={e => handleTypingInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`Message ${other?.name}…`}
                style={{ flex: 1, background: '#fff', border: '1.5px solid rgba(60,100,40,.15)', borderRadius: 12, padding: '12px 18px', color: '#1a2415', fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 14, outline: 'none' }} />
              <button onClick={handleSend}
                style={{ background: '#4e9e2a', border: 'none', borderRadius: 12, padding: '12px 22px', color: '#fff', fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                Send ↑
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}