-- =====================================================
-- MIGRAÇÃO: Sistema de PDV (Ponto de Venda)
-- Descrição: Cria tabelas para gerenciar caixa, 
--            movimentações e vendas do PDV
-- =====================================================

-- Tabela: cash_registers (Caixas)
CREATE TABLE IF NOT EXISTS cash_registers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opened_by TEXT NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  initial_cash DECIMAL(10, 2) NOT NULL DEFAULT 0,
  final_cash DECIMAL(10, 2),
  expected_cash DECIMAL(10, 2),
  difference DECIMAL(10, 2),
  status TEXT NOT NULL CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela: cash_movements (Sangrias e Reforços)
CREATE TABLE IF NOT EXISTS cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cash_register_id UUID NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('withdrawal', 'addition')),
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna cash_register_id à tabela orders (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'cash_register_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN cash_register_id UUID REFERENCES cash_registers(id);
  END IF;
END $$;

-- Adicionar colunas de desconto e taxas às orders (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'discount'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'discount_percent'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_percent DECIMAL(5, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'service_charge'
  ) THEN
    ALTER TABLE orders ADD COLUMN service_charge DECIMAL(5, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'tip'
  ) THEN
    ALTER TABLE orders ADD COLUMN tip DECIMAL(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'change_given'
  ) THEN
    ALTER TABLE orders ADD COLUMN change_given DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_cash_registers_user_status 
  ON cash_registers(user_id, status);

CREATE INDEX IF NOT EXISTS idx_cash_registers_opened_at 
  ON cash_registers(opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_cash_movements_cash_register 
  ON cash_movements(cash_register_id);

CREATE INDEX IF NOT EXISTS idx_orders_cash_register 
  ON orders(cash_register_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;

-- Políticas para cash_registers
DROP POLICY IF EXISTS "Users can view their own cash registers" ON cash_registers;
CREATE POLICY "Users can view their own cash registers"
  ON cash_registers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own cash registers" ON cash_registers;
CREATE POLICY "Users can insert their own cash registers"
  ON cash_registers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own cash registers" ON cash_registers;
CREATE POLICY "Users can update their own cash registers"
  ON cash_registers FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own cash registers" ON cash_registers;
CREATE POLICY "Users can delete their own cash registers"
  ON cash_registers FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para cash_movements
DROP POLICY IF EXISTS "Users can view their own cash movements" ON cash_movements;
CREATE POLICY "Users can view their own cash movements"
  ON cash_movements FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own cash movements" ON cash_movements;
CREATE POLICY "Users can insert their own cash movements"
  ON cash_movements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own cash movements" ON cash_movements;
CREATE POLICY "Users can update their own cash movements"
  ON cash_movements FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own cash movements" ON cash_movements;
CREATE POLICY "Users can delete their own cash movements"
  ON cash_movements FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE cash_registers IS 'Registros de abertura e fechamento de caixa do PDV';
COMMENT ON TABLE cash_movements IS 'Movimentações de caixa (sangrias e reforços)';

COMMENT ON COLUMN cash_registers.opened_by IS 'Nome do operador que abriu o caixa';
COMMENT ON COLUMN cash_registers.initial_cash IS 'Valor inicial do caixa ao abrir';
COMMENT ON COLUMN cash_registers.final_cash IS 'Valor real contado no fechamento';
COMMENT ON COLUMN cash_registers.expected_cash IS 'Valor esperado calculado (inicial + entradas - saídas)';
COMMENT ON COLUMN cash_registers.difference IS 'Diferença entre valor real e esperado (positivo = sobra, negativo = falta)';

COMMENT ON COLUMN cash_movements.type IS 'Tipo: withdrawal (sangria) ou addition (reforço)';
COMMENT ON COLUMN cash_movements.reason IS 'Motivo da movimentação';

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================
