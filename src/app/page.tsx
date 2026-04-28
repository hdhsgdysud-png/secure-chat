'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';

const dict: any = {
  en: {
    login: 'Login', register: 'Create Account', subtitle: 'End-to-end encrypted messaging platform', username: 'Username', password: 'Password', processing: 'Processing...', noAccount: 'Don\'t have an account?', hasAccount: 'Already have an account?', registerNow: 'Register Now', loginNow: 'Login Now', reqEmpty: 'Username and password cannot be empty!', connErr: 'Connection failed!', successReg: 'Registration successful! Code: '
  },
  tr: {
    login: 'Giriş Yap', register: 'Hesap Oluştur', subtitle: 'Uçtan uca şifreli mesajlaşma platformu', username: 'Kullanıcı Adı', password: 'Şifre', processing: 'İşleniyor...', noAccount: 'Henüz hesabın yok mu?', hasAccount: 'Zaten hesabın var mı?', registerNow: 'Hemen Kayıt Ol', loginNow: 'Giriş Yap', reqEmpty: 'Kullanıcı adı ve şifre boş bırakılamaz!', connErr: 'Sunucuya bağlanılamadı!', successReg: 'Kayıt Başarılı! Kodun: '
  }
};

const accentColors: any = {
  cyan: { hex: '#06b6d4', hexEnd: '#0891b2', rgb: '6, 182, 212' },
  white: { hex: '#ffffff', hexEnd: '#e2e8f0', rgb: '255, 255, 255' },
  green: { hex: '#22c55e', hexEnd: '#16a34a', rgb: '34, 197, 94' },
  red: { hex: '#ef4444', hexEnd: '#dc2626', rgb: '239, 68, 68' },
  pink: { hex: '#ec4899', hexEnd: '#db2777', rgb: '236, 72, 153' }
};

const themeStyles: any = {
  dark: { bg: 'radial-gradient(ellipse at top, #14141e 0%, #0a0a0f 50%, #0a0a0f 100%)', surface: 'rgba(20, 20, 30, 0.85)', text: '#f0f0f5', textMuted: '#8a8a95', border: 'rgba(255, 255, 255, 0.15)' },
  black: { bg: '#000000', surface: 'rgba(10, 10, 10, 0.85)', text: '#ffffff', textMuted: '#666666', border: 'rgba(255, 255, 255, 0.1)' },
  light: { bg: 'radial-gradient(ellipse at top, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)', surface: 'rgba(255, 255, 255, 0.7)', text: '#0f172a', textMuted: '#64748b', border: 'rgba(0, 0, 0, 0.1)' }
};

export default function Home() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [lang, setLang] = useState('en');
  const [theme, setTheme] = useState('dark');
  const [accent, setAccent] = useState('cyan');

  useEffect(() => {
    const storedName = localStorage.getItem('username');
    if (storedName) {
      router.push('/dashboard');
    } else {
      setLang(localStorage.getItem('lang') || 'en');
      setTheme(localStorage.getItem('theme') || 'dark');
      setAccent(localStorage.getItem('accent') || 'cyan');
      setIsCheckingAuth(false);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });

    if (!username || !password) {
      setStatus({ type: 'error', text: dict[lang].reqEmpty });
      return;
    }

    setIsLoading(true);
    const apiPath = isLogin ? '/api/login' : '/api/register';

    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok) {
        if (!isLogin) {
          setStatus({ type: 'success', text: `${dict[lang].successReg}${data.userCode}` });
          setTimeout(() => setIsLogin(true), 2000);
       } else {
          localStorage.setItem('username', data.username);
          localStorage.setItem('userCode', data.userCode);
          
          // VERİTABANINDAN GELEN AYARLARI TARAYICIYA KAYDET
          if (data.settings) {
            localStorage.setItem('lang', data.settings.lang);
            localStorage.setItem('theme', data.settings.theme);
            localStorage.setItem('accent', data.settings.accent);
            localStorage.setItem('notif', data.settings.notif.toString());
          }
          
          router.push('/dashboard');
        }
      } else {
        setStatus({ type: 'error', text: data.error || 'Error' });
      }
    } catch (error) {
      setStatus({ type: 'error', text: dict[lang].connErr });
    }
    setIsLoading(false);
  };

  if (isCheckingAuth) return <div className="min-h-screen" style={{ background: themeStyles[theme]?.bg || '#0a0a0f' }}></div>;

  const t = dict[lang];
  const c = accentColors[accent];
  const s = themeStyles[theme];

  return (
    <main className="h-screen w-screen overflow-hidden antialiased flex items-center justify-center p-4 transition-colors duration-500" style={{ background: s.bg }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, rgba(${c.rgb}, 0.05), transparent 50%)` }} />

      <div
        className="w-full max-w-md p-10 rounded-[32px] backdrop-blur-3xl shadow-2xl relative z-10 animate-in zoom-in-95 duration-500"
        style={{ background: s.surface, border: `1.5px solid ${s.border}`, boxShadow: `0 24px 64px rgba(0, 0, 0, 0.3), 0 0 40px rgba(${c.rgb}, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.1)` }}
      >
        <div className="text-center mb-10">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center backdrop-blur-2xl"
            style={{ background: `linear-gradient(135deg, rgba(${c.rgb}, 0.15) 0%, rgba(${c.rgb}, 0.05) 100%)`, border: `1.5px solid rgba(${c.rgb}, 0.3)`, boxShadow: `0 12px 32px rgba(${c.rgb}, 0.15)` }}
          >
            <Shield className="w-10 h-10" style={{ color: c.hex }} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ background: `linear-gradient(135deg, ${c.hex} 0%, ${c.hexEnd} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {isLogin ? t.login : t.register}
          </h1>
          <p className="text-sm" style={{ color: s.textMuted }}>{t.subtitle}</p>
        </div>

        {status.text && (
          <div className="mb-6 p-4 rounded-2xl text-sm font-medium border flex items-center gap-3 animate-in fade-in duration-300" style={{ background: status.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : `rgba(${c.rgb}, 0.1)`, borderColor: status.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : `rgba(${c.rgb}, 0.3)`, color: status.type === 'error' ? '#ef4444' : c.hex }}>
            {status.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {status.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider ml-1" style={{ color: s.textMuted }}>{t.username}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: s.textMuted }} />
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="w-full pl-12 pr-6 py-4 rounded-[20px] backdrop-blur-2xl transition-all duration-300 focus:outline-none" style={{ background: 'rgba(128, 128, 128, 0.08)', border: `1.5px solid ${s.border}`, color: s.text }} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider ml-1" style={{ color: s.textMuted }}>{t.password}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: s.textMuted }} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-6 py-4 rounded-[20px] backdrop-blur-2xl transition-all duration-300 focus:outline-none" style={{ background: 'rgba(128, 128, 128, 0.08)', border: `1.5px solid ${s.border}`, color: s.text }} />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-4 rounded-[22px] backdrop-blur-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group shadow-lg" style={{ background: `linear-gradient(135deg, ${c.hex} 0%, ${c.hexEnd} 100%)`, border: `1.5px solid rgba(${c.rgb}, 0.4)`, boxShadow: `0 8px 24px rgba(${c.rgb}, 0.3)` }}>
            <span className="text-white font-bold text-lg">{isLoading ? t.processing : (isLogin ? t.login : t.register)}</span>
            {!isLoading && <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-10 text-center border-t pt-8" style={{ borderColor: s.border }}>
          <p className="text-sm" style={{ color: s.textMuted }}>
            {isLogin ? t.noAccount : t.hasAccount}{' '}
            <button onClick={() => { setIsLogin(!isLogin); setStatus({ type: '', text: '' }); }} className="font-bold hover:underline ml-1" style={{ color: c.hex }}>
              {isLogin ? t.registerNow : t.loginNow}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}