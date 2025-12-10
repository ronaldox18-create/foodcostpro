-- ===============================================================
-- CORREÇÃO DE ERRO: Adicionar colunas faltantes na tabela 'orders'
-- ===============================================================

-- 1. Adicionar coluna 'couvert' que estava faltando e causava o erro
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'couvert'
  ) THEN
    ALTER TABLE orders ADD COLUMN couvert DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- 2. Garantir que 'service_charge' suporte valores monetários maiores (ex: > R$ 1.000,00)
-- O script anterior definia como (5,2) que limita a 999.99
ALTER TABLE orders ALTER COLUMN service_charge TYPE DECIMAL(10, 2);

-- 3. Garantir que as outras colunas novas também existam (segurança)
DO $$ 
BEGIN
  -- Change Given (Troco)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'change_given'
  ) THEN
    ALTER TABLE orders ADD COLUMN change_given DECIMAL(10, 2) DEFAULT 0;
  END IF;

  -- Cash Register ID
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'cash_register_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN cash_register_id UUID REFERENCES cash_registers(id);
  END IF;
END $$;
