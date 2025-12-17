-- ============================================
-- CARDÁPIO COMPLETO PARA TESTES
-- ============================================
-- Este script adiciona:
-- - Novos ingredientes
-- - Novos produtos variados
-- - Receitas completas
-- - Grupos de complementos

-- SEU USER_ID (não mude isso!)
-- e16ea1bf-a743-4e3e-b940-edab51ce16d2

-- ============================================
-- PARTE 1: ADICIONAR NOVOS INGREDIENTES
-- ============================================

INSERT INTO ingredients (user_id, name, purchase_unit, purchase_quantity, purchase_price, yield_percent, current_stock, min_stock)
VALUES
    -- Para Hot Dog
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Pão de Hot Dog', 'un', 20, 15, 100, 40, 10),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Salsicha', 'kg', 3, 35, 100, 5, 1),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Milho Verde', 'kg', 2, 12, 100, 3, 0.5),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Ervilha', 'kg', 2, 10, 100, 2.5, 0.5),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Batata Palha', 'kg', 1, 25, 100, 2, 0.5),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Molho Vinagrete', 'kg', 2, 15, 100, 3, 0.5),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Catchup', 'kg', 2, 18, 100, 2.5, 0.5),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Mostarda', 'kg', 2, 16, 100, 2.5, 0.5),
    
    -- Para Açaí
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Polpa de Açaí', 'kg', 10, 85, 100, 15, 5),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Banana', 'kg', 5, 8, 90, 8, 2),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Morango', 'kg', 2, 15, 95, 3, 1),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Granola', 'kg', 3, 22, 100, 4, 1),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Leite em Pó', 'kg', 2, 35, 100, 3, 0.5),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Mel', 'kg', 1, 45, 100, 1.5, 0.3),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Amendoim', 'kg', 2, 18, 100, 2.5, 0.5),
    
    -- Para Sorvete
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Sorvete Napolitano', 'l', 5, 40, 100, 8, 3),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Calda de Chocolate', 'kg', 2, 25, 100, 2.5, 0.5),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Chantilly', 'l', 3, 30, 100, 4, 1),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Cereja', 'kg', 1, 35, 100, 1.5, 0.3),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Granulado Colorido', 'kg', 1, 20, 100, 1.5, 0.3),
    
    -- Para Milkshake
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Leite Integral', 'l', 10, 45, 100, 15, 5),
    
    -- Para Pizza
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Massa de Pizza', 'un', 10, 35, 100, 20, 10),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Molho de Tomate', 'kg', 3, 18, 100, 4, 1),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Mussarela', 'kg', 3, 45, 100, 5, 1),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Orégano', 'kg', 0.5, 25, 100, 0.8, 0.1),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Calabresa', 'kg', 2, 38, 100, 3, 0.5),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Azeitona', 'kg', 2, 28, 100, 2.5, 0.5),
    
    -- Para Tapioca
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Goma de Tapioca', 'kg', 5, 15, 100, 7, 2),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Presunto', 'kg', 2, 32, 100, 3, 0.5),
    
    -- Bebidas
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Suco de Laranja Natural', 'l', 5, 20, 100, 7, 2),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Água Mineral', 'un', 24, 18, 100, 48, 12);

-- ============================================
-- PARTE 2: CRIAR NOVOS PRODUTOS
-- ============================================

INSERT INTO products (user_id, name, description, category, current_price, is_available)
VALUES
    -- Hot Dogs
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Hot Dog Simples', '🌭 Salsicha, molhos e batata palha', 'Lanches', 12.90, true),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Hot Dog Completo', '🌭 Salsicha, milho, ervilha, vinagrete, batata palha e molhos', 'Lanches', 15.90, true),
    
    -- Açaís
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Açaí 300ml', '🍇 Açaí puro batido com banana', 'Sobremesas', 12.00, true),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Açaí 500ml Completo', '🍇 Açaí com banana, morango, granola e mel', 'Sobremesas', 18.00, true),
    
    -- Sorvetes
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Sundae', '🍨 Sorvete, calda, chantilly e cereja', 'Sobremesas', 14.00, true),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Milkshake', '🥤 Sorvete batido com leite', 'Bebidas', 16.00, true),
    
    -- Pizzas
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Pizza Mussarela', '🍕 Molho, mussarela e orégano', 'Lanches', 35.00, true),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Pizza Calabresa', '🍕 Molho, mussarela, calabresa, cebola e orégano', 'Lanches', 40.00, true),
    
    -- Tapiocas
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Tapioca Queijo', '🥞 Tapioca com queijo', 'Lanches', 8.00, true),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Tapioca Presunto e Queijo', '🥞 Tapioca com presunto e queijo', 'Lanches', 10.00, true),
    
    -- Bebidas
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Suco de Laranja', '🍊 Suco natural 300ml', 'Bebidas', 7.00, true),
    ('e16ea1bf-a743-4e3e-b940-edab51ce16d2', 'Água Mineral', '💧 Água 500ml', 'Bebidas', 3.00, true);

-- ============================================
-- PARTE 3: CRIAR RECEITAS DOS NOVOS PRODUTOS
-- ============================================

-- Buscar IDs dos ingredientes recém criados
DO $$
DECLARE
    v_user_id UUID := 'e16ea1bf-a743-4e3e-b940-edab51ce16d2';
    
    -- IDs dos ingredientes
    id_pao_hotdog UUID;
    id_salsicha UUID;
    id_milho UUID;
    id_ervilha UUID;
    id_batata_palha UUID;
    id_vinagrete UUID;
    id_catchup UUID;
    id_mostarda UUID;
    id_acai UUID;
    id_banana UUID;
    id_morango UUID;
    id_granola UUID;
    id_leite_po UUID;
    id_mel UUID;
    id_amendoim UUID;
    id_sorvete UUID;
    id_calda_choco UUID;
    id_chantilly UUID;
    id_cereja UUID;
    id_granulado UUID;
    id_leite UUID;
    id_massa_pizza UUID;
    id_molho_tomate UUID;
    id_mussarela UUID;
    id_oregano UUID;
    id_calabresa UUID;
    id_azeitona UUID;
    id_cebola UUID;
    id_goma_tapioca UUID;
    id_presunto UUID;
    id_queijo UUID;
    id_suco_laranja UUID;
    id_agua UUID;
    
    -- IDs dos produtos
    id_hotdog_simples UUID;
    id_hotdog_completo UUID;
    id_acai_300 UUID;
    id_acai_500 UUID;
    id_sundae UUID;
    id_milkshake UUID;
    id_pizza_mussarela UUID;
    id_pizza_calabresa UUID;
    id_tapioca_queijo UUID;
    id_tapioca_presunto UUID;
    id_suco UUID;
    id_agua_prod UUID;
    
BEGIN
    -- Buscar IDs dos ingredientes
    SELECT id INTO id_pao_hotdog FROM ingredients WHERE name = 'Pão de Hot Dog' AND user_id = v_user_id;
    SELECT id INTO id_salsicha FROM ingredients WHERE name = 'Salsicha' AND user_id = v_user_id;
    SELECT id INTO id_milho FROM ingredients WHERE name = 'Milho Verde' AND user_id = v_user_id;
    SELECT id INTO id_ervilha FROM ingredients WHERE name = 'Ervilha' AND user_id = v_user_id;
    SELECT id INTO id_batata_palha FROM ingredients WHERE name = 'Batata Palha' AND user_id = v_user_id;
    SELECT id INTO id_vinagrete FROM ingredients WHERE name = 'Molho Vinagrete' AND user_id = v_user_id;
    SELECT id INTO id_catchup FROM ingredients WHERE name = 'Catchup' AND user_id = v_user_id;
    SELECT id INTO id_mostarda FROM ingredients WHERE name = 'Mostarda' AND user_id = v_user_id;
    SELECT id INTO id_acai FROM ingredients WHERE name = 'Polpa de Açaí' AND user_id = v_user_id;
    SELECT id INTO id_banana FROM ingredients WHERE name = 'Banana' AND user_id = v_user_id;
    SELECT id INTO id_morango FROM ingredients WHERE name = 'Morango' AND user_id = v_user_id;
    SELECT id INTO id_granola FROM ingredients WHERE name = 'Granola' AND user_id = v_user_id;
    SELECT id INTO id_leite_po FROM ingredients WHERE name = 'Leite em Pó' AND user_id = v_user_id;
    SELECT id INTO id_mel FROM ingredients WHERE name = 'Mel' AND user_id = v_user_id;
    SELECT id INTO id_amendoim FROM ingredients WHERE name = 'Amendoim' AND user_id = v_user_id;
    SELECT id INTO id_sorvete FROM ingredients WHERE name = 'Sorvete Napolitano' AND user_id = v_user_id;
    SELECT id INTO id_calda_choco FROM ingredients WHERE name = 'Calda de Chocolate' AND user_id = v_user_id;
    SELECT id INTO id_chantilly FROM ingredients WHERE name = 'Chantilly' AND user_id = v_user_id;
    SELECT id INTO id_cereja FROM ingredients WHERE name = 'Cereja' AND user_id = v_user_id;
    SELECT id INTO id_granulado FROM ingredients WHERE name = 'Granulado Colorido' AND user_id = v_user_id;
    SELECT id INTO id_leite FROM ingredients WHERE name = 'Leite Integral' AND user_id = v_user_id;
    SELECT id INTO id_massa_pizza FROM ingredients WHERE name = 'Massa de Pizza' AND user_id = v_user_id;
    SELECT id INTO id_molho_tomate FROM ingredients WHERE name = 'Molho de Tomate' AND user_id = v_user_id;
    SELECT id INTO id_mussarela FROM ingredients WHERE name = 'Mussarela' AND user_id = v_user_id;
    SELECT id INTO id_oregano FROM ingredients WHERE name = 'Orégano' AND user_id = v_user_id;
    SELECT id INTO id_calabresa FROM ingredients WHERE name = 'Calabresa' AND user_id = v_user_id;
    SELECT id INTO id_azeitona FROM ingredients WHERE name = 'Azeitona' AND user_id = v_user_id;
    SELECT id INTO id_cebola FROM ingredients WHERE name = 'Cebola Roxa' AND user_id = v_user_id;
    SELECT id INTO id_goma_tapioca FROM ingredients WHERE name = 'Goma de Tapioca' AND user_id = v_user_id;
    SELECT id INTO id_presunto FROM ingredients WHERE name = 'Presunto' AND user_id = v_user_id;
    SELECT id INTO id_queijo FROM ingredients WHERE name = 'Queijo Cheddar Fatiado' AND user_id = v_user_id;
    SELECT id INTO id_suco_laranja FROM ingredients WHERE name = 'Suco de Laranja Natural' AND user_id = v_user_id;
    SELECT id INTO id_agua FROM ingredients WHERE name = 'Água Mineral' AND user_id = v_user_id;
    
    -- Buscar IDs dos produtos
    SELECT id INTO id_hotdog_simples FROM products WHERE name = 'Hot Dog Simples' AND user_id = v_user_id;
    SELECT id INTO id_hotdog_completo FROM products WHERE name = 'Hot Dog Completo' AND user_id = v_user_id;
    SELECT id INTO id_acai_300 FROM products WHERE name = 'Açaí 300ml' AND user_id = v_user_id;
    SELECT id INTO id_acai_500 FROM products WHERE name = 'Açaí 500ml Completo' AND user_id = v_user_id;
    SELECT id INTO id_sundae FROM products WHERE name = 'Sundae' AND user_id = v_user_id;
    SELECT id INTO id_milkshake FROM products WHERE name = 'Milkshake' AND user_id = v_user_id;
    SELECT id INTO id_pizza_mussarela FROM products WHERE name = 'Pizza Mussarela' AND user_id = v_user_id;
    SELECT id INTO id_pizza_calabresa FROM products WHERE name = 'Pizza Calabresa' AND user_id = v_user_id;
    SELECT id INTO id_tapioca_queijo FROM products WHERE name = 'Tapioca Queijo' AND user_id = v_user_id;
    SELECT id INTO id_tapioca_presunto FROM products WHERE name = 'Tapioca Presunto e Queijo' AND user_id = v_user_id;
    SELECT id INTO id_suco FROM products WHERE name = 'Suco de Laranja' AND user_id = v_user_id;
    SELECT id INTO id_agua_prod FROM products WHERE name = 'Água Mineral' AND user_id = v_user_id;
    
    -- RECEITAS DOS PRODUTOS
    
    -- Hot Dog Simples
    INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit) VALUES
        (id_hotdog_simples, id_pao_hotdog, 1, 'un'),
        (id_hotdog_simples, id_salsicha, 100, 'g'),
        (id_hotdog_simples, id_batata_palha, 20, 'g'),
        (id_hotdog_simples, id_catchup, 20, 'g'),
        (id_hotdog_simples, id_mostarda, 15, 'g');
    
    -- Hot Dog Completo
    INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit) VALUES
        (id_hotdog_completo, id_pao_hotdog, 1, 'un'),
        (id_hotdog_completo, id_salsicha, 100, 'g'),
        (id_hotdog_completo, id_milho, 30, 'g'),
        (id_hotdog_completo, id_ervilha, 30, 'g'),
        (id_hotdog_completo, id_vinagrete, 40, 'g'),
        (id_hotdog_completo, id_batata_palha, 30, 'g'),
        (id_hotdog_completo, id_catchup, 25, 'g'),
        (id_hotdog_completo, id_mostarda, 20, 'g');
    
    -- Açaí 300ml
    INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit) VALUES
        (id_acai_300, id_acai, 250, 'g'),
        (id_acai_300, id_banana, 80, 'g'),
        (id_acai_300, id_leite_po, 10, 'g');
    
    -- Açaí 500ml Completo
    INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit) VALUES
        (id_acai_500, id_acai, 400, 'g'),
        (id_acai_500, id_banana, 100, 'g'),
        (id_acai_500, id_morango, 50, 'g'),
        (id_acai_500, id_granola, 40, 'g'),
        (id_acai_500, id_mel, 20, 'g'),
        (id_acai_500, id_leite_po, 15, 'g');
    
    -- Sundae
    INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit) VALUES
        (id_sundae, id_sorvete, 200, 'ml'),
        (id_sundae, id_calda_choco, 40, 'g'),
        (id_sundae, id_chantilly, 30, 'ml'),
        (id_sundae, id_cereja, 10, 'g'),
        (id_sundae, id_granulado, 10, 'g');
    
    -- Milkshake
    INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit) VALUES
        (id_milkshake, id_sorvete, 150, 'ml'),
        (id_milkshake, id_leite, 200, 'ml'),
        (id_milkshake, id_calda_choco, 30, 'g'),
        (id_milkshake, id_chantilly, 30, 'ml');
    
    -- Pizza Mussarela
    INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit) VALUES
        (id_pizza_mussarela, id_massa_pizza, 1, 'un'),
        (id_pizza_mussarela, id_molho_tomate, 100, 'g'),
        (id_pizza_mussarela, id_mussarela, 200, 'g'),
        (id_pizza_mussarela, id_oregano, 2, 'g');
    
    -- Pizza Calabresa
    INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit) VALUES
        (id_pizza_calabresa, id_massa_pizza, 1, 'un'),
        (id_pizza_calabresa, id_molho_tomate, 100, 'g'),
        (id_pizza_calabresa, id_mussarela, 180, 'g'),
        (id_pizza_calabresa, id_calabresa, 100, 'g'),
        (id_pizza_calabresa, id_cebola, 30, 'g'),
        (id_pizza_calabresa, id_azeitona, 20, 'g'),
        (id_pizza_calabresa, id_oregano, 2, 'g');
    
    -- Tapioca Queijo
    INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit) VALUES
        (id_tapioca_queijo, id_goma_tapioca, 100, 'g'),
        (id_tapioca_queijo, id_queijo, 50, 'g');
    
    -- Tapioca Presunto e Queijo
    INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit) VALUES
        (id_tapioca_presunto, id_goma_tapioca, 100, 'g'),
        (id_tapioca_presunto, id_presunto, 40, 'g'),
        (id_tapioca_presunto, id_queijo, 50, 'g');
    
    -- Suco de Laranja
    INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit) VALUES
        (id_suco, id_suco_laranja, 300, 'ml');
    
    -- Água Mineral
    INSERT INTO product_recipes (product_id, ingredient_id, quantity_needed, unit) VALUES
        (id_agua_prod, id_agua, 1, 'un');
        
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

SELECT 
    p.name as produto,
    p.category as categoria,
    COUNT(pr.id) as qtd_ingredientes
FROM products p
LEFT JOIN product_recipes pr ON pr.product_id = p.id
WHERE p.user_id = 'e16ea1bf-a743-4e3e-b940-edab51ce16d2'
GROUP BY p.id, p.name, p.category
ORDER BY p.category, p.name;
