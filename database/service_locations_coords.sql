-- Add coordinates for service area checks
USE rudras_farm_fresh;

ALTER TABLE service_locations
  ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 7) NULL AFTER map_url,
  ADD COLUMN IF NOT EXISTS lng DECIMAL(10, 7) NULL AFTER lat;
