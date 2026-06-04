-- ============================================================
--  MIGRATION: Restruktur area_overrides + product_prices
--  
--  Perubahan:
--  1. area_overrides: PK pindah dari city_name → area_id (SERIAL)
--     city_name tidak lagi unik (1 regional = banyak agen/kota)
--  2. product_prices: FK ganti dari city_name → area_id (integer)
--
--  JALANKAN DALAM SATU TRANSAKSI — kalau ada error, otomatis rollback
--  sudo psql -U postgres -d logistik_db -f database/migrations/refaktor_area.sql
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
--  STEP 1: Backup data lama (opsional tapi disarankan)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS _bak_area_overrides AS
    SELECT * FROM area_overrides;

CREATE TABLE IF NOT EXISTS _bak_product_prices AS
    SELECT * FROM product_prices;

-- ────────────────────────────────────────────────────────────
--  STEP 2: Restruktur area_overrides
-- ────────────────────────────────────────────────────────────

-- 2a. Drop FK dari product_prices yang menunjuk ke city_name
ALTER TABLE product_prices
    DROP CONSTRAINT IF EXISTS product_prices_city_name_fkey;

-- 2b. Drop PK lama (city_name)
ALTER TABLE area_overrides
    DROP CONSTRAINT IF EXISTS area_overrides_pkey;

-- 2c. Rename area_id varchar → area_slug (simpan slug, tidak dihapus)
ALTER TABLE area_overrides
    RENAME COLUMN area_id TO area_slug;

-- 2d. Tambah kolom area_id SERIAL sebagai PK baru
ALTER TABLE area_overrides
    ADD COLUMN area_id SERIAL;

-- 2e. Jadikan area_id sebagai PK
ALTER TABLE area_overrides
    ADD CONSTRAINT area_overrides_pkey PRIMARY KEY (area_id);

-- 2f. city_name + agent_type masih bisa duplikat (1 kota bisa banyak agen berbeda)
--     Tapi kombinasi (city_name + area_slug) tetap unik
ALTER TABLE area_overrides
    ADD CONSTRAINT uq_area_slug UNIQUE (area_slug);

-- 2g. Update index
DROP   INDEX IF EXISTS idx_area_overrides_area_id;
CREATE INDEX IF NOT EXISTS idx_area_overrides_city_name  ON area_overrides (city_name);
CREATE INDEX IF NOT EXISTS idx_area_overrides_regional   ON area_overrides (regional);
CREATE INDEX IF NOT EXISTS idx_area_overrides_agent_type ON area_overrides (agent_type);

-- ────────────────────────────────────────────────────────────
--  STEP 3: Restruktur product_prices
-- ────────────────────────────────────────────────────────────

-- 3a. Tambah kolom area_id (integer) di product_prices
ALTER TABLE product_prices
    ADD COLUMN area_id INTEGER;

-- 3b. Isi area_id dari join dengan area_overrides via city_name lama
--     (works karena data lama city_name masih unik)
UPDATE product_prices pp
SET    area_id = ao.area_id
FROM   area_overrides ao
WHERE  ao.city_name = pp.city_name
  AND  ao.agent_type = pp.agent_type;

-- 3c. Cek apakah ada baris yang gagal di-update (area_id masih NULL)
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM product_prices WHERE area_id IS NULL;
    
    IF null_count > 0 THEN
        RAISE EXCEPTION 'Ada % baris product_prices yang area_id-nya NULL — cek data area_overrides', null_count;
    END IF;
END $$;

-- 3d. Set area_id NOT NULL dan tambah FK
ALTER TABLE product_prices
    ALTER COLUMN area_id SET NOT NULL;

ALTER TABLE product_prices
    ADD CONSTRAINT fk_pp_area_id
    FOREIGN KEY (area_id) REFERENCES area_overrides(area_id) ON DELETE CASCADE;

-- 3e. Drop kolom city_name & agent_type lama dari product_prices
--     (info ini sekarang diambil via JOIN ke area_overrides)
ALTER TABLE product_prices
    DROP COLUMN IF EXISTS city_name;

ALTER TABLE product_prices
    DROP COLUMN IF EXISTS agent_type;

-- 3f. Update UNIQUE constraint di product_prices
ALTER TABLE product_prices
    DROP CONSTRAINT IF EXISTS uq_product_price;

ALTER TABLE product_prices
    ADD CONSTRAINT uq_product_price UNIQUE (product_id, area_id);

-- 3g. Index baru
DROP   INDEX IF EXISTS idx_pp_city_name;
DROP   INDEX IF EXISTS idx_pp_agent_type;
CREATE INDEX IF NOT EXISTS idx_pp_area_id ON product_prices (area_id);

-- ────────────────────────────────────────────────────────────
--  STEP 4: Verifikasi hasil
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '=== HASIL MIGRATION ===';
    RAISE NOTICE 'area_overrides: % baris', (SELECT COUNT(*) FROM area_overrides);
    RAISE NOTICE 'product_prices: % baris', (SELECT COUNT(*) FROM product_prices);
    RAISE NOTICE 'product_prices dengan area_id NULL: %', (SELECT COUNT(*) FROM product_prices WHERE area_id IS NULL);
END $$;

COMMIT;

-- ────────────────────────────────────────────────────────────
--  SETELAH MIGRATION BERHASIL — hapus tabel backup (opsional)
-- ────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS _bak_area_overrides;
-- DROP TABLE IF EXISTS _bak_product_prices;


-- ============================================================
--  STRUKTUR AKHIR
-- ============================================================
--
--  area_overrides
--  ├── area_id     SERIAL PRIMARY KEY          ← baru
--  ├── area_slug   VARCHAR(100) UNIQUE NOT NULL ← rename dari area_id varchar
--  ├── city_name   VARCHAR(255) NOT NULL        ← tidak lagi PK/UNIQUE
--  ├── area_name   VARCHAR(255) NOT NULL
--  ├── agent_type  VARCHAR(20)  NOT NULL
--  ├── regional    VARCHAR(100)
--  ├── created_at  TIMESTAMP
--  └── updated_at  TIMESTAMP
--
--  product_prices
--  ├── id          SERIAL PRIMARY KEY
--  ├── product_id  INTEGER FK → products(id)
--  ├── area_id     INTEGER FK → area_overrides(area_id)  ← baru
--  ├── dbp, wbp, rbp, cbp, pita_cukai, hje, tarif
--  ├── UNIQUE (product_id, area_id)
--  ├── created_at
--  └── updated_at
-- ============================================================