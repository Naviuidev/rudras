-- Idempotent deploy script for Rudras Farm Fresh admin features
-- Safe to re-run: skips existing columns/tables/data

USE rudras_farm_fresh;

SET @db = DATABASE();

-- Helper: add column if missing
DROP PROCEDURE IF EXISTS add_column_if_missing;
DELIMITER //
CREATE PROCEDURE add_column_if_missing(IN p_table VARCHAR(64), IN p_column VARCHAR(64), IN p_definition TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END //
DELIMITER ;

CALL add_column_if_missing('users', 'area', "VARCHAR(100) DEFAULT NULL AFTER mobile");
CALL add_column_if_missing('users', 'address', "TEXT DEFAULT NULL AFTER area");
CALL add_column_if_missing('users', 'wallet_balance', "DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER address");
CALL add_column_if_missing('users', 'deleted_at', "TIMESTAMP NULL DEFAULT NULL AFTER updated_at");
CALL add_column_if_missing('users', 'password_hash', "VARCHAR(255) DEFAULT NULL AFTER email");

CALL add_column_if_missing('categories', 'image', "VARCHAR(500) DEFAULT NULL AFTER slug");
CALL add_column_if_missing('categories', 'display_order', "INT NOT NULL DEFAULT 0 AFTER image");

-- Migrate products.category from ENUM to VARCHAR (supports admin-created category slugs)
DROP PROCEDURE IF EXISTS migrate_product_category_column;
DELIMITER //
CREATE PROCEDURE migrate_product_category_column()
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'category'
      AND COLUMN_TYPE LIKE 'enum%'
  ) THEN
    ALTER TABLE products MODIFY COLUMN category VARCHAR(100) NOT NULL DEFAULT 'other';
  END IF;
END //
DELIMITER ;
CALL migrate_product_category_column();
DROP PROCEDURE IF EXISTS migrate_product_category_column;

CALL add_column_if_missing('products', 'sku', "VARCHAR(50) DEFAULT NULL AFTER name");
CALL add_column_if_missing('products', 'sale_price', "DECIMAL(10,2) DEFAULT NULL AFTER price");
CALL add_column_if_missing('products', 'offer_percentage', "DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER price");
CALL add_column_if_missing('products', 'coupon_active', "TINYINT(1) NOT NULL DEFAULT 0 AFTER offer_percentage");
CALL add_column_if_missing('products', 'coupon_code', "VARCHAR(5) DEFAULT NULL AFTER coupon_active");
CALL add_column_if_missing('products', 'coupon_percentage', "DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER coupon_code");
CALL add_column_if_missing('products', 'price_after_offer', "DECIMAL(10,2) DEFAULT NULL AFTER coupon_percentage");
CALL add_column_if_missing('products', 'quantity', "DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT 'Liters' AFTER price_after_offer");
CALL add_column_if_missing('products', 'quantity_unit', "VARCHAR(2) NOT NULL DEFAULT 'L' AFTER quantity");
CALL add_column_if_missing('products', 'monthly_subscription', "TINYINT(1) NOT NULL DEFAULT 0 AFTER quantity_unit");
CALL add_column_if_missing('products', 'low_stock_threshold', "INT NOT NULL DEFAULT 10 AFTER stock");

CALL add_column_if_missing('banners', 'description', "TEXT DEFAULT NULL AFTER title");
CALL add_column_if_missing('banners', 'redirect_link', "VARCHAR(500) DEFAULT NULL AFTER description");
CALL add_column_if_missing('banners', 'banner_type', "ENUM('home','promotional','subscription') NOT NULL DEFAULT 'home' AFTER redirect_link");

CALL add_column_if_missing('subscriptions', 'product_id', "INT UNSIGNED DEFAULT NULL AFTER user_id");
CALL add_column_if_missing('subscriptions', 'frequency', "ENUM('daily','alternate_day','weekly','custom') NOT NULL DEFAULT 'daily' AFTER quantity");

DROP PROCEDURE IF EXISTS add_column_if_missing;

-- Tables
CREATE TABLE IF NOT EXISTS skip_requests (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  subscription_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED DEFAULT NULL,
  skip_date DATE NOT NULL,
  reason VARCHAR(255) DEFAULT NULL,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_skip_status (status),
  KEY idx_skip_date (skip_date),
  CONSTRAINT fk_skip_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_skip_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS carry_forward_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  subscription_id INT UNSIGNED NOT NULL,
  skipped_days INT NOT NULL DEFAULT 0,
  added_days INT NOT NULL DEFAULT 0,
  balance_days INT NOT NULL DEFAULT 0,
  note VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_carry_user (user_id),
  CONSTRAINT fk_carry_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_carry_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transaction_id VARCHAR(64) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('upi', 'phonepe', 'razorpay', 'cash') NOT NULL DEFAULT 'upi',
  payment_status ENUM('paid', 'pending', 'failed') NOT NULL DEFAULT 'pending',
  reference_type VARCHAR(50) DEFAULT NULL,
  reference_id INT UNSIGNED DEFAULT NULL,
  payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_transaction_id (transaction_id),
  KEY idx_payments_user (user_id),
  KEY idx_payments_status (payment_status),
  CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_movements (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL,
  change_type ENUM('added', 'reduced', 'correction') NOT NULL,
  quantity INT NOT NULL,
  notes VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_stock_product (product_id),
  CONSTRAINT fk_stock_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id INT UNSIGNED DEFAULT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INT UNSIGNED DEFAULT NULL,
  details TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS faqs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Seed CMS pages
INSERT IGNORE INTO cms_pages (slug, title, content) VALUES
('about_us', 'About Us', '<h2>About Rudras Farm Fresh</h2><p>We deliver pure farm-fresh milk and dairy products daily.</p>'),
('faqs', 'FAQs', '<h2>Frequently Asked Questions</h2><p>See structured FAQs in admin panel.</p>'),
('privacy_policy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>Rudras Farm Fresh respects your privacy.</p>'),
('terms_conditions', 'Terms & Conditions', '<h2>Terms & Conditions</h2><p>By using our services you agree to our terms.</p>');

INSERT IGNORE INTO faqs (question, answer, display_order) VALUES
('How does milk subscription work?', 'Choose your daily quantity and subscribe for 30 days. We deliver fresh milk every morning.', 1),
('Can I skip a delivery?', 'Yes. Request a skip from the app. Approved skips add carry-forward days to your balance.', 2),
('What payment methods are accepted?', 'UPI, PhonePe, Razorpay, and cash on delivery are supported.', 3);

INSERT IGNORE INTO categories (name, slug, display_order) VALUES
('Milk', 'milk', 1),
('Curd', 'curd', 2),
('Ghee & Oils', 'ghee', 3),
('Paneer', 'paneer', 4),
('Butter', 'butter', 5),
('Eggs', 'eggs', 6),
('Groceries', 'other', 7);
