'use client';

import { useState, useEffect } from 'react';
import { useAuth, AuthProvider } from '@/lib/auth/AuthContext';
import {
  Sun, Moon, ChevronLeft, LogOut,
  ShieldAlert, ShieldCheck, Shield, LandPlot, Boxes,
  NotebookPen, MenuIcon, Menu, X,
  Users, Settings,
} from 'lucide-react';
import UserManagement from '@/app/components/UserManagement';
import AreaManagement from '@/app/components/AreaManagement';
import ProdukManagement from '@/app/components/ProdukManagement';
import HargaManagement from '@/app/components/HargaManagement';
import { ROLE_LABELS, UserRole } from '@/lib/auth/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Theme = 'light' | 'dark';
type TabId = 'area' | 'produk' | 'harga' | 'users' | 'settings';

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_SECTIONS: {
  section: string;
  items: { id: TabId; label: string; icon: React.ComponentType<{ size?: number; color?: string }>; accent: string; perm?: string }[];
}[] = [
  {
    section: 'DATA',
    items: [
      { id: 'area', label: 'Management Area', icon: LandPlot, accent: '#6366f1' },
      { id: 'produk', label: 'Management Produk', icon: Boxes, accent: '#10b981' },
      { id: 'harga', label: 'Management Harga', icon: NotebookPen, accent: '#dc2626' },
    ],
  },
  {
    section: 'ADMIN',
    items: [
      { id: 'users',    label: 'Manajemen User', icon: Users,    accent: '#a855f7', perm: 'manage_users' },
      { id: 'settings', label: 'Pengaturan',     icon: Settings, accent: '#f59e0b' },
    ],
  },
];

const PAGE_META: Record<TabId, { title: string; subtitle: string; color: string }> = {
  area:     { title: 'Area',           subtitle: 'Kelola area',            color: '#6366f1' },
  produk:   { title: 'Produk',         subtitle: 'Kelola produk',            color: '#10b981' },
  harga:    { title: 'Harga',          subtitle: 'Kelola harga',           color: '#0d9488' },
  users:    { title: 'Manajemen User', subtitle: 'Kelola akun pengguna',   color: '#a855f7' },
  settings: { title: 'Pengaturan',     subtitle: 'Akun & konfigurasi',     color: '#f59e0b' },
};

// ─── Theme tokens (identik dengan project) ────────────────────────────────────

export const tk = {
  dark: {
    pagebg: '#070a10', cardbg: '#0e1120',
    inputbg: 'rgba(255,255,255,0.04)',
    dropzoneActive: 'rgba(99,102,241,0.08)',
    border: 'rgba(255,255,255,0.06)', borderCard: 'rgba(255,255,255,0.08)',
    borderInput: 'rgba(255,255,255,0.1)', borderActive: 'rgba(99,102,241,0.6)',
    text: 'rgba(255,255,255,0.92)', textSub: 'rgba(255,255,255,0.58)',
    textMuted: 'rgba(255,255,255,0.32)', textFaint: 'rgba(255,255,255,0.15)',
    tableHead: 'rgba(255,255,255,0.02)', tableAlt: 'rgba(255,255,255,0.015)',
    sidebarbg: '#07120a',
    sidebarBorder: 'rgba(255,255,255,0.06)',
    sidebarText: 'rgba(255,255,255,0.4)',
    shadow: '0 1px 3px rgba(0,0,0,0.3)',
    headerbg: '#0a0d14',
    blue:   { bg: 'rgba(99,102,241,0.12)',  text: '#a5b4fc', border: 'rgba(99,102,241,0.3)'  },
    green:  { bg: 'rgba(16,185,129,0.1)',   text: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
    red:    { bg: 'rgba(239,68,68,0.1)',    text: '#fca5a5', border: 'rgba(239,68,68,0.22)'  },
    yellow: { bg: 'rgba(245,158,11,0.1)',   text: '#fcd34d', border: 'rgba(245,158,11,0.28)' },
    gray:   { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.42)', border: 'rgba(255,255,255,0.08)' },
    btnDisabled: { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.2)' },
    shadowCard: '0 4px 20px rgba(0,0,0,0.4)',
    shadowElevated: '0 8px 32px rgba(0,0,0,0.5)',
    modalOverlay: 'rgba(0,0,0,0.75)',
    stat1: { accent: '#6366f1', iconBg: 'rgba(99,102,241,0.15)', glow: 'rgba(99,102,241,0.2)' },
    stat2: { accent: '#10b981', iconBg: 'rgba(16,185,129,0.15)', glow: 'rgba(16,185,129,0.2)' },
    stat3: { accent: '#a855f7', iconBg: 'rgba(168,85,247,0.15)', glow: 'rgba(168,85,247,0.2)' },
    stat4: { accent: '#f59e0b', iconBg: 'rgba(245,158,11,0.15)', glow: 'rgba(245,158,11,0.2)' },
  },
  light: {
    pagebg: '#f0f3f9', cardbg: '#ffffff',
    inputbg: '#f8fafc',
    dropzoneActive: 'rgba(99,102,241,0.05)',
    border: 'rgba(0,0,0,0.07)', borderCard: 'rgba(0,0,0,0.09)',
    borderInput: 'rgba(0,0,0,0.12)', borderActive: '#6366f1',
    text: '#0f172a', textSub: '#475569', textMuted: '#94a3b8', textFaint: '#cbd5e1',
    tableHead: '#f8fafc', tableAlt: 'rgba(0,0,0,0.012)',
    sidebarbg: '#0a1a0d', 
    sidebarBorder: 'rgba(255,255,255,0.1)',
    sidebarText: 'rgba(255,255,255,0.5)',
    shadow: '0 1px 2px rgba(0,0,0,0.05)',
    headerbg: '#ffffff',
    blue:   { bg: 'rgba(99,102,241,0.08)', text: '#4f46e5', border: 'rgba(99,102,241,0.2)' },
    green:  { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    red:    { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    yellow: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    gray:   { bg: '#f1f5f9', text: '#64748b', border: 'rgba(0,0,0,0.09)' },
    btnDisabled: { bg: '#e2e8f0', text: '#94a3b8' },
    shadowCard: '0 2px 10px rgba(0,0,0,0.07)',
    shadowElevated: '0 8px 32px rgba(0,0,0,0.12)',
    modalOverlay: 'rgba(15,23,42,0.45)',
    stat1: { accent: '#6366f1', iconBg: '#e0e7ff', glow: 'rgba(99,102,241,0.12)' },
    stat2: { accent: '#10b981', iconBg: '#d1fae5', glow: 'rgba(16,185,129,0.12)' },
    stat3: { accent: '#a855f7', iconBg: '#ede9fe', glow: 'rgba(168,85,247,0.12)' },
    stat4: { accent: '#f59e0b', iconBg: '#fef3c7', glow: 'rgba(245,158,11,0.12)' },
  },
} as const;

type Tokens = typeof tk['light'];

const FONT_SANS = '"IBM Plex Sans", sans-serif';
const FONT_MONO = '"IBM Plex Mono", monospace';
const SIDEBAR_W           = 220;
const SIDEBAR_W_COLLAPSED = 52;
const BP_MD = 768;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useWindowWidth() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, []);
  return w;
}

function RoleIcon({ role, size = 12 }: { role: UserRole; size?: number }) {
  const c: Record<UserRole, string> = { root: '#a78bfa', admin: '#60a5fa', user: '#34d399' };
  if (role === 'root')  return <ShieldAlert  size={size} color={c.root}  />;
  if (role === 'admin') return <ShieldCheck size={size} color={c.admin} />;
  return <Shield size={size} color={c.user} />;
}

// ─── Session + admin guard ────────────────────────────────────────────────────

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, can, loading } = useAuth();
  const [dots, setDots] = useState(0);

  useEffect(() => { const iv = setInterval(() => setDots(d => (d + 1) % 4), 500); return () => clearInterval(iv); }, []);
  useEffect(() => { if (!loading && !user) window.location.href = '/login?from=' + encodeURIComponent(window.location.pathname); }, [user, loading]);

  if (loading || !user) return (
    <div style={{ minHeight: '100vh', background: '#07090e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontFamily: FONT_MONO }}>
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
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.22em', textTransform: 'uppercase', marginTop: 4 }}>Admin Panel</div>
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

  if (!can('access_admin_panel')) return (
  <div style={{ minHeight: '100vh', background: '#070e07', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontFamily: FONT_MONO }}>
    <style>{`
      @keyframes sgFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
    <div style={{ animation: 'sgFadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      
      {/* Icon */}
      <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShieldAlert size={28} color="#f87171" />
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center', animation: 'sgFadeUp 0.5s 0.1s ease both', opacity: 0 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: '-0.03em', lineHeight: 1 }}>Akses Ditolak</div>
        <div style={{ fontSize: 11, color: '#f87171', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 6 }}>Unauthorized Access</div>
      </div>

      {/* Desc */}
      <div style={{ animation: 'sgFadeUp 0.5s 0.2s ease both', opacity: 0, fontSize: 12, color: 'rgba(255,255,255,0.38)', textAlign: 'center', maxWidth: 260, lineHeight: 1.6 }}>
        Anda tidak memiliki akses ke panel admin. Hubungi Pak Nanang untuk informasi lebih lanjut.
      </div>

      {/* Divider */}
      <div style={{ animation: 'sgFadeUp 0.5s 0.3s ease both', opacity: 0, width: 160, height: 1, background: 'rgba(239,68,68,0.15)' }} />

      {/* Back button */}
      <div style={{ animation: 'sgFadeUp 0.5s 0.35s ease both', opacity: 0 }}>
        <button
          onClick={() => window.location.href = '/'}
          style={{ padding: '8px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, color: '#f87171', fontSize: 11, fontWeight: 600, fontFamily: FONT_MONO, cursor: 'pointer', letterSpacing: '0.06em' }}
        >
          Kembali ke Dashboard
        </button>
      </div>

    </div>
  </div>
);

  return <>{children}</>;
}

// ─── NavItem ──────────────────────────────────────────────────────────────────

function NavItem({ id, label, icon: Icon, accent, active, collapsed, onClick }: {
  id: TabId; label: string; icon: React.ComponentType<{ size?: number; color?: string }>;
  accent: string; active: boolean; collapsed: boolean; onClick: () => void;
}) {
  const t = tk['dark']; // sidebar selalu dark
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      title={collapsed ? label : undefined}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 9, padding: collapsed ? '8px 0' : '8px 10px 8px 14px', justifyContent: collapsed ? 'center' : 'flex-start', background: active ? `linear-gradient(90deg,${accent}22,${accent}08)` : hov ? 'rgba(255,255,255,0.04)' : 'transparent', border: 'none', borderLeft: active ? `2.5px solid ${accent}` : '2.5px solid transparent', borderRadius: collapsed ? 8 : '0 8px 8px 0', cursor: 'pointer', transition: 'all 0.12s', marginBottom: 1, position: 'relative' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? accent + '22' : hov ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
        <Icon size={14} color={active ? accent : hov ? 'rgba(255,255,255,0.75)' : t.sidebarText} />
      </div>
      {!collapsed && <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#fff' : hov ? 'rgba(255,255,255,0.8)' : t.sidebarText, flex: 1, textAlign: 'left' }}>{label}</span>}
      {collapsed && hov && (
        <div style={{ position: 'absolute', left: 'calc(100% + 10px)', top: '50%', transform: 'translateY(-50%)', background: '#1a1f35', color: '#fff', padding: '6px 10px', borderRadius: 7, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {label}
          <div style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', border: '5px solid transparent', borderRightColor: '#1a1f35' }} />
        </div>
      )}
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function SidebarContent({ activeTab, setActiveTab, collapsed, setCollapsed, theme, setTheme, can, isMobile, onClose }: {
  activeTab: TabId; setActiveTab: (id: TabId) => void;
  collapsed: boolean; setCollapsed: (v: boolean) => void;
  theme: Theme; setTheme: (v: Theme) => void;
  can: (p: string) => boolean; isMobile: boolean; onClose: () => void;
}) {
  const { user, logout } = useAuth();
  const ROLE_CFG: Record<UserRole, { color: string; bg: string; border: string }> = {
    root:  { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.25)' },
    admin: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.25)'  },
    user:  { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)'  },
  };

  return (
    <>
      {/* Logo */}
      <div style={{ padding: collapsed ? '14px 0' : '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', height: 64, flexShrink: 0, gap: 10 }}>
        {collapsed ? (
          <button onClick={() => setCollapsed(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
            <img src="/logo-cgkn.png" alt="CGKN" style={{ width: 26, height: 26, borderRadius: 7, objectFit: 'contain' }}/>
          </button>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
              <img src="/logo-cgkn.png" alt="CGKN" style={{ width: 26, height: 26, borderRadius: 7, objectFit: 'contain', flexShrink: 0 }}/>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT_MONO, whiteSpace: 'nowrap', letterSpacing: '-0.02em' }}>Admin Panel</div>
                <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 8, fontFamily: FONT_MONO, letterSpacing: '0.12em', textTransform: 'uppercase' }}>CGKN Logistik</div>
              </div>
            </div>
            {!isMobile ? (
              <button onClick={() => setCollapsed(true)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ChevronLeft size={11}/>
              </button>
            ) : (
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 5, display: 'flex', flexShrink: 0 }}><X size={13}/></button>
            )}
          </>
        )}
      </div>

      {/* User info */}
      {user && (
        <div style={{ padding: collapsed ? '10px 0' : '10px 12px', borderBottom: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', gap: 8, flexShrink: 0, borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'rgba(255,255,255,0.06)' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: ROLE_CFG[user.role as UserRole].bg, border: `1.5px solid ${ROLE_CFG[user.role as UserRole].border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RoleIcon role={user.role as UserRole} size={13}/>
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: FONT_MONO, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: ROLE_CFG[user.role as UserRole].color, fontFamily: FONT_MONO, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{ROLE_LABELS[user.role as UserRole]}</div>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: collapsed ? '10px 4px' : '10px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_SECTIONS.map(({ section, items }) => {
          const visible = items.filter(item => !item.perm || can(item.perm));
          if (!visible.length) return null;
          return (
            <div key={section} style={{ marginBottom: 20 }}>
              {!collapsed && <div style={{ fontSize: 9, fontWeight: 700, fontFamily: FONT_MONO, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.18)', padding: '0 14px', marginBottom: 4, textTransform: 'uppercase' }}>{section}</div>}
              {collapsed && <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '2px 8px 6px' }}/>}
              {visible.map(item => (
                <NavItem key={item.id} {...item} active={activeTab === item.id} collapsed={collapsed}
                  onClick={() => { setActiveTab(item.id); if (isMobile) onClose(); }}/>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ borderTop: 'rgba(255,255,255,0.06)', borderTopWidth: 1, borderTopStyle: 'solid', borderTopColor: 'rgba(255,255,255,0.06)', padding: collapsed ? '8px 4px' : '8px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {collapsed ? (
          <>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ width: '100%', height: 32, borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.5)' }}>
              {theme === 'dark' ? <Sun size={13}/> : <Moon size={13}/>}
            </button>
            <button onClick={logout} style={{ width: '100%', height: 32, borderRadius: 7, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogOut size={12} color="#f87171"/>
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontFamily: FONT_SANS }}>
              {theme === 'dark' ? <Sun size={12} color="rgba(255,255,255,0.5)"/> : <Moon size={12} color="rgba(255,255,255,0.5)"/>}
              <span style={{ color: 'rgba(255,255,255,0.4)', flex: 1, textAlign: 'left' }}>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
            </button>
            <button onClick={logout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 7, padding: '7px 8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, fontFamily: FONT_SANS }}>
              <LogOut size={12} color="#f87171"/>
              <span style={{ color: '#f87171' }}>Logout</span>
            </button>
          </>
        )}
      </div>
    </>
  );
}

function Sidebar({ activeTab, setActiveTab, collapsed, setCollapsed, theme, setTheme, can, isMobile, mobileOpen, onMobileClose }: {
  activeTab: TabId; setActiveTab: (id: TabId) => void;
  collapsed: boolean; setCollapsed: (v: boolean) => void;
  theme: Theme; setTheme: (v: Theme) => void;
  can: (p: string) => boolean; isMobile: boolean; mobileOpen: boolean; onMobileClose: () => void;
}) {
  const props = { activeTab, setActiveTab, collapsed, setCollapsed, theme, setTheme, can };

  if (isMobile) return (
    <>
      {mobileOpen && <div onClick={onMobileClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 28, backdropFilter: 'blur(3px)' }}/>}
      <aside style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 29, width: SIDEBAR_W, background: tk.dark.sidebarbg, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', transform: mobileOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`, transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)', overflowY: 'auto', overflowX: 'hidden' }}>
        <SidebarContent {...props} isMobile={true} onClose={onMobileClose}/>
      </aside>
    </>
  );

  const W = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;
  return (
    <aside style={{ width: W, background: tk.dark.sidebarbg, borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0, position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 30, overflowX: 'hidden', overflowY: 'auto' }}>
      <SidebarContent {...props} isMobile={false} onClose={() => {}}/>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

// function Topbar({ activeTab, theme, onMobileMenuToggle }: { activeTab: TabId; theme: Theme; onMobileMenuToggle: () => void }) {
//   const t = tk[theme];
//   const w = useWindowWidth();
//   const isMobile = w < BP_MD;
//   const page = PAGE_META[activeTab];

//   return (
//     <header style={{ height: 52, background: t.headerbg, borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', padding: `0 ${isMobile ? 12 : 20}px`, gap: 10, flexShrink: 0, boxShadow: t.shadow }}>
//       {isMobile && (
//         <button onClick={onMobileMenuToggle} style={{ width: 32, height: 32, background: t.inputbg, border: `1px solid ${t.border}`, borderRadius: 8, cursor: 'pointer', color: t.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//           <Menu size={15}/>
//         </button>
//       )}
//       <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
//         <div style={{ width: 30, height: 30, borderRadius: 8, background: page.color + '15', border: `1px solid ${page.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//           {/* icon dari nav */}
//           {NAV_SECTIONS.flatMap(s => s.items).find(i => i.id === activeTab)?.icon &&
//             (() => { const Icon = NAV_SECTIONS.flatMap(s => s.items).find(i => i.id === activeTab)!.icon; return <Icon size={14} color={page.color}/>; })()
//           }
//         </div>
//         <div style={{ minWidth: 0 }}>
//           <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: t.text, lineHeight: 1 }}>{page.title}</div>
//           {!isMobile && <div style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO, marginTop: 2 }}>{page.subtitle}</div>}
//         </div>
//       </div>
//       {/* ← tambah action topbar di sini */}
//     </header>
//   );
// }

// ─── Placeholder tab ──────────────────────────────────────────────────────────

function PlaceholderTab({ id, theme }: { id: TabId; theme: Theme }) {
  const t = tk[theme];
  const item = NAV_SECTIONS.flatMap(s => s.items).find(i => i.id === id)!;
  const Icon = item.icon;
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: item.accent + '15', border: `1px solid ${item.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} color={item.accent}/>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 4 }}>{item.label}</div>
        <div style={{ fontSize: 12, color: t.textMuted, fontFamily: FONT_MONO }}>ganti dengan komponen aktual</div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardContent() {
  const { can } = useAuth();
  const w = useWindowWidth();
  const isMobile = w < BP_MD;

  const [theme,      setThemeState] = useState<Theme>('light');
  const [activeTab,  setActiveTab]  = useState<TabId>('area');
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { try { const s = localStorage.getItem('admin-theme') as Theme | null; if (s) setThemeState(s); } catch {} }, []);
  const setTheme = (v: Theme) => { setThemeState(v); try { localStorage.setItem('admin-theme', v); } catch {} };
  useEffect(() => { if (!isMobile) setMobileOpen(false); }, [isMobile]);

  const t = tk[theme];
  const sidebarW = isMobile ? 0 : (collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W);
  const isUsers = activeTab === 'users';

  return (
    <div style={{ height: '100vh', background: t.pagebg, fontFamily: FONT_SANS, display: 'flex', overflow: 'hidden' }}>
      <Sidebar
        activeTab={activeTab} setActiveTab={setActiveTab}
        collapsed={collapsed} setCollapsed={setCollapsed}
        theme={theme} setTheme={setTheme}
        can={can as (p: string) => boolean}
        isMobile={isMobile} mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: sidebarW, transition: 'margin-left 0.22s cubic-bezier(0.4,0,0.2,1)', minWidth: 0, height: '100vh', overflow: 'hidden' }}>
        

        <main style={{
          flex: 1, minHeight: 0,
          overflow: isUsers ? 'hidden' : 'auto',
          display: isUsers ? 'flex' : 'block',
          flexDirection: 'column',
          padding: isUsers
            ? (isMobile ? '12px' : '16px 20px')
            : (isMobile ? '14px 12px' : '18px 22px'),
        }}>
          {/* ── Tambah tab aktual di sini ── */}
          {activeTab === 'area'     && <AreaManagement theme={theme}/>}
          {activeTab === 'produk'   && <ProdukManagement theme={theme}/>}
          {activeTab === 'harga'    && <HargaManagement theme={theme}/>}
          {activeTab === 'users'    && can('manage_users') && <UserManagement theme={theme}/>}
          {activeTab === 'settings' && <PlaceholderTab id="settings" theme={theme}/>}
        </main>

        <footer style={{ padding: `7px ${isMobile ? 12 : 20}px`, borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: t.textFaint, fontFamily: FONT_MONO }}>Admin · CGKN</span>
          <span style={{ fontSize: 11, color: t.textFaint, fontFamily: FONT_MONO }}>v1.0</span>
        </footer>
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  return (
    <AuthProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.25); border-radius: 3px; }
      `}</style>
      <AdminGuard>
        <DashboardContent/>
      </AdminGuard>
    </AuthProvider>
  );
}