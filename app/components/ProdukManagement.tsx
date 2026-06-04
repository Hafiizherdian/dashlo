'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Package, Plus, Pencil, Trash2, X, Check,
  RefreshCw, Search, ChevronLeft, ChevronRight,
  AlertTriangle, Factory, Filter, ChevronDown,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark';

interface Product {
  id: number;
  name: string;
  category: string;
  factory: string;
  stick_per_pack: number;
  pack_per_slop: number;
  slop_per_bal: number;
  bal_per_dos: number;
  created_at?: string;
}

type ProductForm = Omit<Product, 'id' | 'created_at'>;

const EMPTY_FORM: ProductForm = {
  name: '', category: '', factory: '',
  stick_per_pack: 12, pack_per_slop: 10, slop_per_bal: 10, bal_per_dos: 4,
};

// 1. Definisikan tipe untuk sub-objek warna badge
interface ColorSet {
  bg: string;
  text: string;
  border: string;
}

// 2. Definisikan struktur menyeluruh token tema
interface ThemeTokens {
  pagebg: string;
  cardbg: string;
  border: string;
  borderCard: string;
  borderInput: string;
  borderActive: string;
  inputbg: string;
  text: string;
  textSub: string;
  textMuted: string;
  textFaint: string;
  tableHead: string;
  tableAlt: string;
  shadowCard: string;
  shadowElevated: string;
  modalOverlay: string;
  blue: ColorSet;
  green: ColorSet;
  red: ColorSet;
  yellow: ColorSet;
  orange: ColorSet;
  gray: ColorSet;
  purple: ColorSet;
}

// 3. Pasangkan ThemeTokens ke objek tk (Hapus 'as const' di bagian paling bawah)
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

// ─── Category badge ───────────────────────────────────────────────────────────

// Membatasi key hanya untuk palette warna yang valid di ThemeTokens
const CATEGORY_COLOR: Record<string, 'blue' | 'green' | 'yellow' | 'orange' | 'purple'> = {
  SKMR: 'blue', SKMM: 'green', SPM: 'yellow', SKT: 'orange', SPT: 'purple',
};

// Gunakan t: ThemeTokens di parameter komponen
function CategoryBadge({ cat, t }: { cat: string; t: ThemeTokens }) {
  const colorKey = CATEGORY_COLOR[cat] ?? 'gray';
  const color = t[colorKey]; 

  return (
    <span style={{
      display: 'inline-flex', 
      alignItems: 'center', 
      padding: '2px 8px',
      borderRadius: 6, 
      background: color.bg, 
      border: `1px solid ${color.border}`,
      color: color.text, 
      fontSize: 11, 
      fontWeight: 700, 
      fontFamily: FONT_MONO,
      letterSpacing: '0.06em',
    }}>
      {cat}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg style={{ animation: 'spin 0.8s linear infinite', width: size, height: size, flexShrink: 0 }} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" opacity="0.2"/>
      <path d="M4 12a8 8 0 018-8" stroke={color} strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────

function ConfirmDeleteModal({ product, onConfirm, onCancel, theme, loading }: {
  product: Product; onConfirm: () => void; onCancel: () => void; theme: Theme; loading: boolean;
}) {
  const t = tk[theme];
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: t.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}>
      <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 400, boxShadow: t.shadowElevated, animation: 'slideUp 0.2s ease' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: t.red.bg, border: `1px solid ${t.red.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangle size={18} color={t.red.text}/>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text, marginBottom: 5 }}>Hapus Produk</div>
            <div style={{ fontSize: 13, color: t.textSub, lineHeight: 1.65 }}>
              Yakin menghapus <strong style={{ color: t.text }}>"{product.name}"</strong>?
              Data produk ini akan terhapus permanen.
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

// ─── Product Modal ────────────────────────────────────────────────────────────

function ProductModal({ mode, product, categories, factories, onSave, onClose, theme, loading }: {
  mode: 'add' | 'edit';
  product?: Product;
  categories: string[];
  factories: string[];
  onSave: (form: ProductForm) => void;
  onClose: () => void;
  theme: Theme;
  loading: boolean;
}) {
  const t = tk[theme];
  const [form, setForm] = useState<ProductForm>(
    product
      ? { name: product.name, category: product.category, factory: product.factory,
          stick_per_pack: product.stick_per_pack, pack_per_slop: product.pack_per_slop,
          slop_per_bal: product.slop_per_bal, bal_per_dos: product.bal_per_dos }
      : { ...EMPTY_FORM }
  );
  const [catInput, setCatInput]         = useState(product?.category ?? '');
  const [factoryInput, setFactoryInput] = useState(product?.factory  ?? '');
  const [showCatList,  setShowCatList]  = useState(false);
  const [showFacList,  setShowFacList]  = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const set = (k: keyof ProductForm, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }));

  const valid = form.name.trim().length > 0
    && form.category.trim().length > 0
    && form.factory.trim().length > 0
    && form.stick_per_pack > 0 && form.pack_per_slop > 0
    && form.slop_per_bal  > 0 && form.bal_per_dos   > 0;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', fontSize: 13, borderRadius: 9,
    background: t.inputbg, border: `1px solid ${t.borderInput}`,
    color: t.text, outline: 'none', fontFamily: FONT_MONO,
    transition: 'border-color 0.15s', boxSizing: 'border-box',
  };

  const numInputStyle: React.CSSProperties = {
    ...inputStyle, textAlign: 'right', width: '100%',
  };

  const filteredCats = categories.filter(c => c.toLowerCase().includes(catInput.toLowerCase()));
  const filteredFacs = factories.filter(f => f.toLowerCase().includes(factoryInput.toLowerCase()));

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: t.modalOverlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.15s ease' }}>
      <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 16, padding: 24, width: '100%', maxWidth: 520, boxShadow: t.shadowElevated, animation: 'slideUp 0.2s ease', maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: t.blue.bg, border: `1px solid ${t.blue.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} color={t.blue.text}/>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: t.text, lineHeight: 1 }}>
                {mode === 'add' ? 'Tambah Produk' : 'Edit Produk'}
              </div>
              <div style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO, marginTop: 2 }}>
                {mode === 'add' ? 'Produk baru' : `ID: ${product?.id}`}
              </div>
            </div>
          </div>
          <button onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 7, background: t.red.bg, border: `1px solid ${t.red.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={13} color={t.red.text}/>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Nama Produk */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 5 }}>
              Nama Produk <span style={{ color: t.red.text }}>*</span>
            </label>
            <input value={form.name}
              onChange={e => set('name', e.target.value.toUpperCase())}
              placeholder="contoh: CAKRA KRESNA 12 F" style={inputStyle}
              onFocus={e => (e.target.style.borderColor = t.borderActive)}
              onBlur={e  => (e.target.style.borderColor = t.borderInput)}/>
          </div>

          {/* Kategori + Pabrik — 2 kolom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* Kategori */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 5 }}>
                Kategori <span style={{ color: t.red.text }}>*</span>
              </label>
              <input value={catInput}
                onChange={e => { setCatInput(e.target.value.toUpperCase()); set('category', e.target.value.toUpperCase()); setShowCatList(true); }}
                onFocus={() => setShowCatList(true)}
                onBlur={() => setTimeout(() => setShowCatList(false), 150)}
                placeholder="SKMR" style={inputStyle}/>
              {showCatList && filteredCats.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 9, boxShadow: t.shadowElevated, overflow: 'hidden', marginTop: 2 }}>
                  {filteredCats.map(c => (
                    <div key={c} onMouseDown={() => { setCatInput(c); set('category', c); setShowCatList(false); }}
                      style={{ padding: '8px 12px', fontSize: 12, fontFamily: FONT_MONO, color: t.text, cursor: 'pointer', background: c === form.category ? t.blue.bg : 'transparent' }}>
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pabrik */}
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 5 }}>
                Pabrik <span style={{ color: t.red.text }}>*</span>
              </label>
              <input value={factoryInput}
                onChange={e => { setFactoryInput(e.target.value.toUpperCase()); set('factory', e.target.value.toUpperCase()); setShowFacList(true); }}
                onFocus={() => setShowFacList(true)}
                onBlur={() => setTimeout(() => setShowFacList(false), 150)}
                placeholder="PT. ..." style={inputStyle}/>
              {showFacList && filteredFacs.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 9, boxShadow: t.shadowElevated, overflow: 'hidden', marginTop: 2, maxHeight: 160, overflowY: 'auto' }}>
                  {filteredFacs.map(f => (
                    <div key={f} onMouseDown={() => { setFactoryInput(f); set('factory', f); setShowFacList(false); }}
                      style={{ padding: '8px 12px', fontSize: 12, fontFamily: FONT_MONO, color: t.text, cursor: 'pointer', background: f === form.factory ? t.blue.bg : 'transparent' }}>
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Satuan — divider */}
          <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: t.textMuted, fontFamily: FONT_MONO, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Satuan / Konversi
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {([
                ['stick_per_pack', 'Stick / Pack'],
                ['pack_per_slop',  'Pack / Slop'],
                ['slop_per_bal',   'Slop / Bal'],
                ['bal_per_dos',    'Bal / Dos'],
              ] as [keyof ProductForm, string][]).map(([key, label]) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.textSub, marginBottom: 5 }}>
                    {label} <span style={{ color: t.red.text }}>*</span>
                  </label>
                  <input type="number" min={1} value={form[key] as number}
                    onChange={e => set(key, Math.max(1, parseInt(e.target.value) || 1))}
                    style={numInputStyle}
                    onFocus={e => (e.target.style.borderColor = t.borderActive)}
                    onBlur={e  => (e.target.style.borderColor = t.borderInput)}/>
                </div>
              ))}
            </div>

            {/* Summary konversi */}
            <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, background: t.blue.bg, border: `1px solid ${t.blue.border}` }}>
              <div style={{ fontSize: 11, color: t.blue.text, fontFamily: FONT_MONO, lineHeight: 1.8 }}>
                1 Dos = {form.bal_per_dos} Bal
                = {form.bal_per_dos * form.slop_per_bal} Slop
                = {form.bal_per_dos * form.slop_per_bal * form.pack_per_slop} Pack
                = {form.bal_per_dos * form.slop_per_bal * form.pack_per_slop * form.stick_per_pack} Stick
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} disabled={loading}
            style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: t.gray.bg, color: t.gray.text, border: `1px solid ${t.gray.border}`, cursor: 'pointer' }}>
            Batal
          </button>
          <button onClick={() => onSave(form)} disabled={!valid || loading}
            style={{ padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: valid && !loading ? '#6366f1' : t.gray.bg, color: valid && !loading ? '#fff' : t.gray.text, border: 'none', cursor: valid && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s', boxShadow: valid && !loading ? '0 2px 8px rgba(99,102,241,0.35)' : 'none' }}>
            {loading
              ? <><Spinner size={12} color="currentColor"/> Menyimpan…</>
              : <><Check size={12}/> {mode === 'add' ? 'Tambah' : 'Simpan'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductManagement({ theme }: { theme: Theme }) {
  const t = tk[theme];

  const [products,    setProducts]    = useState<Product[]>([]);
  const [categories,  setCategories]  = useState<string[]>([]);
  const [factories,   setFactories]   = useState<string[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [actionLoad,  setActionLoad]  = useState(false);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState('');
  const [filterFac,   setFilterFac]   = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page,        setPage]        = useState(1);
  const PAGE_SIZE = 15;

  const [modal,        setModal]        = useState<{ mode: 'add' | 'edit'; product?: Product } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [toast,        setToast]        = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (search)    params.set('search',   search);
      if (filterCat) params.set('category', filterCat);
      if (filterFac) params.set('factory',  filterFac);

      const res  = await fetch(`/api/produk?${params}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.products   ?? []);
        setCategories(json.data.categories ?? []);
        setFactories(json.data.factories   ?? []);
      } else {
        setError(json.error ?? 'Gagal memuat produk');
      }
    } catch {
      setError('Koneksi gagal');
    } finally {
      setLoading(false);
    }
  }, [search, filterCat, filterFac]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(1); }, [search, filterCat, filterFac]);

  const apiAction = async (action: string, product: Partial<Product> & Partial<ProductForm>) => {
    setActionLoad(true);
    try {
      const res  = await fetch('/api/produk?', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, product }),
      });
      const json = await res.json();
      if (json.success) return true;
      showToast('error', json.error ?? 'Operasi gagal');
      return false;
    } catch {
      showToast('error', 'Koneksi gagal');
      return false;
    } finally {
      setActionLoad(false);
    }
  };

  const handleSave = async (form: ProductForm) => {
    if (!modal) return;
    const ok = await apiAction(
      modal.mode === 'add' ? 'add' : 'update',
      modal.mode === 'add' ? form : { ...form, id: modal.product!.id },
    );
    if (ok) {
      showToast('success', modal.mode === 'add'
        ? `Produk "${form.name}" berhasil ditambahkan`
        : `Produk "${form.name}" berhasil diupdate`);
      setModal(null);
      fetchProducts();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await apiAction('delete', { id: deleteTarget.id });
    if (ok) {
      showToast('success', `Produk "${deleteTarget.name}" berhasil dihapus`);
      setDeleteTarget(null);
      fetchProducts();
    }
  };

  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const paginated  = products.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const iconBtnStyle = (color: { bg: string; border: string }): React.CSSProperties => ({
    width: 28, height: 28, borderRadius: 7, background: color.bg,
    border: `1px solid ${color.border}`, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    transition: 'all 0.15s',
  });

  const activeFilters = [filterCat, filterFac].filter(Boolean).length;

  return (
    <>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 20, right: 16, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 12, background: t.cardbg, border: `1px solid ${toast.type === 'success' ? t.green.border : t.red.border}`, boxShadow: t.shadowElevated, animation: 'slideUp 0.25s ease', minWidth: 240, maxWidth: 340 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: toast.type === 'success' ? t.green.bg : t.red.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {toast.type === 'success' ? <Check size={11} color={t.green.text}/> : <X size={11} color={t.red.text}/>}
          </div>
          <span style={{ fontSize: 13, color: t.text, flex: 1, fontWeight: 500 }}>{toast.msg}</span>
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 0, display: 'flex' }}><X size={11}/></button>
        </div>
      )}

      {/* Modals */}
      {modal && (
        <ProductModal mode={modal.mode} product={modal.product}
          categories={categories} factories={factories}
          onSave={handleSave} onClose={() => setModal(null)}
          theme={theme} loading={actionLoad}/>
      )}
      {deleteTarget && (
        <ConfirmDeleteModal product={deleteTarget} onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)} theme={theme} loading={actionLoad}/>
      )}

      {/* Main card */}
      {/* <div style={{ background: t.cardbg, border: `1px solid ${t.borderCard}`, borderRadius: 14, overflow: 'hidden', boxShadow: t.shadowCard }}> */}

        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: t.green.bg, border: `1px solid ${t.green.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={14} color={t.green.text}/>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text, lineHeight: 1 }}>Management Produk</div>
              {/* <div style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO, marginTop: 2 }}>
                {products.length} produk{activeFilters > 0 ? ` (filter aktif: ${activeFilters})` : ''}
              </div> */}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={11} color={t.textMuted} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama / pabrik…"
                style={{ paddingLeft: 26, paddingRight: search ? 24 : 10, paddingTop: 7, paddingBottom: 7, fontSize: 12, borderRadius: 8, background: t.inputbg, border: `1px solid ${search ? t.borderActive : t.borderInput}`, color: t.text, outline: 'none', width: 190, fontFamily: FONT_MONO, transition: 'border-color 0.15s' }}/>
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: t.textMuted, padding: 0, display: 'flex' }}><X size={10}/></button>
              )}
            </div>

            {/* Filter toggle */}
            <button onClick={() => setShowFilters(f => !f)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: activeFilters > 0 ? t.yellow.bg : t.gray.bg, color: activeFilters > 0 ? t.yellow.text : t.gray.text, border: `1px solid ${activeFilters > 0 ? t.yellow.border : t.gray.border}`, cursor: 'pointer', transition: 'all 0.15s' }}>
              <Filter size={11}/> Filter {activeFilters > 0 ? `(${activeFilters})` : ''} <ChevronDown size={10} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>
            </button>

            {/* Refresh */}
            <button onClick={fetchProducts} disabled={loading} title="Refresh"
              style={{ ...iconBtnStyle(t.gray), opacity: loading ? 0.5 : 1 }}>
              <RefreshCw size={12} color={t.gray.text} style={loading ? { animation: 'spin 1s linear infinite' } : {}}/>
            </button>

            {/* Tambah */}
            <button onClick={() => setModal({ mode: 'add' })}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.3)', transition: 'all 0.15s' }}>
              <Plus size={13}/> Tambah Produk
            </button>
          </div>
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${t.border}`, background: t.tableHead, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: t.textMuted, fontFamily: FONT_MONO }}>Filter:</span>

            {/* Kategori */}
            <div style={{ position: 'relative' }}>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                style={{ padding: '5px 28px 5px 10px', fontSize: 12, borderRadius: 7, background: t.inputbg, border: `1px solid ${filterCat ? t.borderActive : t.borderInput}`, color: filterCat ? t.text : t.textMuted, outline: 'none', fontFamily: FONT_MONO, cursor: 'pointer', appearance: 'none' }}>
                <option value="">Semua Kategori</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown size={10} color={t.textMuted} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
            </div>

            {/* Pabrik */}
            <div style={{ position: 'relative' }}>
              <select value={filterFac} onChange={e => setFilterFac(e.target.value)}
                style={{ padding: '5px 28px 5px 10px', fontSize: 12, borderRadius: 7, background: t.inputbg, border: `1px solid ${filterFac ? t.borderActive : t.borderInput}`, color: filterFac ? t.text : t.textMuted, outline: 'none', fontFamily: FONT_MONO, cursor: 'pointer', appearance: 'none', maxWidth: 220 }}>
                <option value="">Semua Pabrik</option>
                {factories.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown size={10} color={t.textMuted} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
            </div>

            {activeFilters > 0 && (
              <button onClick={() => { setFilterCat(''); setFilterFac(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, fontSize: 11, fontFamily: FONT_MONO, background: t.red.bg, border: `1px solid ${t.red.border}`, color: t.red.text, cursor: 'pointer' }}>
                <X size={9}/> Reset
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ padding: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: t.textMuted, fontSize: 13, fontFamily: FONT_MONO }}>
            <Spinner size={16} color={t.textMuted}/> Memuat produk…
          </div>
        ) : error ? (
          <div style={{ padding: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: t.red.text, fontSize: 13 }}>
            <AlertTriangle size={14}/> {error}
            <button onClick={fetchProducts} style={{ marginLeft: 8, fontSize: 12, color: t.blue.text, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Coba lagi</button>
          </div>
        ) : products.length === 0 ? (
          <div style={{ padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: t.textMuted }}>
            <Package size={32} color={t.textFaint}/>
            <div style={{ fontSize: 13, fontFamily: FONT_MONO }}>{search || activeFilters ? 'Tidak ada hasil ditemukan' : 'Belum ada produk'}</div>
            {!search && !activeFilters && (
              <button onClick={() => setModal({ mode: 'add' })} style={{ fontSize: 12, color: '#818cf8', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Tambah produk pertama</button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['#', 'Nama Produk', 'Kat.', 'Pabrik', 'Stick/Pack', 'Pack/Slop', 'Slop/Bal', 'Bal/Dos', 'Aksi'].map((h, i) => (
                    <th key={h} style={{
                      padding: '10px 12px',
                      textAlign: i >= 4 && i <= 7 ? 'center' : i === 8 ? 'center' : 'left',
                      fontSize: 10, fontWeight: 700, fontFamily: FONT_MONO,
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      color: t.textMuted, borderBottom: `1px solid ${t.border}`,
                      background: t.tableHead, whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, idx) => (
                  <tr key={p.id} style={{ background: idx % 2 === 1 ? t.tableAlt : 'transparent' }}>

                    {/* ID */}
                    <td style={{ padding: '10px 12px', fontFamily: FONT_MONO, fontSize: 11, color: t.textFaint, whiteSpace: 'nowrap' }}>
                      {(safePage - 1) * PAGE_SIZE + idx + 1}
                    </td>

                    {/* Nama */}
                    <td style={{ padding: '10px 12px', color: t.text, fontWeight: 600, minWidth: 180 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 6, background: t.gray.bg, border: `1px solid ${t.gray.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Package size={11} color={t.text}/>
                        </div>
                        <span style={{ fontSize: 13 }}>{p.name}</span>
                      </div>
                    </td>

                    {/* Kategori */}
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                      <CategoryBadge cat={p.category} t={t}/>
                    </td>

                    {/* Pabrik */}
                    <td style={{ padding: '10px 12px', color: t.textSub, fontSize: 12, fontFamily: FONT_MONO, minWidth: 160 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Factory size={11} color={t.textMuted} style={{ flexShrink: 0 }}/>
                        <span style={{ fontSize: 11 }}>{p.factory}</span>
                      </div>
                    </td>

                    {/* Angka-angka */}
                    {([p.stick_per_pack, p.pack_per_slop, p.slop_per_bal, p.bal_per_dos] as number[]).map((val, vi) => (
                      <td key={vi} style={{ padding: '10px 12px', textAlign: 'center', fontFamily: FONT_MONO, fontSize: 13, fontWeight: 700, color: t.text }}>
                        {val}
                      </td>
                    ))}

                    {/* Aksi */}
                    <td style={{ padding: '10px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
                        <button onClick={() => setModal({ mode: 'edit', product: p })}
                          style={iconBtnStyle(t.blue)} title="Edit produk">
                          <Pencil size={11} color={t.blue.text}/>
                        </button>
                        <button onClick={() => setDeleteTarget(p)}
                          style={iconBtnStyle(t.red)} title="Hapus produk">
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
        {!loading && !error && products.length > PAGE_SIZE && (
          <div style={{ padding: '10px 14px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 11, color: t.textMuted, fontFamily: FONT_MONO }}>
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, products.length)} / {products.length} produk
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
      {/* </div> */}
    </>
  );
}