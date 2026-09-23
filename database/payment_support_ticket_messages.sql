USE rudras_farm_fresh;

CREATE TABLE IF NOT EXISTS payment_support_ticket_messages (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT UNSIGNED NOT NULL,
  sender_type ENUM('user', 'admin') NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_support_msg_ticket (ticket_id),
  CONSTRAINT fk_support_msg_ticket FOREIGN KEY (ticket_id) REFERENCES payment_support_tickets(id) ON DELETE CASCADE
) ENGINE=InnoDB;

ALTER TABLE payment_support_tickets
  MODIFY COLUMN status ENUM('pending', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'pending',
  ADD COLUMN closed_by ENUM('user', 'admin') NULL DEFAULT NULL AFTER status,
  ADD COLUMN closed_at TIMESTAMP NULL DEFAULT NULL AFTER closed_by;

INSERT INTO payment_support_ticket_messages (ticket_id, sender_type, message, created_at)
SELECT id, 'user', message, created_at
FROM payment_support_tickets
WHERE NOT EXISTS (
  SELECT 1 FROM payment_support_ticket_messages m WHERE m.ticket_id = payment_support_tickets.id AND m.sender_type = 'user'
);

INSERT INTO payment_support_ticket_messages (ticket_id, sender_type, message, created_at)
SELECT id, 'admin', admin_reply, COALESCE(admin_replied_at, updated_at)
FROM payment_support_tickets
WHERE admin_reply IS NOT NULL AND admin_reply != ''
  AND NOT EXISTS (
    SELECT 1 FROM payment_support_ticket_messages m
    WHERE m.ticket_id = payment_support_tickets.id AND m.sender_type = 'admin'
  );
