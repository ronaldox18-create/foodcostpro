-- ADICIONAR ESTOQUE EM COMPLEMENTOS
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE product_addons 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT NULL;

-- Atualizar tipos.ts também precisará do campo stock_quantity

-- Verificar se funcionou:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_addons'
ORDER BY ordinal_position;

-- Deve aparecer a coluna stock_quantity
