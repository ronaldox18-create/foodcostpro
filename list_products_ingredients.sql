-- ============================================
-- LISTAR TODOS OS PRODUTOS (SEM FILTRO)
-- ============================================

SELECT 
    id,
    name,
    category,
    user_id
FROM products
ORDER BY created_at DESC
LIMIT 20;

-- Separador
SELECT '==================== INGREDIENTES ====================' as separador;

-- ============================================
-- LISTAR TODOS OS INGREDIENTES (SEM FILTRO)
-- ============================================

SELECT *
FROM ingredients
ORDER BY created_at DESC
LIMIT 20;
