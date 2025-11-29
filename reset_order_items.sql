-- =================================================================
-- RESET TOTAL DA TABELA ORDER_ITEMS
-- =================================================================
-- Este script APAGA a tabela order_items e a recria do zero.
-- Use isso para corrigir problemas de colunas ausentes ou corrompidas.

-- 1. Apagar tabela existente (e tudo que depende dela)
DROP TABLE IF EXISTS order_items CASCADE;

-- 2. Recriar tabela com estrutura correta
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    total DECIMAL(10, 2) NOT NULL CHECK (total >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Criar índices
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 4. Habilitar RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 5. Criar policies (permissões)
-- Permitir INSERT público (para o cardápio funcionar)
CREATE POLICY "Public can insert order items" 
ON order_items FOR INSERT 
WITH CHECK (true);

-- Permitir SELECT apenas para o dono da loja
CREATE POLICY "Users can view their order items" 
ON order_items FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    )
);

-- 6. Adicionar ao Realtime (com tratamento de erro se já estiver)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
END $$;

-- 7. Forçar recarregamento do schema
NOTIFY pgrst, 'reload config';
