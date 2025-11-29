-- ========================================
-- ATUALIZAR TABELA ORDERS
-- ========================================
-- Adiciona campos para tipo de entrega, endereço e notas

-- 1. Adicionar novos campos à tabela orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_type TEXT CHECK (delivery_type IN ('delivery', 'pickup')),
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Atualizar orders existentes com valores padrão
UPDATE orders
SET delivery_type = 'pickup'
WHERE delivery_type IS NULL;

-- ========================================
-- VERIFICAÇÃO (Execute separadamente)
-- ========================================
-- SELECT * FROM orders ORDER BY created_at DESC LIMIT 5;

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Vá em "SQL Editor"
-- 3. Cole e execute ESTE SCRIPT
-- 4. Depois, teste o novo fluxo de checkout
-- ========================================
