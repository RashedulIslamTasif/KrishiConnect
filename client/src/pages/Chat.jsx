import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useResponsive } from '../hooks/useResponsive.js';
import useSocket from '../hooks/useSocket.js';

const S = `
  .chat-root {
    position: fixed;
    top: calc(58px + env(safe-area-inset-top, 0px));
    left: 0; right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    background: #f0f2f0;
    overflow: hidden;
  }
  .chat-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    height: 60px;
    min-height: 60px;
    background: #fff;
    border-bottom: 1px solid rgba(0,0,0,.08);
    flex-shrink: 0;
    box-shadow: 0 1px 4px rgba(0,0,0,.06);
  }
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 12px 14px 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    overscroll-behavior: contain;
  }
  .chat-input-bar {
    flex-shrink: 0;
    display: flex;
    align-items: flex-end;
    gap: 10px;
    padding: 10px 14px;
    padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
    background: #fff;
    border-top: 1px solid rgba(0,0,0,.08);
  }
  .chat-input {
    flex: 1;
    background: #f0f2f0;
    border: none;
    border-radius: 22px;
    padding: 10px 16px;
    color: #1a1a1a;
    font-family: inherit;
    font-size: 15px;
    outline: none;
    resize: none;
    max-height: 120px;
    line-height: 1.4;
  }
  .chat-send-btn {
    background: #4e9e2a;
    border: none;
    border-radius: 50%;
    width: 40px; height: 40px;
    flex-shrink: 0;
    color: #fff;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s, transform .1s;
  }
  .chat-send-btn:active { background: #3d7f22; transform: scale(.92); }
  .bubble-me {
    background: #4e9e2a;
    color: #fff;
    border-radius: 18px 18px 4px 18px;
    padding: 9px 13px;
    max-width: 75%;
    font-size: 15px;
    line-height: 1.45;
    word-break: break-word;
  }
  .bubble-other {
    background: #fff;
    color: #1a1a1a;
    border-radius: 18px 18px 18px 4px;
    padding: 9px 13px;
    max-width: 75%;
    font-size: 15px;
    line-height: 1.45;
    word-break: break-word;
    box-shadow: 0 1px 2px rgba(0,0,0,.08);
  }
  .back-btn {
    background: transparent;
    border: none;
    color: #4e9e2a;
    font-size: 28px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    width: 36px; height: 36px;
  }
  .av {
    width: 40px; height: 40px; border-radius: 50%;
    background: rgba(78,158,42,.18);
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; color: #4e9e2a; font-size: 16px;
    flex-shrink: 0; overflow: hidden;
  }
  .av img { width: 100%; height: 100%; object-fit: cover; }
  .convo-item {
    display: flex; gap: 12px; align-items: center;
    padding: 13px 16px;
    cursor: pointer;
    border-bottom: 1px solid rgba(0,0,0,.05);
    transition: background .12s;
    background: #fff;
  }
  .convo-item:active { background: #f0f2f0; }
  .date-label {
    text-align: center;
    font-size: 11px;
    color: #8a8a8a;
    margin: 12px 0 6px;
    font-weight: 500;
  }
  .typing-bubble {
    display: flex; gap: 4px; align-items: center;
    background: #fff; border-radius: 18px 18px 18px 4px;
    padding: 10px 14px; width: fit-content;
    box-shadow: 0 1px 2px rgba(0,0,0,.08);
  }
  .dot { width: 7px; height: 7px; border-radius: 50%; background: #aaa; animation: bounce .9s infinite; }
  .dot:nth-child(2) { animation-delay: .15s; }
  .dot:nth-child(3) { animation-delay: .3s; }
  @keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
`;

function inject() {
  if (document.getElementById('chat-css')) return;
  const el = document.createElement('style');
  el.id = 'chat-css';
  el.textContent = S;
  document.head.appendChild(el);
}

function Avatar({ user }) {
  if (!user) return <div className="av">?</div>;
  return (
    <div className="av">
      {user.avatar
        ? <img src={user.avatar} alt={user.name} />
        : user.name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function formatTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });
}
function formatDateLabel(d) {
  const date = new Date(d);
  const today = new Date();
  const diff = Math.floor((today - date) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-BD', { month: 'short', day: 'numeric' });
}

export default function Chat() {
  const { conversationId: urlConvoId } = useParams();
  const { user }     = useAuth();
  const { isMobile } = useResponsive();
  const socket       = useSocket();
  const navigate     = useNavigate();
  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeConvo,   setActiveConvo]   = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState('');
  const [typing,        setTyping]        = useState(false);
  const [isTyping,      setIsTyping]      = useState(false);
  const [mobileView,    setMobileView]    = useState('list');
  const chatRootRef = useRef(null);

  // iOS keyboard fix — visualViewport shrinks when keyboard opens
  // We manually set bottom offset so the input bar stays above keyboard
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop;
      if (chatRootRef.current) {
        chatRootRef.current.style.bottom = `${Math.max(0, keyboardHeight)}px`;
      }
      // scroll latest message into view when keyboard opens
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  useEffect(() => { inject(); fetchConversations(); }, []);

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
    const onTyping    = () => setIsTyping(true);
    const onStopTyping = () => setIsTyping(false);
    socket?.on('new_message', handleMsg);
    socket?.on('typing',      onTyping);
    socket?.on('stop_typing', onStopTyping);
    return () => {
      socket?.off('new_message', handleMsg);
      socket?.off('typing',      onTyping);
      socket?.off('stop_typing', onStopTyping);
    };
  }, [activeConvo, socket, user._id, isMobile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations);
      if (urlConvoId) {
        const found = data.conversations.find(c => c._id === urlConvoId);
        if (found) setActiveConvo(found);
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
    const msgText = text.trim();
    if (!msgText || !activeConvo) return;
    setText('');
    socket?.emit('stop_typing', activeConvo._id);
    inputRef.current?.focus();
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

  // Group messages by date for date labels
  const groupedMessages = () => {
    const groups = [];
    let lastDate = null;
    messages.forEach(msg => {
      if (!msg) return;
      const d = msg.createdAt ? formatDateLabel(msg.createdAt) : 'Today';
      if (d !== lastDate) { groups.push({ type: 'date', label: d }); lastDate = d; }
      groups.push({ type: 'msg', msg });
    });
    return groups;
  };

  const other = getOther(activeConvo);

  /* ── MOBILE: conversation list ── */
  if (isMobile && mobileView === 'list') {
    return (
      <div ref={chatRootRef} className="chat-root" style={{ background: '#fff' }}>
        <div className="chat-header">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="#4e9e2a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>Messages</div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#8a8a8a' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>No messages yet</div>
              <div style={{ fontSize: 13 }}>Message a farmer from any product page.</div>
            </div>
          ) : conversations.map(c => {
            const o = getOther(c);
            return (
              <div key={c._id} className="convo-item" onClick={() => setActiveConvo(c)}>
                <Avatar user={o} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 2 }}>{o?.name}</div>
                  <div style={{ fontSize: 13, color: '#8a8a8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.lastMessage || 'Start a conversation'}
                  </div>
                </div>
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1 1l6 6-6 6" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── MOBILE: active chat (Messenger style) ── */
  if (isMobile) {
    return (
      <div ref={chatRootRef} className="chat-root">
        {/* Header */}
        <div className="chat-header">
          <button className="back-btn" onClick={() => setMobileView('list')}>
            <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="#4e9e2a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <Avatar user={other} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{other?.name}</div>
            <div style={{ fontSize: 12, color: '#4e9e2a', fontWeight: 500 }}>{other?.role === 'farmer' ? 'Farmer' : 'Customer'}</div>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#aaa', fontSize: 13, marginTop: 40 }}>
              Say hi to {other?.name}! 👋
            </div>
          )}
          {groupedMessages().map((item, i) => {
            if (item.type === 'date') return <div key={i} className="date-label">{item.label}</div>;
            const { msg } = item;
            const isMe = (msg.sender?._id || msg.sender) === user._id;
            return (
              <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                <div className={isMe ? 'bubble-me' : 'bubble-other'}>{msg.text}</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 3, paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}>{formatTime(msg.createdAt)}</div>
              </div>
            );
          })}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <Avatar user={other} />
              <div className="typing-bubble">
                <div className="dot" /><div className="dot" /><div className="dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="chat-input-bar">
          <textarea
            ref={inputRef}
            className="chat-input"
            rows={1}
            value={text}
            onChange={e => { handleTypingInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Message ${other?.name || ''}…`}
          />
          <button className="chat-send-btn" onClick={handleSend} aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  /* ── DESKTOP ── */
  const navH = 'calc(58px + env(safe-area-inset-top, 0px))';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: `calc(100vh - ${navH})`, overflow: 'hidden' }}>
      <div style={{ background: '#fff', borderRight: '1px solid rgba(0,0,0,.08)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(0,0,0,.07)' }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Messages</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#8a8a8a', fontSize: 13 }}>No conversations yet.</div>}
          {conversations.map(c => {
            const o = getOther(c);
            const act = activeConvo?._id === c._id;
            return (
              <div key={c._id} onClick={() => setActiveConvo(c)}
                style={{ padding: '13px 16px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', background: act ? 'rgba(78,158,42,.08)' : 'transparent', borderLeft: `3px solid ${act ? '#4e9e2a' : 'transparent'}`, transition: 'background .12s' }}>
                <Avatar user={o} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{o?.name}</div>
                  <div style={{ fontSize: 12, color: '#8a8a8a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage || 'Start a conversation'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', height: `calc(100vh - ${navH})`, overflow: 'hidden', background: '#f0f2f0' }}>
        {!activeConvo ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a8a8a', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 48 }}>💬</div>
            <div style={{ fontSize: 14 }}>Select a conversation</div>
          </div>
        ) : (
          <>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,.08)', display: 'flex', alignItems: 'center', gap: 12, background: '#fff', flexShrink: 0 }}>
              <Avatar user={other} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{other?.name}</div>
                <div style={{ fontSize: 12, color: '#4e9e2a' }}>{other?.role === 'farmer' ? '🌾 Farmer' : '🛒 Customer'}</div>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {groupedMessages().map((item, i) => {
                if (item.type === 'date') return <div key={i} className="date-label">{item.label}</div>;
                const { msg } = item;
                const isMe = (msg.sender?._id || msg.sender) === user._id;
                return (
                  <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', marginBottom: 2 }}>
                    <div className={isMe ? 'bubble-me' : 'bubble-other'} style={{ maxWidth: '60%' }}>{msg.text}</div>
                    <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>{formatTime(msg.createdAt)}</div>
                  </div>
                );
              })}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar user={other} />
                  <div className="typing-bubble"><div className="dot" /><div className="dot" /><div className="dot" /></div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,.08)', display: 'flex', gap: 10, background: '#fff', flexShrink: 0, alignItems: 'flex-end' }}>
              <textarea value={text} onChange={e => { handleTypingInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                rows={1}
                placeholder={`Message ${other?.name}…`}
                style={{ flex: 1, background: '#f0f2f0', border: 'none', borderRadius: 22, padding: '10px 16px', color: '#1a1a1a', fontFamily: 'inherit', fontSize: 14, outline: 'none', resize: 'none', maxHeight: 120, lineHeight: 1.4 }} />
              <button onClick={handleSend}
                style={{ background: '#4e9e2a', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}