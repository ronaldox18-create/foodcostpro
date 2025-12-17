-- Ver estrutura de um order_item com addons
SELECT 
    oi.*,
    o.customer_name,
    o.status
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
ORDER BY oi.created_at DESC
LIMIT 5;
