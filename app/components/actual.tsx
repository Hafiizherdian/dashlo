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

interface Props { theme: Theme; }

export default function Actual({ theme }: Props) {
  const t = tk[theme];
  const isDark = theme === 'dark';

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

  // ── Design tokens ──────────────────────────────────────────────────────────
  // Menggunakan variabel dari tk theme — tidak ada warna custom di luar token.
  // Untuk elemen yang belum ada token-nya, kita derive secara konsisten.

  const C = {
    // Surfaces
    bg:         t.cardbg,
    bgSubtle:   t.tableHead,     // sedikit lebih gelap dari cardbg
    bgSunken:   isDark ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.03)',

    // Borders
    border:     t.border,
    borderCard: t.borderCard,
    borderInput: t.borderInput,

    // Text
    text:       t.text,
    textSub:    t.textSub,
    textMuted:  t.textMuted,
    textFaint:  t.textFaint,

    // Accents (diambil dari t.green untuk positif/aktif, minimal)
    accentBg:   isDark ? 'rgba(34,197,94,0.10)' : 'rgba(28,151,6,0.07)',
    accentText: isDark ? '#22c55e' : '#15803d',
    accentBorder: isDark ? 'rgba(34,197,94,0.30)' : 'rgba(28,151,6,0.25)',

    // Row stripe
    rowAlt:    isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.018)',

    // Solid opaque alt untuk factory group ke-2 — dari token tableAlt yang sudah solid
    bgSubtle2: t.tableAlt,
  };

  // ── Styles ─────────────────────────────────────────────────────────────────

  const selectStyle: React.CSSProperties = {
    background:   t.inputbg,
    border:       `1px solid ${C.borderInput}`,
    borderRadius: 6,
    color:        C.text,
    fontSize:     11,
    fontFamily:   FONT_MONO,
    padding:      '0 8px',
    height:       28,
    outline:      'none',
    cursor:       'pointer',
    minWidth:     90,
    // Kunci: sinyal ke browser agar render native <option> dengan warna yang sesuai tema
    colorScheme:  isDark ? 'dark' : 'light',
  };

  // Field toggle: aktif → outline accent tipis; non-aktif → muted flat
  const fieldPillStyle = (active: boolean): React.CSSProperties => ({
    padding:      '2px 9px',
    height:       24,
    border:       `1px solid ${active ? C.accentBorder : C.borderInput}`,
    borderRadius: 4,
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

  // Badge tipe agen — minimal, hanya border
  const agentBadge = (agentType: string): React.CSSProperties => ({
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

  // Sticky header row 1 — factory
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

  // Sticky header row 2 — product name
  const thProduct: React.CSSProperties = {
    background:   C.bgSubtle,
    borderBottom: `2px solid ${C.borderCard}`,
    borderRight:  `1px solid ${C.border}`,
    padding:      '5px 8px',
    fontSize:     10,
    fontWeight:   500,
    color:        C.textSub,
    textAlign:    'center',
    maxWidth:     96,
    minWidth:     72,
    lineHeight:   1.3,
    position:     'sticky',
    top:          29,         // tinggi row factory
    zIndex:       3,
    whiteSpace:   'normal',
    verticalAlign: 'bottom',
  };

  // Corner cell (top-left intersection)
  const thCorner: React.CSSProperties = {
    minWidth:    200,
    position:    'sticky',
    left:        0,
    background:  C.bgSubtle,
    borderRight: `1px solid ${C.borderCard}`,
    zIndex:      5,
    padding:     '6px 14px',
    textAlign:   'left',
    // row-1 corner
    top:         0,
    borderBottom: `1px solid ${C.border}`,
  };

  const thCorner2: React.CSSProperties = {
    ...thCorner,
    top:          29,
    borderBottom: `2px solid ${C.borderCard}`,
    zIndex:       6,
  };

  // Baris regional header
  const trRegional: React.CSSProperties = {
    position:     'sticky',
    left:         0,
    zIndex:       1,
    background:   C.bgSubtle,
    borderBottom: `1px solid ${C.borderCard}`,
    padding:      '6px 14px',
    fontSize:     10,
    fontWeight:   700,
    fontFamily:   FONT_MONO,
    color:        C.textMuted,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    whiteSpace:   'nowrap',
    borderRight:  `1px solid ${C.borderCard}`,
  };

  // Baris area + agent type
  const tdArea: React.CSSProperties = {
    position:    'sticky',
    left:        0,
    zIndex:      1,
    background:  C.bg,
    borderRight: `1px solid ${C.borderCard}`,
    borderBottom: `1px solid ${C.border}`,
    padding:     '5px 14px 5px 24px',
    whiteSpace:  'nowrap',
  };

  // Baris field label
  const tdFieldLabel = (isLast: boolean): React.CSSProperties => ({
    position:    'sticky',
    left:        0,
    zIndex:      1,
    background:  C.bg,
    borderRight: `1px solid ${C.borderCard}`,
    borderBottom: isLast ? `1px solid ${C.borderCard}` : `1px solid ${C.border}`,
    padding:     '3px 14px 3px 36px',
    fontSize:    10,
    fontFamily:  FONT_MONO,
    color:       C.textMuted,
    letterSpacing: '0.04em',
    whiteSpace:  'nowrap',
  });

  // Cell nilai harga
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

  // Cell kosong (area/regional row, kolom produk)
  const tdBlank = (isRegionalRow: boolean): React.CSSProperties => ({
    background:   isRegionalRow ? C.bgSubtle : C.bg,
    borderBottom: `1px solid ${isRegionalRow ? C.borderCard : C.border}`,
    borderRight:  `1px solid ${C.border}`,
  });

  // ── Render ─────────────────────────────────────────────────────────────────

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

  return (
    <div style={{
      width:         '100%',
      fontFamily:    FONT_SANS,
      display:       'flex',
      flexDirection: 'column',
      gap:           0,
    }}>

      {/* Inject color-scheme agar native browser UI (dropdown <option>) ikut tema.
          color-scheme di elemen <select> saja tidak cukup di Chromium — harus di :root. */}
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

        {/* Filters kiri */}
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

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: C.borderInput, margin: '0 4px' }} />

        {/* Field toggles */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          {ALL_PRICE_FIELDS.map(({ key, label }) => (
            <button key={key} onClick={() => toggleField(key)} style={fieldPillStyle(activeFields.includes(key))}>
              {label}
            </button>
          ))}
        </div>

        {/* Spacer + info count */}
        <div style={{ marginLeft: 'auto', fontSize: 10, fontFamily: FONT_MONO, color: C.textFaint }}>
          {colProducts.length} produk &middot; {[...regionalGroups.values()].flat().length} area
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
            {/* Row 1: Factory groups */}
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
                    // HARUS solid opaque — sticky header dengan rgba/transparent akan tembus konten di bawahnya
                    background: gi % 2 === 0 ? C.bgSubtle : C.bgSubtle2,
                  }}
                >
                  {shortFactory(factory)}
                </th>
              ))}
            </tr>

            {/* Row 2: Product names */}
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

                {/* ── Regional separator row ──────────────────────────── */}
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

                      {/* ── Area header row ─────────────────────────────── */}
                      <tr>
                        <td style={tdArea}>
                          <span style={{
                            fontSize:   11,
                            fontWeight: 500,
                            color:      C.text,
                            fontFamily: FONT_SANS,
                          }}>
                            {area.area_name}
                          </span>
                          {area.area_name && area.area_name !== area.city_name && (
                            <span style={{
                              fontSize:  10,
                              color:     C.textMuted,
                              fontFamily: FONT_MONO,
                              marginLeft: 6,
                            }}>
                              {area.city_name}
                            </span>
                          )}
                          <span style={agentBadge(area.agent_type)}>
                            {area.agent_type}
                          </span>
                        </td>
                        {colProducts.map(p => (
                          <td key={p.id} style={tdBlank(false)} />
                        ))}
                      </tr>

                      {/* ── Field rows ──────────────────────────────────── */}
                      {activeFieldDefs.map(({ key, label }, fIdx) => {
                        const isLastField = fIdx === activeFieldDefs.length - 1;
                        return (
                          <tr
                            key={`${area.area_id}_${key}`}
                            style={{
                              // Alternating subtle stripe per field pair
                              background: fIdx % 2 === 0 ? 'transparent' : C.rowAlt,
                            }}
                          >
                            <td style={tdFieldLabel(isLastField && isLastArea)}>
                              {label}
                            </td>
                            {colProducts.map((p, pi) => {
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