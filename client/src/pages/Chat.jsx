import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';
import useSocket from '../hooks/useSocket.js';

const S = {
  wrap:      { display: 'grid', gridTemplateColumns: '300px 1fr', height: 'calc(100vh - 64px)', overflow: 'hidden' },
  sidebar:   { background: 'var(--surface)', borderRight: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  sbHead:    { padding: '20px 16px', borderBottom: '1px solid var(--border)' },
  sbTitle:   { fontSize: 15, fontWeight: 700 },
  convoItem: (active) => ({ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', background: active ? 'rgba(90,176,48,.12)' : 'transparent', borderLeft: active ? '3px solid var(--green-hi)' : '3px solid transparent', transition: 'all .18s' }),
  avatar:    { width: 42, height: 42, borderRadius: '50%', background: 'rgba(90,176,48,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--green-lt)', flexShrink: 0, fontSize: 16 },
  chatArea:  { display: 'flex', flexDirection: 'column', height: '100%' },
  chatHead:  { padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--surface)' },
  msgs:      { flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 10 },
  msgMe:     { alignSelf: 'flex-end', background: 'var(--green-hi)', color: '#fff', borderRadius: '18px 18px 4px 18px', padding: '10px 16px', maxWidth: '65%', fontSize: 14, lineHeight: 1.5 },
  msgOther:  { alignSelf: 'flex-start', background: 'var(--card2)', color: 'var(--white)', borderRadius: '18px 18px 18px 4px', padding: '10px 16px', maxWidth: '65%', fontSize: 14, lineHeight: 1.5 },
  msgTime:   { fontSize: 10, color: 'var(--muted)', marginTop: 3 },
  inputRow:  { padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, background: 'var(--surface)' },
  input:     { flex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 18px', color: 'var(--white)', fontFamily: 'Sora,sans-serif', fontSize: 14, outline: 'none' },
  sendBtn:   { background: 'var(--green-hi)', border: 'none', borderRadius: 12, padding: '12px 22px', color: '#fff', fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' },
  backBtn:   { background: 'transparent', border: '1px solid var(--border)', borderRadius: 99, padding: '7px 16px', color: 'var(--muted)', fontFamily: 'Sora,sans-serif', fontSize: 13, cursor: 'pointer', marginBottom: 0 },
};

export default function Chat() {
  const { conversationId: urlConvoId } = useParams();
  const { user }  = useAuth();
  const socket    = useSocket();
  const navigate  = useNavigate();
  const bottomRef = useRef(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvo,   setActiveConvo]   = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [text,          setText]          = useState('');
  const [isTyping,      setIsTyping]      = useState(false);
  const [typing,        setTyping]        = useState(false);
  const typingTimeout = useRef(null);

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    if (!activeConvo) return;
    fetchMessages(activeConvo._id);
    socket?.emit('join_conversation', activeConvo._id);

    const handleMsg = ({ conversationId, message }) => {
      if (conversationId !== activeConvo._id) return;
      // Only add messages from OTHER people — our own are added optimistically
      const senderId = message.sender?._id || message.sender;
      if (senderId === user._id) return;
      setMessages(prev => {
        // deduplicate by _id
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };
    const handleTyping     = () => setIsTyping(true);
    const handleStopTyping = () => setIsTyping(false);

    socket?.on('new_message', handleMsg);
    socket?.on('typing', handleTyping);
    socket?.on('stop_typing', handleStopTyping);

    return () => {
      socket?.off('new_message', handleMsg);
      socket?.off('typing', handleTyping);
      socket?.off('stop_typing', handleStopTyping);
    };
  }, [activeConvo, socket, user._id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations);
      if (urlConvoId) {
        const found = data.conversations.find(c => c._id === urlConvoId);
        if (found) setActiveConvo(found);
      } else if (data.conversations.length > 0) {
        setActiveConvo(data.conversations[0]);
      }
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async (convoId) => {
    try {
      const { data } = await api.get(`/chat/${convoId}/messages`);
      setMessages(data.messages);
    } catch (e) { console.error(e); }
  };

  const getOtherParticipant = (convo) =>
    convo?.participants?.find(p => p._id !== user._id);

  const handleSend = async () => {
    if (!text.trim() || !activeConvo) return;
    const msgText = text.trim();
    setText('');
    socket?.emit('stop_typing', activeConvo._id);
    try {
      const { data } = await api.post(`/chat/${activeConvo._id}/messages`, { text: msgText });
      // Add OUR message once — from the API response (not from socket)
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

  const formatTime = (date) => new Date(date).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' });
  const other = getOtherParticipant(activeConvo);

  return (
    <div style={S.wrap}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.sbHead}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <button style={S.backBtn} onClick={() => navigate(-1)}>← Back</button>
          </div>
          <div style={S.sbTitle}>Messages</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{conversations.length} conversations</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
              No conversations yet.<br />Message a farmer from a product page.
            </div>
          )}
          {conversations.map(c => {
            const o = getOtherParticipant(c);
            const active = activeConvo?._id === c._id;
            return (
              <div key={c._id} style={S.convoItem(active)} onClick={() => setActiveConvo(c)}>
                <div style={S.avatar}>{o?.name?.[0] || '?'}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--white)' }}>{o?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.lastMessage || 'Start a conversation'}</div>
                  {c.product && <div style={{ fontSize: 10, color: 'var(--green-lt)', marginTop: 2 }}>re: {c.product.name}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div style={S.chatArea}>
        {!activeConvo ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 14 }}>
            💬 Select a conversation to start chatting
          </div>
        ) : (
          <>
            <div style={S.chatHead}>
              <div style={{ ...S.avatar, width: 38, height: 38, fontSize: 14 }}>{other?.name?.[0]}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{other?.name}</div>
                <div style={{ fontSize: 11, color: 'var(--green-lt)' }}>{other?.role === 'farmer' ? '🌾 Farmer' : '🛒 Customer'}</div>
              </div>
            </div>
            <div style={S.msgs}>
              {messages.map(msg => {
                const isMe = (msg.sender?._id || msg.sender) === user._id;
                return (
                  <div key={msg._id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={isMe ? S.msgMe : S.msgOther}>{msg.text}</div>
                    <div style={{ ...S.msgTime, textAlign: isMe ? 'right' : 'left' }}>{formatTime(msg.createdAt)}</div>
                  </div>
                );
              })}
              {isTyping && <div style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>{other?.name} is typing...</div>}
              <div ref={bottomRef} />
            </div>
            <div style={S.inputRow}>
              <input
                style={S.input}
                value={text}
                onChange={e => handleTypingInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder={`Message ${other?.name}...`}
              />
              <button style={S.sendBtn} onClick={handleSend}>Send ↑</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
