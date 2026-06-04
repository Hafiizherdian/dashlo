-- ============================================================
-- DDL: product_price_periods
-- Jalankan sekali di database logistik_db
-- sudo psql -U postgres -d logistik_db -f database/migrations/add_periode.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS product_price_periods (
  period_id        SERIAL PRIMARY KEY,
  product_price_id INTEGER NOT NULL
    REFERENCES product_prices(id) ON DELETE CASCADE,
  product_id       INTEGER NOT NULL,
  area_id          INTEGER NOT NULL,
  valid_from       DATE NOT NULL,
  dbp              NUMERIC(14,2) NOT NULL DEFAULT 0,
  wbp              NUMERIC(14,2) NOT NULL DEFAULT 0,
  rbp              NUMERIC(14,2) NOT NULL DEFAULT 0,
  cbp              NUMERIC(14,2) NOT NULL DEFAULT 0,
  pita_cukai       NUMERIC(14,2) NOT NULL DEFAULT 0,
  hje              NUMERIC(14,2) NOT NULL DEFAULT 0,
  tarif            NUMERIC(14,2) NOT NULL DEFAULT 0,
  hpp              NUMERIC(14,2) NOT NULL DEFAULT 0,
  -- 'active'     : valid_from <= hari ini DAN ini adalah periode terbaru yg berlaku
  -- 'scheduled'  : valid_from > hari ini (belum berlaku)
  -- 'superseded' : sudah digantikan periode baru yg lebih baru
  status           VARCHAR(12) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('active', 'scheduled', 'superseded')),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by       VARCHAR(64),

  CONSTRAINT uq_price_period UNIQUE (product_id, area_id, valid_from)
);

CREATE INDEX IF NOT EXISTS idx_ppp_product_area ON product_price_periods(product_id, area_id);
CREATE INDEX IF NOT EXISTS idx_ppp_valid_from   ON product_price_periods(valid_from);
CREATE INDEX IF NOT EXISTS idx_ppp_status       ON product_price_periods(status);

-- ── View: harga aktif saat ini per produk+area ──────────────
-- Ambil periode valid_from terbaru yg sudah <= CURRENT_DATE
CREATE OR REPLACE VIEW active_price_periods AS
SELECT DISTINCT ON (product_id, area_id)
  period_id, product_price_id, product_id, area_id,
  valid_from, dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, hpp,
  status, created_at, created_by
FROM  product_price_periods
WHERE valid_from <= CURRENT_DATE
ORDER BY product_id, area_id, valid_from DESC;