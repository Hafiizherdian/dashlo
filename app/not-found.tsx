// app/not-found.tsx
import { FONT_MONO } from '@/app/components/admin/shared'; // atau define ulang lokal
import {ShieldQuestionMark} from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#07090e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', fontFamily: '"IBM Plex Mono", monospace' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700;800&display=swap');
        @keyframes sgFadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes sgPulse  { 0%,100% { opacity: 0.4; } 50% { opacity: 0.9; } }
        @keyframes sgGlitch {
          0%,100% { clip-path: inset(0 0 100% 0); }
          10%      { clip-path: inset(10% 0 60% 0); transform: translateX(-4px); }
          20%      { clip-path: inset(40% 0 30% 0); transform: translateX(4px); }
          30%      { clip-path: inset(70% 0 5% 0);  transform: translateX(-2px); }
          40%      { clip-path: inset(0 0 100% 0); }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        {/* 404 number */}
        <div style={{ position: 'relative', animation: 'sgFadeUp 0.5s ease both' }}>
          <div style={{ fontSize: 96, fontWeight: 800, color: 'rgba(255,255,255,0.06)', letterSpacing: '-0.06em', lineHeight: 1, userSelect: 'none' }}>
            404
          </div>
          {/* glitch overlay */}
          <div style={{ position: 'absolute', inset: 0, fontSize: 96, fontWeight: 800, color: '#6366f1', letterSpacing: '-0.06em', lineHeight: 1, animation: 'sgGlitch 3s steps(1) infinite', opacity: 0.6, userSelect: 'none' }}>
            404
          </div>
        </div>

        {/* icon + title */}
        <div style={{ animation: 'sgFadeUp 0.5s 0.1s ease both', opacity: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* inline SVG biar tidak perlu import lucide */}
            <ShieldQuestionMark color="#6366f1" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.03em', lineHeight: 1 }}>Halaman Tidak Ditemukan</div>
            <div style={{ fontSize: 9, color: '#6366f1', letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 5 }}>Page Not Found</div>
          </div>
        </div>

        {/* desc */}
        <div style={{ animation: 'sgFadeUp 0.5s 0.2s ease both', opacity: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', maxWidth: 260, lineHeight: 1.7 }}>
          Halaman yang Anda cari tidak ada atau telah dipindahkan. Periksa kembali URL yang dimasukkan.
        </div>

        {/* divider */}
        <div style={{ animation: 'sgFadeUp 0.5s 0.28s ease both', opacity: 0, width: 160, height: 1, background: 'rgba(99,102,241,0.12)' }} />

        {/* blinking cursor path */}
        <div style={{ animation: 'sgFadeUp 0.5s 0.3s ease both', opacity: 0, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '6px 14px' }}>
          <span style={{ color: '#6366f1', fontSize: 11 }}>~/</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{typeof window !== 'undefined' ? window.location.pathname : '/???'}</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', animation: 'sgPulse 1s steps(1) infinite' }}>▋</span>
        </div>

        {/* button */}
        <div style={{ animation: 'sgFadeUp 0.5s 0.38s ease both', opacity: 0, display: 'flex', gap: 8 }}>
          <a href="/" style={{ padding: '8px 20px', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: '#a5b4fc', fontSize: 11, fontWeight: 600, fontFamily: '"IBM Plex Mono", monospace', cursor: 'pointer', letterSpacing: '0.06em', textDecoration: 'none' }}>
            ← Dashboard
          </a>
          <a href="/admin" style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 600, fontFamily: '"IBM Plex Mono", monospace', cursor: 'pointer', letterSpacing: '0.06em', textDecoration: 'none' }}>
            Admin Panel
          </a>
        </div>

      </div>
    </div>
  );
}