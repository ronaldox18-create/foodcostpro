-- =================================================================
-- RECARREGAR SCHEMA CACHE
-- =================================================================
-- Execute este script para forçar o Supabase a reconhecer as novas colunas
-- e tabelas criadas (como order_items e suas colunas price, total, etc).

NOTIFY pgrst, 'reload config';

-- Verificação (opcional): Lista as colunas da tabela order_items para confirmar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items';
