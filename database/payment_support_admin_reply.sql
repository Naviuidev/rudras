USE rudras_farm_fresh;

ALTER TABLE payment_support_tickets
  ADD COLUMN admin_reply TEXT NULL AFTER message,
  ADD COLUMN admin_replied_at TIMESTAMP NULL DEFAULT NULL AFTER admin_reply;
