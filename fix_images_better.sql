-- MELHORIA DA LÓGICA DE IMAGENS 2.0
-- Este script corrige as imagens erradas e cobre mais casos como Picolés, Sorvetes, Açaí, etc.

UPDATE products
SET image_url = CASE
    -- 1. HAMBÚRGUERES E SANDUÍCHES
    WHEN name ILIKE '%burger%' OR name ILIKE '%hamburguer%' OR name ILIKE '%smash%' OR name ILIKE '%x-%' OR name ILIKE '%bacon%' OR name ILIKE '%cheddar%' OR category ILIKE '%lanche%' OR category ILIKE '%burger%'
        THEN 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?fm=jpg&w=800&fit=max'
    
    -- 2. PIZZAS E MASSAS
    WHEN name ILIKE '%pizza%' OR name ILIKE '%calabresa%' OR name ILIKE '%mussarela%' OR name ILIKE '%pepperoni%' OR name ILIKE '%marguerita%' OR category ILIKE '%pizza%' 
        THEN 'https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=jpg&w=800&fit=max'
    
    -- 3. SOBREMESAS / DOCES / SORVETES (Correção Principal)
    WHEN name ILIKE '%picolé%' OR name ILIKE '%picole%' OR name ILIKE '%sorvete%' OR name ILIKE '%açaí%' OR name ILIKE '%acai%' OR name ILIKE '%gelado%'
        THEN 'https://images.unsplash.com/photo-1505394033641-40c6ad1178d1?fm=jpg&w=800&fit=max' -- Foto de Sorvete/Picolé
        
    WHEN name ILIKE '%sobremesa%' OR name ILIKE '%doce%' OR name ILIKE '%pudim%' OR name ILIKE '%bolo%' OR name ILIKE '%torta%' OR name ILIKE '%chocolate%' OR name ILIKE '%brigadeiro%' OR category ILIKE '%sobremesa%' 
        THEN 'https://images.unsplash.com/photo-1551024601-bec78aea704b?fm=jpg&w=800&fit=max' -- Foto de Bolo/Doce geral
    
    -- 4. BEBIDAS
    WHEN name ILIKE '%bebida%' OR name ILIKE '%refrigerante%' OR name ILIKE '%coca%' OR name ILIKE '%pepsi%' OR name ILIKE '%guaraná%' OR name ILIKE '%suco%' OR name ILIKE '%agua%' OR name ILIKE '%água%' OR name ILIKE '%cerveja%' OR category ILIKE '%bebida%' 
        THEN 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?fm=jpg&w=800&fit=max'
    
    -- 5. PORÇÕES E FRITAS
    WHEN name ILIKE '%batata%' OR name ILIKE '%frita%' OR name ILIKE '%porção%' OR name ILIKE '%mandioca%' OR name ILIKE '%polenta%' OR name ILIKE '%aneis%' OR name ILIKE '%anéis%' OR category ILIKE '%acompanhamento%' 
        THEN 'https://images.unsplash.com/photo-1573080496982-b9418e624310?fm=jpg&w=800&fit=max'
    
    -- 6. SALADAS E SAUDÁVEL
    WHEN name ILIKE '%salada%' OR name ILIKE '%natural%' OR name ILIKE '%fitness%' OR name ILIKE '%legume%' 
        THEN 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?fm=jpg&w=800&fit=max'

    -- 7. REFEIÇÕES / PRATOS
    WHEN name ILIKE '%prato%' OR name ILIKE '%executivo%' OR name ILIKE '%almoço%' OR name ILIKE '%jantar%' OR name ILIKE '%parmegiana%' OR name ILIKE '%filé%' OR name ILIKE '%bife%'
        THEN 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?fm=jpg&w=800&fit=max' -- Foto de Prato Feito / Salada Bowl (Genérico Comida)

    -- 8. DEFAULT (Caso não caia em nenhum acima, usa uma imagem neutra de restaurante/mesa)
    ELSE 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?fm=jpg&w=800&fit=max'
END;
