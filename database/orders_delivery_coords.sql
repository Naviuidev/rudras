-- Store GPS coordinates on orders for driver navigation links
ALTER TABLE orders
  ADD COLUMN delivery_lat DECIMAL(10, 7) DEFAULT NULL AFTER delivery_address,
  ADD COLUMN delivery_lng DECIMAL(10, 7) DEFAULT NULL AFTER delivery_lat;
