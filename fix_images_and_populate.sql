-- 1. Ensure column exists (Safe to re-run)
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Create bucket (Safe to re-run)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Fix Policies (Safe to re-run - IDEMPOTENT)
DO $$
BEGIN
    -- Only create logic if policies don't exist, OR drop and recreate. 
    -- Dropping is safer to ensure correctness.
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;
    
    -- Also ensure products table policies allow updates (assuming standard RLS)
    -- If you have a specific policy for products, ensure it allows UPDATEs for the owner
END $$;

-- Re-apply Storage Policies
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'product-images' );

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING ( bucket_id = 'product-images' AND auth.role() = 'authenticated' );

-- 4. POPULATE DATA DIRECTLY (The Fix)
-- This updates ONLY products that don't have images yet.
UPDATE products
SET image_url = CASE
    -- Burgers
    WHEN name ILIKE '%burger%' OR name ILIKE '%hamburguer%' OR name ILIKE '%smash%' OR name ILIKE '%x-%' OR category ILIKE '%burger%' OR category ILIKE '%lanche%' 
        THEN 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?fm=jpg&w=800&fit=max'
    
    -- Pizzas
    WHEN name ILIKE '%pizza%' OR name ILIKE '%calabresa%' OR name ILIKE '%mussarela%' OR category ILIKE '%pizza%' 
        THEN 'https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=jpg&w=800&fit=max'
    
    -- Drinks
    WHEN name ILIKE '%bebida%' OR name ILIKE '%refrigerante%' OR name ILIKE '%coca%' OR name ILIKE '%suco%' OR name ILIKE '%agua%' OR name ILIKE '%água%' OR category ILIKE '%bebida%' 
        THEN 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?fm=jpg&w=800&fit=max'
    
    -- Fries / Portions
    WHEN name ILIKE '%batata%' OR name ILIKE '%frita%' OR name ILIKE '%porção%' OR category ILIKE '%porção%' OR category ILIKE '%acompanhamento%' 
        THEN 'https://images.unsplash.com/photo-1573080496982-b9418e624310?fm=jpg&w=800&fit=max'
    
    -- Desserts
    WHEN name ILIKE '%sobremesa%' OR name ILIKE '%doce%' OR name ILIKE '%pudim%' OR name ILIKE '%chocolate%' OR category ILIKE '%sobremesa%' 
        THEN 'https://images.unsplash.com/photo-1551024601-bec78aea704b?fm=jpg&w=800&fit=max'
    
    -- Salads / Healthy
    WHEN name ILIKE '%salada%' OR name ILIKE '%natural%' OR name ILIKE '%fitness%' OR category ILIKE '%salada%' 
        THEN 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?fm=jpg&w=800&fit=max'
    
    -- Default / Others
    ELSE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?fm=jpg&w=800&fit=max'
END
WHERE image_url IS NULL OR image_url = '';
