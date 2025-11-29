-- ========================================
-- CRIAR TABELA ORDER_ITEMS
-- ========================================
-- Esta tabela armazena os itens de cada pedido com detalhes completos

-- 1. Criar tabela order_items
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS
-- Permitir que usuários vejam items de seus próprios pedidos
CREATE POLICY "Users can view their order items"
ON order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
);

-- Permitir que usuários insiram items em seus próprios pedidos
CREATE POLICY "Users can insert their order items"
ON order_items FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
);

-- Permitir que usuários atualizem items de seus próprios pedidos
CREATE POLICY "Users can update their order items"
ON order_items FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
);

-- Permitir que usuários deletem items de seus próprios pedidos
CREATE POLICY "Users can delete their order items"
ON order_items FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
);

-- 5. Habilitar Realtime para order_items
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- ========================================
-- VERIFICAÇÃO (Execute separadamente)
-- ========================================
-- SELECT * FROM order_items LIMIT 10;

-- ========================================
-- INSTRUÇÕES:
-- ========================================
-- 1. Acesse: https://supabase.com/dashboard
-- 2. Vá em "SQL Editor"
-- 3. Cole e execute ESTE SCRIPT COMPLETO
-- 4. Verifique se não há erros
-- 5. Depois, atualize o código StoreMenu.tsx para inserir items ao criar pedidos
-- ========================================
