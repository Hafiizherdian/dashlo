ALTER TABLE public.area_overrides ADD COLUMN IF NOT EXISTS regional VARCHAR(100);

-- Migration: Create area_overrides table
-- Description: Table for mapping city overrides to specific area IDs and names
-- sudo psql -U postgres -d logistik_db -f database/migrations/add_area_overrides.sql

-- 1. Buat Tabel area_overrides jika belum ada
CREATE TABLE IF NOT EXISTS public.area_overrides (
    city_name   VARCHAR(255) PRIMARY KEY, -- Otomatis menjadi NOT NULL dan btree index
    area_id     VARCHAR(100) NOT NULL,
    area_name   VARCHAR(255) NOT NULL,
    agen_type   VARCHAR(20)  NOT NULL,
    regional    VARCHAR(100),   
    created_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Buat Fungsi Trigger untuk Otomatisasi update_updated_at (jika belum ada di database)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Pasang Trigger ke Tabel area_overrides
-- Drop trigger terlebih dahulu jika sudah ada untuk menghindari duplikasi saat script dijalankan ulang
DROP TRIGGER IF EXISTS trg_area_overrides_updated_at ON public.area_overrides;

CREATE TRIGGER trg_area_overrides_updated_at
    BEFORE UPDATE ON public.area_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Tambahkan Indeks Tambahan untuk Optimasi Query Dashboard
-- Indeks pada area_id sangat penting karena query filter dashboard Anda akan sering melakukan WHERE area_id = '...'
CREATE INDEX IF NOT EXISTS idx_area_overrides_area_id ON public.area_overrides(area_id);

-- 5. Dokumentasi Kolom (Opsional, sangat baik untuk manajemen database jangka panjang)
COMMENT ON TABLE public.area_overrides IS 'Tabel pemetaan nama kota/kabupaten ke area ID tertentu untuk override data sales';
COMMENT ON COLUMN public.area_overrides.agent_type IS 'Jenis: agen atau perwakilan (dari kolom JENIS di excel)';
COMMENT ON COLUMN public.area_overrides.city_name IS 'Nama kota/kabupaten dari data excel (contoh: KAB. BANYUWANGI) sebagai Primary Key';
COMMENT ON COLUMN public.area_overrides.area_id IS 'ID Area target yang digunakan aplikasi (contoh: banyuwangi, jember)';
COMMENT ON COLUMN public.area_overrides.regional IS 'Nama regional yang terkait dengan area';