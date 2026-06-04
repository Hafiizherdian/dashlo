'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin, Plus, Pencil, Trash2, X, Check,
  RefreshCw, Search, ChevronLeft, ChevronRight,
  AlertTriangle, Building2, Map, Globe,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark';

interface Area {
  id: number; // Berubah jadi number mengikuti schema DB (serial)
  name: string;
  agent_type?: string;
  regional?: string;
  city_count?: number;
  cities?: string[];
}

const tk = {
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
    gray:   { bg: '#f1f5f9', text: '#64748b', border: 'rgba(0,0,0,0.09)' },
    purple: { bg: 'rgba(168,85,247,0.08)', text: '#7c3aed', border: 'rgba(168,85,247,0.2)' },
  },
};

const FONT_MONO = '"IBM Plex Mono", monospace';

// ─── Modal Form Komponen (Hanya field yang Anda inginkan) ─────────────────────
function AreaFormModal({
  mode,
  initialData,
  onClose,
  onSave,
  theme,
  loading,
}: {
  mode: 'add' | 'edit';
  initialData?: Area;
  onClose: () => void;
  onSave: (data: Partial<Area>) => void;
  theme: Theme;
  loading: boolean;
}) {
  const t = tk[theme];
  const [name, setName] = useState(initialData?.name || '');
  const [agentType, setAgentType] = useState(initialData?.agent_type || 'agen');
  const [regional, setRegional] = useState(initialData?.regional || '');
  const [cityInput, setCityInput] = useState(initialData?.cities?.join(', ') || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cityInput.trim()) return;

    // Pisah koma menjadi array kota
    const citiesArr = cityInput
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    onSave({
      id: initialData?.id, // Akan bernilai undefined saat "add", dan aman terisi saat "edit"
      name: name.trim(),
      agent_type: agentType,
      regional: regional.trim() || undefined,
      cities: citiesArr,
    });
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 5
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 8,
    background: t.inputbg, border: `1px solid ${t.borderInput}`, color: t.text,
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s'
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: t.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 460, boxShadow: t.shadowElevated }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>
            {mode === 'add' ? 'Tambah Agen / Perwakilan Baru' : 'Ubah Data Perwakilan'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 1. Nama Agen / Perwakilan */}
          <div>
            <label style={labelStyle}>Nama Agen / Perwakilan *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Contoh: CV. BUANA KIRANA" style={inputStyle} />
          </div>

          {/* 2. Jenis */}
          <div>
            <label style={labelStyle}>Jenis *</label>
            <select value={agentType} onChange={e => setAgentType(e.target.value)} style={inputStyle}>
              <option value="agen">agen</option>
              <option value="perwakilan">perwakilan</option>
              
            </select>
          </div>

          {/* 3. Regional */}
          <div>
            <label style={labelStyle}>Regional</label>
            <input type="text" value={regional} onChange={e => setRegional(e.target.value)} placeholder="Contoh: KALIMANTAN / JAWA TIMUR" style={inputStyle} />
          </div>

          {/* 4. Area / Kota */}
          <div>
            <label style={labelStyle}>Area / Kota * <span style={{ fontSize: 10, fontWeight: 400, color: t.textMuted }}>(Pisahkan dengan koma jika multi kota)</span></label>
            <input type="text" value={cityInput} onChange={e => setCityInput(e.target.value)} required placeholder="Contoh: BANJARMASIN, MARTAPURA" style={inputStyle} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={onClose} disabled={loading} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'transparent', border: `1px solid ${t.borderInput}`, color: t.textSub, cursor: 'pointer' }}>
              Batal
            </button>
            <button type="submit" disabled={loading || !name.trim() || !cityInput.trim()} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#6366f1', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {loading ? 'Menyimpan...' : <><Check size={14} /> Simpan</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AreaManagement({ theme }: { theme: Theme }) {
  const t = tk[theme];
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; data?: Area } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Area | null>(null);

  const fetchAreas = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/areas');
      const json = await res.json();
      if (json.success) {
        setAreas(json.data.areas || []);
      } else {
        setError(json.error || 'Gagal memuat data area');
      }
    } catch {
      setError('Koneksi jaringan gagal');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAreas(); }, [fetchAreas]);

  const handleSave = async (formData: Partial<Area>) => {
    if (!modal) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modal.mode,
          area: formData
        }),
      });
      const json = await res.json();
      if (json.success) {
        setAreas(json.data.areas || []);
        setModal(null);
      } else {
        alert(json.error || 'Terjadi kesalahan sistem');
      }
    } catch {
      alert('Gagal mengirim data');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', area: { id: deleteTarget.id } }),
      });
      const json = await res.json();
      if (json.success) {
        setAreas(json.data.areas || []);
        setDeleteTarget(null);
      } else {
        alert(json.error || 'Gagal menghapus area');
      }
    } catch {
      alert('Gagal menghubungi server');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = areas.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.regional || '').toLowerCase().includes(q) ||
      (a.cities || []).some(c => c.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <>
      {modal && (
        <AreaFormModal mode={modal.mode} initialData={modal.data} onClose={() => setModal(null)} onSave={handleSave} theme={theme} loading={actionLoading} />
      )}

      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: t.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, boxShadow: t.shadowElevated }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: t.red.bg, border: `1px solid ${t.red.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={18} color={t.red.text} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 5 }}>Hapus Perwakilan / Agen</div>
                <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.6 }}>
                  Apakah Anda yakin ingin menghapus <strong style={{ color: t.text }}>{deleteTarget.name}</strong>? Menghapus area ini juga akan menghapus data harga terkait secara permanen!
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setDeleteTarget(null)} disabled={actionLoading} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: t.gray.bg, color: t.gray.text, border: `1px solid ${t.gray.border}`, cursor: 'pointer' }}>Batal</button>
              <button onClick={handleDelete} disabled={actionLoading} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' }}>
                {actionLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 14, overflow: 'hidden', boxShadow: t.shadowCard }}> */}
        {/* Header bar */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: t.blue.bg, border: `1px solid ${t.blue.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={14} color={t.blue.text} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, lineHeight: 1 }}>Manajemen Agen & Perwakilan</div>
              {/* <div style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO, marginTop: 2 }}>{filtered.length} entri terdaftar</div> */}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={12} color={t.textMuted} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
              <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Cari nama agen, kota, regional..." style={{ paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 12, borderRadius: 8, background: t.inputbg, border: `1px solid ${t.borderInput}`, color: t.text, outline: 'none', width: 220, fontFamily: FONT_MONO }} />
            </div>
            <button onClick={fetchAreas} disabled={loading} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${t.gray.border}`, background: t.gray.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <RefreshCw size={12} color={t.gray.text} />
            </button>
            <button onClick={() => setModal({ mode: 'add' })} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)' }}>
              <Plus size={13} /> Tambah Wilayah
            </button>
          </div>
        </div>

        {/* Table / Loader content */}
        {loading ? (
          <div style={{ padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: t.textMuted, fontSize: 13, fontFamily: FONT_MONO }}>Memuat data wilayah…</div>
        ) : error ? (
          <div style={{ padding: 32, textAlign: 'center', color: t.red.text, fontSize: 13 }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: t.textMuted, fontSize: 13, fontFamily: FONT_MONO }}>Tidak ditemukan data wilayah matching.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: t.tableHead }}>
                  {/* <th style={{ padding: '10px 12px', textAlign: 'left', color: t.textMuted, fontFamily: FONT_MONO, fontSize: 10 }}>ID Wilayah</th> */}
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: t.textMuted, fontFamily: FONT_MONO, fontSize: 10 }}>Nama Agen / Perwakilan</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: t.textMuted, fontFamily: FONT_MONO, fontSize: 10 }}>Tipe Jenis</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: t.textMuted, fontFamily: FONT_MONO, fontSize: 10 }}>Regional</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', color: t.textMuted, fontFamily: FONT_MONO, fontSize: 10 }}>Area Cakupan Kota</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', color: t.textMuted, fontFamily: FONT_MONO, fontSize: 10 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((row, idx) => (
                  <tr key={row.id} style={{ borderTop: `1px solid ${t.border}`, background: idx % 2 === 1 ? t.tableAlt : 'transparent' }}>
                    {/* <td style={{ padding: '12px', fontFamily: FONT_MONO, color: t.textMuted, fontWeight: 600 }}>#{row.id}</td> */}
                    <td style={{ padding: '12px', fontWeight: 600, color: t.text }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Building2 size={13} color={t.textMuted} /> {row.name}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: FONT_MONO, background: row.agent_type === 'perwakilan' ? t.green.bg : row.agent_type === 'kota' ? t.green.bg : t.blue.bg, color: row.agent_type === 'perwakilan' ? t.green.text : row.agent_type === 'kota' ? t.green.text : t.blue.text }}>
                        {row.agent_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: t.textSub }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Globe size={12} color={t.textFaint} /> {row.regional || '—'}</div>
                    </td>
                    <td style={{ padding: '12px', maxWidth: 300 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}><Map size={12} color={t.textFaint} /><span style={{ fontSize: 11, fontWeight: 700, color: t.textSub }}>{row.city_count} Kota</span></div>
                      <div style={{ fontSize: 11, color: t.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.cities?.join(', ')}</div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                        <button onClick={() => setModal({ mode: 'edit', data: row })} style={{ width: 28, height: 28, borderRadius: 6, background: t.blue.bg, border: `1px solid ${t.blue.border}`, color: t.blue.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pencil size={12} /></button>
                        <button onClick={() => setDeleteTarget(row)} style={{ width: 28, height: 28, borderRadius: 6, background: t.red.bg, border: `1px solid ${t.red.border}`, color: t.red.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!loading && !error && filtered.length > PAGE_SIZE && (
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO }}>
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} / {filtered.length} area
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${t.gray.border}`, background: t.gray.bg, color: t.textSub, cursor: 'pointer', opacity: safePage === 1 ? 0.4 : 1 }}><ChevronLeft size={12} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${t.gray.border}`, background: t.gray.bg, color: t.textSub, cursor: 'pointer', opacity: safePage === totalPages ? 0.4 : 1 }}><ChevronRight size={12} /></button>
            </div>
          </div>
        )}
      {/* </div> */}
    </>
  );
}