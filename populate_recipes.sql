-- ============================================
-- RECEITAS AUTOMÁTICAS DOS PRODUTOS
-- ============================================
-- Execute este script no Supabase SQL Editor

-- ============================================
-- 1. PICOLÉ DE MORANGO
-- ============================================
INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit)
VALUES 
    ('cf545a32-ff62-4f69-b5c6-e069d4fad41e', 'e3580c37-4ea7-446b-9b2d-641adb5fc9e8', 1, 'un');

-- ============================================
-- 2. CLASSIC BACON
-- ============================================
INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit)
VALUES 
    -- Pão Brioche
    ('ee7757e5-885b-46bc-a0a0-6a37ac995656', '3cf55686-4bb1-48e2-995e-de82fe571f60', 1, 'un'),
    -- Blend Carne (hambúrguer 150g)
    ('ee7757e5-885b-46bc-a0a0-6a37ac995656', 'e14ca8be-a5fb-4097-a4c4-8ab9b7ba8218', 150, 'g'),
    -- Bacon Fatiado
    ('ee7757e5-885b-46bc-a0a0-6a37ac995656', '7ca695ba-586c-4b5c-8769-d5f5b095e2be', 50, 'g'),
    -- Queijo Cheddar
    ('ee7757e5-885b-46bc-a0a0-6a37ac995656', '6afd5f84-7c93-4bfe-9b17-cbda06091fde', 50, 'g'),
    -- Alface
    ('ee7757e5-885b-46bc-a0a0-6a37ac995656', 'bc4bec96-6e7c-4333-ad28-84dab2a32007', 30, 'g'),
    -- Tomate
    ('ee7757e5-885b-46bc-a0a0-6a37ac995656', 'd3cad70a-a38d-4bdc-877f-1f97847bc4a4', 40, 'g'),
    -- Maionese
    ('ee7757e5-885b-46bc-a0a0-6a37ac995656', '6f3dd1dc-1cbb-4710-9194-df4244da0952', 30, 'g');

-- ============================================
-- 3. SMASH SIMPLES
-- ============================================
INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit)
VALUES 
    -- Pão Brioche
    ('e5ce9270-9d26-481a-a5b3-f29e5ed158ba', '3cf55686-4bb1-48e2-995e-de82fe571f60', 1, 'un'),
    -- Blend Carne (burger 120g)
    ('e5ce9270-9d26-481a-a5b3-f29e5ed158ba', 'e14ca8be-a5fb-4097-a4c4-8ab9b7ba8218', 120, 'g'),
    -- Queijo Cheddar
    ('e5ce9270-9d26-481a-a5b3-f29e5ed158ba', '6afd5f84-7c93-4bfe-9b17-cbda06091fde', 40, 'g'),
    -- Cebola Roxa
    ('e5ce9270-9d26-481a-a5b3-f29e5ed158ba', '3652e2b5-0cd1-4dcf-ae78-b79e57bb08b6', 20, 'g'),
    -- Maionese
    ('e5ce9270-9d26-481a-a5b3-f29e5ed158ba', '6f3dd1dc-1cbb-4710-9194-df4244da0952', 20, 'g');

-- ============================================
-- 4. COCA-COLA
-- ============================================
INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit)
VALUES 
    ('956901b9-1a61-4317-9416-7f96a583a869', 'b6c4dfa1-f305-470a-8c73-c68c2a3452ba', 1, 'un');

-- ============================================
-- 5. FRITAS INDIVIDUAL
-- ============================================
INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit)
VALUES 
    -- Batata Palito
    ('559b2d78-abb7-4b2f-99ea-dde0b7ed9de8', '406aacdd-1a63-4329-bbfc-2356fca958ea', 200, 'g'),
    -- Óleo (para fritura)
    ('559b2d78-abb7-4b2f-99ea-dde0b7ed9de8', 'bfaf6f7f-ebd9-4a05-9d3d-e0dcd1bec86e', 50, 'ml');

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Ver todas as receitas criadas
SELECT 
    p.name as produto,
    i.name as ingrediente,
    pr.quantity_needed,
    pr.unit
FROM product_recipes pr
JOIN products p ON p.id = pr.product_id
JOIN ingredients i ON i.id = pr.ingredient_id
ORDER BY p.name, i.name;
