-- 1. Garantir que a coluna added_at existe
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Garantir que a coluna price existe (se chamava unit_price, vamos renomear ou criar)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'unit_price') THEN
        ALTER TABLE order_items RENAME COLUMN unit_price TO price;
    END IF;
END $$;

-- 3. Se a coluna price não existir (e não era unit_price), criar
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS price NUMERIC(10,2) DEFAULT 0;

-- 4. Atualizar permissões (RLS) para garantir que tudo funcione
DROP POLICY IF EXISTS "Users can view own order_items" ON order_items;
DROP POLICY IF EXISTS "Users can insert own order_items" ON order_items;
DROP POLICY IF EXISTS "Users can update own order_items" ON order_items;
DROP POLICY IF EXISTS "Users can delete own order_items" ON order_items;

CREATE POLICY "Users can view own order_items"
ON order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own order_items"
ON order_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own order_items"
ON order_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own order_items"
ON order_items FOR DELETE
USING (auth.uid() = user_id);
