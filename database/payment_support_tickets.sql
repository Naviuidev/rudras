USE rudras_farm_fresh;

CREATE TABLE IF NOT EXISTS payment_support_tickets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_number VARCHAR(20) NOT NULL,
  user_id INT UNSIGNED DEFAULT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  service_type VARCHAR(120) NOT NULL,
  message TEXT NOT NULL,
  admin_reply TEXT NULL,
  admin_replied_at TIMESTAMP NULL DEFAULT NULL,
  status ENUM('pending', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'pending',
  closed_by ENUM('user', 'admin') NULL DEFAULT NULL,
  closed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_payment_support_ticket_number (ticket_number),
  KEY idx_payment_support_user (user_id),
  KEY idx_payment_support_email (email),
  CONSTRAINT fk_payment_support_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
