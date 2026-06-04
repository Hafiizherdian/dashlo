-- sudo psql -U postgres -d logistik_db -f database/migrations/history_harga_produk.sql
-- =========================================================================
-- 1. MEMBUAT TABEL RIWAYAT PERUBAHAN HARGA (AUDIT LOG)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.product_price_histories (
    history_id SERIAL PRIMARY KEY,
    product_price_id INT NOT NULL, -- Merujuk ke 'id' asli di tabel product_prices
    product_id INT NOT NULL,
    area_id INT NOT NULL,
    dbp NUMERIC(14,2),
    wbp NUMERIC(14,2),
    rbp NUMERIC(14,2),
    cbp NUMERIC(14,2),
    pita_cukai NUMERIC(14,2),
    hje NUMERIC(14,2),
    tarif NUMERIC(14,2),
    action VARCHAR(10) NOT NULL, -- Berisi 'UPDATE' atau 'DELETE'
    changed_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(100) DEFAULT CURRENT_USER
);

-- Membuat index agar pencarian riwayat data di kemudian hari tetap cepat
CREATE INDEX IF NOT EXISTS idx_pph_product_price_id ON public.product_price_histories(product_price_id);
CREATE INDEX IF NOT EXISTS idx_pph_product_area ON public.product_price_histories(product_id, area_id);


-- =========================================================================
-- 2. MEMBUAT FUNGSI TRIGGER UNTUK MENYALIN DATA SEBELUM DIUBAH/DIHAPUS
-- =========================================================================
CREATE OR REPLACE FUNCTION log_product_prices_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Jika data di-update, simpan data LAMA (OLD) ke tabel history
    IF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.product_price_histories (
            product_price_id, product_id, area_id, dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, action
        )
        VALUES (
            OLD.id, OLD.product_id, OLD.area_id, OLD.dbp, OLD.wbp, OLD.rbp, OLD.cbp, OLD.pita_cukai, OLD.hje, OLD.tarif, 'UPDATE'
        );
        RETURN NEW;
        
    -- Jika data di-delete, simpan data TERAKHIR (OLD) sebelum hilang
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.product_price_histories (
            product_price_id, product_id, area_id, dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, action
        )
        VALUES (
            OLD.id, OLD.product_id, OLD.area_id, OLD.dbp, OLD.wbp, OLD.rbp, OLD.cbp, OLD.pita_cukai, OLD.hje, OLD.tarif, 'DELETE'
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


-- =========================================================================
-- 3. MEMASANG TRIGGER PADA TABEL UTAMA (product_prices)
-- =========================================================================
-- Bagian ini memastikan trigger dihapus dulu jika sebelumnya sudah ada, untuk menghindari duplikasi
DROP TRIGGER IF EXISTS trg_log_product_prices ON public.product_prices;

CREATE TRIGGER trg_log_product_prices
BEFORE UPDATE OR DELETE ON public.product_prices
FOR EACH ROW
EXECUTE FUNCTION log_product_prices_changes();