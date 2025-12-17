-- Verificar se a receita do Hot Dog Completo existe
SELECT 
    p.name as produto,
    i.name as ingrediente,
    pr.quantity_needed,
    pr.unit
FROM products p
LEFT JOIN product_recipes pr ON pr.product_id = p.id
LEFT JOIN ingredients i ON i.id = pr.ingredient_id
WHERE p.name LIKE '%Hot Dog%'
ORDER BY p.name, i.name;
