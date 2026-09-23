-- Add product offer & coupon fields (MySQL compatible)
USE rudras_farm_fresh;

ALTER TABLE products ADD COLUMN offer_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0 AFTER price;
ALTER TABLE products ADD COLUMN coupon_active TINYINT(1) NOT NULL DEFAULT 0 AFTER offer_percentage;
ALTER TABLE products ADD COLUMN coupon_code VARCHAR(5) DEFAULT NULL AFTER coupon_active;
ALTER TABLE products ADD COLUMN coupon_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0 AFTER coupon_code;
ALTER TABLE products ADD COLUMN price_after_offer DECIMAL(10, 2) DEFAULT NULL AFTER coupon_percentage;
