'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  Tag, Plus, Pencil, Trash2, X, Check,
  RefreshCw, Search, ChevronLeft, ChevronRight,
  AlertTriangle, ChevronDown, Filter, MapPin, Users,
  History, Download, FileSpreadsheet, CalendarDays, Clock, CalendarCheck2,
} from 'lucide-react';

export type Theme = 'light' | 'dark';

interface ColorSet { bg: string; text: string; border: string; }
interface ThemeTokens {
  pagebg: string; cardbg: string;
  border: string; borderCard: string; borderInput: string; borderActive: string;
  inputbg: string;
  text: string; textSub: string; textMuted: string; textFaint: string;
  tableHead: string; tableAlt: string;
  shadowCard: string; shadowElevated: string; modalOverlay: string;
  blue: ColorSet; green: ColorSet; red: ColorSet; yellow: ColorSet;
  orange: ColorSet; gray: ColorSet; purple: ColorSet;
}

const tk: Record<Theme, ThemeTokens> = {
  dark: {
    pagebg: '#070a10', cardbg: '#0e1120',
    border: 'rgba(255,255,255,0.06)', borderCard: 'rgba(255,255,255,0.08)',
    borderInput: 'rgba(255,255,255,0.1)', borderActive: 'rgba(99,102,241,0.6)',
    inputbg: 'rgba(255,255,255,0.04)',
    text: 'rgba(255,255,255,0.92)', textSub: 'rgba(255,255,255,0.58)',
    textMuted: 'rgba(255,255,255,0.32)', textFaint: 'rgba(255,255,255,0.15)',
    tableHead: 'rgba(255,255,255,0.02)', tableAlt: 'rgba(255,255,255,0.015)',
    shadowCard: '0 4px 20px rgba(0,0,0,0.4)', shadowElevated: '0 8px 32px rgba(0,0,0,0.5)',
    modalOverlay: 'rgba(0,0,0,0.75)',
    blue:   { bg: 'rgba(99,102,241,0.12)',  text: '#a5b4fc', border: 'rgba(99,102,241,0.3)'  },
    green:  { bg: 'rgba(16,185,129,0.1)',   text: '#6ee7b7', border: 'rgba(16,185,129,0.25)' },
    red:    { bg: 'rgba(239,68,68,0.1)',    text: '#fca5a5', border: 'rgba(239,68,68,0.22)'  },
    yellow: { bg: 'rgba(245,158,11,0.1)',   text: '#fcd34d', border: 'rgba(245,158,11,0.28)' },
    orange: { bg: 'rgba(249,115,22,0.1)',   text: '#fdba74', border: 'rgba(249,115,22,0.25)' },
    gray:   { bg: 'rgba(255,255,255,0.05)', text: 'rgba(255,255,255,0.42)', border: 'rgba(255,255,255,0.08)' },
    purple: { bg: 'rgba(168,85,247,0.1)',   text: '#d8b4fe', border: 'rgba(168,85,247,0.25)' },
  },
  light: {
    pagebg: '#f0f3f9', cardbg: '#ffffff',
    border: 'rgba(0,0,0,0.07)', borderCard: 'rgba(0,0,0,0.09)',
    borderInput: 'rgba(0,0,0,0.12)', borderActive: '#6366f1',
    inputbg: '#f8fafc',
    text: '#0f172a', textSub: '#475569', textMuted: '#94a3b8', textFaint: '#cbd5e1',
    tableHead: '#f8fafc', tableAlt: 'rgba(0,0,0,0.012)',
    shadowCard: '0 2px 10px rgba(0,0,0,0.07)', shadowElevated: '0 8px 32px rgba(0,0,0,0.12)',
    modalOverlay: 'rgba(15,23,42,0.45)',
    blue:   { bg: 'rgba(99,102,241,0.08)', text: '#4f46e5', border: 'rgba(99,102,241,0.2)' },
    green:  { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    red:    { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    yellow: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    orange: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    gray:   { bg: '#f1f5f9', text: '#64748b', border: 'rgba(0,0,0,0.09)' },
    purple: { bg: 'rgba(168,85,247,0.08)', text: '#7c3aed', border: 'rgba(168,85,247,0.2)' },
  },
};

const FONT_MONO = '"IBM Plex Mono", monospace';

const AGENT_COLOR: Record<string, 'blue' | 'green' | 'purple'> = {
  agen: 'blue', perwakilan: 'green',
};
const CATEGORY_COLOR: Record<string, 'blue' | 'green' | 'yellow' | 'orange' | 'purple'> = {
  SKMR: 'blue', SKMM: 'green', SPM: 'yellow', SKT: 'orange', SPT: 'purple',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Area {
  area_id: number; area_slug: string; city_name: string;
  area_name: string; agent_type: string; regional: string;
}
interface ProductOption {
  id: number; name: string; category: string; factory: string;
}
interface PriceRow {
  id: number; product_id: number; product_name: string;
  category: string; factory: string;
  area_id: number; area_slug: string; city_name: string;
  area_name: string; agent_type: string; regional: string;
  dbp: number; wbp: number; rbp: number; cbp: number;
  pita_cukai: number; hje: number; tarif: number; hpp: number;
  updated_at: string;
  scheduled_count: number;       // jumlah periode terjadwal mendatang
  active_period_from: string | null; // valid_from periode aktif saat ini
}
interface HistoryRow {
  history_id: number; product_price_id: number; product_id: number; area_id: number;
  dbp: number; wbp: number; rbp: number; cbp: number;
  pita_cukai: number; hje: number; tarif: number; hpp: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  changed_at: string; changed_by: string;
}
interface PeriodRow {
  period_id: number; product_price_id: number; product_id: number; area_id: number;
  valid_from: string;
  dbp: number; wbp: number; rbp: number; cbp: number;
  pita_cukai: number; hje: number; tarif: number; hpp: number;
  status: 'active' | 'scheduled' | 'superseded';
  created_at: string; created_by: string;
}

type PriceForm = {
  product_id: number | '';
  area_id: number[];
  dbp: number; wbp: number; rbp: number; cbp: number;
  pita_cukai: number; hje: number; tarif: number; hpp: number;
  // Periode
  valid_from: string;       // ISO date string, '' = berlaku sekarang
  period_mode: 'now' | 'schedule';
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const EMPTY_FORM: PriceForm = {
  product_id: '', area_id: [],
  dbp: 0, wbp: 0, rbp: 0, cbp: 0, pita_cukai: 0, hje: 0, tarif: 0, hpp: 0,
  valid_from: todayISO(),
  period_mode: 'now',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  const isWhole = Number.isInteger(n) || n % 1 === 0;
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: isWhole ? 0 : 2,
  }).format(n);
}

function fmtDate(iso: string) {
  // Slice ke YYYY-MM-DD dulu agar tidak kena shift timezone UTC → lokal
  const s = iso.slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function Spinner({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg style={{ animation: 'spin 0.8s linear infinite', width: size, height: size, flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" opacity="0.2"/>
      <path d="M4 12a8 8 0 018-8" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

function AgentBadge({ type, t }: { type: string; t: ThemeTokens }) {
  const key = AGENT_COLOR[type] ?? 'gray';
  const c   = t[key];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 7px', borderRadius: 5, background: c.bg, border: `1px solid ${c.border}`, color: c.text, fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>
      {type}
    </span>
  );
}

function CategoryBadge({ cat, t }: { cat: string; t: ThemeTokens }) {
  const colorKey = CATEGORY_COLOR[cat] ?? 'gray';
  const color    = t[colorKey];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 6, background: color.bg, border: `1px solid ${color.border}`, color: color.text, fontSize: 11, fontWeight: 700, fontFamily: FONT_MONO, letterSpacing: '0.06em' }}>
      {cat}
    </span>
  );
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────

function ConfirmDeleteModal({ row, onConfirm, onCancel, theme, loading }: {
  row: PriceRow; onConfirm: () => void; onCancel: () => void; theme: Theme; loading: boolean;
}) {
  const t = tk[theme];
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: t.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}>
      <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 420, boxShadow: t.shadowElevated, animation: 'slideUp 0.2s ease' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: t.red.bg, border: `1px solid ${t.red.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} color={t.red.text}/>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 5 }}>Hapus Data Harga</div>
            <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.65 }}>
              Yakin menghapus harga <strong style={{ color: t.text }}>"{row.product_name}"</strong> untuk{' '}
              <strong style={{ color: t.text }}>{row.area_name}</strong> — {row.city_name}?
              {row.scheduled_count > 0 && (
                <span style={{ display: 'block', marginTop: 6, color: t.yellow.text, fontSize: 12 }}>
                  ⚠ {row.scheduled_count} periode terjadwal ikut terhapus.
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} disabled={loading}
            style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: t.gray.bg, color: t.gray.text, border: `1px solid ${t.gray.border}`, cursor: 'pointer' }}>
            Batal
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: '#dc2626', color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.7 : 1 }}>
            {loading ? <><Spinner size={12} color="#fff"/> Menghapus…</> : <><Trash2 size={12}/> Hapus</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History Modal ────────────────────────────────────────────────────────────

function HistoryModal({ row, onClose, theme }: { row: PriceRow; onClose: () => void; theme: Theme }) {
  const t = tk[theme];
  const [histories, setHistories] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/harga?history=true&product_id=${row.product_id}&area_id=${row.area_id}`);
        const json = await res.json();
        if (json.success) setHistories(json.data);
        else setError(json.error || 'Gagal memuat riwayat');
      } catch { setError('Koneksi gagal'); }
      finally { setLoading(false); }
    })();
  }, [row]);

  const exportToExcel = () => {
    const data = histories.map(h => ({
      'Waktu Diubah': new Date(h.changed_at).toLocaleString('id-ID'),
      'Aksi': h.action,
      'DBP': Number(h.dbp), 'WBP': Number(h.wbp), 'RBP': Number(h.rbp), 'CBP': Number(h.cbp),
      'Pita Cukai': Number(h.pita_cukai), 'HJE': Number(h.hje), 'Tarif': Number(h.tarif), 'HPP': Number(h.hpp),
      'Diubah Oleh': h.changed_by,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{wch:22},{wch:8},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:16}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Harga');
    XLSX.writeFile(wb, `riwayat_harga_${row.product_name.replace(/[^a-zA-Z0-9]/g,'_')}_${row.area_name.replace(/[^a-zA-Z0-9]/g,'_')}.xlsx`);
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: t.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}>
      <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 920, boxShadow: t.shadowElevated, animation: 'slideUp 0.2s ease', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: t.blue.bg, border: `1px solid ${t.blue.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <History size={16} color={t.blue.text}/>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Riwayat Perubahan Harga</div>
              <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>
                {row.product_name} — <span style={{ fontFamily: FONT_MONO }}>{row.area_name} ({row.city_name})</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {histories.length > 0 && !loading && (
              <button onClick={exportToExcel}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: t.green.bg, border: `1px solid ${t.green.border}`, color: t.green.text, cursor: 'pointer' }}>
                <Download size={11}/> Export Excel
              </button>
            )}
            <button onClick={onClose}
              style={{ width: 30, height: 30, borderRadius: 7, background: t.red.bg, border: `1px solid ${t.red.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <X size={13} color={t.red.text}/>
            </button>
          </div>
        </div>
        {loading ? (
          <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: t.textMuted, fontSize: 13, fontFamily: FONT_MONO }}>
            <Spinner size={16} color={t.textMuted}/> Memuat log riwayat…
          </div>
        ) : error ? (
          <div style={{ padding: 20, color: t.red.text, fontSize: 13, textAlign: 'center' }}>{error}</div>
        ) : histories.length === 0 ? (
          <div style={{ padding: 40, color: t.textMuted, fontSize: 13, textAlign: 'center', fontFamily: FONT_MONO }}>Belum ada riwayat perubahan.</div>
        ) : (
          <div style={{ overflowX: 'auto', border: `1px solid ${t.border}`, borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: t.tableHead }}>
                  {['Waktu Diubah','Aksi','DBP','WBP','RBP','CBP','Cukai','HJE','Tarif','HPP','Oleh'].map((h,i) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: i >= 2 && i <= 9 ? 'right' : i === 1 ? 'center' : 'left', color: t.textMuted, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {histories.map((h, idx) => (
                  <tr key={h.history_id} style={{ borderTop: `1px solid ${t.border}`, background: idx % 2 === 1 ? t.tableAlt : 'transparent' }}>
                    <td style={{ padding: '8px 10px', color: t.textSub, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>{new Date(h.changed_at).toLocaleString('id-ID')}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, fontFamily: FONT_MONO,
                        background: h.action === 'DELETE' ? t.red.bg : h.action === 'INSERT' ? t.green.bg : t.orange.bg,
                        color: h.action === 'DELETE' ? t.red.text : h.action === 'INSERT' ? t.green.text : t.orange.text }}>
                        {h.action}
                      </span>
                    </td>
                    {(['dbp','wbp','rbp','cbp','pita_cukai','hje','tarif','hpp'] as const).map(k => (
                      <td key={k} style={{ padding: '8px 10px', textAlign: 'right', fontFamily: FONT_MONO, color: t.text }}>{fmt(h[k])}</td>
                    ))}
                    <td style={{ padding: '8px 10px', color: t.textMuted, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>{h.changed_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Periods Modal ────────────────────────────────────────────────────────────

function PeriodsModal({ row, onClose, theme, onDeleted }: {
  row: PriceRow; onClose: () => void; theme: Theme; onDeleted: () => void;
}) {
  const t = tk[theme];
  const [periods, setPeriods] = useState<PeriodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/harga?periods=true&product_id=${row.product_id}&area_id=${row.area_id}`);
      const json = await res.json();
      if (json.success) setPeriods(json.data);
      else setError(json.error || 'Gagal memuat periode');
    } catch { setError('Koneksi gagal'); }
    finally { setLoading(false); }
  }, [row]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const deletePeriod = async (period_id: number) => {
    setDeleting(period_id);
    try {
      const res = await fetch('/api/harga', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_period', price: { period_id } }),
      });
      const json = await res.json();
      if (json.success) { load(); onDeleted(); }
    } catch {}
    finally { setDeleting(null); }
  };

  const statusColor = (s: PeriodRow['status']) =>
    s === 'active' ? t.green : s === 'scheduled' ? t.yellow : t.gray;

  const statusLabel = (s: PeriodRow['status']) =>
    s === 'active' ? 'Aktif' : s === 'scheduled' ? 'Terjadwal' : 'Kadaluarsa';

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: t.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}>
      <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 960, boxShadow: t.shadowElevated, animation: 'slideUp 0.2s ease', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: t.purple.bg, border: `1px solid ${t.purple.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarDays size={16} color={t.gray.text}/>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Riwayat Periode Harga</div>
              <div style={{ fontSize: 12, color: t.textSub, marginTop: 2 }}>
                {row.product_name} — <span style={{ fontFamily: FONT_MONO }}>{row.area_name} ({row.city_name})</span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 7, background: t.red.bg, border: `1px solid ${t.red.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={13} color={t.red.text}/>
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: t.textMuted, fontSize: 13, fontFamily: FONT_MONO }}>
            <Spinner size={16} color={t.textMuted}/> Memuat periode…
          </div>
        ) : error ? (
          <div style={{ padding: 20, color: t.red.text, fontSize: 13, textAlign: 'center' }}>{error}</div>
        ) : periods.length === 0 ? (
          <div style={{ padding: 40, color: t.textMuted, fontSize: 13, textAlign: 'center', fontFamily: FONT_MONO }}>Belum ada data periode untuk harga ini.</div>
        ) : (
          <div style={{ overflowX: 'auto', border: `1px solid ${t.border}`, borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: t.tableHead }}>
                  {['Berlaku Mulai','Status','DBP','WBP','RBP','CBP','Cukai','HJE','Tarif','HPP','Dibuat','Oleh',''].map((h,i) => (
                    <th key={i} style={{ padding: '8px 10px', textAlign: i >= 2 && i <= 9 ? 'right' : i === 12 ? 'center' : 'left', color: t.textMuted, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map((p, idx) => {
                  const sc = statusColor(p.status);
                  return (
                    <tr key={p.period_id} style={{ borderTop: `1px solid ${t.border}`, background: idx % 2 === 1 ? t.tableAlt : 'transparent' }}>
                      <td style={{ padding: '8px 10px', fontFamily: FONT_MONO, whiteSpace: 'nowrap', color: t.text, fontWeight: 600 }}>{fmtDate(p.valid_from)}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: FONT_MONO, background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text }}>
                          {statusLabel(p.status)}
                        </span>
                      </td>
                      {(['dbp','wbp','rbp','cbp','pita_cukai','hje','tarif','hpp'] as const).map(k => (
                        <td key={k} style={{ padding: '8px 10px', textAlign: 'right', fontFamily: FONT_MONO, color: t.text }}>{fmt(p[k])}</td>
                      ))}
                      <td style={{ padding: '8px 10px', color: t.textMuted, fontFamily: FONT_MONO, whiteSpace: 'nowrap', fontSize: 10 }}>{new Date(p.created_at).toLocaleString('id-ID')}</td>
                      <td style={{ padding: '8px 10px', color: t.textMuted, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>{p.created_by || '—'}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        {p.status === 'scheduled' && (
                          <button
                            disabled={deleting === p.period_id}
                            onClick={() => deletePeriod(p.period_id)}
                            title="Batalkan jadwal periode ini"
                            style={{ width: 24, height: 24, borderRadius: 6, background: t.red.bg, border: `1px solid ${t.red.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: deleting === p.period_id ? 0.5 : 1 }}>
                            {deleting === p.period_id ? <Spinner size={10} color={t.red.text}/> : <X size={10} color={t.red.text}/>}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Price Modal ──────────────────────────────────────────────────────────────

function PriceModal({ mode, row, areas, products, onSave, onClose, theme, loading }: {
  mode: 'add' | 'edit';
  row?: PriceRow;
  areas: Area[];
  products: ProductOption[];
  onSave: (form: PriceForm) => void;
  onClose: () => void;
  theme: Theme;
  loading: boolean;
}) {
  const t = tk[theme];

  const [form, setForm] = useState<PriceForm>(
    row
      ? {
          product_id: row.product_id, area_id: [row.area_id],
          dbp: row.dbp, wbp: row.wbp, rbp: row.rbp, cbp: row.cbp,
          pita_cukai: row.pita_cukai, hje: row.hje, tarif: row.tarif, hpp: row.hpp,
          valid_from: todayISO(),
          period_mode: 'now',
        }
      : { ...EMPTY_FORM }
  );

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const set = (k: keyof PriceForm, v: any) => setForm(f => ({ ...f, [k]: v }));

  // Saat mode berubah ke 'now', reset valid_from ke hari ini
  const setPeriodMode = (m: 'now' | 'schedule') => {
    setForm(f => ({
      ...f,
      period_mode: m,
      valid_from: m === 'now' ? todayISO() : (f.valid_from > todayISO() ? f.valid_from : ''),
    }));
  };

  const selectedAreas = areas.filter(a => form.area_id.includes(a.area_id));
  const regionGroups  = areas.reduce<Record<string, Area[]>>((acc, a) => {
    const key = a.regional || 'Lainnya';
    (acc[key] ??= []).push(a);
    return acc;
  }, {});

  const isSchedule    = form.period_mode === 'schedule';
  const validDateOk   = !isSchedule || (form.valid_from > todayISO());
  const valid         = form.product_id !== '' && form.area_id.length > 0 && validDateOk;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 12, borderRadius: 8,
    background: t.inputbg, border: `1px solid ${t.borderInput}`,
    color: t.text, outline: 'none', fontFamily: FONT_MONO,
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  };
  const numStyle: React.CSSProperties = { ...inputStyle, textAlign: 'right' };

  const PRICE_FIELDS: [keyof PriceForm, string, string][] = [
    ['dbp','DBP','Distributor Buying Price'],
    ['wbp','WBP','Wholesale Buying Price'],
    ['rbp','RBP','Retail Buying Price'],
    ['cbp','CBP','Consumer Buying Price'],
    ['pita_cukai','Pita Cukai','Nilai Pita Cukai'],
    ['hje','HJE','Harga Jual Eceran'],
    ['tarif','Tarif','Tarif Cukai'],
    ['hpp','HPP','Harga Pokok Produksi'],
  ];

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: t.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}>
      <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, boxShadow: t.shadowElevated, animation: 'slideUp 0.2s ease', maxHeight: '94vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: t.green.bg, border: `1px solid ${t.green.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag size={16} color={t.green.text}/>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, lineHeight: 1 }}>
                {mode === 'add' ? 'Tambah Harga' : 'Edit Harga'}
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO, marginTop: 2 }}>
                {mode === 'add' ? 'Entri harga baru' : `ID: ${row?.id}`}
              </div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 7, background: t.red.bg, border: `1px solid ${t.red.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={13} color={t.red.text}/>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Produk */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 5 }}>
              Produk <span style={{ color: t.red.text }}>*</span>
            </label>
            <select value={form.product_id} onChange={e => set('product_id', Number(e.target.value))}
              disabled={mode === 'edit'}
              style={{ ...inputStyle, appearance: 'none', cursor: mode === 'edit' ? 'not-allowed' : 'pointer', opacity: mode === 'edit' ? 0.6 : 1 }}>
              <option value="">— Pilih Produk —</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
              ))}
            </select>
          </div>

          {/* Area Selector */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 8 }}>
              Agen / Perwakilan <span style={{ color: t.red.text }}>*</span>
            </label>
            <div style={{ maxHeight: 200, overflowY: 'auto', border: `1px solid ${t.borderInput}`, borderRadius: 8, padding: '10px 12px', background: mode === 'edit' ? t.tableHead : t.inputbg, opacity: mode === 'edit' ? 0.65 : 1, pointerEvents: mode === 'edit' ? 'none' : 'auto' }}>
              {Object.entries(regionGroups).sort().map(([regional, areaList]) => (
                <div key={regional} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: t.textMuted, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>{regional}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
                    {areaList.map(a => {
                      const isChecked = form.area_id.includes(a.area_id);
                      return (
                        <label key={a.area_id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.text, cursor: 'pointer' }}>
                          <input type="checkbox" checked={isChecked} disabled={mode === 'edit'}
                            onChange={() => set('area_id', isChecked ? form.area_id.filter(id => id !== a.area_id) : [...form.area_id, a.area_id])}
                          />
                          <span>{a.area_name} — {a.city_name} ({a.agent_type})</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedAreas.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: t.textMuted }}>Area Terpilih ({selectedAreas.length}):</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                {selectedAreas.map(area => (
                  <div key={area.area_id} style={{ padding: '6px 12px', borderRadius: 8, background: t.blue.bg, border: `1px solid ${t.blue.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: t.blue.text }}>{area.area_name}</div>
                      <div style={{ fontSize: 10, color: t.blue.text, opacity: 0.75, fontFamily: FONT_MONO, marginTop: 1 }}>{area.city_name}{area.regional ? ` · ${area.regional}` : ''}</div>
                    </div>
                    <AgentBadge type={area.agent_type} t={t}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Periode ─────────────────────────────────────────────────────── */}
          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: FONT_MONO, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Periode Berlaku</div>

            {/* Toggle mode */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              {/* Berlaku Sekarang */}
              <button
                onClick={() => setPeriodMode('now')}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${form.period_mode === 'now' ? t.green.border : t.borderInput}`,
                  background: form.period_mode === 'now' ? t.green.bg : t.inputbg,
                  color: form.period_mode === 'now' ? t.green.text : t.textSub,
                  transition: 'all 0.15s',
                }}>
                <CalendarCheck2 size={12}/> Berlaku Sekarang
              </button>
              {/* Jadwalkan */}
              <button
                onClick={() => setPeriodMode('schedule')}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${form.period_mode === 'schedule' ? t.yellow.border : t.borderInput}`,
                  background: form.period_mode === 'schedule' ? t.yellow.bg : t.inputbg,
                  color: form.period_mode === 'schedule' ? t.yellow.text : t.textSub,
                  transition: 'all 0.15s',
                }}>
                <Clock size={12}/> Jadwalkan
              </button>
            </div>

            {/* Keterangan + date picker */}
            {form.period_mode === 'now' ? (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: t.green.bg, border: `1px solid ${t.green.border}`, fontSize: 12, color: t.green.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarCheck2 size={13}/>
                <span>
                  Harga langsung berlaku hari ini{' '}
                  <strong style={{ fontFamily: FONT_MONO }}>({fmtDate(todayISO())})</strong>.
                  Data <code style={{ fontFamily: FONT_MONO }}>product_prices</code> ikut diperbarui.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.textSub, marginBottom: 4 }}>
                    Tanggal Berlaku <span style={{ color: t.red.text }}>*</span>
                  </label>
                  <input
                    type="date"
                    min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0,10); })()}
                    value={form.valid_from}
                    onChange={e => set('valid_from', e.target.value)}
                    style={{
                      ...inputStyle, width: '100%',
                      borderColor: !validDateOk ? '#ef4444' : t.borderInput,
                      colorScheme: theme === 'dark' ? 'dark' : 'light',
                    }}
                    onFocus={e => (e.target.style.borderColor = t.borderActive)}
                    onBlur={e  => (e.target.style.borderColor = !validDateOk ? '#ef4444' : t.borderInput)}
                  />
                  {!validDateOk && (
                    <div style={{ fontSize: 11, color: t.red.text, marginTop: 4, fontFamily: FONT_MONO }}>
                      Tanggal harus lebih dari hari ini untuk mode jadwal.
                    </div>
                  )}
                </div>
                <div style={{ padding: '10px 12px', borderRadius: 8, background: t.yellow.bg, border: `1px solid ${t.yellow.border}`, fontSize: 12, color: t.yellow.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={13}/>
                  <span>
                    Harga disimpan sebagai <strong>Terjadwal</strong>.{' '}
                    Harga aktif saat ini <em>tidak berubah</em> sampai tanggal berlaku tiba.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Data Harga */}
          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: FONT_MONO, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Data Harga</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {PRICE_FIELDS.map(([key, label, hint]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.textSub, marginBottom: 4 }}>
                    {label}
                    <span style={{ fontSize: 9, color: t.textMuted, fontFamily: FONT_MONO, marginLeft: 4, opacity: 0.7 }}>{hint}</span>
                  </label>
                  <input type="number" min={0} step="any"
                    value={Number(form[key]) === 0 ? '' : parseFloat(Number(form[key]).toFixed(2)).toString()}
                    placeholder="0"
                    onChange={e => set(key, parseFloat(e.target.value) || 0)}
                    style={numStyle}
                    onFocus={e => (e.target.style.borderColor = t.borderActive)}
                    onBlur={e  => (e.target.style.borderColor = t.borderInput)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} disabled={loading}
            style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: t.gray.bg, color: t.gray.text, border: `1px solid ${t.gray.border}`, cursor: 'pointer' }}>
            Batal
          </button>
          <button onClick={() => onSave(form)} disabled={!valid || loading}
            style={{
              padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none',
              background: !valid || loading ? t.gray.bg : isSchedule ? '#d97706' : '#6366f1',
              color: !valid || loading ? t.gray.text : '#fff',
              cursor: valid && !loading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
              boxShadow: valid && !loading ? (isSchedule ? '0 2px 8px rgba(217,119,6,0.35)' : '0 2px 8px rgba(99,102,241,0.35)') : 'none',
            }}>
            {loading
              ? <><Spinner size={12} color="currentColor"/> Menyimpan…</>
              : isSchedule
                ? <><Clock size={12}/> Jadwalkan</>
                : <><Check size={12}/> {mode === 'add' ? 'Tambah' : 'Simpan'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PriceManagement({ theme }: { theme: Theme }) {
  const t = tk[theme];

  const [prices,     setPrices]     = useState<PriceRow[]>([]);
  const [areas,      setAreas]      = useState<Area[]>([]);
  const [products,   setProducts]   = useState<ProductOption[]>([]);
  const [regionals,  setRegionals]  = useState<string[]>([]);
  const [agentTypes, setAgentTypes] = useState<string[]>([]);

  const [loading,    setLoading]    = useState(true);
  const [actionLoad, setActionLoad] = useState(false);
  const [exporting,  setExporting]  = useState(false);
  const [error,      setError]      = useState('');

  const [search,      setSearch]      = useState('');
  const [filterReg,   setFilterReg]   = useState('');
  const [filterAgent, setFilterAgent] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page,        setPage]        = useState(1);
  const PAGE_SIZE = 20;

  const [modal,          setModal]          = useState<{ mode: 'add' | 'edit'; row?: PriceRow } | null>(null);
  const [deleteTarget,   setDeleteTarget]   = useState<PriceRow | null>(null);
  const [historyTarget,  setHistoryTarget]  = useState<PriceRow | null>(null);
  const [periodsTarget,  setPeriodsTarget]  = useState<PriceRow | null>(null);
  const [toast,          setToast]          = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (filterReg)   params.set('regional', filterReg);
      if (filterAgent) params.set('agent_type', filterAgent);
      const res  = await fetch(`/api/harga?${params}`);
      const json = await res.json();
      if (json.success) {
        const { prices: p, areas: a, products: pr, regionals: r, agentTypes: at } = json.data;
        setPrices(p ?? []); setAreas(a ?? []); setProducts(pr ?? []);
        setRegionals(r ?? []); setAgentTypes(at ?? []);
      } else { setError(json.error ?? 'Gagal memuat data'); }
    } catch { setError('Koneksi gagal'); }
    finally { setLoading(false); }
  }, [filterReg, filterAgent]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [search, filterReg, filterAgent]);

  const filtered = prices.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.product_name.toLowerCase().includes(q) ||
      p.area_name.toLowerCase().includes(q) ||
      p.city_name.toLowerCase().includes(q) ||
      p.regional.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeFilters = [filterReg, filterAgent].filter(Boolean).length;

  const apiAction = async (action: string, payload: object) => {
    setActionLoad(true);
    try {
      const res  = await fetch('/api/harga', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, price: payload }),
      });
      const json = await res.json();
      if (json.success) return json;
      showToast('error', json.error ?? 'Operasi gagal');
      return null;
    } catch {
      showToast('error', 'Koneksi gagal');
      return null;
    } finally { setActionLoad(false); }
  };

  const handleSave = async (form: PriceForm) => {
    if (!modal) return;
    const payload = {
      ...(modal.mode === 'edit'
        ? { ...form, id: modal.row!.id, area_id: form.area_id[0] }
        : form),
      // Kirim valid_from ke API:
      // - mode 'now'      → kirim valid_from (= hari ini), API tahu isImmediate = true
      // - mode 'schedule' → kirim valid_from (tanggal mendatang)
      valid_from: form.valid_from || null,
    };
    const res = await apiAction('upsert', payload);
    if (res) {
      const label = products.find(p => p.id === form.product_id)?.name ?? String(form.product_id);
      const isScheduled = res.scheduled;
      showToast('success',
        modal.mode === 'add'
          ? isScheduled
            ? `Harga "${label}" dijadwalkan mulai ${fmtDate(form.valid_from)}`
            : `Harga "${label}" berhasil ditambahkan`
          : isScheduled
            ? `Perubahan harga "${label}" dijadwalkan mulai ${fmtDate(form.valid_from)}`
            : `Harga "${label}" berhasil diupdate`
      );
      setModal(null);
      fetchData();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await apiAction('delete', { id: deleteTarget.id });
    if (res) {
      showToast('success', `Harga "${deleteTarget.product_name}" berhasil dihapus`);
      setDeleteTarget(null);
      fetchData();
    }
  };

  // ── Export Excel ────────────────────────────────────────────────────────────
  const exportToExcel = async () => {
    setExporting(true);
    try {
      const results = await Promise.all(
        filtered.map(row =>
          fetch(`/api/harga?history=true&product_id=${row.product_id}&area_id=${row.area_id}`)
            .then(r => r.json())
            .then(json => ({ row, histories: json.success ? (json.data as HistoryRow[]) : [] }))
        )
      );
      const data = results.flatMap(({ row, histories }) => {
        if (histories.length === 0) return [{
          'Produk': row.product_name, 'Kategori': row.category, 'Pabrik': row.factory,
          'Agen': row.area_name, 'Kota': row.city_name, 'Regional': row.regional, 'Tipe': row.agent_type,
          'Aksi': '-', 'Waktu Diubah': '-',
          'DBP': Number(row.dbp), 'WBP': Number(row.wbp), 'RBP': Number(row.rbp), 'CBP': Number(row.cbp),
          'Pita Cukai': Number(row.pita_cukai), 'HJE': Number(row.hje), 'Tarif': Number(row.tarif), 'HPP': Number(row.hpp),
          'Diubah Oleh': '-',
        }];
        return histories.map(h => ({
          'Produk': row.product_name, 'Kategori': row.category, 'Pabrik': row.factory,
          'Agen': row.area_name, 'Kota': row.city_name, 'Regional': row.regional, 'Tipe': row.agent_type,
          'Aksi': h.action, 'Waktu Diubah': new Date(h.changed_at).toLocaleString('id-ID'),
          'DBP': Number(h.dbp), 'WBP': Number(h.wbp), 'RBP': Number(h.rbp), 'CBP': Number(h.cbp),
          'Pita Cukai': Number(h.pita_cukai), 'HJE': Number(h.hje), 'Tarif': Number(h.tarif), 'HPP': Number(h.hpp),
          'Diubah Oleh': h.changed_by,
        }));
      });
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{wch:28},{wch:10},{wch:16},{wch:24},{wch:16},{wch:14},{wch:10},{wch:8},{wch:22},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:10},{wch:12},{wch:16}];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Harga & Riwayat');
      const suffix = (filterReg || filterAgent || search) ? '_filtered' : '_all';
      XLSX.writeFile(wb, `data harga & riwayat${suffix}_${new Date().toISOString().slice(0,10)}.xlsx`);
      showToast('success', `Export selesai · ${filtered.length} harga · ${data.length} baris`);
    } catch { showToast('error', 'Gagal mengekspor data'); }
    finally { setExporting(false); }
  };

  const exportRowHistory = async (row: PriceRow) => {
    try {
      const res  = await fetch(`/api/harga?history=true&product_id=${row.product_id}&area_id=${row.area_id}`);
      const json = await res.json();
      if (!json.success) { showToast('error', json.error ?? 'Gagal memuat riwayat'); return; }
      const histories: HistoryRow[] = json.data;
      if (histories.length === 0) { showToast('error', 'Belum ada riwayat untuk entri ini'); return; }
      const data = histories.map(h => ({
        'Waktu Diubah': new Date(h.changed_at).toLocaleString('id-ID'), 'Aksi': h.action,
        'DBP': Number(h.dbp), 'WBP': Number(h.wbp), 'RBP': Number(h.rbp), 'CBP': Number(h.cbp),
        'Pita Cukai': Number(h.pita_cukai), 'HJE': Number(h.hje), 'Tarif': Number(h.tarif), 'HPP': Number(h.hpp),
        'Diubah Oleh': h.changed_by,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      ws['!cols'] = [{wch:22},{wch:8},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:16}];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Harga');
      XLSX.writeFile(wb, `riwayat_harga_${row.product_name.replace(/[^a-zA-Z0-9]/g,'_')}_${row.area_name.replace(/[^a-zA-Z0-9]/g,'_')}.xlsx`);
    } catch { showToast('error', 'Koneksi gagal saat mengambil riwayat'); }
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const iconBtnStyle = (color: { bg: string; border: string }): React.CSSProperties => ({
    width: 28, height: 28, borderRadius: 7, background: color.bg,
    border: `1px solid ${color.border}`, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    transition: 'all 0.15s',
  });

  const PRICE_COLS: [keyof PriceRow, string][] = [
    ['dbp','DBP'],['wbp','WBP'],['rbp','RBP'],['cbp','CBP'],
    ['pita_cukai','Pita'],['hje','HJE'],['tarif','Tarif'],['hpp','HPP'],
  ];

  const TABLE_HEADERS = [
    '#','Produk','Kat.','Agen / Perwakilan','Kota','Regional','Tipe',
    ...PRICE_COLS.map(([,l]) => l),
    'Periode','Aksi',
  ];

  const exportDisabled = loading || exporting || filtered.length === 0;

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 16, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: t.cardbg, border: `1px solid ${toast.type === 'success' ? t.green.border : t.red.border}`, boxShadow: t.shadowElevated, animation: 'slideUp 0.25s ease', minWidth: 240, maxWidth: 360 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: toast.type === 'success' ? t.green.bg : t.red.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {toast.type === 'success' ? <Check size={11} color={t.green.text}/> : <X size={11} color={t.red.text}/>}
          </div>
          <span style={{ fontSize: 13, color: t.text, flex: 1, fontWeight: 500 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 0, display: 'flex' }}><X size={11}/></button>
        </div>
      )}

      {/* Modals */}
      {modal && (
        <PriceModal mode={modal.mode} row={modal.row} areas={areas} products={products}
          onSave={handleSave} onClose={() => setModal(null)} theme={theme} loading={actionLoad}/>
      )}
      {deleteTarget && (
        <ConfirmDeleteModal row={deleteTarget} onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)} theme={theme} loading={actionLoad}/>
      )}
      {historyTarget && (
        <HistoryModal row={historyTarget} onClose={() => setHistoryTarget(null)} theme={theme}/>
      )}
      {periodsTarget && (
        <PeriodsModal row={periodsTarget} onClose={() => setPeriodsTarget(null)} theme={theme} onDeleted={fetchData}/>
      )}

      {/* Header bar */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: t.red.bg, border: `1px solid ${t.red.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tag size={14} color={t.red.text}/>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: t.text, lineHeight: 1 }}>Management Harga</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={11} color={t.textMuted} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Cari produk / agen / kota…"
              style={{ paddingLeft: 26, paddingRight: search ? 24 : 10, paddingTop: 7, paddingBottom: 7, fontSize: 12, borderRadius: 8, background: t.inputbg, border: `1px solid ${search ? t.borderActive : t.borderInput}`, color: t.text, outline: 'none', width: 200, fontFamily: FONT_MONO, transition: 'border-color 0.15s' }}/>
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 0, display: 'flex' }}><X size={10}/></button>
            )}
          </div>

          {/* Filter toggle */}
          <button onClick={() => setShowFilters(f => !f)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: activeFilters > 0 ? t.yellow.bg : t.gray.bg, color: activeFilters > 0 ? t.yellow.text : t.gray.text, border: `1px solid ${activeFilters > 0 ? t.yellow.border : t.gray.border}`, cursor: 'pointer' }}>
            <Filter size={11}/> Filter {activeFilters > 0 ? `(${activeFilters})` : ''} <ChevronDown size={10} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
          </button>

          {/* Export */}
          <button onClick={exportToExcel} disabled={exportDisabled}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: t.green.bg, border: `1px solid ${t.green.border}`, color: t.green.text, cursor: exportDisabled ? 'not-allowed' : 'pointer', opacity: exportDisabled ? 0.5 : 1 }}>
            {exporting ? <><Spinner size={12} color={t.green.text}/> Mengekspor…</> : <><FileSpreadsheet size={12}/> Export</>}
          </button>

          {/* Refresh */}
          <button onClick={fetchData} disabled={loading}
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${t.gray.border}`, background: t.gray.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
            <RefreshCw size={12} color={t.gray.text} style={loading ? { animation: 'spin 1s linear infinite' } : {}}/>
          </button>

          {/* Tambah */}
          <button onClick={() => setModal({ mode: 'add' })}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
            <Plus size={13}/> Tambah Harga
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${t.border}`, background: t.tableHead, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, fontFamily: FONT_MONO }}>Filter:</span>
          <div style={{ position: 'relative' }}>
            <MapPin size={10} color={t.textMuted} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
            <select value={filterReg} onChange={e => setFilterReg(e.target.value)}
              style={{ paddingLeft: 22, paddingRight: 28, paddingTop: 5, paddingBottom: 5, fontSize: 12, borderRadius: 7, background: t.inputbg, border: `1px solid ${filterReg ? t.borderActive : t.borderInput}`, color: filterReg ? t.text : t.textMuted, outline: 'none', fontFamily: FONT_MONO, cursor: 'pointer', appearance: 'none' }}>
              <option value="">Semua Regional</option>
              {regionals.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <ChevronDown size={10} color={t.textMuted} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
          </div>
          <div style={{ position: 'relative' }}>
            <Users size={10} color={t.textMuted} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
            <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
              style={{ paddingLeft: 22, paddingRight: 28, paddingTop: 5, paddingBottom: 5, fontSize: 12, borderRadius: 7, background: t.inputbg, border: `1px solid ${filterAgent ? t.borderActive : t.borderInput}`, color: filterAgent ? t.text : t.textMuted, outline: 'none', fontFamily: FONT_MONO, cursor: 'pointer', appearance: 'none' }}>
              <option value="">Semua Tipe</option>
              {agentTypes.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <ChevronDown size={10} color={t.textMuted} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setFilterReg(''); setFilterAgent(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, fontSize: 11, fontFamily: FONT_MONO, background: t.red.bg, border: `1px solid ${t.red.border}`, color: t.red.text, cursor: 'pointer' }}>
              <X size={9}/> Reset
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: t.textMuted, fontSize: 13, fontFamily: FONT_MONO }}>
          <Spinner size={16} color={t.textMuted}/> Memuat data harga…
        </div>
      ) : error ? (
        <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.red.text, fontSize: 13 }}>
          <AlertTriangle size={14}/> {error}
          <button onClick={fetchData} style={{ marginLeft: 8, fontSize: 12, color: t.blue.text, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Coba lagi</button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: t.textMuted }}>
          <Tag size={32} color={t.textFaint}/>
          <div style={{ fontSize: 13, fontFamily: FONT_MONO }}>{search || activeFilters ? 'Tidak ada hasil' : 'Belum ada data harga'}</div>
          {!search && !activeFilters && (
            <button onClick={() => setModal({ mode: 'add' })} style={{ fontSize: 12, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Tambah harga pertama</button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {TABLE_HEADERS.map((h, i) => (
                  <th key={i} style={{
                    padding: '9px 10px',
                    textAlign: i >= 7 && i <= 14 ? 'right' : (i === 15 || i === 16) ? 'center' : 'left',
                    fontSize: 9, fontWeight: 700, fontFamily: FONT_MONO,
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                    color: t.textMuted, borderBottom: `1px solid ${t.border}`,
                    background: t.tableHead, whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((row, idx) => (
                <tr key={row.id} style={{ background: idx % 2 === 1 ? t.tableAlt : 'transparent' }}>
                  <td style={{ padding: '9px 10px', fontFamily: FONT_MONO, fontSize: 10, color: t.textFaint }}>
                    {(safePage - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  <td style={{ padding: '9px 10px', minWidth: 160, whiteSpace: 'nowrap' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{row.product_name}</div>
                    <div style={{ fontSize: 10, color: t.textMuted, fontFamily: FONT_MONO }}>{row.factory}</div>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <CategoryBadge cat={row.category} t={t}/>
                  </td>
                  <td style={{ padding: '9px 10px', minWidth: 160 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{row.area_name}</div>
                  </td>
                  <td style={{ padding: '9px 10px', fontSize: 11, color: t.textSub, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>{row.city_name}</td>
                  <td style={{ padding: '9px 10px', fontSize: 11, color: t.textSub, fontFamily: FONT_MONO, whiteSpace: 'nowrap' }}>{row.regional || '—'}</td>
                  <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>
                    <AgentBadge type={row.agent_type} t={t}/>
                  </td>
                  {PRICE_COLS.map(([key]) => (
                    <td key={key} style={{ padding: '9px 10px', textAlign: 'right', fontFamily: FONT_MONO, fontSize: 11, color: t.text, whiteSpace: 'nowrap' }}>
                      {fmt(row[key] as number)}
                    </td>
                  ))}

                  {/* Kolom Periode */}
                  <td style={{ padding: '9px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      {/* Badge periode aktif */}
                      {row.active_period_from ? (
                        <span style={{ fontSize: 9, fontFamily: FONT_MONO, color: t.green.text, background: t.green.bg, border: `1px solid ${t.green.border}`, padding: '1px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>
                          {fmtDate(row.active_period_from)}
                        </span>
                      ) : (
                        <span style={{ fontSize: 9, fontFamily: FONT_MONO, color: t.textFaint }}>—</span>
                      )}
                      {/* Badge terjadwal */}
                      {row.scheduled_count > 0 && (
                        <span style={{ fontSize: 9, fontFamily: FONT_MONO, color: t.yellow.text, background: t.yellow.bg, border: `1px solid ${t.yellow.border}`, padding: '1px 5px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 3, cursor: 'pointer' }}
                          onClick={() => setPeriodsTarget(row)}>
                          <Clock size={8}/> +{row.scheduled_count} terjadwal
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Aksi */}
                  <td style={{ padding: '9px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
                      <button onClick={() => setPeriodsTarget(row)} style={iconBtnStyle(t.gray)} title="Lihat Periode">
                        <CalendarDays size={11} color={t.gray.text}/>
                      </button>
                      <button onClick={() => setHistoryTarget(row)} style={iconBtnStyle(t.orange)} title="Lihat Riwayat">
                        <History size={11} color={t.orange.text}/>
                      </button>
                      <button onClick={() => exportRowHistory(row)} style={iconBtnStyle(t.green)} title="Export Riwayat">
                        <Download size={11} color={t.green.text}/>
                      </button>
                      <button onClick={() => setModal({ mode: 'edit', row })} style={iconBtnStyle(t.blue)} title="Edit">
                        <Pencil size={11} color={t.blue.text}/>
                      </button>
                      <button onClick={() => setDeleteTarget(row)} style={iconBtnStyle(t.red)} title="Hapus">
                        <Trash2 size={11} color={t.red.text}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && filtered.length > PAGE_SIZE && (
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO }}>
            {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length} entri
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}
              style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${t.gray.border}`, background: t.gray.bg, color: t.textSub, cursor: safePage === 1 ? 'not-allowed' : 'pointer', opacity: safePage === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={12}/>
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}
              style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${t.gray.border}`, background: t.gray.bg, color: t.textSub, cursor: safePage === totalPages ? 'not-allowed' : 'pointer', opacity: safePage === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={12}/>
            </button>
          </div>
        </div>
      )}
    </>
  );
}