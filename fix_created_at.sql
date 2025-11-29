-- =================================================================
-- CORREÇÃO DA COLUNA CREATED_AT
-- =================================================================
-- O erro 400 indica que o frontend está pedindo 'created_at' mas o banco
-- não está encontrando ou reconhecendo essa coluna.

-- 1. Adicionar created_at se não existir
DO $$
BEGIN
    ALTER TABLE orders ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION
    WHEN duplicate_column THEN NULL; -- Se já existir, não faz nada
END $$;

-- 2. Garantir que order_items também tenha created_at
DO $$
BEGIN
    ALTER TABLE order_items ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- 3. Recarregar Schema Cache (CRUCIAL para resolver o erro 400)
NOTIFY pgrst, 'reload config';
