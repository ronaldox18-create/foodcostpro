-- Ver order_items mais recentes com selected_addons
SELECT 
    oi.id,
    oi.product_name,
    oi.quantity,
    oi.selected_addons,
    o.customer_name,
    o.created_at
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
ORDER BY o.created_at DESC
LIMIT 5;
