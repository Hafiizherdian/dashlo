-- ===========================================================================
-- MIGRATION: Create products table & SEED DATA
-- Description: Membuat tabel master produk dan melakukan seeding data otomatis
-- sudo psql -U postgres -d logistik_db -f database/migrations/add_product.sql
-- ===========================================================================

-- 1. BUAT TABEL PRODUCTS (Jika Belum Ada)
CREATE TABLE IF NOT EXISTS public.products (
    id             SERIAL PRIMARY KEY,
    name           VARCHAR(100) UNIQUE NOT NULL,
    category       VARCHAR(10)  NOT NULL,  -- SKMR, SKMM, SKT, SPM
    factory        VARCHAR(100) NOT NULL,
    stick_per_pack INT          NOT NULL,
    pack_per_slop  INT          NOT NULL DEFAULT 10,
    slop_per_bal   INT          NOT NULL,
    bal_per_dos    INT          NOT NULL,
    created_at     TIMESTAMP             DEFAULT NOW()
);

-- Buat indeks btree pada kolom category untuk optimasi query dashboard
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

-- 2. SEED DATA PRODUK (Menghindari duplikasi dengan ON CONFLICT DO UPDATE)
INSERT INTO public.products 
    (name, category, factory, stick_per_pack, pack_per_slop, slop_per_bal, bal_per_dos)
VALUES
    -- ── SKMR (Sigaret Kretek Mesin Regular) ─────────────────────────────────
    ('CAKRA KRESNA 12 F', 'SKMR', 'PT. CAKRA GUNA CIPTA', 12, 10, 20, 4),
    ('CAKRA KRESNA 16 F', 'SKMR', 'PT. CAKRA GUNA CIPTA', 16, 10, 10, 6),
    ('CAKRA LUXURY 12 F', 'SKMR', 'PT. KARYA TAJINAN PRIMA', 12, 10, 20, 4),
    ('CAKRA ON 20 FILTER', 'SKMR', 'PT. CAKRA GUNA CIPTA', 20, 10, 10, 6),
    ('CAKRAM 12 F', 'SKMR', 'PT. KARYA TAJINAN PRIMA', 12, 10, 20, 4),
    ('CAKRAM GOLD 12 F', 'SKMR', 'PT. KARYA TAJINAN PRIMA', 12, 10, 20, 4),
    ('CAKRAM SPESIAL 12 F', 'SKMR', 'PT. KARYA TAJINAN PRIMA', 12, 10, 20, 4),
    ('FIM BOLD 12 F', 'SKMR', 'PT. RAGAM RASA RAYA', 12, 10, 20, 4),
    ('FIM BOLD 20 F', 'SKMR', 'PT. RAGAM RASA RAYA', 20, 10, 10, 6),
    ('FIM TEH SEGAR 12 F', 'SKMR', 'PT. RAGAM RASA RAYA', 12, 10, 20, 4),
    ('IDE BOLD 20 F', 'SKMR', 'PT. RAGAM RASA RAYA', 20, 10, 10, 6),
    ('INA 16 F', 'SKMR', 'PT. KARYA TIMUR PRIMA', 16, 10, 10, 6),
    ('INA BOLD 12 F', 'SKMR', 'PT. KARYA TIMUR PRIMA', 12, 10, 20, 4),
    ('INA BOLD 16 F', 'SKMR', 'PT. KARYA TIMUR PRIMA', 16, 10, 10, 6),
    ('INA BOLD 20 F', 'SKMR', 'PT. KARYA TIMUR PRIMA', 20, 10, 10, 6),
    ('ON BOLD 12 F', 'SKMR', 'PT. CAKRA GUNA CIPTA', 12, 10, 20, 4),
    ('ON BOLD 20 F', 'SKMR', 'PT. CAKRA GUNA CIPTA', 20, 10, 10, 6),
    ('ON CALL 12 F', 'SKMR', 'PT. CAKRA GUNA CIPTA', 12, 10, 20, 4),
    ('ON CLIK 20', 'SKMR', 'PT. CAKRA GUNA CIPTA', 20, 10, 10, 6),
    ('ON LINE 16 F', 'SKMR', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('ON LINE BOLD 16 F', 'SKMR', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('ON LINE BOLD 20 F', 'SKMR', 'PT. KARYA TAJINAN PRIMA', 20, 10, 10, 6),
    ('ON LINE COOL MINT 16 F', 'SKMR', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('ON POWER 12 F', 'SKMR', 'PT. CAKRA GUNA CIPTA', 12, 10, 20, 4),
    ('PATIK 20 F', 'SKMR', 'PT. KARYA TIMUR PRIMA', 20, 10, 10, 6),
    ('POTENZA 12 F', 'SKMR', 'PT. KARYA TIMUR PRIMA', 12, 10, 20, 4),
    ('POTENZA 16 F', 'SKMR', 'PT. KARYA TIMUR PRIMA', 16, 10, 10, 6),
    ('POTENZA 20 F', 'SKMR', 'PT. KARYA TIMUR PRIMA', 20, 10, 10, 6),
    ('POTENZA BLUEBERRY 16 F', 'SKMR', 'PT. KARYA TIMUR PRIMA', 16, 10, 10, 6),
    ('POTENZA BOLD 12 F', 'SKMR', 'PT. KARYA TIMUR PRIMA', 12, 10, 20, 4),
    ('POTENZA BOLD 16 F', 'SKMR', 'PT. KARYA TIMUR PRIMA', 16, 10, 10, 6),
    ('POTENZA BOLD 20 F', 'SKMR', 'PT. KARYA TIMUR PRIMA', 20, 10, 10, 6),
    ('POTENZO 16 F', 'SKMR', 'PT. RAGAM RASA RAYA', 16, 10, 10, 6),
    ('ULTIMATE 20 F', 'SKMR', 'PT. KARYA TAJINAN PRIMA', 20, 10, 10, 6),

    -- ── SKMM (Sigaret Kretek Mesin Mild) ───────────────────────────────────
    ('CAKRA ROYAL MILD 16 F', 'SKMM', 'PT. CAKRA GUNA CIPTA', 16, 10, 10, 6),
    ('INA MILD 20 F', 'SKMM', 'PT. KARYA TIMUR PRIMA', 20, 10, 10, 6),
    ('MARCH MILD 16 F', 'SKMM', 'PT. KARYA TIMUR PRIMA', 16, 10, 10, 6),
    ('N-30 BLACK MILD 16 F', 'SKMM', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('N-30 MENTHOL 16 F', 'SKMM', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('N-30 MILD 16 F', 'SKMM', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('N-30 MILD 20 F', 'SKMM', 'PT. KARYA TAJINAN PRIMA', 20, 10, 10, 6),
    ('N-30 MILD SR 16 FILTER', 'SKMM', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('ON 20 F', 'SKMM', 'PT. CAKRA GUNA CIPTA', 20, 10, 10, 6),
    ('NAVAJO 16 F', 'SKMM', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('ON LINE ES TELER 16 F', 'SKMM', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('ON LINE FRESH GRAPE 16 F', 'SKMM', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('ON LINE FRESH GRAPE 20 F', 'SKMM', 'PT. KARYA TAJINAN PRIMA', 20, 10, 10, 6),
    ('ON LINE PINEAPPLE 16 F', 'SKMM', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('POTENZA BLUEBERRY 20 F', 'SKMM', 'PT. KARYA TIMUR PRIMA', 20, 10, 10, 6),
    ('POTENZA MILD 16 F', 'SKMM', 'PT. KARYA TIMUR PRIMA', 16, 10, 10, 6),
    ('POTENZA MILD 20 F', 'SKMM', 'PT. KARYA TIMUR PRIMA', 20, 10, 10, 6),

    -- ── SKT (Sigaret Kretek Tangan) ─────────────────────────────────────────
    ('CAKRA PRIMA 16 K', 'SKT', 'PT. CAKRA GUNA CIPTA', 16, 10, 10, 6),
    ('CAKRA PRIMA 10 K', 'SKT', 'PT. CAKRA GUNA CIPTA', 10, 10, 20, 4),
    ('CAKRA PRIMA 12 K', 'SKT', 'PT. CAKRA GUNA CIPTA', 12, 10, 20, 4),
    ('CAKRA PRIMA 12 K HARDPACK', 'SKT', 'PT. CAKRA GUNA CIPTA', 12, 10, 20, 4),
    ('CAKRA PRIMA 16 K HARDPACK', 'SKT', 'PT. CAKRA GUNA CIPTA', 16, 10, 10, 6),
    ('CAKRAM PRIMA 10 KRETEK', 'SKT', 'PT. KARYA TAJINAN PRIMA', 10, 10, 20, 4),
    ('CAKRAM PRIMA 12 K', 'SKT', 'PT. KARYA TAJINAN PRIMA', 12, 10, 20, 4),
    ('CAKRAM SUPRA 12 K', 'SKT', 'PT. KARYA TAJINAN PRIMA', 12, 10, 20, 4),
    ('INTRA LINE 16 K', 'SKT', 'PR. INTRACO', 16, 10, 10, 6),
    ('JAGOAN SEJATI 12 K', 'SKT', 'PR. GANESHA PUTRA PRIMA', 12, 10, 20, 4),
    ('JAGOAN SEJATI 16 K', 'SKT', 'PR. GANESHA PUTRA PRIMA', 16, 10, 10, 6),
    ('JALA 12 K', 'SKT', 'PT. RAGAM RASA RAYA', 12, 10, 20, 4),
    ('MAHAYANA 12 K', 'SKT', 'PT. KARYA TIMUR PRIMA', 12, 10, 20, 4),
    ('MAHAYANA 16 K', 'SKT', 'PT. KARYA TIMUR PRIMA', 16, 10, 10, 6),
    ('ON 12 K', 'SKT', 'PT. CAKRA GUNA CIPTA', 12, 10, 20, 4),
    ('ON BOLD 12 K', 'SKT', 'PT. CAKRA GUNA CIPTA', 12, 10, 20, 4),
    ('ON CALL 16 K (HTM)', 'SKT', 'PT. RAGAM RASA RAYA', 16, 10, 10, 6),
    ('ON CALL BERRY 12 K', 'SKT', 'PT. RAGAM RASA RAYA', 12, 10, 20, 4),
    ('ON JASMINE 12 K', 'SKT', 'PT. CAKRA GUNA CIPTA', 12, 10, 20, 4),
    ('ON LINE 12 K', 'SKT', 'PT. KARYA TAJINAN PRIMA', 12, 10, 20, 4),
    ('ON LINE 16 K', 'SKT', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('ON LINE JAHE 16 K', 'SKT', 'PT. KARYA TAJINAN PRIMA', 16, 10, 10, 6),
    ('ON POWER 16 K', 'SKT', 'PT. CAKRA GUNA CIPTA', 16, 10, 10, 6),
    ('POTENZA 16 K', 'SKT', 'PT. KARYA TIMUR PRIMA', 16, 10, 10, 6),
    ('PRIYAYI SEJATI 12 K', 'SKT', 'PR. INTRACO', 12, 10, 20, 4),
    ('PRIYAYI SEJATI 16 K', 'SKT', 'PR. INTRACO', 16, 10, 10, 6),
    ('RAGA 12 K', 'SKT', 'PT. RAGAM RASA RAYA', 12, 10, 20, 4),
    ('TALI ROSO SEJATI 12 K', 'SKT', 'PR. GANESHA PUTRA PRIMA', 12, 10, 20, 4),
    ('TALI ROSO SEJATI 16 K', 'SKT', 'PR. GANESHA PUTRA PRIMA', 16, 10, 10, 6),

    -- ── SPM (Sigaret Putih Mesin) ─────────────────────────────────────────
    ('ON WHITE 20 F', 'SPM', 'PT. CAKRA GUNA CIPTA', 20, 10, 10, 6),
    ('SHUANG LONG 20 F', 'SPM', 'PT. CAKRA GUNA CIPTA', 20, 10, 10, 6)
ON CONFLICT (name) DO UPDATE SET
    category       = EXCLUDED.category,
    factory        = EXCLUDED.factory,
    stick_per_pack = EXCLUDED.stick_per_pack,
    pack_per_slop  = EXCLUDED.pack_per_slop,
    slop_per_bal   = EXCLUDED.slop_per_bal,
    bal_per_dos    = EXCLUDED.bal_per_dos;

-- 3. KONTROL HASIL INSERTION
SELECT category, COUNT(*) as total_products 
FROM public.products 
GROUP BY category 
ORDER BY total_products DESC;