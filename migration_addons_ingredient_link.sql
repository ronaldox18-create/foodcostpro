-- MIGRAÇÃO: VINCULAR COMPLEMENTOS AO ESTOQUE DE INGREDIENTES
-- Execute este SQL no Supabase SQL Editor

-- Remover coluna antiga se existir
ALTER TABLE product_addons 
DROP COLUMN IF EXISTS stock_quantity;

-- Adicionar campos para vincular ao ingrediente
ALTER TABLE product_addons 
ADD COLUMN IF NOT EXISTS ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS quantity_used DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS unit_used VARCHAR(10);

-- Comentários
COMMENT ON COLUMN product_addons.ingredient_id IS 'Ingrediente vinculado (opcional). Se preenchido, desconta do estoque ao vender';
COMMENT ON COLUMN product_addons.quantity_used IS 'Quantidade do ingrediente a descontar (ex: 100 para 100g)';
COMMENT ON COLUMN product_addons.unit_used IS 'Unidade: g, kg, ml, l, un';

-- Verificar se funcionou:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_addons'
ORDER BY ordinal_position;

-- Deve aparecer as colunas:
-- ingredient_id, quantity_used, unit_used
