import { useState, useEffect, useRef } from 'react';
import DoctorLayout from './DoctorLayout';
import api from '@/utils/api';
import styles from '@/styles/Dashboard.module.css';
import { FaPaperPlane, FaPen, FaTrash, FaTimes, FaCheck } from 'react-icons/fa';

// 1. UPDATE TYPE DEFINITION
type User = { 
  id: number; 
  name: string; 
  profession: string; 
  avatarUrl?: string; 
  unreadCount?: number; // Added this field
};

type Message = { id: number; senderId: number; content: string; createdAt: string; isEdited?: boolean; };

export default function MessagesPage() {
  const [contacts, setContacts] = useState<User[]>([]);
  const [activeContact, setActiveContact] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [meId, setMeId] = useState<string>(""); 
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    if(t) {
      try { 
        const p = JSON.parse(atob(t.split('.')[1])); 
        const rawId = p.id || p.sub || p.user_id;
        setMeId(String(rawId)); 
      } catch(e) {}
    }
    loadContacts();
    
    // Refresh contacts every 10s to check for new messages/red dots
    const interval = setInterval(loadContacts, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeContact) {
      loadMessages(activeContact.id);
      const interval = setInterval(() => {
        if (editingId === null) loadMessages(activeContact.id);
      }, 3000); 
      return () => clearInterval(interval);
    }
  }, [activeContact, editingId]);

  useEffect(() => {
    if (editingId === null) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, editingId]);

  async function loadContacts() {
    try { 
      const res = await api.get('/api/doctor-features/messages/contacts'); 
      setContacts(res.data); 
    } catch {}
  }

  async function loadMessages(uid: number) {
    try { 
      const res = await api.get(`/api/doctor-features/messages/${uid}`); 
      setMessages(res.data);
      // If we load messages, we assume they are read, so update local count immediately
      setContacts(prev => prev.map(c => c.id === uid ? { ...c, unreadCount: 0 } : c));
    } catch {}
  }

  async function send() {
    if (!input.trim() || !activeContact) return;
    try {
      await api.post('/api/doctor-features/messages', { receiverId: activeContact.id, content: input });
      setInput('');
      loadMessages(activeContact.id);
    } catch {}
  }

  const startEdit = (m: Message) => {
    setEditingId(m.id);
    setEditContent(m.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const saveEdit = async (id: number) => {
    if (!editContent.trim()) return;
    try {
      await api.put(`/api/doctor-features/messages/${id}`, { content: editContent });
      setEditingId(null);
      if(activeContact) loadMessages(activeContact.id);
    } catch { alert('Failed to update message'); }
  };

  const deleteMessage = async (id: number) => {
    if (!confirm('Delete this message?')) return;
    try {
      await api.delete(`/api/doctor-features/messages/${id}`);
      if(activeContact) loadMessages(activeContact.id);
    } catch { alert('Failed to delete'); }
  };

  return (
    <DoctorLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 140px)', gap: '1.5rem' }}>
        
        {/* CONTACTS LIST */}
        <div className={styles.card} style={{ width: '300px', padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '1.2rem', borderBottom: '1px solid var(--color-border)', fontWeight: '800', background: 'var(--color-surface)' }}>
            Doctor Chat
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {contacts.map(u => (
              <div 
                key={u.id}
                onClick={() => setActiveContact(u)}
                style={{ 
                  padding: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                  background: activeContact?.id === u.id ? 'var(--color-secondary)' : 'transparent',
                  borderBottom: '1px solid var(--color-border)',
                  transition: 'background 0.2s'
                }}
              >
                {/* Avatar with Red Dot */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                    background: 'var(--color-border)', display: 'grid', placeItems: 'center'
                  }}>
                    {u.avatarUrl ? (
                       <img src={u.avatarUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="u"/>
                    ) : (
                       <span style={{fontWeight:'bold', color:'var(--color-text-secondary)'}}>{u.name.charAt(0)}</span>
                    )}
                  </div>
                  
                  {/* 2. RED DOT LOGIC */}
                  {u.unreadCount && u.unreadCount > 0 ? (
                    <div style={{
                      position: 'absolute', top: -2, right: -2,
                      width: 12, height: 12, borderRadius: '50%',
                      background: 'red', border: '2px solid var(--color-surface)'
                    }} />
                  ) : null}
                </div>

                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: u.unreadCount ? '800' : '600', fontSize: '0.95rem', color: 'var(--color-text)' }}>{u.name}</div>
                  
                  {/* 3. Status Text Logic */}
                  {u.unreadCount && u.unreadCount > 0 ? (
                     <div style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                       {u.unreadCount} new messages
                     </div>
                  ) : (
                     <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{u.profession}</div>
                  )}
                </div>
              </div>
            ))}
            {contacts.length === 0 && <div style={{padding:'2rem', textAlign:'center', color:'var(--color-text-secondary)'}}>No other doctors found.</div>}
          </div>
        </div>

        {/* CHAT AREA */}
        <div className={styles.card} style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeContact ? (
            <>
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)', display:'flex', alignItems:'center', gap:'10px' }}>
                <div style={{fontWeight:'700', fontSize:'1.1rem'}}>{activeContact.name}</div>
                <div style={{fontSize:'0.8rem', background:'var(--color-secondary)', padding:'2px 8px', borderRadius:'10px'}}>Doctor</div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', background: 'var(--color-background)' }}>
                {messages.map((m) => {
                  const isMe = String(m.senderId) === meId;
                  const isEditingThis = editingId === m.id;
                  
                  return (
                    <div key={m.id} 
                      style={{ 
                        alignSelf: isMe ? 'flex-end' : 'flex-start', 
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: isMe ? 'row-reverse' : 'row',
                        gap: '10px',
                      }}
                      onMouseEnter={(e) => {
                         const actions = e.currentTarget.querySelector('.msg-actions') as HTMLElement;
                         if(actions) actions.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                         const actions = e.currentTarget.querySelector('.msg-actions') as HTMLElement;
                         if(actions) actions.style.opacity = '0';
                      }}
                    >
                      <div style={{
                         width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                         background: isMe ? 'var(--color-primary)' : '#ccc',
                         display: 'grid', placeItems: 'center', color: '#fff', fontSize: '0.8rem', fontWeight: 'bold',
                         marginTop: '4px', overflow: 'hidden'
                      }}>
                        {isMe ? 'ME' : (activeContact.avatarUrl ? <img src={activeContact.avatarUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} /> : activeContact.name.charAt(0))}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', position: 'relative' }}>
                        
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px', padding: '0 4px' }}>
                          {isMe ? 'You' : activeContact.name}
                        </div>

                        {isEditingThis ? (
                          <div style={{ display:'flex', gap:'5px', alignItems:'center' }}>
                            <input 
                              autoFocus
                              value={editContent} 
                              onChange={e => setEditContent(e.target.value)}
                              className={styles.formInput}
                              style={{ padding: '8px', minWidth: '200px' }}
                              onKeyDown={e => {
                                if(e.key === 'Enter') saveEdit(m.id);
                                if(e.key === 'Escape') cancelEdit();
                              }}
                            />
                            <button onClick={() => saveEdit(m.id)} style={{color:'green', border:'none', background:'none', cursor:'pointer'}}><FaCheck/></button>
                            <button onClick={cancelEdit} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}><FaTimes/></button>
                          </div>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <div style={{ 
                              background: isMe ? 'var(--color-primary)' : 'var(--color-surface)',
                              color: isMe ? '#fff' : 'var(--color-text)',
                              border: isMe ? 'none' : '1px solid var(--color-border)',
                              padding: '0.8rem 1.2rem', 
                              borderRadius: '16px',
                              borderTopRightRadius: isMe ? '2px' : '16px',
                              borderTopLeftRadius: isMe ? '16px' : '2px',
                              boxShadow: 'var(--shadow-sm)',
                              lineHeight: '1.5'
                            }}>
                              {m.content}
                              {m.isEdited && <span style={{fontSize:'0.65em', opacity:0.7, marginLeft:6, fontStyle:'italic'}}>(edited)</span>}
                            </div>
                            
                            {isMe && (
                              <div className="msg-actions" style={{
                                position: 'absolute', top: '50%', right: '100%', transform: 'translateY(-50%)',
                                marginRight: '10px', display: 'flex', gap: '8px', opacity: 0, transition: 'opacity 0.2s'
                              }}>
                                <button onClick={() => startEdit(m)} title="Edit" style={{border:'none', background:'none', color:'var(--color-text-secondary)', cursor:'pointer', fontSize:'0.9rem'}}>
                                  <FaPen />
                                </button>
                                <button onClick={() => deleteMessage(m.id)} title="Delete" style={{border:'none', background:'none', color:'var(--color-error)', cursor:'pointer', fontSize:'0.9rem'}}>
                                  <FaTrash />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', marginTop: 4, padding: '0 4px' }}>
                          {new Date(m.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <div style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '10px', background: 'var(--color-surface)' }}>
                <input 
                  className={styles.formInput} 
                  placeholder="Type a message..." 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                />
                <button className={styles.submitBtn} onClick={send} style={{ width: 50, padding: 0, display: 'grid', placeItems: 'center', borderRadius: '50%' }}>
                  <FaPaperPlane />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-secondary)' }}>
              <div style={{ fontSize: '4rem', opacity: 0.2, marginBottom: '1rem' }}>💬</div>
              <div>Select a doctor to start chatting</div>
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}