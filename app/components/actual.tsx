'use client';

import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { tk } from '@/lib/theme';

type Theme = 'light' | 'dark';

interface PriceRow {
  id: number;
  product_id: number;
  product_name: string;
  category: string;
  factory: string;
  area_id: number;
  area_slug: string;
  city_name: string;
  area_name: string;
  agent_type: string;
  regional: string;
  dbp: string;
  wbp: string;
  rbp: string;
  cbp: string;
  pita_cukai: string;
  hje: string;
  tarif: string;
  hpp: string;
  updated_at: string;
  scheduled_count: number;
  active_period_from: string | null;
}

interface Product {
  id: number;
  name: string;
  category: string;
  factory: string;
}

interface HargaApiData {
  prices: PriceRow[];
  areas: any[];
  products: Product[];
  regionals: string[];
  agentTypes: string[];
}

type PriceField = 'wbp' | 'rbp' | 'cbp' | 'dbp' | 'pita_cukai' | 'hje' | 'tarif' | 'hpp';

const ALL_PRICE_FIELDS: { key: PriceField; label: string }[] = [
  { key: 'wbp',        label: 'WBP'        },
  { key: 'rbp',        label: 'RBP'        },
  { key: 'cbp',        label: 'CBP'        },
  { key: 'dbp',        label: 'DBP'        },
  { key: 'pita_cukai', label: 'Pita Cukai' },
  { key: 'hje',        label: 'HJE'        },
  { key: 'tarif',      label: 'Tarif'      },
  { key: 'hpp',        label: 'HPP'        },
];

const FONT_MONO = '"IBM Plex Mono", monospace';
const FONT_SANS = '"IBM Plex Sans", sans-serif';

function fmt(v: string | number | null | undefined): string {
  const n = parseFloat(String(v ?? ''));
  if (!n || isNaN(n)) return '';
  return n.toLocaleString('id-ID');
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isMobile;
}

interface Props { theme: Theme; }

export default function Actual({ theme }: Props) {
  const t = tk[theme];
  const isDark = theme === 'dark';
  const isMobile = useIsMobile();

  const [data,            setData]            = useState<HargaApiData | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [filterFactory,   setFilterFactory]   = useState('');
  const [filterCategory,  setFilterCategory]  = useState('');
  const [filterProduct,   setFilterProduct]   = useState('');
  const [filterRegional,  setFilterRegional]  = useState('');
  const [filterAgentType, setFilterAgentType] = useState('');
  const [activeFields,    setActiveFields]    = useState<PriceField[]>([
    'wbp', 'rbp', 'cbp', 'dbp', 'pita_cukai', 'hje', 'tarif', 'hpp',
  ]);

  // Mobile states
  const [filterOpen,    setFilterOpen]    = useState(false);
  // Gunakan array of number, bukan Set — lebih predictable di React
  const [expandedIds,   setExpandedIds]   = useState<number[]>([]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/harga');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal mengambil data');
      setData(json.data);
    } catch (e: any) {
      setError(e.message ?? 'Error tidak diketahui');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const factories = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.products.map(p => p.factory))].sort();
  }, [data]);

  const categories = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.products.map(p => p.category))].sort();
  }, [data]);

  const colProducts = useMemo(() => {
    if (!data) return [];
    return data.products
      .filter(p =>
        (!filterFactory  || p.factory  === filterFactory) &&
        (!filterCategory || p.category === filterCategory) &&
        (!filterProduct  || p.id === parseInt(filterProduct))
      )
      .sort((a, b) => a.factory.localeCompare(b.factory) || a.name.localeCompare(b.name));
  }, [data, filterFactory, filterCategory, filterProduct]);

  const priceMap = useMemo(() => {
    if (!data) return new Map<string, PriceRow>();
    const m = new Map<string, PriceRow>();
    data.prices.forEach(r => m.set(`${r.product_id}_${r.area_id}`, r));
    return m;
  }, [data]);

  const regionalGroups = useMemo(() => {
    if (!data) return new Map<string, PriceRow[]>();
    const productIds = new Set(colProducts.map(p => p.id));
    const filtered = data.prices.filter(r =>
      productIds.has(r.product_id) &&
      (!filterRegional  || r.regional   === filterRegional) &&
      (!filterAgentType || r.agent_type === filterAgentType)
    );
    const areaMap = new Map<number, PriceRow>();
    filtered.forEach(r => { if (!areaMap.has(r.area_id)) areaMap.set(r.area_id, r); });
    const groups = new Map<string, PriceRow[]>();
    areaMap.forEach(r => {
      const reg = r.regional || '–';
      if (!groups.has(reg)) groups.set(reg, []);
      groups.get(reg)!.push(r);
    });
    groups.forEach(arr => arr.sort((a, b) => a.city_name.localeCompare(b.city_name)));
    return new Map([...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [data, colProducts, filterRegional, filterAgentType]);

  const factoryGroups = useMemo(() => {
    const seen = new Map<string, Product[]>();
    colProducts.forEach(p => {
      if (!seen.has(p.factory)) seen.set(p.factory, []);
      seen.get(p.factory)!.push(p);
    });
    return [...seen.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([factory, products]) => ({ factory, products }));
  }, [colProducts]);

  function toggleField(key: PriceField) {
    setActiveFields(prev =>
      prev.includes(key)
        ? prev.length > 1 ? prev.filter(k => k !== key) : prev
        : [...prev, key]
    );
  }

  function shortFactory(name: string) {
    return name.replace('PT. ', '').replace('PR. ', '');
  }

  function toggleArea(areaId: number) {
    setExpandedIds(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  }

  // ── Design tokens ──────────────────────────────────────────────────────────
  const C = {
    bg:           t.cardbg,
    bgSubtle:     t.tableHead,
    bgSunken:     isDark ? '#1a1a1a' : '#f5f5f5',
    border:       t.border,
    borderCard:   t.borderCard,
    borderInput:  t.borderInput,
    text:         t.text,
    textSub:      t.textSub,
    textMuted:    t.textMuted,
    textFaint:    t.textFaint,
    accentBg:     isDark ? 'rgba(34,197,94,0.10)' : 'rgba(28,151,6,0.07)',
    accentText:   isDark ? '#22c55e' : '#15803d',
    accentBorder: isDark ? 'rgba(34,197,94,0.30)' : 'rgba(28,151,6,0.25)',
    rowAlt:       isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.018)',
    bgSubtle2:    t.tableAlt,
  };

  const selectStyle: React.CSSProperties = {
    background:  t.inputbg,
    border:      `1px solid ${C.borderInput}`,
    borderRadius: 6,
    color:       C.text,
    fontSize:    11,
    fontFamily:  FONT_MONO,
    padding:     '0 8px',
    height:      28,
    outline:     'none',
    cursor:      'pointer',
    minWidth:    90,
    colorScheme: isDark ? 'dark' : 'light',
  };

  const fieldPillStyle = (active: boolean): React.CSSProperties => ({
    padding:      '2px 9px',
    height:       24,
    border:       `1px solid ${active ? C.accentBorder : C.borderInput}`,
    borderRadius:  4,
    background:   active ? C.accentBg : 'transparent',
    color:        active ? C.accentText : C.textMuted,
    fontSize:     10,
    fontFamily:   FONT_MONO,
    fontWeight:   active ? 600 : 400,
    cursor:       'pointer',
    letterSpacing: '0.04em',
    transition:   'all 0.10s',
    whiteSpace:   'nowrap' as const,
    lineHeight:   '20px',
  });

  const agentBadgeStyle = (): React.CSSProperties => ({
    display:       'inline-block',
    fontSize:      9,
    fontFamily:    FONT_MONO,
    fontWeight:    600,
    padding:       '1px 5px',
    borderRadius:  3,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    border:        `1px solid ${C.borderCard}`,
    color:         C.textMuted,
    background:    'transparent',
    marginLeft:    5,
    verticalAlign: 'middle',
  });

  // Desktop styles
  const thFactory: React.CSSProperties = {
    background:    C.bgSubtle,
    borderBottom:  `1px solid ${C.border}`,
    borderRight:   `1px solid ${C.border}`,
    padding:       '5px 10px',
    fontSize:      9,
    fontWeight:    700,
    fontFamily:    FONT_MONO,
    color:         C.textMuted,
    textAlign:     'center',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    position:      'sticky',
    top:           0,
    zIndex:        3,
    whiteSpace:    'nowrap',
  };

  const thProduct: React.CSSProperties = {
    background:    C.bgSubtle,
    borderBottom:  `2px solid ${C.borderCard}`,
    borderRight:   `1px solid ${C.border}`,
    padding:       '5px 8px',
    fontSize:      10,
    fontWeight:    500,
    color:         C.textSub,
    textAlign:     'center',
    maxWidth:      96,
    minWidth:      72,
    lineHeight:    1.3,
    position:      'sticky',
    top:           29,
    zIndex:        3,
    whiteSpace:    'normal',
    verticalAlign: 'bottom',
  };

  const thCorner: React.CSSProperties = {
    minWidth:     200,
    position:     'sticky',
    left:         0,
    background:   C.bgSubtle,
    borderRight:  `1px solid ${C.borderCard}`,
    zIndex:       5,
    padding:      '6px 14px',
    textAlign:    'left',
    top:          0,
    borderBottom: `1px solid ${C.border}`,
  };

  const thCorner2: React.CSSProperties = {
    ...thCorner,
    top:          29,
    borderBottom: `2px solid ${C.borderCard}`,
    zIndex:       6,
  };

  const trRegional: React.CSSProperties = {
    position:      'sticky',
    left:          0,
    zIndex:        1,
    background:    C.bgSubtle,
    borderBottom:  `1px solid ${C.borderCard}`,
    padding:       '6px 14px',
    fontSize:      10,
    fontWeight:    700,
    fontFamily:    FONT_MONO,
    color:         C.textMuted,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    whiteSpace:    'nowrap',
    borderRight:   `1px solid ${C.borderCard}`,
  };

  const tdArea: React.CSSProperties = {
    position:     'sticky',
    left:         0,
    zIndex:       1,
    background:   C.bg,
    borderRight:  `1px solid ${C.borderCard}`,
    borderBottom: `1px solid ${C.border}`,
    padding:      '5px 14px 5px 24px',
    whiteSpace:   'nowrap',
  };

  const tdFieldLabel = (isLast: boolean): React.CSSProperties => ({
    position:      'sticky',
    left:          0,
    zIndex:        1,
    background:    C.bg,
    borderRight:   `1px solid ${C.borderCard}`,
    borderBottom:  isLast ? `1px solid ${C.borderCard}` : `1px solid ${C.border}`,
    padding:       '3px 14px 3px 36px',
    fontSize:      10,
    fontFamily:    FONT_MONO,
    color:         C.textMuted,
    letterSpacing: '0.04em',
    whiteSpace:    'nowrap',
  });

  const tdValue = (hasValue: boolean, isLast: boolean): React.CSSProperties => ({
    borderBottom: isLast ? `1px solid ${C.borderCard}` : `1px solid ${C.border}`,
    borderRight:  `1px solid ${C.border}`,
    padding:      '3px 12px 3px 8px',
    textAlign:    'right',
    color:        hasValue ? C.text : C.textFaint,
    fontFamily:   FONT_MONO,
    fontWeight:   hasValue ? 500 : 400,
    fontSize:     11,
    whiteSpace:   'nowrap',
    minWidth:     72,
  });

  const tdBlank = (isRegionalRow: boolean): React.CSSProperties => ({
    background:   isRegionalRow ? C.bgSubtle : C.bg,
    borderBottom: `1px solid ${isRegionalRow ? C.borderCard : C.border}`,
    borderRight:  `1px solid ${C.border}`,
  });

  if (isMobile === null) return null;

  if (loading) return (
    <div style={{
      padding:    '4rem',
      textAlign:  'center',
      color:      C.textMuted,
      fontFamily: FONT_MONO,
      fontSize:   11,
    }}>
      Memuat data harga…
    </div>
  );

  if (error) return (
    <div style={{
      padding:       '3rem',
      textAlign:     'center',
      color:         t.red?.text ?? '#ef4444',
      fontFamily:    FONT_MONO,
      fontSize:      11,
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      gap:           10,
    }}>
      <span>Gagal memuat: {error}</span>
      <button
        onClick={fetchData}
        style={{ ...selectStyle, padding: '5px 14px', height: 'auto', color: C.textMuted }}
      >
        Coba lagi
      </button>
    </div>
  );

  if (!data) return null;

  const activeFieldDefs = ALL_PRICE_FIELDS.filter(f => activeFields.includes(f.key));
  const totalArea = [...regionalGroups.values()].flat().length;
  const activeFilterCount = [
    filterFactory, filterCategory, filterProduct, filterRegional, filterAgentType,
  ].filter(Boolean).length;

  // ══════════════════════════════════════════════════════════════════════════
  // MOBILE LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <div style={{
        width:         '100%',
        fontFamily:    FONT_SANS,
        display:       'flex',
        flexDirection: 'column',
        background:    C.bg,
      }}>
        <style>{`
          :root { color-scheme: ${isDark ? 'dark' : 'light'}; }
          .harga-select option { background: ${t.optionBg}; color: ${C.text}; }
        `}</style>

        {/* ── Filter Bar sticky ────────────────────────────────────────── */}
        <div style={{
          position:     'sticky',
          top:          0,
          zIndex:       20,
          background:   C.bg,
          borderBottom: `1px solid ${C.borderCard}`,
        }}>
          {/* Header row */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '10px 14px 8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize:      10,
                fontFamily:    FONT_MONO,
                color:         C.textFaint,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {colProducts.length} produk · {totalArea} area
              </span>
              {activeFilterCount > 0 && (
                <span style={{
                  fontSize:      9,
                  fontFamily:    FONT_MONO,
                  fontWeight:    700,
                  background:    C.accentBg,
                  color:         C.accentText,
                  border:        `1px solid ${C.accentBorder}`,
                  borderRadius:  10,
                  padding:       '1px 7px',
                  letterSpacing: '0.05em',
                }}>
                  {activeFilterCount} filter aktif
                </span>
              )}
            </div>
            <button
              onClick={() => setFilterOpen(v => !v)}
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:           5,
                background:    filterOpen ? C.accentBg : 'C.accentBg + 20%',
                border:        `1px solid ${filterOpen ? C.accentBorder : C.borderInput}`,
                borderRadius:  6,
                color:         filterOpen ? C.accentText : C.textMuted,
                fontSize:      10,
                fontFamily:    FONT_MONO,
                fontWeight:    600,
                padding:       '5px 10px',
                cursor:        'pointer',
                letterSpacing: '0.04em',
                minHeight:     32,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 2.5h10M2.5 6h7M4 9.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Filter
            </button>
          </div>

          {/* Collapsible panel */}
          {filterOpen && (
            <div style={{
              padding:       '10px 14px 12px',
              display:       'flex',
              flexDirection: 'column',
              gap:           8,
              borderTop:     `1px solid ${C.border}`,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {[
                  { label: 'Pabrik',    value: filterFactory,   set: setFilterFactory,   opts: factories.map(f => ({ v: f, l: shortFactory(f) })) },
                  { label: 'Kategori',  value: filterCategory,  set: setFilterCategory,  opts: categories.map(c => ({ v: c, l: c })) },
                  { label: 'Produk',    value: filterProduct,   set: setFilterProduct,   opts: colProducts.map(p => ({ v: String(p.id), l: p.name })) },
                  { label: 'Regional',  value: filterRegional,  set: setFilterRegional,  opts: data.regionals.map(r => ({ v: r, l: r })) },
                  { label: 'Tipe Agen', value: filterAgentType, set: setFilterAgentType, opts: data.agentTypes.map(a => ({ v: a, l: a.charAt(0).toUpperCase() + a.slice(1) })) },
                ].map(({ label, value, set, opts }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{
                      fontSize:      9,
                      fontFamily:    FONT_MONO,
                      color:         C.textSub,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}>
                      {label}
                    </span>
                    <select
                      value={value}
                      onChange={e => set(e.target.value)}
                      className="harga-select"
                      style={{ ...selectStyle, minWidth: 0, width: '100%', height: 34, fontSize: 11 }}
                    >
                      <option value="">Semua</option>
                      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                  </div>
                ))}

                {activeFilterCount > 0 && (
                  <button
                    onClick={() => {
                      setFilterFactory('');
                      setFilterCategory('');
                      setFilterProduct('');
                      setFilterRegional('');
                      setFilterAgentType('');
                    }}
                    style={{
                      gridColumn:   '1 / -1',
                      background:   t.red?.bg ?? 'rgba(239,68,68,0.1)',
                      border:       `1px solid ${C.borderInput}`,
                      borderRadius:  6,
                      color:        C.textMuted,
                      fontSize:     10,
                      fontFamily:   FONT_MONO,
                      padding:      '6px',
                      cursor:       'pointer',
                      marginTop:    2,
                    }}
                  >
                    Reset filter
                  </button>
                )}
              </div>

              {/* Field toggles */}
              <div style={{
                borderTop:  `1px solid ${C.border}`,
                paddingTop: 8,
                display:    'flex',
                flexWrap:   'wrap',
                gap:        4,
              }}>
                <span style={{
                  fontSize:      9,
                  fontFamily:    FONT_MONO,
                  color:         C.textFaint,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  width:         '100%',
                  marginBottom:  2,
                }}>
                  Kolom harga
                </span>
                {ALL_PRICE_FIELDS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => toggleField(key)}
                    style={fieldPillStyle(activeFields.includes(key))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Area Cards ───────────────────────────────────────────────── */}
        <div>
          {[...regionalGroups.entries()].map(([regional, areas]) => (
            <div key={regional}>

              {/* Regional header */}
              <div style={{
                padding:       '7px 14px',
                fontSize:      9,
                fontFamily:    FONT_MONO,
                fontWeight:    700,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color:         C.textFaint,
                background:    C.bgSubtle,
                borderTop:     `1px solid ${C.borderCard}`,
                borderBottom:  `1px solid ${C.border}`,
              }}>
                {regional}
              </div>

              {/* Area items */}
              {areas.map(area => {
                const isOpen = expandedIds.includes(area.area_id);

                return (
                  <div key={area.area_id} style={{ borderBottom: `1px solid ${C.border}` }}>

                    {/* Area header button */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleArea(area.area_id)}
                      onKeyDown={e => e.key === 'Enter' && toggleArea(area.area_id)}
                      style={{
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'space-between',
                        padding:        '11px 14px',
                        cursor:         'pointer',
                        gap:            8,
                        minHeight:      44,
                        userSelect:     'none',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{
                          fontSize:   12,
                          fontWeight: 600,
                          color:      C.text,
                          fontFamily: FONT_SANS,
                          lineHeight: 1.3,
                        }}>
                          {area.area_name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {area.area_name !== area.city_name && (
                            <span style={{
                              fontSize:   10,
                              color:      C.textMuted,
                              fontFamily: FONT_MONO,
                            }}>
                              {area.city_name}
                            </span>
                          )}
                          <span style={agentBadgeStyle()}>{area.agent_type}</span>
                        </div>
                      </div>

                      {/* Chevron */}
                      <svg
                        width="14" height="14" viewBox="0 0 14 14" fill="none"
                        style={{
                          flexShrink: 0,
                          transform:  isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.18s ease',
                          color:      C.textFaint,
                        }}
                      >
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>

                    {/* ── Expanded: tabel produk × field ───────────────── */}
                    {isOpen && (
                      <div style={{
                        borderTop:  `1px solid ${C.border}`,
                        background: C.bgSunken,
                        overflowX:  'auto',
                        /* PENTING: jangan pakai position:sticky di dalam sini */
                      }}>
                        <table style={{
                          borderCollapse: 'collapse',
                          fontSize:       11,
                          fontFamily:     FONT_MONO,
                          /* width: max-content supaya kolom tidak terpaksa menyempit */
                          width:          colProducts.length > 3 ? 'max-content' : '100%',
                          minWidth:       '100%',
                        }}>
                          <thead>
                            <tr style={{ background: C.bgSubtle }}>
                              {/* Kolom label field */}
                              <th style={{
                                padding:       '6px 10px',
                                fontSize:      9,
                                fontWeight:    700,
                                color:         C.textFaint,
                                textAlign:     'left',
                                borderBottom:  `1px solid ${C.borderCard}`,
                                borderRight:   `1px solid ${C.borderCard}`,
                                whiteSpace:    'nowrap',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                minWidth:      70,
                                position:      'sticky',
                                left:          0,
                                zIndex:        3,
                                background:    C.bgSubtle,
                              }}>
                                Harga
                              </th>
                              {colProducts.map(p => (
                                <th key={p.id} style={{
                                  padding:      '6px 10px',
                                  fontSize:     10,
                                  fontWeight:   500,
                                  color:        C.textSub,
                                  textAlign:    'center',
                                  borderBottom: `1px solid ${C.borderCard}`,
                                  borderRight:  `1px solid ${C.border}`,
                                  whiteSpace:   'nowrap',
                                  minWidth:     80,
                                }}>
                                  {p.name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {activeFieldDefs.map(({ key, label }, fIdx) => {
                              const rowBg = fIdx % 2 === 0
                                ? C.bgSunken
                                : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)');
                              return (
                                <tr key={key} style={{ background: rowBg }}>
                                  {/* Label */}
                                  <td style={{
                                    padding:       '5px 10px',
                                    fontSize:      10,
                                    color:         C.textSub,
                                    letterSpacing: '0.04em',
                                    whiteSpace:    'nowrap',
                                    borderBottom:  `1px solid ${C.border}`,
                                    borderRight:   `1px solid ${C.borderCard}`,
                                    background:    C.bgSubtle2,
                                    fontWeight:    500,
                                    position:      'sticky',
                                    left:          0,
                                    zIndex:        2,
                                  }}>
                                    {label}
                                  </td>
                                  {/* Nilai per produk */}
                                  {colProducts.map(p => {
                                    const row = priceMap.get(`${p.id}_${area.area_id}`);
                                    const val = row ? fmt(row[key]) : '';
                                    return (
                                      <td key={p.id} style={{
                                        padding:      '5px 10px',
                                        textAlign:    'right',
                                        color:        val ? C.text : C.textFaint,
                                        fontWeight:   val ? 500 : 400,
                                        fontSize:     11,
                                        whiteSpace:   'nowrap',
                                        borderBottom: `1px solid ${C.border}`,
                                        borderRight:  `1px solid ${C.border}`,
                                      }}>
                                        {val || <span style={{ opacity: 0.3 }}>—</span>}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {regionalGroups.size === 0 && (
            <div style={{
              padding:    '3rem 2rem',
              textAlign:  'center',
              color:      C.textFaint,
              fontFamily: FONT_MONO,
              fontSize:   11,
            }}>
              Tidak ada data untuk filter yang dipilih.
            </div>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DESKTOP LAYOUT
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{
      width:         '100%',
      fontFamily:    FONT_SANS,
      display:       'flex',
      flexDirection: 'column',
      gap:           0,
    }}>
      <style>{`
        :root { color-scheme: ${isDark ? 'dark' : 'light'}; }
        .harga-select option {
          background: ${t.optionBg};
          color: ${C.text};
        }
      `}</style>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div style={{
        display:      'flex',
        flexWrap:     'wrap',
        gap:          6,
        alignItems:   'center',
        padding:      '8px 12px',
        background:   C.bg,
        borderBottom: `1px solid ${C.borderCard}`,
        position:     'sticky',
        top:          0,
        zIndex:       20,
      }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filterFactory}   onChange={e => setFilterFactory(e.target.value)}   className="harga-select" style={selectStyle}>
            <option value="">Pabrik</option>
            {factories.map(f => <option key={f} value={f}>{shortFactory(f)}</option>)}
          </select>
          <select value={filterCategory}  onChange={e => setFilterCategory(e.target.value)}  className="harga-select" style={selectStyle}>
            <option value="">Kategori</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterProduct}   onChange={e => setFilterProduct(e.target.value)}   className="harga-select" style={selectStyle}>
            <option value="">Produk</option>
            {colProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filterRegional}  onChange={e => setFilterRegional(e.target.value)}  className="harga-select" style={selectStyle}>
            <option value="">Regional</option>
            {data.regionals.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterAgentType} onChange={e => setFilterAgentType(e.target.value)} className="harga-select" style={selectStyle}>
            <option value="">Tipe Agen</option>
            {data.agentTypes.map(a => (
              <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>
            ))}
          </select>
        </div>

        <div style={{ width: 1, height: 18, background: C.borderInput, margin: '0 4px' }} />

        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {ALL_PRICE_FIELDS.map(({ key, label }) => (
            <button key={key} onClick={() => toggleField(key)} style={fieldPillStyle(activeFields.includes(key))}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', fontSize: 10, fontFamily: FONT_MONO, color: C.textFaint }}>
          {colProducts.length} produk &middot; {totalArea} area
        </div>
      </div>

      {/* ── Table wrapper ──────────────────────────────────────────────────── */}
      <div style={{
        overflowX:  'auto',
        overflowY:  'auto',
        maxHeight:  'calc(100vh - 100px)',
        background: C.bg,
      }}>
        <table style={{
          borderCollapse: 'collapse',
          width:          'max-content',
          minWidth:       '100%',
          fontSize:       11,
          fontFamily:     FONT_SANS,
        }}>
          <thead>
            <tr>
              <th style={thCorner}>
                <span style={{ fontSize: 9, fontFamily: FONT_MONO, color: C.textFaint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Area &amp; Agen
                </span>
              </th>
              {factoryGroups.map(({ factory, products }, gi) => (
                <th
                  key={factory}
                  colSpan={products.length}
                  style={{
                    ...thFactory,
                    borderLeft: `2px solid ${C.borderCard}`,
                    background: gi % 2 === 0 ? C.bgSubtle : C.bgSubtle2,
                  }}
                >
                  {shortFactory(factory)}
                </th>
              ))}
            </tr>
            <tr>
              <th style={thCorner2} />
              {colProducts.map((p, i) => {
                const isFirstInGroup = i === 0 || colProducts[i - 1].factory !== p.factory;
                return (
                  <th key={p.id} style={{
                    ...thProduct,
                    borderLeft: isFirstInGroup ? `2px solid ${C.borderCard}` : undefined,
                  }}>
                    {p.name}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {[...regionalGroups.entries()].map(([regional, areas]) => (
              <React.Fragment key={`reg_${regional}`}>
                <tr>
                  <td style={trRegional}>{regional}</td>
                  {colProducts.map(p => (
                    <td key={p.id} style={tdBlank(true)} />
                  ))}
                </tr>

                {areas.map((area, aIdx) => {
                  const isLastArea = aIdx === areas.length - 1;
                  return (
                    <React.Fragment key={`area_${area.area_id}`}>
                      <tr>
                        <td style={tdArea}>
                          <span style={{ fontSize: 11, fontWeight: 500, color: C.text, fontFamily: FONT_SANS }}>
                            {area.area_name}
                          </span>
                          {area.area_name && area.area_name !== area.city_name && (
                            <span style={{ fontSize: 10, color: C.textMuted, fontFamily: FONT_MONO, marginLeft: 6 }}>
                              {area.city_name}
                            </span>
                          )}
                          <span style={agentBadgeStyle()}>{area.agent_type}</span>
                        </td>
                        {colProducts.map(p => (
                          <td key={p.id} style={tdBlank(false)} />
                        ))}
                      </tr>

                      {activeFieldDefs.map(({ key, label }, fIdx) => {
                        const isLastField = fIdx === activeFieldDefs.length - 1;
                        return (
                          <tr
                            key={`${area.area_id}_${key}`}
                            style={{ background: fIdx % 2 === 0 ? 'transparent' : C.rowAlt }}
                          >
                            <td style={tdFieldLabel(isLastField && isLastArea)}>
                              {label}
                            </td>
                            {colProducts.map(p => {
                              const row = priceMap.get(`${p.id}_${area.area_id}`);
                              const val = row ? fmt(row[key]) : '';
                              return (
                                <td key={p.id} style={tdValue(!!val, isLastField && isLastArea)}>
                                  {val || <span style={{ opacity: 0.25 }}>—</span>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}

            {regionalGroups.size === 0 && (
              <tr>
                <td
                  colSpan={colProducts.length + 1}
                  style={{
                    padding:    '3rem',
                    textAlign:  'center',
                    color:      C.textFaint,
                    fontFamily: FONT_MONO,
                    fontSize:   11,
                  }}
                >
                  Tidak ada data untuk filter yang dipilih.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}