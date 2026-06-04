-- ============================================================
--  DDL: harga_produk.sql
--  Description: Tabel harga produk per area_id dengan audit log user
--  Relasi kokoh ke products dan area_overrides menggunakan area_id
--  Execute: sudo psql -U postgres -d logistik_db -f database/migrations/harga_produk.sql
-- ============================================================

-- Bersihkan tabel lama agar perubahan skema teraplikasi sempurna
DROP TABLE IF EXISTS product_prices CASCADE;

CREATE TABLE product_prices (
    id            SERIAL PRIMARY KEY,

    -- Relasi ke tabel products
    product_id    INTEGER NOT NULL 
                    REFERENCES products(id) ON DELETE CASCADE,

    -- Relasi tunggal kokoh ke tabel area_overrides
    area_id       INTEGER NOT NULL 
                    REFERENCES area_overrides(area_id) ON DELETE CASCADE,

    -- Kolom harga (dalam Rupiah, presisi 2 desimal)
    dbp           NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Dasar Bea Pita
    wbp           NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Wajib Bayar Pita
    rbp           NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Restitusi Bea Pita
    cbp           NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Cukai Bayar Pita
    pita_cukai    NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Nilai Pita Cukai
    hje           NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Harga Jual Eceran
    tarif         NUMERIC(14,2) NOT NULL DEFAULT 0,  -- Tarif Cukai (%)

    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Kolom jembatan untuk menangkap user session dari web app ke trigger
    updated_by    VARCHAR(64),

    -- CONSTRAINT: Satu harga unik per kombinasi produk dan area spesifik
    CONSTRAINT uq_product_price UNIQUE (product_id, area_id)
);

-- Index untuk akselerasi query performa tinggi
CREATE INDEX idx_pp_product_id ON product_prices (product_id);
CREATE INDEX idx_pp_area_id    ON product_prices (area_id);

-- 1. Trigger Auto-update updated_at kolom utama
CREATE TRIGGER trg_product_prices_updated_at
    BEFORE UPDATE ON product_prices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
--  FUNGSI & TRIGGER AUDIT LOG (HISTORY) BERBASIS area_id
--  Merekam histori perubahan harga beserta aktor pelakunya
-- ============================================================

CREATE OR REPLACE FUNCTION log_product_price_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO product_price_histories (
            product_price_id, product_id, area_id, 
            dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, action, changed_by, changed_at
        ) VALUES (
            NEW.id, NEW.product_id, NEW.area_id, 
            NEW.dbp, NEW.wbp, NEW.rbp, NEW.cbp, NEW.pita_cukai, NEW.hje, NEW.tarif, 
            'INSERT', COALESCE(NEW.updated_by, 'system'), CURRENT_TIMESTAMP
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO product_price_histories (
            product_price_id, product_id, area_id, 
            dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, action, changed_by, changed_at
        ) VALUES (
            NEW.id, NEW.product_id, NEW.area_id, 
            NEW.dbp, NEW.wbp, NEW.rbp, NEW.cbp, NEW.pita_cukai, NEW.hje, NEW.tarif, 
            'UPDATE', COALESCE(NEW.updated_by, 'system'), CURRENT_TIMESTAMP
        );
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO product_price_histories (
            product_price_id, product_id, area_id, 
            dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, action, changed_by, changed_at
        ) VALUES (
            OLD.id, OLD.product_id, OLD.area_id, 
            OLD.dbp, OLD.wbp, OLD.rbp, OLD.cbp, OLD.pita_cukai, OLD.hje, OLD.tarif, 
            'DELETE', COALESCE(OLD.updated_by, 'system'), CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasangkan ke tabel product_prices
DROP TRIGGER IF EXISTS trg_log_price_changes ON product_prices;
CREATE TRIGGER trg_log_price_changes
    AFTER INSERT OR UPDATE OR DELETE ON product_prices
    FOR EACH ROW EXECUTE FUNCTION log_product_price_changes();