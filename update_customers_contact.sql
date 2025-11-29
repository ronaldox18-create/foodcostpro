-- ========================================
-- ATUALIZAR TABELA CUSTOMERS
-- ========================================
-- Adiciona campos de telefone e endereço aos clientes

-- 1. Adicionar novos campos à tabela customers
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- 2. Comentários nas colunas
COMMENT ON COLUMN customers.phone IS 'Telefone do cliente para contato';
COMMENT ON COLUMN customers.address IS 'Endereço completo do cliente';

-- ========================================
-- VERIFICAÇÃO (Execute separadamente)
-- ========================================
-- SELECT id, name, email, phone, address FROM customers LIMIT 10;

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Vá em "SQL Editor"
-- 3. Cole e execute ESTE SCRIPT
-- ========================================
