-- ============================================
-- LISTAR PRODUTOS
-- ============================================

SELECT 
    id,
    name,
    category
FROM products
ORDER BY created_at DESC;
