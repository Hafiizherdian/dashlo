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

// Semua field harga yang tersedia — termasuk pita_cukai, hje, tarif, hpp
type PriceField = 'wbp' | 'rbp' | 'cbp' | 'dbp' | 'pita_cukai' | 'hje' | 'tarif' | 'hpp';

const ALL_PRICE_FIELDS: { key: PriceField; label: string; colorKey: 'gray' }[] = [
  { key: 'wbp',        label: 'WBP',        colorKey: 'gray'   },
  { key: 'rbp',        label: 'RBP',        colorKey: 'gray'  },
  { key: 'cbp',        label: 'CBP',        colorKey: 'gray' },
  { key: 'dbp',        label: 'DBP',        colorKey: 'gray'  },
  { key: 'pita_cukai', label: 'Pita Cukai', colorKey: 'gray'    },
  { key: 'hje',        label: 'HJE',        colorKey: 'gray'   },
  { key: 'tarif',      label: 'Tarif',      colorKey: 'gray' },
  { key: 'hpp',        label: 'HPP',        colorKey: 'gray'  },
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

  const [data,              setData]              = useState<HargaApiData | null>(null);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState<string | null>(null);
  const [filterFactory,     setFilterFactory]     = useState('');
  const [filterCategory,    setFilterCategory]    = useState('');
  const [filterProduct,     setFilterProduct]     = useState('');
  const [filterRegional,    setFilterRegional]    = useState('');
  const [filterAgentType,   setFilterAgentType]   = useState('');
  const [activeFields,      setActiveFields]      = useState<PriceField[]>(['wbp', 'rbp']);

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
        (!filterProduct || p.id === parseInt(filterProduct))
      )
      .sort((a, b) => a.factory.localeCompare(b.factory) || a.name.localeCompare(b.name));
  }, [data, filterFactory, filterCategory, filterProduct]);

  const priceMap = useMemo(() => {
    if (!data) return new Map<string, PriceRow>();
    const m = new Map<string, PriceRow>();
    data.prices.forEach(r => m.set(`${r.product_id}_${r.area_id}`, r));
    return m;
  }, [data]);

  // Grouped areas: filter juga berdasarkan agent_type
  const regionalGroups = useMemo(() => {
    if (!data) return new Map<string, PriceRow[]>();
    const productIds = new Set(colProducts.map(p => p.id));
    const filtered   = data.prices.filter(r =>
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

  function getFieldColor(colorKey: 'blue' | 'green' | 'yellow' | 'gray' | 'red') {
    return t[colorKey];
  }

  function agentBadgeStyle(agentType: string): React.CSSProperties {
    const isAgen = agentType === 'agen';
    return {
      display:      'inline-block',
      fontSize:     9,
      fontFamily:   FONT_MONO,
      fontWeight:   700,
      padding:      '1px 5px',
      borderRadius: 4,
      letterSpacing: '0.04em',
      background:   isAgen ? t.blue.bg   : t.yellow.bg,
      color:        isAgen ? t.blue.text : t.yellow.text,
      border:       `1px solid ${isAgen ? t.blue.border : t.yellow.border}`,
      marginLeft:   6,
      verticalAlign: 'middle',
      textTransform: 'uppercase' as const,
    };
  }

  // ── Styles ─────────────────────────────────────────────────────────────────

  const selectStyle: React.CSSProperties = {
    background:   t.inputbg,
    border:       `1px solid ${t.borderInput}`,
    borderRadius: 7,
    color:        t.text,
    fontSize:     11,
    fontFamily:   FONT_MONO,
    padding:      '5px 8px',
    height:       30,
    outline:      'none',
    cursor:       'pointer',
  };

  const fieldBtnStyle = (active: boolean, colorKey: 'blue' | 'green' | 'yellow' | 'gray' | 'red'): React.CSSProperties => {
    const c = getFieldColor(colorKey);
    return {
      padding:      '3px 9px',
      border:       `1px solid ${active ? c.border : t.borderInput}`,
      borderRadius: 5,
      background:   active ? c.bg : t.inputbg,
      color:        active ? c.text : t.textMuted,
      fontSize:     10,
      fontFamily:   FONT_MONO,
      fontWeight:   active ? 700 : 400,
      cursor:       'pointer',
      transition:   'all 0.12s',
      whiteSpace:   'nowrap' as const,
    };
  };

  const thBase: React.CSSProperties = {
    background:    t.tableHead,
    borderBottom:  `1px solid ${t.border}`,
    borderRight:   `1px solid ${t.border}`,
    padding:       '6px 10px',
    fontSize:      9,
    fontWeight:    700,
    fontFamily:    FONT_MONO,
    color:         t.textMuted,
    textAlign:     'center',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    position:      'sticky',
    top:           0,
    zIndex:        3,
    whiteSpace:    'nowrap',
  };

  const thProduct: React.CSSProperties = {
    background:   t.tableHead,
    borderBottom: `1px solid ${t.borderCard}`,
    borderRight:  `1px solid ${t.border}`,
    padding:      '5px 4px',
    fontSize:     10,
    fontWeight:   600,
    color:        t.textSub,
    textAlign:    'center',
    maxWidth:     88,
    lineHeight:   1.3,
    position:     'sticky',
    top:          30,
    zIndex:       3,
    whiteSpace:   'normal',
  };

  const thRowLabel: React.CSSProperties = {
    minWidth:    190,
    position:    'sticky',
    left:        0,
    zIndex:      4,
    background:  t.tableHead,
    borderRight: `1px solid ${t.borderCard}`,
    padding:     '6px 12px',
    textAlign:   'left',
    top:         0,
  };

  const tdRowLabel = (type: 'regional' | 'area' | 'field'): React.CSSProperties => ({
    position:      'sticky',
    left:          0,
    zIndex:        1,
    background:    type === 'regional' ? t.tableHead : t.cardbg,
    borderRight:   `1px solid ${t.borderCard}`,
    borderBottom:  `1px solid ${t.border}`,
    padding:
      type === 'field'    ? '3px 10px 3px 32px' :
      type === 'area'     ? '5px 10px 5px 16px'  :
                            '5px 12px',
    color:
      type === 'regional' ? t.text :
      type === 'area'     ? t.textSub :
                            t.textMuted,
    fontWeight:    type === 'regional' ? 700 : type === 'area' ? 600 : 400,
    fontSize:      type === 'regional' ? 11 : 11,
    fontFamily:    type === 'field' ? FONT_MONO : FONT_SANS,
    whiteSpace:    'nowrap',
    letterSpacing: type === 'field' ? '0.04em' : 'normal',
  });

  const tdEmpty: React.CSSProperties = {
    borderBottom: `1px solid ${t.border}`,
    borderRight:  `1px solid ${t.border}`,
    background:   t.tableHead,
    padding:      '4px 8px',
  };

  const tdValue = (hasValue: boolean, colorKey: 'blue' | 'green' | 'yellow' | 'gray' | 'red'): React.CSSProperties => {
    const c = getFieldColor(colorKey);
    return {
      borderBottom: `1px solid ${t.border}`,
      borderRight:  `1px solid ${t.border}`,
      padding:      '3px 10px',
      textAlign:    'right',
      color:        hasValue ? c.text : t.textFaint,
      fontFamily:   hasValue ? FONT_MONO : FONT_SANS,
      fontWeight:   hasValue ? 600 : 400,
      fontSize:     11,
      whiteSpace:   'nowrap',
      minWidth:     72,
    };
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ padding: '3rem', textAlign: 'center', color: t.textMuted, fontFamily: FONT_MONO, fontSize: 12 }}>
      Memuat data harga...
    </div>
  );

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: t.red.text, fontFamily: FONT_MONO, fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <span>Gagal memuat: {error}</span>
      <button onClick={fetchData} style={{ ...selectStyle, padding: '6px 14px', borderColor: t.red.border, color: t.red.text, background: t.red.bg }}>
         Coba lagi
      </button>
    </div>
  );

  if (!data) return null;

  const totalArea    = [...new Set(data.prices.map(r => r.area_id))].length;
  const activeFieldDefs = ALL_PRICE_FIELDS.filter(f => activeFields.includes(f.key));

  return (
    <div style={{ width: '100%', fontFamily: FONT_SANS, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', border: `1px solid ${t.borderCard}`, borderRadius: 7, background: t.cardbg, boxShadow: t.shadowCard, position: 'sticky', top: 0, zIndex: 10 }}>

        {/* Factory */}
        <select value={filterFactory} onChange={e => setFilterFactory(e.target.value)} style={selectStyle}>
          <option value="">Pabrik</option>
          {factories.map(f => (
            <option key={f} value={f}>{f.replace('PT. ', '').replace('PR. ', '')}</option>
          ))}
        </select>

        {/* Category */}
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={selectStyle}>
          <option value="">Kategori</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Produk */}
        <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)} style={selectStyle}>
          <option value="">Produk</option>
          {colProducts.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Regional */}
        <select value={filterRegional} onChange={e => setFilterRegional(e.target.value)} style={selectStyle}>
          <option value="">Regional</option>
          {data.regionals.map(r => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Agent Type */}
        <select value={filterAgentType} onChange={e => setFilterAgentType(e.target.value)} style={selectStyle}>
          <option value="">Tipe Agen</option>
          {data.agentTypes.map(a => (
            <option key={a} value={a}>
              {a.charAt(0).toUpperCase() + a.slice(1)}
            </option>
          ))}
        </select>

        {/* Separator */}
        <div style={{ width: 1, height: 20, background: t.borderInput, margin: '0 2px' }}/>

        {/* Field toggles */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {ALL_PRICE_FIELDS.map(({ key, label, colorKey }) => (
            <button key={key} onClick={() => toggleField(key)} style={fieldBtnStyle(activeFields.includes(key), colorKey)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table wrapper ──────────────────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', minWidth: '100%', fontSize: 11, fontFamily: FONT_SANS }}>
          <thead>
            {/* Row 1: Factory */}
            <tr>
              <th style={{ ...thBase, ...thRowLabel, zIndex: 5, fontSize: 9, letterSpacing: '0.1em' }}>
                AREA &amp; AGEN
              </th>
              {factoryGroups.map(({ factory, products }) => (
                <th
                  key={factory}
                  colSpan={products.length}
                  style={{ ...thBase, borderLeft: `4px solid ${t.borderCard}` }}
                >
                  {factory.replace('PT. ', '').replace('PR. ', '')}
                </th>
              ))}
            </tr>
            {/* Row 2: Product name */}
            <tr>
              <th style={{ ...thProduct, ...thRowLabel, top: 30, zIndex: 5, borderBottom: `1px solid ${t.border}` }}/>
              {colProducts.map((p, i) => {
                const isFirst = i === 0 || colProducts[i - 1].factory !== p.factory;
                return (
                  <th
                    key={p.id}
                    style={{ ...thProduct, borderLeft: isFirst ? `4px solid ${t.borderCard}` : undefined }}
                  >
                    {p.name}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {[...regionalGroups.entries()].map(([regional, areas]) => (
              <React.Fragment key={`reg_${regional}`}>
                {/* Regional row */}
                <tr>
                  <td style={tdRowLabel('regional')}>{regional}</td>
                  {colProducts.map(p => <td key={p.id} style={tdEmpty}/>)}
                </tr>

                {areas.map(area => (
                  <React.Fragment key={`area_${area.area_id}`}>
                    {/* Area row */}
                    <tr>
                      <td style={tdRowLabel('area')}>
                        {area.area_name && area.area_name !== area.city_name && (
                          <span style={{ fontSize: 10, color: t.text, fontFamily: FONT_MONO, marginLeft: 6 }}>
                            {area.area_name}
                          </span>
                        )}
                        <span style={agentBadgeStyle(area.agent_type)}>
                          {area.agent_type}
                        </span>
                      </td>
                      {colProducts.map(p => (
                        <td key={p.id} style={{ ...tdEmpty, background: 'transparent' }}/>
                      ))}
                    </tr>

                    {/* Field rows */}
                    {activeFieldDefs.map(({ key, label, colorKey }) => (
                      <tr key={`${area.area_id}_${key}`}>
                        <td style={tdRowLabel('field')}>{label}</td>
                        {colProducts.map(p => {
                          const row = priceMap.get(`${p.id}_${area.area_id}`);
                          const val = row ? fmt(row[key]) : '';
                          return (
                            <td key={p.id} style={tdValue(!!val, colorKey)}>
                              {val || '·'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}

            {regionalGroups.size === 0 && (
              <tr>
                <td
                  colSpan={colProducts.length + 1}
                  style={{ padding: '2rem', textAlign: 'center', color: t.textMuted, fontFamily: FONT_MONO, fontSize: 11 }}
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