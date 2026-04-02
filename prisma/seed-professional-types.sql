-- Seed Professional Types
INSERT INTO "ProfessionalType" (id, name, description, "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'Bespoke Tailor', 'Specializes in custom-fit apparel and alterations. Primarily sells custom products with optional fitting services.', true, NOW(), NOW()),
  (gen_random_uuid(), 'Fashion Designer', 'Designs and sells original brand collections. Focuses on ready-to-wear products and pre-orders.', true, NOW(), NOW()),
  (gen_random_uuid(), 'Boutique Owner', 'Retailer selling a curated mix of finished apparel from various brands.', true, NOW(), NOW()),
  (gen_random_uuid(), 'Personal Stylist', 'Offers curated style packs and accessory sets as products, with styling consultations as a plus.', true, NOW(), NOW()),
  (gen_random_uuid(), 'Fabric & Lace Vendor', 'Supplier of raw materials, textiles, and lace bundles for designers and consumers.', true, NOW(), NOW()),
  (gen_random_uuid(), 'Model', 'Showcases featured looks and lifestyle kits. primarily selling curated outfit selections.', true, NOW(), NOW()),
  (gen_random_uuid(), 'Fashion Photographer', 'Sells digital content packs, presets, and offers professional shoot sessions as services.', true, NOW(), NOW())
ON CONFLICT (name) DO UPDATE 
SET description = EXCLUDED.description, "updatedAt" = NOW();
