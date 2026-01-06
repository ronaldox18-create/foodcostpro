-- VERIFICAR SE TABELA stock_movements EXISTE

-- Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stock_movements'
ORDER BY ordinal_position;

-- Se retornar vazio, a tabela NÃO existe
-- Se retornar colunas, a tabela EXISTE

-- Verificar políticas RLS
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'stock_movements';

-- Contar registros (se tabela existir)
SELECT COUNT(*) as total_movimentacoes
FROM stock_movements;
