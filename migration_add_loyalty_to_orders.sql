-- ============================================
-- ADICIONAR COLUNAS DE FIDELIDADE NA TABELA ORDERS
-- ============================================
-- Execute este script no Supabase para adicionar suporte
-- a descontos de fidelidade e pontos ganhos nos pedidos
-- ============================================

-- Adicionar coluna de desconto de fidelidade
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'loyalty_discount'
    ) THEN
        ALTER TABLE orders ADD COLUMN loyalty_discount DECIMAL(10, 2) DEFAULT 0.00;
        COMMENT ON COLUMN orders.loyalty_discount IS 'Desconto aplicado pelo programa de fidelidade';
    END IF;
END $$;

-- Adicionar coluna de pontos ganhos
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'points_earned'
    ) THEN
        ALTER TABLE orders ADD COLUMN points_earned INTEGER DEFAULT 0;
        COMMENT ON COLUMN orders.points_earned IS 'Pontos ganhos pelo cliente neste pedido';
    END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_orders_loyalty_discount ON orders(loyalty_discount) WHERE loyalty_discount > 0;
CREATE INDEX IF NOT EXISTS idx_orders_points_earned ON orders(points_earned) WHERE points_earned > 0;

-- ============================================
-- Script concluído!
-- As colunas foram adicionadas com sucesso.
-- ============================================
