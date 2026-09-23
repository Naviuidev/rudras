-- Categories table (run if upgrading existing database)
USE rudras_farm_fresh;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_categories_slug (slug),
  UNIQUE KEY uk_categories_name (name)
) ENGINE=InnoDB;

INSERT IGNORE INTO categories (name, slug) VALUES
('Milk', 'milk'),
('Curd', 'curd'),
('Ghee', 'ghee'),
('Other', 'other');
