import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useResponsive } from '../hooks/useResponsive.js';
import useSocket from '../hooks/useSocket.js';

export default function Chat() {
  const { conversationId: urlConvoId } = useParams();
  const { user }   = useAuth();
  const { isMobile } = useResponsive();
  const socket     = useSocket();
  const navigate   = useNavigate();
  const bottomRef  = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeConvo,   setActiveConvo]   = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState('');
  const [typing,        setTyping]        = useState(false);
  const [isTyping,      setIsTyping]      = useState(false);
  // On mobile: show list or chat, not both
  const [mobileView,    setMobileView]    = useState('list'); // 'list' | 'chat'
  const typingTimeout = useRef(null);

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    if (!activeConvo) return;
    fetchMessages(activeConvo._id);
    if (isMobile) setMobileView('chat');
    socket?.emit('join_conversation', activeConvo._id);

    const handleMsg = ({ conversationId, message }) => {
      if (conversationId !== activeConvo._id) return;
      const senderId = message.sender?._id || message.sender;
      if (senderId === user._id) return;
      setMessages(prev => {
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
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
      setMessages(prev => {
        if (prev.some(m => m._id === data.message._id)) return prev;
        return [...prev, data.message];
      });
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
  const h = 'calc(100vh - 56px)';

  // ── MOBILE LAYOUT ─────────────────────────────────────
  if (isMobile) {
    // Show conversation list
    if (mobileView === 'list') {
      return (
        <div style={{ height: h, display: 'flex', flexDirection: 'column', background: '#f5f7f2' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid rgba(60,100,40,.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: '1px solid rgba(60,100,40,.1)', borderRadius: 99, padding: '6px 12px', color: '#7a9070', fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 12, cursor: 'pointer' }}>← Back</button>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1a2415' }}>Messages</div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#7a9070', fontSize: 14 }}>
                No conversations yet.<br />Message a farmer from a product page.
              </div>
            ) : conversations.map(c => {
              const o = getOther(c);
              return (
                <div key={c._id} onClick={() => setActiveConvo(c)}
                  style={{ padding: '16px', display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid rgba(60,100,40,.1)', cursor: 'pointer', background: activeConvo?._id === c._id ? 'rgba(90,176,48,.08)' : 'transparent' }}>
                  <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(90,176,48,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4e9e2a', fontSize: 18, flexShrink: 0 }}>{o?.name?.[0] || '?'}</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a2415', marginBottom: 2 }}>{o?.name}</div>
                    <div style={{ fontSize: 12, color: '#7a9070', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage || 'Start a conversation'}</div>
                  </div>
                  <span style={{ fontSize: 18, color: '#7a9070' }}>›</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Show active chat
    return (
      <div style={{ height: h, display: 'flex', flexDirection: 'column', background: '#f5f7f2' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(60,100,40,.1)', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', flexShrink: 0 }}>
          <button onClick={() => setMobileView('list')} style={{ background: 'transparent', border: 'none', color: '#4e9e2a', fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 22, cursor: 'pointer', padding: '0 4px' }}>‹</button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(90,176,48,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4e9e2a', fontSize: 14, flexShrink: 0 }}>{other?.name?.[0]}</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#1a2415' }}>{other?.name}</div>
            <div style={{ fontSize: 11, color: '#4e9e2a' }}>{other?.role === 'farmer' ? '🌾 Farmer' : '🛒 Customer'}</div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {messages.map(msg => {
            const isMe = (msg.sender?._id || msg.sender) === user._id;
            return (
              <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                <div style={{ background: isMe ? '#4e9e2a' : '#f0f4ec', color: isMe ? '#fff' : '#1a2415', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '10px 14px', maxWidth: '75%', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.text}</div>
                <div style={{ fontSize: 10, color: '#7a9070', marginTop: 3 }}>{formatTime(msg.createdAt)}</div>
              </div>
            );
          })}
          {isTyping && <div style={{ alignSelf: 'flex-start', fontSize: 12, color: '#7a9070', fontStyle: 'italic' }}>{other?.name} is typing...</div>}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(60,100,40,.1)', display: 'flex', gap: 8, background: '#fff', flexShrink: 0, paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
          <input value={text} onChange={e => handleTypingInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
            placeholder={`Message ${other?.name}...`}
            style={{ flex: 1, background: '#fff', border: '1px solid rgba(60,100,40,.1)', borderRadius: 24, padding: '11px 16px', color: '#1a2415', fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 14, outline: 'none' }} />
          <button onClick={handleSend} style={{ background: '#4e9e2a', border: 'none', borderRadius: 24, padding: '11px 18px', color: '#fff', fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>↑</button>
        </div>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ────────────────────────────────────
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
                style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', background: act ? 'rgba(90,176,48,.12)' : 'transparent', borderLeft: `3px solid ${act ? '#4e9e2a' : 'transparent'}` }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(90,176,48,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4e9e2a', flexShrink: 0 }}>{o?.name?.[0] || '?'}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1a2415' }}>{o?.name}</div>
                  <div style={{ fontSize: 11, color: '#7a9070', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage || 'Start a conversation'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {!activeConvo ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a9070', fontSize: 14 }}>💬 Select a conversation to start chatting</div>
        ) : (
          <>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(60,100,40,.1)', display: 'flex', alignItems: 'center', gap: 12, background: '#fff' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(90,176,48,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#4e9e2a', fontSize: 14 }}>{other?.name?.[0]}</div>
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
                    <div style={{ background: isMe ? '#4e9e2a' : '#f0f4ec', color: isMe ? '#fff' : '#1a2415', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', padding: '10px 16px', maxWidth: '65%', fontSize: 14, lineHeight: 1.5 }}>{msg.text}</div>
                    <div style={{ fontSize: 10, color: '#7a9070', marginTop: 3, textAlign: isMe ? 'right' : 'left' }}>{formatTime(msg.createdAt)}</div>
                  </div>
                );
              })}
              {isTyping && <div style={{ alignSelf: 'flex-start', fontSize: 12, color: '#7a9070', fontStyle: 'italic' }}>{other?.name} is typing...</div>}
              <div ref={bottomRef} />
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(60,100,40,.1)', display: 'flex', gap: 10, background: '#fff' }}>
              <input value={text} onChange={e => handleTypingInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`Message ${other?.name}...`}
                style={{ flex: 1, background: '#fff', border: '1px solid rgba(60,100,40,.1)', borderRadius: 12, padding: '12px 18px', color: '#1a2415', fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 14, outline: 'none' }} />
              <button onClick={handleSend} style={{ background: '#4e9e2a', border: 'none', borderRadius: 12, padding: '12px 22px', color: '#fff', fontFamily: 'Plus Jakarta Sans,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Send ↑</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
