-- Add quantity (liters) and monthly subscription fields
USE rudras_farm_fresh;

ALTER TABLE products ADD COLUMN quantity DECIMAL(5, 2) NOT NULL DEFAULT 1.00 COMMENT 'Liters' AFTER price_after_offer;
ALTER TABLE products ADD COLUMN monthly_subscription TINYINT(1) NOT NULL DEFAULT 0 AFTER quantity;
