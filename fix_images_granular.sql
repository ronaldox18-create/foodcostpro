-- CORREÇÃO GRANULAR DE IMAGENS (V3.0)
-- Foca na fidelidade visual baseada em Nome, Descrição e Categoria.
-- URLs testadas e funcionando.

UPDATE products
SET image_url = CASE
    -- === 1. SOBREMESAS, GELADOS E AÇAÍ (Prioridade Alta) ===
    
    -- Picolé/Sorvete de Morango (Específico)
    WHEN (name ILIKE '%picole%' OR name ILIKE '%picolé%' OR name ILIKE '%sorvete%') AND (name ILIKE '%morango%' OR description ILIKE '%morango%')
        THEN 'https://images.unsplash.com/photo-1488900128323-21503983a07e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    
    -- Picolé/Sorvete de Chocolate
    WHEN (name ILIKE '%picole%' OR name ILIKE '%picolé%' OR name ILIKE '%sorvete%') AND (name ILIKE '%chocolate%' OR description ILIKE '%chocolate%')
        THEN 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        
    -- Picolé/Sorvete Geral
    WHEN name ILIKE '%picole%' OR name ILIKE '%picolé%' OR name ILIKE '%sorvete%' OR name ILIKE '%gelado%'
        THEN 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'

    -- Açaí
    WHEN name ILIKE '%açaí%' OR name ILIKE '%acai%' 
        THEN 'https://images.unsplash.com/photo-1590301157890-4810ed352733?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'

    -- Sobremesas com Chocolate (Bolo, Torta, Brownie)
    WHEN (name ILIKE '%bolo%' OR name ILIKE '%torta%' OR name ILIKE '%brownie%' OR name ILIKE '%petit%') AND (name ILIKE '%chocolate%' OR description ILIKE '%chocolate%')
        THEN 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'

    -- Sobremesas Gerais
    WHEN category ILIKE '%sobremesa%' OR name ILIKE '%doce%' OR name ILIKE '%pudim%'
        THEN 'https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'


    -- === 2. HAMBÚRGUERES E SANDUÍCHES (Por Ingrediente) ===
    
    -- Bacon
    WHEN (name ILIKE '%bacon%' OR description ILIKE '%bacon%') AND (category ILIKE '%lanche%' OR category ILIKE '%burger%' OR name ILIKE '%burger%' OR name ILIKE '%x-%' OR name ILIKE '%smash%')
        THEN 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'

    -- Frango / Chicken
    WHEN (name ILIKE '%frango%' OR name ILIKE '%chicken%' OR description ILIKE '%frango%') AND (category ILIKE '%lanche%' OR category ILIKE '%burger%')
        THEN 'https://images.unsplash.com/photo-1615557960916-5f4791effe9d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    
    -- Salada / Vegetariano / Simples
    WHEN (name ILIKE '%salada%' OR name ILIKE '%vegan%' OR name ILIKE '%simples%') AND (category ILIKE '%lanche%' OR category ILIKE '%burger%')
        THEN 'https://images.unsplash.com/photo-1550547660-d9450f859349?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'

    -- Hambúrguer Padrão (Fallback)
    WHEN name ILIKE '%burger%' OR name ILIKE '%hamburguer%' OR name ILIKE '%x-%' OR name ILIKE '%smash%' OR category ILIKE '%lanche%' OR category ILIKE '%burger%'
        THEN 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'


    -- === 3. PIZZAS ===
    
    -- Calabresa / Pepperoni
    WHEN (name ILIKE '%calabresa%' OR name ILIKE '%pepperoni%' OR description ILIKE '%calabresa%') AND (category ILIKE '%pizza%' OR name ILIKE '%pizza%')
        THEN 'https://images.unsplash.com/photo-1628840042765-356cda07504e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'

    -- Frango com Catupiry
    WHEN (name ILIKE '%frango%' AND (name ILIKE '%catupiry%' OR name ILIKE '%requeijão%')) AND (category ILIKE '%pizza%' OR name ILIKE '%pizza%')
        THEN 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
        
    -- Pizza Geral
    WHEN category ILIKE '%pizza%' OR name ILIKE '%pizza%'
        THEN 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'


    -- === 4. BEBIDAS ===
    
    -- Coca-Cola / Refrigerantes Escuros
    WHEN name ILIKE '%coca%' OR name ILIKE '%pepsi%' OR (name ILIKE '%refrigerante%' AND name ILIKE '%cola%')
        THEN 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'

    -- Guaraná / Refrigerantes Claros
    WHEN name ILIKE '%guaraná%' OR name ILIKE '%guarana%' OR name ILIKE '%sprite%' OR name ILIKE '%soda%'
        THEN 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'

    -- Sucos Naturais
    WHEN name ILIKE '%suco%' OR name ILIKE '%laranja%' OR name ILIKE '%limão%' OR name ILIKE '%limao%'
        THEN 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'

    -- Cervejas
    WHEN name ILIKE '%cerveja%' OR name ILIKE '%heineken%' OR name ILIKE '%long neck%' OR name ILIKE '%chopp%'
        THEN 'https://images.unsplash.com/photo-1608270586620-248524c67de9?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    
    -- Água
    WHEN name ILIKE '%agua%' OR name ILIKE '%água%'
        THEN 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'


    -- === 5. ACOMPANHAMENTOS ===
    
    -- Batata Frita
    WHEN name ILIKE '%batata%' OR name ILIKE '%fritas%' OR name ILIKE '%fries%'
        THEN 'https://images.unsplash.com/photo-1630384060421-cb20d0e06497?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    
    -- Aneis de Cebola
    WHEN name ILIKE '%cebola%' AND (name ILIKE '%aneis%' OR name ILIKE '%anéis%' OR name ILIKE '%onion%')
        THEN 'https://images.unsplash.com/photo-1639024471283-03518883512d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'


    -- === 6. OUTROS / DEFAULT ===
    -- Se não cair em nada acima, mantém o que está (se não for nulo) ou põe imagem genérica de restaurante
    ELSE COALESCE(NULLIF(image_url, ''), 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80')
END;
