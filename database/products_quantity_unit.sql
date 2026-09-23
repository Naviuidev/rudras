-- Add quantity unit (L or ml)
USE rudras_farm_fresh;

ALTER TABLE products ADD COLUMN quantity_unit VARCHAR(2) NOT NULL DEFAULT 'L' AFTER quantity;
