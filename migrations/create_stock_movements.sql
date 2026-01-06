-- Tabela de movimentação de estoque
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    
    -- Tipo de movimentação
    type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'entry', 'adjustment', 'loss')),
    
    -- Quantidade (positiva para entrada, negativa para saída)
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    
    -- Motivo/Descrição
    reason TEXT,
    
    -- Referências
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    addon_id UUID REFERENCES product_addons(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_ingredient ON stock_movements(ingredient_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(type);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_order ON stock_movements(order_id);

-- RLS Policies
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver só seus movimentos
CREATE POLICY "Users can view own movements"
    ON stock_movements FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir seus movimentos
CREATE POLICY "Users can insert own movements"
    ON stock_movements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE stock_movements IS 'Histórico completo de movimentações de estoque';
COMMENT ON COLUMN stock_movements.type IS 'sale=venda, entry=entrada, adjustment=ajuste, loss=perda';
COMMENT ON COLUMN stock_movements.quantity IS 'Quantidade movimentada (negativo para saída)';
