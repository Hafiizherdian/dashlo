-- 1. Pastikan data 'system' aman atau hapus jika itu hanya data uji coba
-- (Relasi akan gagal jika ada nilai di product_prices yang tidak ada di tabel app_users)

-- sudo psql -U postgres -d logistik_db -c "DELETE FROM public.app_users WHERE username = 'system';"
-- sudo psql -U postgres -d logistik_db -f database/migrations/update_history_harga.sql

-- 2. Tambahkan Foreign Key dari product_prices ke app_users (berdasarkan username)
ALTER TABLE public.product_prices
    ADD CONSTRAINT product_prices_updated_by_fkey FOREIGN KEY (updated_by)
    REFERENCES public.app_users (username)
    ON UPDATE CASCADE
    ON DELETE SET NULL;

-- 3. Tambahkan Foreign Key dari product_price_histories ke app_users (berdasarkan username)
ALTER TABLE public.product_price_histories
    ADD CONSTRAINT pph_changed_by_fkey FOREIGN KEY (changed_by)
    REFERENCES public.app_users (username)
    ON UPDATE CASCADE
    ON DELETE SET NULL;