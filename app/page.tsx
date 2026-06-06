'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth, AuthProvider } from '@/lib/auth/AuthContext';
import {
  TrendingUp, BarChart3, FileText, Store,
  Sun, Moon, ChevronLeft, LogOut,
  ShieldAlert, ShieldCheck, Shield,
} from 'lucide-react';
import { tk } from '@/lib/theme';
import Actual from '@/app/components/actual'

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme    = 'light' | 'dark';
type UserRole = 'root' | 'admin' | 'user';
type TabId    = 'Actual' | 'Menu2' | 'Menu3' | 'Menu4';

// ─── Tabs config — tambah / ubah di sini ─────────────────────────────────────

const TABS: { id: TabId; label: string; shortLabel: string; Icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { id: 'Actual',    label: 'Actual',     shortLabel: 'Actual', Icon: FileText    },
  // { id: 'Menu2',     label: 'Menu 2',       shortLabel: 'Menu 2',   Icon: BarChart3   },
  // { id: 'Menu3',     label: 'Menu 3',       shortLabel: 'Menu 3',   Icon: BarChart3   },
  // { id: 'Menu4',     label: 'Menu 4',       shortLabel: 'Menu 4',   Icon: BarChart3   },
];

// ─── Theme tokens ─────────────────────────────────────────────────────────────

// const tk = {
//   dark: {
//     pagebg: '#07090e', sidebarbg: '#0b0d13', headerbg: 'rgba(11,13,19,0.96)',
//     cardbg: '#0e1118', bottombarbg: 'rgba(11,13,19,0.97)',
//     border: 'rgba(255,255,255,0.055)', borderCard: 'rgba(255,255,255,0.075)',
//     borderInput: 'rgba(255,255,255,0.09)',
//     text: 'rgba(255,255,255,0.92)', textSub: 'rgba(255,255,255,0.52)',
//     textMuted: 'rgba(255,255,255,0.28)', textFaint: 'rgba(255,255,255,0.13)',
//     textNav: 'rgba(255,255,255,0.36)',
//     navActiveBg: 'rgba(28,151,6,0.11)', navActiveText: '#4ade80', navActiveDot: '#1c9706',
//     inputBg: 'rgba(255,255,255,0.035)',
//     toggleBg: 'rgba(255,255,255,0.055)', toggleBorder: 'rgba(255,255,255,0.09)',
//     optionBg: '#0b0d13', scrollbar: 'rgba(255,255,255,0.08)',
//     red: { bg: 'rgba(239,68,68,0.08)', text: '#fca5a5', border: 'rgba(239,68,68,0.18)' },
//   },
//   light: {
//     pagebg: '#eef1f7', sidebarbg: '#ffffff', headerbg: 'rgba(255,255,255,0.96)',
//     cardbg: '#ffffff', bottombarbg: 'rgba(255,255,255,0.97)',
//     border: 'rgba(0,0,0,0.065)', borderCard: 'rgba(0,0,0,0.08)',
//     borderInput: 'rgba(0,0,0,0.1)',
//     text: '#0f172a', textSub: '#475569', textMuted: '#94a3b8',
//     textFaint: '#cbd5e1', textNav: '#64748b',
//     navActiveBg: 'rgba(28,151,6,0.07)', navActiveText: '#15803d', navActiveDot: '#1c9706',
//     inputBg: 'rgba(0,0,0,0.03)',
//     toggleBg: '#f1f5f9', toggleBorder: 'rgba(0,0,0,0.09)',
//     optionBg: '#ffffff', scrollbar: 'rgba(0,0,0,0.12)',
//     red: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
//   },
// } as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useBreakpoint() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return { isMobile: w < 640, isTablet: w < 1024 };
}

function RoleIcon({ role, size = 12 }: { role: UserRole; size?: number }) {
  const c: Record<UserRole, string> = { root: '#a78bfa', admin: '#60a5fa', user: '#34d399' };
  if (role === 'root')  return <ShieldAlert  size={size} color={c.root}  />;
  if (role === 'admin') return <ShieldCheck size={size} color={c.admin} />;
  return <Shield size={size} color={c.user} />;
}

// ─── Theme toggle ─────────────────────────────────────────────────────────────

function ThemeToggle({ theme, setTheme, compact = false }: { theme: Theme; setTheme: (t: Theme) => void; compact?: boolean }) {
  const t = tk[theme]; const isDark = theme === 'dark';
  if (compact) return (
    <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
      style={{ width: 30, height: 30, borderRadius: 7, background: t.toggleBg, border: `1px solid ${t.toggleBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.textMuted, flexShrink: 0 }}>
      {isDark ? <Sun size={13} /> : <Moon size={13} />}
    </button>
  );
  return (
    <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px 4px 4px', background: t.toggleBg, border: `1px solid ${t.toggleBorder}`, borderRadius: 16, cursor: 'pointer', flexShrink: 0 }}>
      <span style={{ position: 'relative', display: 'inline-flex', width: 26, height: 15, borderRadius: 8, background: isDark ? '#1e2d1a' : '#e8f0fe', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: isDark ? 13 : 2, width: 9, height: 9, borderRadius: '50%', background: isDark ? '#4ade80' : '#2563eb', transition: 'left 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isDark ? <Moon size={5} color="#07090e" /> : <Sun size={5} color="white" />}
        </span>
      </span>
      <span style={{ fontSize: 10, fontWeight: 600, color: t.textSub, fontFamily: 'IBM Plex Mono,monospace' }}>{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
}

// ─── Session guard ────────────────────────────────────────────────────────────

function SessionGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [dots, setDots] = useState(0);

  useEffect(() => { const iv = setInterval(() => setDots(d => (d + 1) % 4), 500); return () => clearInterval(iv); }, []);
  useEffect(() => { if (!loading && !user) window.location.href = '/login?from=' + encodeURIComponent(window.location.pathname); }, [user, loading]);

  if (loading || !user) return (
    <div style={{ minHeight: '100vh', background: '#07090e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontFamily: 'IBM Plex Mono, monospace' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        @keyframes sgPulse { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes sgRing  { to{transform:rotate(360deg)} }
        @keyframes sgFadeUp{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sgBar   { 0%{width:0%} 40%{width:60%} 70%{width:82%} 100%{width:96%} }
      `}</style>
      <div style={{ animation: 'sgFadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <svg style={{ position: 'absolute', inset: 0, animation: 'sgRing 1.4s linear infinite' }} width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="28" stroke="rgba(28,151,6,0.15)" strokeWidth="2.5"/>
            <path d="M32 4 a28 28 0 0 1 24.2 14" stroke="#1c9706" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div style={{ position: 'absolute', inset: 10, borderRadius: 12, background: 'rgba(28,151,6,0.12)', border: '1px solid rgba(28,151,6,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'sgPulse 2s ease-in-out infinite' }}>
            <img src="/logo-cgkn.png" alt="CGKN" style={{ width: 28, height: 28, objectFit: 'contain' }}/>
          </div>
        </div>
        <div style={{ textAlign: 'center', animation: 'sgFadeUp 0.5s 0.1s ease both', opacity: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.03em', lineHeight: 1 }}>CGKN Logistik</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 4 }}>Dashboard</div>
        </div>
        <div style={{ animation: 'sgFadeUp 0.5s 0.2s ease both', opacity: 0, width: 160 }}>
          <div style={{ height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'linear-gradient(90deg, #1c9706, #4ade80)', borderRadius: 2, animation: 'sgBar 2.5s cubic-bezier(0.4,0,0.2,1) forwards' }}/>
          </div>
        </div>
        <div style={{ animation: 'sgFadeUp 0.5s 0.3s ease both', opacity: 0, fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.06em' }}>
          Memverifikasi sesi{'.' .repeat(dots)}
        </div>
      </div>
    </div>
  );
  return <>{children}</>;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, theme, setTheme }: {
  activeTab: TabId; setActiveTab: (id: TabId) => void;
  collapsed: boolean; setCollapsed: (v: boolean) => void;
  theme: Theme; setTheme: (t: Theme) => void;
}) {
  const t = tk[theme]; const { user, logout } = useAuth();
  return (
    <aside style={{ position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 40, display: 'flex', flexDirection: 'column', width: collapsed ? 52 : 200, background: t.sidebarbg, borderRight: `1px solid ${t.border}`, transition: 'width 0.2s cubic-bezier(.4,0,.2,1)', overflowX: 'hidden' }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '0' : '0 8px 0 12px', borderBottom: `1px solid ${t.border}`, flexShrink: 0, minHeight: 46 }}>
        {collapsed ? (
          <button onClick={() => setCollapsed(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
            <img src="/logo-cgkn.png" alt="CGKN" style={{ width: 26, height: 26, borderRadius: 7, objectFit: 'contain' }}/>
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/logo-cgkn.png" alt="CGKN" style={{ width: 26, height: 26, borderRadius: 7, objectFit: 'contain', flexShrink: 0 }}/>
              <div>
                <div style={{ color: t.text, fontSize: 12, fontWeight: 800, fontFamily: 'IBM Plex Mono,monospace', lineHeight: 1.1 }}>CGKN</div>
                <div style={{ color: t.textMuted, fontSize: 8, fontFamily: 'IBM Plex Mono,monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Dashboard Logistik</div>
              </div>
            </div>
            <button onClick={() => setCollapsed(true)} style={{ background: t.inputBg, border: `1px solid ${t.borderInput}`, cursor: 'pointer', color: t.textMuted, borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={11}/>
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '6px 4px', overflowY: 'auto' }}>
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} onClick={() => setActiveTab(id)} title={collapsed ? label : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minHeight: 33, padding: collapsed ? '5px 0' : '5px 8px', borderRadius: 7, border: 'none', cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start', background: active ? t.navActiveBg : 'transparent', color: active ? t.navActiveText : t.textNav, fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: 'IBM Plex Sans,sans-serif', transition: 'all 0.12s', marginBottom: 1, position: 'relative' }}>
              <Icon size={13} color={active ? t.navActiveText : t.textMuted}/>
              {!collapsed && <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>}
              {active && <span style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 2, borderRadius: '0 2px 2px 0', background: t.navActiveDot }}/>}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: collapsed ? '8px 4px' : '8px', borderTop: `1px solid ${t.border}`, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5, alignItems: collapsed ? 'center' : 'stretch' }}>
        {collapsed ? (
          <>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, borderRadius: 7, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {theme === 'dark' ? <Sun size={13}/> : <Moon size={13}/>}
            </button>
            <button onClick={logout} style={{ background: t.red.bg, border: `1px solid ${t.red.border}`, cursor: 'pointer', borderRadius: 7, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={12} color={t.red.text}/>
            </button>
          </>
        ) : (
          <>
            {user && (
              <div style={{ padding: '6px 8px', borderRadius: 8, background: t.inputBg, border: `1px solid ${t.borderInput}`, display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: user.role === 'root' ? 'rgba(139,92,246,0.14)' : user.role === 'admin' ? 'rgba(37,99,235,0.12)' : 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <RoleIcon role={user.role as UserRole} size={11}/>
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.text, fontFamily: 'IBM Plex Mono,monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
                  <div style={{ fontSize: 8, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{user.role}</div>
                </div>
                <button onClick={logout} style={{ background: t.red.bg, border: `1px solid ${t.red.border}`, cursor: 'pointer', borderRadius: 5, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <LogOut size={10} color={t.red.text}/>
                </button>
              </div>
            )}
            <ThemeToggle theme={theme} setTheme={setTheme}/>
          </>
        )}
      </div>
    </aside>
  );
}

// ─── Mobile bottom nav ────────────────────────────────────────────────────────

function MobileBottomNav({ activeTab, setActiveTab, theme }: { activeTab: TabId; setActiveTab: (id: TabId) => void; theme: Theme }) {
  const t = tk[theme];
  return (
    <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, background: t.bottombarbg, backdropFilter: 'blur(16px)', borderTop: `1px solid ${t.border}`, display: 'flex', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
      {TABS.map(({ id, shortLabel, Icon }) => {
        const active = activeTab === id;
        return (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '7px 2px', border: 'none', background: 'transparent', cursor: 'pointer', minHeight: 48, gap: 2, color: active ? t.navActiveText : t.textMuted, position: 'relative' }}>
            <Icon size={16} color={active ? t.navActiveText : t.textMuted}/>
            <span style={{ fontSize: 8, fontWeight: active ? 700 : 400, fontFamily: 'IBM Plex Sans,sans-serif' }}>{shortLabel}</span>
            {active && <span style={{ position: 'absolute', top: 0, width: 16, height: 2, background: t.navActiveText, borderRadius: '0 0 2px 2px' }}/>}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Mobile header ────────────────────────────────────────────────────────────

function MobileHeader({ theme, setTheme }: { theme: Theme; setTheme: (t: Theme) => void }) {
  const t = tk[theme]; const { user, logout } = useAuth();
  return (
    <header style={{ background: t.headerbg, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', height: 44, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <img src="/logo-cgkn.png" alt="CGKN" style={{ width: 26, height: 26, borderRadius: 7, objectFit: 'contain' }}/>
        <span style={{ fontSize: 12, fontWeight: 800, color: t.text, fontFamily: 'IBM Plex Mono,monospace' }}>CGKN</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        {user && <span style={{ fontSize: 10, fontWeight: 600, color: t.textSub, fontFamily: 'IBM Plex Mono,monospace', padding: '2px 6px', borderRadius: 10, background: t.inputBg, border: `1px solid ${t.borderInput}` }}>{user.username}</span>}
        <ThemeToggle theme={theme} setTheme={setTheme} compact/>
        <button onClick={logout} style={{ width: 28, height: 28, borderRadius: 7, background: t.red.bg, border: `1px solid ${t.red.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <LogOut size={11} color={t.red.text}/>
        </button>
      </div>
    </header>
  );
}

// ─── Tab content placeholder — ganti dengan komponen aktual ──────────────────

function TabContent({ tab, theme }: { tab: TabId; theme: Theme }) {
  const t = tk[theme];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
        {TABS.find(x => x.id === tab)?.label}
      </div>
      <div style={{ fontSize: 12, color: t.textMuted, fontFamily: 'IBM Plex Mono,monospace' }}>
        {/* ganti dengan komponen aktual */}
        sek harap bersabar
      </div>
    </div>
  );
}

// ─── Dashboard inner ──────────────────────────────────────────────────────────

function DashboardInner() {
  const [theme,    setThemeState] = useState<Theme>('light');
  const [tab,      setTab]        = useState<TabId>('Actual');
  const [collapsed, setCollapsed] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const { isMobile, isTablet } = useBreakpoint();
  const t = tk[theme];

  useEffect(() => {
    try { const s = localStorage.getItem('dashboard-theme') as Theme | null; if (s === 'dark' || s === 'light') setThemeState(s); } catch {}
  }, []);

  const setTheme = (v: Theme) => { setThemeState(v); try { localStorage.setItem('dashboard-theme', v); } catch {} };

  useEffect(() => { if (isTablet) setCollapsed(true); }, [isTablet]);

  if (isMobile) return (
    <div style={{ width: '100%', background: t.pagebg, height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <MobileHeader theme={theme} setTheme={setTheme}/>
      <main ref={mainRef} style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingBottom: 56 }}>
        <TabContent tab={tab} theme={theme}/>
      </main>
      <MobileBottomNav activeTab={tab} setActiveTab={setTab} theme={theme}/>
    </div>
  );

  return (
    <div style={{ width: '100%', background: t.pagebg, height: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <Sidebar activeTab={tab} setActiveTab={setTab} collapsed={collapsed} setCollapsed={setCollapsed} theme={theme} setTheme={setTheme}/>
      <div style={{ marginLeft: collapsed ? 52 : 200, display: 'flex', flexDirection: 'column', height: '100vh', flex: 1, transition: 'margin-left 0.2s cubic-bezier(.4,0,.2,1)', overflow: 'hidden', minWidth: 0 }}>
        <main ref={mainRef} style={{ flex: 1, minHeight: 0, padding: '16px', overflow: 'auto', color: t.text }}>
          {/* ← tambah tab content di sini */}
          {/* {tab === 'overview'     && <OverviewTab     theme={theme} />} */}
          {/* {tab === 'sales'        && <SalesTab        theme={theme} />} */}
          {/* {tab === 'distribution' && <DistributionTab theme={theme} />} */}
          {/* {tab === 'stores'       && <StoresTab       theme={theme} />} */}
          {tab === 'Actual' && <Actual theme={theme} />}
        </main>
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <AuthProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes sgPulse { 0%,100%{opacity:0.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.06)} }
        @keyframes sgRing  { to{transform:rotate(360deg)} }
        @keyframes sgFadeUp{ from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes sgBar   { 0%{width:0%} 40%{width:60%} 70%{width:82%} 100%{width:96%} }
      `}</style>
      <SessionGuard>
        <DashboardInner />
      </SessionGuard>
    </AuthProvider>
  );
}