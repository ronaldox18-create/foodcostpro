-- ========================================
-- HABILITAR REALTIME PARA TABELA ORDERS
-- ========================================
-- Este script habilita publicação em tempo real para a tabela orders
-- Execute este SQL no Supabase SQL Editor

-- 1. Habilitar publicação da tabela orders
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- 2. Verificar se a publicação foi habilitada
-- (Execute esta query separadamente para verificar)
-- SELECT schemaname, tablename 
-- FROM pg_publication_tables 
-- WHERE pubname = 'supabase_realtime';

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Abra seu projeto
-- 3. Vá em "SQL Editor" no menu lateral
-- 4. Cole e execute a linha: ALTER PUBLICATION supabase_realtime ADD TABLE orders;
-- 5. Para verificar, execute a query SELECT comentada acima
-- 6. Você deve ver "orders" na lista de tabelas publicadas
-- ========================================
