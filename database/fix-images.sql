-- Run this if you already imported the old schema with broken /uploads/ image paths
USE rudras_farm_fresh;

UPDATE products SET image = 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400' WHERE name = 'Fresh Cow Milk';
UPDATE products SET image = 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400' WHERE name = 'Homemade Curd';
UPDATE products SET image = 'https://images.unsplash.com/photo-1606914501446-0c0fb0d4a2c5?w=400' WHERE name = 'Pure Cow Ghee';
UPDATE products SET image = 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400' WHERE name = 'Farm Fresh Paneer';

UPDATE banners SET image = 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=800' WHERE title = 'Fresh Milk Daily';
UPDATE banners SET image = 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=800' WHERE title = 'Pure Farm Products';
UPDATE banners SET image = 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=800' WHERE title = 'Subscribe & Save';
