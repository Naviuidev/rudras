-- Service locations (Google Maps links for delivery areas)
USE rudras_farm_fresh;

CREATE TABLE IF NOT EXISTS service_locations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL DEFAULT '',
  map_url VARCHAR(500) NOT NULL,
  lat DECIMAL(10, 7) NULL,
  lng DECIMAL(10, 7) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_service_locations_map_url (map_url)
) ENGINE=InnoDB;
