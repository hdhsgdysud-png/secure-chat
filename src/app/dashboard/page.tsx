'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';
import { Shield, Trash2, Check, Send, X, ArrowLeft, MessageSquare, Settings, RefreshCw } from 'lucide-react';

// --- KLAVYE VE STATUS BAR EKLENTİLERİ ---
import { Keyboard } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
// ----------------------------------------

const dict: any = {
  en: { chats: "Chats", addFriend: "+ Add Friend", noChats: "No chats yet. Add a friend from above!", openChat: "Click to open chat...", logout: "Secure Logout", yourCode: "Your Code", selectChat: "Select a chat to start", orAddFriend: "Or add a new friend from the menu", encrypted: "AES-256 Encrypted", delete: "Delete", emptyHistory: "Message history is empty.", typeMessage: "Type a message...", send: "Send", typing: "Typing...", settings: "Settings", language: "Language", theme: "Theme", accentColor: "Accent Color", notifications: "Notifications", save: "Save changes", dark: "Dark", light: "Light", black: "Pitch Black", on: "On", off: "Off", friendCode: "Friend Code", enter6Digit: "Enter 6-digit code", startChat: "Start Chat", searching: "Searching...", success: "Chat created! ✅", error: "An error occurred!", confirmDelete: "Are you sure you want to permanently delete this chat? No traces will be left!", connectionError: "Connection error!" },
  tr: { chats: "Sohbetlerim", addFriend: "+ Arkadaş Ekle", noChats: "Henüz sohbetin yok. Yukarıdan arkadaş ekle!", openChat: "Sohbeti açmak için tıkla...", logout: "Sistemden Güvenli Çıkış Yap", yourCode: "Kodun", selectChat: "Sohbet başlatmak için birini seç", orAddFriend: "Veya menüden yeni bir arkadaş ekle", encrypted: "AES-256 Uçtan Uca Şifreli", delete: "Sil", emptyHistory: "Mesaj geçmişi boş.", typeMessage: "Mesaj yaz...", send: "Gönder", typing: "Yazıyor...", settings: "Ayarlar", language: "Dil", theme: "Tema", accentColor: "Vurgu Rengi", notifications: "Bildirimler", save: "Değişiklikleri Kaydet", dark: "Koyu (Dark)", light: "Açık (Beyaz)", black: "Simsiyah (AMOLED)", on: "Açık", off: "Kapalı", friendCode: "Arkadaş Kodu", enter6Digit: "6 haneli kodu girin", startChat: "Sohbet Başlat", searching: "Aranıyor...", success: "Sohbet oluşturuldu! ✅", error: "Hata oluştu!", confirmDelete: "Bu sohbeti tamamen silmek istediğine emin misin? İz kalmayacak!", connectionError: "Bağlantı hatası!" }
};

const accentColors: any = {
  cyan: { hex: '#06b6d4', hexEnd: '#0891b2', rgb: '6, 182, 212', text: '#ffffff' },
  white: { hex: '#ffffff', hexEnd: '#e2e8f0', rgb: '255, 255, 255', text: '#0f172a' },
  green: { hex: '#22c55e', hexEnd: '#16a34a', rgb: '34, 197, 94', text: '#ffffff' },
  red: { hex: '#ef4444', hexEnd: '#dc2626', rgb: '239, 68, 68', text: '#ffffff' },
  pink: { hex: '#ec4899', hexEnd: '#db2777', rgb: '236, 72, 153', text: '#ffffff' }
};

const themeStyles: any = {
  dark: { bg: 'radial-gradient(ellipse at top, #14141e 0%, #0a0a0f 50%, #0a0a0f 100%)', surface: 'rgba(255, 255, 255, 0.04)', text: '#f0f0f5', textMuted: '#8a8a95', border: 'rgba(255, 255, 255, 0.08)', msgBubble: 'rgba(255, 255, 255, 0.06)' },
  black: { bg: '#000000', surface: 'rgba(20, 20, 20, 0.5)', text: '#ffffff', textMuted: '#666666', border: 'rgba(255, 255, 255, 0.05)', msgBubble: 'rgba(30, 30, 30, 0.8)' },
  light: { bg: 'radial-gradient(ellipse at top, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)', surface: 'rgba(255, 255, 255, 0.6)', text: '#0f172a', textMuted: '#64748b', border: 'rgba(0, 0, 0, 0.1)', msgBubble: 'rgba(255, 255, 255, 0.8)' }
};

export default function Dashboard() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [userCode, setUserCode] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState('dark');
  const [accent, setAccent] = useState('cyan');
  const [notif, setNotif] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendCode, setFriendCode] = useState('');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- KLAVYENİN BEYAZ ÇUBUĞUNU GİZLEYEN KOD ---
  useEffect(() => {
    const hideKeyboardBar = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await Keyboard.setAccessoryBarVisible({ isVisible: false });
        } catch (error) {
          console.error("Klavye çubuğu gizlenemedi:", error);
        }
      }
    };
    hideKeyboardBar();
  }, []);
  // ----------------------------------------------

  // --- DURUM ÇUBUĞUNU (STATUS BAR) DİNAMİK YAPAN KOD ---
  useEffect(() => {
    const syncStatusBar = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Uygulamayı durum çubuğunun ALTINA yayar (Tam ekran cam hissi)
          await StatusBar.setOverlaysWebView({ overlay: true });
          
          // Temaya göre saat/şarj ikonlarının rengini ayarla
          if (theme === 'light') {
            await StatusBar.setStyle({ style: Style.Light }); // Siyah ikonlar
          } else {
            await StatusBar.setStyle({ style: Style.Dark }); // Beyaz ikonlar
          }
        } catch (e) {
          console.error("Durum çubuğu ayarlanamadı", e);
        }
      }
    };
    syncStatusBar();
  }, [theme]);
  // ----------------------------------------------------

  const handleRefreshCode = async (action: 'auto' | 'manual', currentUsername?: string) => {
    const targetUser = currentUsername || username;
    if (!targetUser) return;
    
    if (action === 'manual') setIsRefreshing(true);
    try {
      const res = await fetch('/api/user/refresh-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser, action })
      });
      const data = await res.json();
      if (res.ok && data.newCode) {
        setUserCode(data.newCode);
        localStorage.setItem('userCode', data.newCode);
      }
    } catch (error) {
      console.error("Hata:", error);
    }
    if (action === 'manual') setTimeout(() => setIsRefreshing(false), 500);
  };

  const fetchDashboardData = async (name: string) => {
    const res = await fetch(`/api/chat/list?username=${name}`);
    const data = await res.json();
    if (res.ok) setChats(data.chats);
  };

  useEffect(() => {
    const storedName = localStorage.getItem('username');
    if (!storedName) {
      router.push('/');
    } else {
      setUsername(storedName);
      setUserCode(localStorage.getItem('userCode') || '');
      setLang(localStorage.getItem('lang') || 'en');
      setTheme(localStorage.getItem('theme') || 'dark');
      setAccent(localStorage.getItem('accent') || 'cyan');
      setNotif(localStorage.getItem('notif') === 'false' ? false : true);
      fetchDashboardData(storedName);
      handleRefreshCode('auto', storedName);
      setIsMounted(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const saveSettings = async () => {
    localStorage.setItem('lang', lang);
    localStorage.setItem('theme', theme);
    localStorage.setItem('accent', accent);
    localStorage.setItem('notif', notif.toString());
    setShowSettings(false);
    
    if (notif && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, settings: { lang, theme, accent, notif } })
    });
  };

  const markMessagesAsRead = async (chatId: string) => {
    await fetch('/api/messages/read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId, username }) });
  };

  const fetchMessages = async (chatId: string) => {
    const res = await fetch(`/api/messages?chatId=${chatId}`);
    const data = await res.json();
    if (res.ok) { setMessages(data.messages); scrollToBottom(); markMessagesAsRead(chatId); }
  };

  const handleSelectChat = (chat: any) => { setSelectedChat(chat); fetchMessages(chat._id); setIsMobileChatOpen(true); };

  useEffect(() => {
    if (!username) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const userChannel = pusher.subscribe(`user-${username}`);
    userChannel.bind('chat-updated', async () => {
      const res = await fetch(`/api/chat/list?username=${username}`);
      const data = await res.json();
      if (res.ok) {
        setChats(data.chats);
        setSelectedChat((prev: any) => {
          if (prev && !data.chats.some((c: any) => c._id === prev._id)) { setIsMobileChatOpen(false); return null; }
          return prev;
        });
      }
    });

    // 2. YENİ EKLENEN: Karşı taraf sohbeti silerse anında ekrandan uçur (Sunucuyu beklemeden)
    userChannel.bind('chat-deleted', (data: { chatId: string }) => {
      setChats((prev) => prev.filter((c: any) => c._id !== data.chatId));
      setSelectedChat((prev: any) => {
        if (prev && prev._id === data.chatId) {
          setIsMobileChatOpen(false); // Telefondaysa sohbet ekranını kapatır
          return null;
        }
        return prev;
      });
    });
    return () => pusher.unsubscribe(`user-${username}`);
  }, [username]);

  useEffect(() => {
    if (!selectedChat) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const channel = pusher.subscribe(selectedChat._id);

    channel.bind('new-message', (data: any) => {
      if (data.sender !== username) {
        setMessages((prev) => [...prev, { ...data, isRead: true }]);
        scrollToBottom();
        markMessagesAsRead(selectedChat._id);
        if (notif && Notification.permission === 'granted') {
          new Notification('Yeni Mesaj', { body: data.text });
        }
      }
    });
    channel.bind('typing', (data: any) => { if (data.username !== username) { setTypingUser(data.isTyping ? data.username : null); scrollToBottom(); } });
    channel.bind('messages-read', (data: any) => { if (data.reader !== username) { setMessages((prev) => prev.map(msg => ({ ...msg, isRead: true }))); } });
    return () => pusher.unsubscribe(selectedChat._id);
  }, [selectedChat, username, notif]);

  const handleTyping = (e: any) => {
    setNewMessage(e.target.value);
    if (!selectedChat) return;
    fetch('/api/chat/typing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId: selectedChat._id, username, isTyping: true }) });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => { fetch('/api/chat/typing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId: selectedChat._id, username, isTyping: false }) }); }, 2000);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    fetch('/api/chat/typing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId: selectedChat._id, username, isTyping: false }) });

    const tempMsg = { _id: Date.now(), sender: username, text: newMessage, createdAt: new Date(), isRead: false };
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage('');
    
    // YENİ EKLENEN: Mesaj gidince kutuyu eski orijinal boyuna döndür
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    scrollToBottom();

    await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId: selectedChat._id, sender: username, text: tempMsg.text }) });
  };

  const scrollToBottom = () => { setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100); };

  const addFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (friendCode.length !== 6) return;
    setLoading(true); setStatus('');
    const res = await fetch('/api/chat/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentUser: username, friendCode }) });
    const data = await res.json();
    if (res.ok) { 
      setStatus(dict[lang].success); setFriendCode(''); fetchDashboardData(username);
      setTimeout(() => setShowAddFriendModal(false), 1000);
    } else { setStatus(data.error || dict[lang].error); }
    setLoading(false);
  };

  const deleteChat = async () => {
    if (!selectedChat) return;
    if (!window.confirm(dict[lang].confirmDelete)) return;
    try {
      const res = await fetch(`/api/chat/delete?chatId=${selectedChat._id}`, { method: 'DELETE' });
      if (res.ok) {
        setChats((prev) => prev.filter((c: any) => c._id !== selectedChat._id));
        setSelectedChat(null); setMessages([]); setIsMobileChatOpen(false);
      } else { alert(dict[lang].error); }
    } catch (error) { alert(dict[lang].connectionError); }
  };

  if (!isMounted) return <div className="flex h-screen items-center justify-center bg-[#0a0a0f]"></div>;

  const t = dict[lang];
  const c = accentColors[accent];
  const s = themeStyles[theme];

  return (
    <main className="fixed inset-0 h-[100dvh] w-full overflow-hidden overscroll-none antialiased transition-colors duration-500" style={{ background: s.bg, color: s.text }}>
      <div className="absolute inset-0 transition-colors duration-500" style={{ background: `radial-gradient(circle at 50% 50%, rgba(${c.rgb}, 0.03), transparent 50%)` }} />
      
      <div className="h-full max-w-[1920px] mx-auto flex relative z-10">
        
        <div className={`w-full md:w-[380px] flex-col h-full backdrop-blur-3xl border-r ${isMobileChatOpen ? 'hidden md:flex' : 'flex'}`} style={{ background: s.surface, borderColor: s.border }}>
          <div className="px-6 pb-6 border-b flex justify-between items-center" style={{ borderColor: s.border, paddingTop: 'calc(env(safe-area-inset-top) + 1.5rem)' }}>
            <h1 className="text-2xl tracking-tight font-bold inline-block bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${c.hex} 0%, ${c.hexEnd} 100%)` }}>
              FALCON
            </h1>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="px-3 py-1.5 rounded-[12px] border flex items-center gap-2" style={{ background: `rgba(${c.rgb}, 0.1)`, borderColor: `rgba(${c.rgb}, 0.2)` }}>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: s.textMuted }}>{t.yourCode}:</span>
                  <span className="text-sm font-mono font-bold" style={{ color: c.hex }}>{userCode}</span>
                </div>
                <button onClick={() => handleRefreshCode('manual')} disabled={isRefreshing} className={`p-1 rounded-md transition-all hover:bg-white/10 ${isRefreshing ? 'animate-spin opacity-50' : ''}`} style={{ color: c.hex }}>
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:scale-110 transition-all" style={{ background: 'rgba(128, 128, 128, 0.1)' }}>
                <Settings className="w-5 h-5" style={{ color: s.textMuted }} />
              </button>
            </div>
          </div>

          <div className="p-4 border-b" style={{ borderColor: s.border }}>
            <button onClick={() => { setStatus(''); setShowAddFriendModal(true); }} className="w-full px-5 py-3.5 rounded-[20px] backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" style={{ background: `linear-gradient(135deg, rgba(${c.rgb}, 0.15) 0%, rgba(${c.rgb}, 0.08) 100%)`, border: `1.5px solid rgba(${c.rgb}, 0.35)` }}>
              <span className="font-medium" style={{ color: c.hex }}>{t.addFriend}</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
            {chats.length === 0 ? (
              <p className="text-center text-sm mt-10" style={{ color: s.textMuted }}>{t.noChats}</p>
            ) : (
              chats.map((chat: any) => {
                const friendName = chat.participants.find((p: string) => p !== username);
                const isSelected = selectedChat?._id === chat._id;
                return (
                  <button key={chat._id} onClick={() => handleSelectChat(chat)} className={`w-full p-4 rounded-[20px] backdrop-blur-2xl transition-all duration-300 text-left group hover:scale-[1.01] active:scale-[0.99] ${isSelected ? 'scale-[1.01]' : ''}`} style={{ background: isSelected ? `linear-gradient(135deg, rgba(${c.rgb}, 0.18) 0%, rgba(${c.rgb}, 0.1) 100%)` : 'transparent', border: `1.5px solid ${isSelected ? `rgba(${c.rgb}, 0.4)` : 'transparent'}` }}>
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-medium" style={{ background: `linear-gradient(135deg, rgba(${c.rgb}, 0.25) 0%, rgba(${c.rgb}, 0.15) 100%)`, border: `1.5px solid rgba(${c.rgb}, 0.35)` }}>
                        <span style={{ color: c.hex }}>{friendName ? friendName[0].toUpperCase() : '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1"><h3 className="truncate font-medium" style={{ color: s.text }}>{friendName}</h3></div>
                        <p className="text-sm truncate leading-tight" style={{ color: s.textMuted }}>{t.openChat}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <button onClick={() => { localStorage.clear(); router.push('/'); }} className="p-4 text-xs hover:text-red-500 transition-colors text-center border-t" style={{ borderColor: s.border, color: s.textMuted }}>{t.logout}</button>
        </div>

        <div className={`flex-1 flex-col relative ${!isMobileChatOpen ? 'hidden md:flex' : 'flex'}`}>
          {!selectedChat ? (
            <div className="flex flex-col h-full items-center justify-center backdrop-blur-2xl relative" style={{ background: 'rgba(128, 128, 128, 0.01)' }}>
              <div className="absolute top-6 right-6 text-right hidden md:block">
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color: s.textMuted }}>{t.yourCode}</p>
                <p className="text-xl font-mono font-bold" style={{ color: c.hex }}>{userCode}</p>
              </div>
              <div className="text-center px-4">
                <div className="w-28 h-28 mx-auto mb-8 rounded-full flex items-center justify-center backdrop-blur-2xl" style={{ background: `linear-gradient(135deg, rgba(${c.rgb}, 0.15) 0%, rgba(${c.rgb}, 0.08) 100%)`, border: `1.5px solid rgba(${c.rgb}, 0.3)` }}>
                  <MessageSquare className="w-14 h-14" style={{ color: c.hex }} strokeWidth={1.5} />
                </div>
                <h2 className="text-xl mb-2 font-semibold tracking-tight" style={{ color: s.text }}>{t.selectChat}</h2>
                <p className="text-sm" style={{ color: s.textMuted }}>{t.orAddFriend}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full backdrop-blur-2xl" style={{ background: 'rgba(128, 128, 128, 0.01)' }}>
              <div className="px-6 pb-5 backdrop-blur-3xl border-b" style={{ background: 'rgba(128, 128, 128, 0.03)', borderColor: s.border, paddingTop: 'calc(env(safe-area-inset-top) + 1.25rem)' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setIsMobileChatOpen(false)} className="md:hidden mr-2" style={{ color: c.hex }}><ArrowLeft className="w-6 h-6" /></button>
                    <h2 className="text-xl font-semibold tracking-tight" style={{ color: s.text }}>{selectedChat.participants.find((p: string) => p !== username)}</h2>
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-2xl" style={{ background: `rgba(${c.rgb}, 0.12)`, border: `1.5px solid rgba(${c.rgb}, 0.35)` }}>
                      <Shield className="w-3.5 h-3.5" style={{ color: c.hex }} />
                      <span className="text-[11px] font-medium" style={{ color: c.hex }}>{t.encrypted}</span>
                    </div>
                  </div>
                  <button onClick={deleteChat} className="p-2.5 rounded-full backdrop-blur-2xl transition-all duration-300 hover:scale-110 active:scale-95 group" style={{ background: s.surface, border: `1.5px solid ${s.border}` }}>
                    <Trash2 className="w-5 h-5 group-hover:text-red-500 transition-colors" style={{ color: s.textMuted }} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-50"><p className="text-center text-sm" style={{ color: s.textMuted }}>{t.emptyHistory}</p></div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.sender === username;
                    return (
                      <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[85%] md:max-w-[65%] px-4 py-2.5 md:px-6 md:py-3.5 backdrop-blur-2xl ${isMe ? 'rounded-[20px] md:rounded-[24px] rounded-br-[6px] md:rounded-br-[8px]' : 'rounded-[20px] md:rounded-[24px] rounded-bl-[6px] md:rounded-bl-[8px]'}`} style={{ background: isMe ? `linear-gradient(135deg, rgba(${c.rgb}, 0.35) 0%, rgba(${c.rgb}, 0.2) 100%)` : s.msgBubble, border: `1.5px solid ${isMe ? `rgba(${c.rgb}, 0.4)` : s.border}` }}>
                          <p className="whitespace-pre-wrap break-all leading-relaxed text-sm md:text-base" style={{ color: isMe ? c.text : s.text }}>{msg.text}</p>
                          <div className="flex items-center gap-2 mt-2 justify-end">
                            <span className="text-[11px] opacity-80" style={{ color: isMe ? c.text : s.textMuted }}>{new Date(msg.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && (
                              <div className="flex">
                                <Check className={`w-3.5 h-3.5 -mr-2 transition-all duration-300`} style={{ color: msg.isRead ? c.hex : c.text }} />
                                <Check className={`w-3.5 h-3.5 transition-all duration-300`} style={{ color: msg.isRead ? c.hex : c.text }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {typingUser && (
                  <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* YENİ: Paddingler ve noktalar WhatsApp ebatlarına küçültüldü */}
                    <div className="px-4 py-3 rounded-[20px] rounded-bl-[6px] backdrop-blur-2xl flex items-center gap-1.5 h-[38px]" style={{ background: s.msgBubble, border: `1.5px solid ${s.border}` }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: c.hex }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: c.hex, animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: c.hex, animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 md:p-5 backdrop-blur-2xl border-t" style={{ background: 'rgba(128, 128, 128, 0.03)', borderColor: s.border }}>
                <form onSubmit={sendMessage} className="flex gap-3 items-end">
                  <div className="flex-1 relative">
                    <textarea 
                      ref={textareaRef} 
                      value={newMessage} 
                      onChange={handleTyping} 
                      placeholder={t.typeMessage} 
                      rows={1}
                      className="w-full px-6 py-4 rounded-[26px] backdrop-blur-2xl focus:outline-none resize-none scrollbar-hide" 
                      style={{ 
                        background: 'rgba(128, 128, 128, 0.08)', 
                        border: `1.5px solid ${s.border}`, 
                        color: s.text,
                        minHeight: '56px',
                        maxHeight: '120px'
                      }} 
                      onInput={(e: any) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                      }}
                    />
                  </div>
                  <button type="submit" disabled={!newMessage.trim()} className="w-14 h-14 rounded-full backdrop-blur-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center flex-shrink-0 disabled:opacity-40" style={{ background: newMessage.trim() ? `linear-gradient(135deg, ${c.hex} 0%, ${c.hexEnd} 100%)` : 'rgba(128, 128, 128, 0.08)', border: `1.5px solid rgba(${c.rgb}, 0.4)` }}>
                    <Send className="w-5 h-5" style={{ color: newMessage.trim() ? c.text : s.textMuted }} />
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddFriendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
          <div className="w-full max-w-md p-8 rounded-[32px] backdrop-blur-3xl shadow-2xl animate-in zoom-in-95 duration-300" style={{ background: s.surface, border: `1.5px solid ${s.border}` }}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold inline-block bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${c.hex} 0%, ${c.hexEnd} 100%)` }}>{t.addFriend}</h2>
              <button onClick={() => setShowAddFriendModal(false)} className="p-2.5 rounded-full hover:scale-110 active:scale-95" style={{ background: 'rgba(128, 128, 128, 0.1)' }}><X className="w-5 h-5" style={{ color: s.textMuted }} /></button>
            </div>
            <form onSubmit={addFriend} className="space-y-6">
              <div>
                <label className="block text-sm mb-3 font-medium" style={{ color: s.textMuted }}>{t.friendCode}</label>
                <input type="text" value={friendCode} onChange={(e) => setFriendCode(e.target.value.slice(0, 6))} placeholder="000000" maxLength={6} className="w-full px-6 py-5 rounded-[24px] focus:outline-none text-center tracking-[0.6em] text-3xl font-medium" style={{ background: 'rgba(128, 128, 128, 0.08)', border: `1.5px solid ${s.border}`, color: c.hex }} />
                {status && <p className={`text-center text-sm font-medium mt-2`} style={{ color: status.includes('Hata') || status.includes('Error') ? '#ef4444' : c.hex }}>{status}</p>}
              </div>
              <button type="submit" disabled={loading || friendCode.length !== 6} className="w-full px-6 py-4 rounded-[24px] disabled:opacity-40 font-medium" style={{ background: friendCode.length === 6 ? `linear-gradient(135deg, ${c.hex} 0%, ${c.hexEnd} 100%)` : 'rgba(128, 128, 128, 0.08)' }}><span style={{ color: friendCode.length === 6 ? c.text : s.textMuted }}>{loading ? t.searching : t.startChat}</span></button>
            </form>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
          <div className="w-full max-w-md p-8 rounded-[32px] backdrop-blur-3xl shadow-2xl animate-in zoom-in-95 duration-300" style={{ background: s.surface, border: `1.5px solid ${s.border}` }}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold inline-block bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${c.hex} 0%, ${c.hexEnd} 100%)` }}>{t.settings}</h2>
              <button onClick={() => setShowSettings(false)} className="p-2.5 rounded-full hover:scale-110 active:scale-95" style={{ background: 'rgba(128, 128, 128, 0.1)' }}><X className="w-5 h-5" style={{ color: s.textMuted }} /></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: s.textMuted }}>{t.language}</label>
                <div className="flex gap-2">
                  <button onClick={() => setLang('en')} className={`flex-1 py-2 rounded-xl border ${lang === 'en' ? 'border-transparent' : ''}`} style={{ background: lang === 'en' ? c.hex : 'transparent', borderColor: lang === 'en' ? 'transparent' : s.border, color: lang === 'en' ? c.text : s.text }}>English</button>
                  <button onClick={() => setLang('tr')} className={`flex-1 py-2 rounded-xl border ${lang === 'tr' ? 'border-transparent' : ''}`} style={{ background: lang === 'tr' ? c.hex : 'transparent', borderColor: lang === 'tr' ? 'transparent' : s.border, color: lang === 'tr' ? c.text : s.text }}>Türkçe</button>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: s.textMuted }}>{t.theme}</label>
                <div className="flex gap-2">
                  <button onClick={() => setTheme('dark')} className={`flex-1 py-2 rounded-xl border`} style={{ background: theme === 'dark' ? c.hex : 'transparent', borderColor: theme === 'dark' ? 'transparent' : s.border, color: theme === 'dark' ? c.text : s.text }}>{t.dark}</button>
                  <button onClick={() => setTheme('black')} className={`flex-1 py-2 rounded-xl border`} style={{ background: theme === 'black' ? c.hex : 'transparent', borderColor: theme === 'black' ? 'transparent' : s.border, color: theme === 'black' ? c.text : s.text }}>{t.black}</button>
                  <button onClick={() => setTheme('light')} className={`flex-1 py-2 rounded-xl border`} style={{ background: theme === 'light' ? c.hex : 'transparent', borderColor: theme === 'light' ? 'transparent' : s.border, color: theme === 'light' ? c.text : s.text }}>{t.light}</button>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: s.textMuted }}>{t.accentColor}</label>
                <div className="flex gap-3 justify-center">
                  {Object.keys(accentColors).map((colorKey) => (
                    <button key={colorKey} onClick={() => setAccent(colorKey)} className={`w-10 h-10 rounded-full transition-all ${accent === colorKey ? 'scale-125 outline outline-2 outline-offset-2' : 'hover:scale-110'}`} style={{ background: accentColors[colorKey].hex, outlineColor: accentColors[colorKey].hex }} />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2 font-medium" style={{ color: s.textMuted }}>{t.notifications}</label>
                <div className="flex gap-2">
                  <button onClick={() => setNotif(true)} className={`flex-1 py-2 rounded-xl border`} style={{ background: notif ? c.hex : 'transparent', borderColor: notif ? 'transparent' : s.border, color: notif ? c.text : s.text }}>{t.on}</button>
                  <button onClick={() => setNotif(false)} className={`flex-1 py-2 rounded-xl border`} style={{ background: !notif ? '#ef4444' : 'transparent', borderColor: !notif ? 'transparent' : s.border, color: !notif ? '#fff' : s.text }}>{t.off}</button>
                </div>
              </div>

              <button onClick={saveSettings} className="w-full py-4 rounded-[24px] font-bold mt-4 hover:opacity-90 active:scale-[0.98] transition-all" style={{ background: `linear-gradient(135deg, ${c.hex} 0%, ${c.hexEnd} 100%)`, color: c.text }}>{t.save}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}