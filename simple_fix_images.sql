-- SIMPLIFIED FIX: Focus ONLY on products table to avoid permission errors
-- This will make the images appear immediately.

-- 1. Ensure the column exists in your products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. POPULATE IMAGES (External Unsplash URLs)
-- This does not require storage permissions because these are links to the internet.
UPDATE products
SET image_url = CASE
    -- Burgers
    WHEN name ILIKE '%burger%' OR name ILIKE '%hamburguer%' OR name ILIKE '%smash%' OR name ILIKE '%x-bacon%' OR name ILIKE '%x-salada%' OR category ILIKE '%burger%' OR category ILIKE '%lanche%' 
        THEN 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?fm=jpg&w=800&fit=max'
    
    -- Pizzas
    WHEN name ILIKE '%pizza%' OR name ILIKE '%calabresa%' OR name ILIKE '%mussarela%' OR category ILIKE '%pizza%' 
        THEN 'https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=jpg&w=800&fit=max'
    
    -- Drinks
    WHEN name ILIKE '%bebida%' OR name ILIKE '%refrigerante%' OR name ILIKE '%coca%' OR name ILIKE '%suco%' OR name ILIKE '%agua%' OR category ILIKE '%bebida%' 
        THEN 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?fm=jpg&w=800&fit=max'
    
    -- Fries
    WHEN name ILIKE '%batata%' OR name ILIKE '%frita%' OR name ILIKE '%porção%' 
        THEN 'https://images.unsplash.com/photo-1573080496982-b9418e624310?fm=jpg&w=800&fit=max'
    
    -- Desserts
    WHEN name ILIKE '%sobremesa%' OR name ILIKE '%doce%' OR name ILIKE '%pudim%' OR name ILIKE '%bolo%' 
        THEN 'https://images.unsplash.com/photo-1551024601-bec78aea704b?fm=jpg&w=800&fit=max'
    
    -- Default
    ELSE 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?fm=jpg&w=800&fit=max'
END
WHERE image_url IS NULL OR image_url = '';
