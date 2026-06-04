-- sudo psql -U postgres -d logistik_db -f database/migrations/add_hpp.sql
-- Tambah kolom hpp di product_prices
ALTER TABLE product_prices 
ADD COLUMN hpp numeric(14,2) NOT NULL DEFAULT 0;

-- Tambah kolom hpp di product_price_histories
ALTER TABLE product_price_histories 
ADD COLUMN hpp numeric(14,2);

-- Update trigger function agar hpp ikut tercatat di history
CREATE OR REPLACE FUNCTION public.log_product_price_changes()
RETURNS trigger AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO product_price_histories (
            product_price_id, product_id, area_id, 
            dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, hpp, action, changed_by, changed_at
        ) VALUES (
            NEW.id, NEW.product_id, NEW.area_id, 
            NEW.dbp, NEW.wbp, NEW.rbp, NEW.cbp, NEW.pita_cukai, NEW.hje, NEW.tarif, NEW.hpp,
            'INSERT', COALESCE(NEW.updated_by, 'system'), CURRENT_TIMESTAMP
        );
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO product_price_histories (
            product_price_id, product_id, area_id, 
            dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, hpp, action, changed_by, changed_at
        ) VALUES (
            NEW.id, NEW.product_id, NEW.area_id, 
            NEW.dbp, NEW.wbp, NEW.rbp, NEW.cbp, NEW.pita_cukai, NEW.hje, NEW.tarif, NEW.hpp,
            'UPDATE', COALESCE(NEW.updated_by, 'system'), CURRENT_TIMESTAMP
        );
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO product_price_histories (
            product_price_id, product_id, area_id, 
            dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, hpp, action, changed_by, changed_at
        ) VALUES (
            OLD.id, OLD.product_id, OLD.area_id, 
            OLD.dbp, OLD.wbp, OLD.rbp, OLD.cbp, OLD.pita_cukai, OLD.hje, OLD.tarif, OLD.hpp,
            'DELETE', COALESCE(OLD.updated_by, 'system'), CURRENT_TIMESTAMP
        );
    END IF;
    RETURN NEW;
END;
$function$ LANGUAGE plpgsql;