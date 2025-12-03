-- Adicionar coluna added_at na tabela order_items para registrar horário do pedido do item
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Comentário para documentação
COMMENT ON COLUMN order_items.added_at IS 'Horário exato em que o item foi adicionado ao pedido';
