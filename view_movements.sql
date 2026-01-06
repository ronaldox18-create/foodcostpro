-- VER ÚLTIMAS MOVIMENTAÇÕES (Top 20)

SELECT 
    sm.created_at as data_hora,
    sm.type as tipo,
    i.name as ingrediente,
    sm.quantity as quantidade,
    sm.unit as unidade,
    sm.reason as motivo,
    SUBSTRING(sm.order_id::text, 1, 8) as pedido
FROM stock_movements sm
LEFT JOIN ingredients i ON i.id = sm.ingredient_id
ORDER BY sm.created_at DESC
LIMIT 20;

-- Resumo por tipo
SELECT 
    type as tipo,
    COUNT(*) as total,
    SUM(CASE WHEN quantity < 0 THEN 1 ELSE 0 END) as saidas,
    SUM(CASE WHEN quantity > 0 THEN 1 ELSE 0 END) as entradas
FROM stock_movements
GROUP BY type
ORDER BY total DESC;
