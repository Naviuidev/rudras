-- Admin panel feature extensions
USE rudras_farm_fresh;

-- Users: customer profile fields
ALTER TABLE users ADD COLUMN area VARCHAR(100) DEFAULT NULL AFTER mobile;
ALTER TABLE users ADD COLUMN address TEXT DEFAULT NULL AFTER area;
ALTER TABLE users ADD COLUMN wallet_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER address;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at;

-- Categories: image & display order
ALTER TABLE categories ADD COLUMN image VARCHAR(500) DEFAULT NULL AFTER slug;
ALTER TABLE categories ADD COLUMN display_order INT NOT NULL DEFAULT 0 AFTER image;

-- Products: SKU, sale price, low stock threshold
ALTER TABLE products ADD COLUMN sku VARCHAR(50) DEFAULT NULL AFTER name;
ALTER TABLE products ADD COLUMN sale_price DECIMAL(10, 2) DEFAULT NULL AFTER price;
ALTER TABLE products ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 10 AFTER stock;

-- Banners: marketing fields
ALTER TABLE banners ADD COLUMN description TEXT DEFAULT NULL AFTER title;
ALTER TABLE banners ADD COLUMN redirect_link VARCHAR(500) DEFAULT NULL AFTER description;
ALTER TABLE banners ADD COLUMN banner_type ENUM('home', 'promotional', 'subscription') NOT NULL DEFAULT 'home' AFTER redirect_link;

-- Subscriptions: product link & frequency
ALTER TABLE subscriptions ADD COLUMN product_id INT UNSIGNED DEFAULT NULL AFTER user_id;
ALTER TABLE subscriptions ADD COLUMN frequency ENUM('daily', 'alternate_day', 'weekly', 'custom') NOT NULL DEFAULT 'daily' AFTER quantity;

-- Skip request workflow
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

-- Carry forward history
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

-- Payments / transactions
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

-- Inventory stock movements
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

-- Audit logs
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

-- Structured FAQs
CREATE TABLE IF NOT EXISTS faqs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(500) NOT NULL,
  answer TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- CMS seed for About Us & FAQs page
INSERT IGNORE INTO cms_pages (slug, title, content) VALUES
('about_us', 'About Us', '<h2>About Rudras Farm Fresh</h2><p>We deliver pure farm-fresh milk and dairy products daily.</p>'),
('faqs', 'FAQs', '<h2>Frequently Asked Questions</h2><p>See structured FAQs in admin panel.</p>');

INSERT IGNORE INTO faqs (question, answer, display_order) VALUES
('How does milk subscription work?', 'Choose your daily quantity and subscribe for 30 days. We deliver fresh milk every morning.', 1),
('Can I skip a delivery?', 'Yes. Request a skip from the app. Approved skips add carry-forward days to your balance.', 2),
('What payment methods are accepted?', 'UPI, PhonePe, Razorpay, and cash on delivery are supported.', 3);
