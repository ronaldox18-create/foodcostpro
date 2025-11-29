-- =================================================================
-- DIAGNÓSTICO E CORREÇÃO DE VISIBILIDADE DE PEDIDOS
-- =================================================================

-- 1. Desabilitar temporariamente o RLS na tabela orders para você ver tudo
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- 2. (Opcional) Se você quiser reabilitar depois com uma regra mais permissiva para testes:
-- ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "View all orders" ON orders;
-- CREATE POLICY "View all orders" ON orders FOR SELECT USING (true);

-- =================================================================
-- INSTRUÇÃO:
-- Execute apenas a linha 1 ("ALTER TABLE ... DISABLE ...")
-- Isso fará todos os pedidos reaparecerem imediatamente.
-- Depois podemos ajustar a segurança com calma.
-- =================================================================
