-- =================================================================
-- SCRIPT DE CORREÇÃO DO BANCO DE DADOS
-- =================================================================
-- Execute este script para garantir que todas as colunas e tabelas existam.
-- Ele foi feito para NÃO dar erro se algo já existir.

-- 1. Adicionar colunas na tabela 'orders' (se não existirem)
DO $$
BEGIN
    BEGIN
        ALTER TABLE orders ADD COLUMN delivery_type TEXT CHECK (delivery_type IN ('delivery', 'pickup'));
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE orders ADD COLUMN delivery_address TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE orders ADD COLUMN phone TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE orders ADD COLUMN notes TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- 2. Adicionar colunas na tabela 'customers' (se não existirem)
DO $$
BEGIN
    BEGIN
        ALTER TABLE customers ADD COLUMN phone TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;

    BEGIN
        ALTER TABLE customers ADD COLUMN address TEXT;
    EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- 3. Criar tabela 'order_items' (se não existir)
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

-- 4. Habilitar RLS na tabela order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança (remove as antigas se existirem para recriar)
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
CREATE POLICY "Users can view their order items" ON order_items FOR SELECT
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert their order items" ON order_items;
CREATE POLICY "Users can insert their order items" ON order_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- 6. Adicionar order_items ao Realtime (ignora se já estiver)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL; -- Ignora outros erros de publicação
END $$;

-- 7. Recarregar o Schema Cache (Importante para o erro PGRST204)
NOTIFY pgrst, 'reload config';
