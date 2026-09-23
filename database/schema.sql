-- Rudras Farm Fresh - MySQL Database Schema
-- PHP 8+ / MySQL 8.0+

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS rudras_farm_fresh
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE rudras_farm_fresh;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  mobile VARCHAR(20) DEFAULT NULL,
  push_token VARCHAR(512) DEFAULT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_mobile (mobile),
  KEY idx_users_role (role)
) ENGINE=InnoDB;

-- ============================================================
-- OTP VERIFICATIONS
-- ============================================================
CREATE TABLE otp_verifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_otp_email (email),
  KEY idx_otp_expires (expires_at)
) ENGINE=InnoDB;

-- ============================================================
-- BANNERS
-- ============================================================
CREATE TABLE banners (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_banners_active (is_active, sort_order)
) ENGINE=InnoDB;

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(500) DEFAULT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'other',
  price DECIMAL(10, 2) NOT NULL,
  offer_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  coupon_active TINYINT(1) NOT NULL DEFAULT 0,
  coupon_code VARCHAR(5) DEFAULT NULL,
  coupon_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
  price_after_offer DECIMAL(10, 2) DEFAULT NULL,
  quantity DECIMAL(5, 2) NOT NULL DEFAULT 1.00 COMMENT 'Liters',
  quantity_unit VARCHAR(2) NOT NULL DEFAULT 'L',
  monthly_subscription TINYINT(1) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 100,
  active_status TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_products_category (category),
  KEY idx_products_active (active_status),
  KEY idx_products_name (name)
) ENGINE=InnoDB;

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_categories_slug (slug),
  UNIQUE KEY uk_categories_name (name)
) ENGINE=InnoDB;

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  payment_status ENUM('pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  order_status ENUM('pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_orders_number (order_number),
  KEY idx_orders_user (user_id),
  KEY idx_orders_status (order_status),
  KEY idx_orders_created (created_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  quantity DECIMAL(5, 2) NOT NULL DEFAULT 1.00 COMMENT 'Liters per day',
  total_days INT NOT NULL DEFAULT 30,
  remaining_days INT NOT NULL DEFAULT 30,
  price_per_day DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status ENUM('active', 'paused', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
  carried_forward_days INT NOT NULL DEFAULT 0 COMMENT 'Days carried from previous subscription',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_subscriptions_user (user_id),
  KEY idx_subscriptions_status (status),
  KEY idx_subscriptions_dates (start_date, end_date),
  CONSTRAINT fk_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DELIVERY PAUSES
-- ============================================================
CREATE TABLE delivery_pauses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subscription_id INT UNSIGNED NOT NULL,
  pause_date DATE NOT NULL,
  reason VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_pause_sub_date (subscription_id, pause_date),
  KEY idx_delivery_pauses_date (pause_date),
  CONSTRAINT fk_delivery_pauses_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DELIVERY LOGS
-- ============================================================
CREATE TABLE delivery_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  subscription_id INT UNSIGNED NOT NULL,
  delivery_date DATE NOT NULL,
  quantity DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
  status ENUM('scheduled', 'delivered', 'skipped', 'paused') NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_delivery_logs_user (user_id),
  KEY idx_delivery_logs_subscription (subscription_id),
  KEY idx_delivery_logs_date (delivery_date),
  UNIQUE KEY uk_delivery_log (subscription_id, delivery_date),
  CONSTRAINT fk_delivery_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_delivery_logs_subscription FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED DEFAULT NULL COMMENT 'NULL = broadcast to all',
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type ENUM('order', 'subscription', 'delivery', 'promo', 'general') NOT NULL DEFAULT 'general',
  reference_id INT UNSIGNED DEFAULT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  sent_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notifications_user (user_id),
  KEY idx_notifications_type (type),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- CMS PAGES
-- ============================================================
CREATE TABLE cms_pages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cms_slug (slug)
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO cms_pages (slug, title, content) VALUES
('privacy_policy', 'Privacy Policy', '<h2>Privacy Policy</h2><p>Rudras Farm Fresh respects your privacy. We collect only the information necessary to provide our milk subscription and product delivery services.</p>'),
('terms_conditions', 'Terms & Conditions', '<h2>Terms & Conditions</h2><p>By using Rudras Farm Fresh services, you agree to our subscription terms, delivery policies, and payment conditions.</p>');

INSERT INTO categories (name, slug) VALUES
('Milk', 'milk'),
('Curd', 'curd'),
('Ghee', 'ghee'),
('Other', 'other');

INSERT INTO products (name, description, image, category, price, stock, active_status) VALUES
('Fresh Cow Milk', 'Pure farm-fresh cow milk, delivered daily.', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', 'milk', 60.00, 100, 1),
('Homemade Curd', 'Thick, creamy curd made from fresh milk.', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400', 'curd', 80.00, 50, 1),
('Pure Cow Ghee', 'Traditional bilona ghee, 500g jar.', 'https://images.unsplash.com/photo-1606914501446-0c0fb0d4a2c5?w=400', 'ghee', 650.00, 30, 1),
('Farm Fresh Paneer', 'Soft paneer made daily.', 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', 'other', 120.00, 40, 1);

INSERT INTO banners (title, image, sort_order, is_active) VALUES
('Fresh Milk Daily', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800', 1, 1),
('Pure Farm Products', 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800', 2, 1),
('Subscribe & Save', 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800', 3, 1);

INSERT INTO users (name, email, role) VALUES
('Rudra', 'admin@rudrasfarmfresh.com', 'admin');

SET FOREIGN_KEY_CHECKS = 1;
