-- Adicionar campos de controle do iFood na tabela de Categorias
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS ifood_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS ifood_status VARCHAR(50) DEFAULT 'AVAILABLE'; -- AVAILABLE, UNAVAILABLE

-- Adicionar campos de controle do iFood na tabela de Produtos
ALTER TABLE products
ADD COLUMN IF NOT EXISTS ifood_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS ifood_external_code VARCHAR(255), -- Para facilitar o vinculo reverso e update de estoque
ADD COLUMN IF NOT EXISTS ifood_status VARCHAR(50) DEFAULT 'AVAILABLE';

-- Criar tabela de logs de sincronização para auditoria
CREATE TABLE IF NOT EXISTS catalog_sync_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    entity_type VARCHAR(50), -- 'PRODUCT', 'CATEGORY'
    entity_id UUID,
    action VARCHAR(50), -- 'CREATE', 'UPDATE', 'PAUSE', 'UNPAUSE'
    status VARCHAR(50), -- 'SUCCESS', 'ERROR'
    message TEXT,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para a nova tabela
ALTER TABLE catalog_sync_logs ENABLE ROW LEVEL SECURITY;

-- Remover politica antiga se existir para evitar erro de duplicidade
DROP POLICY IF EXISTS "Users can only access their own logs" ON catalog_sync_logs;

CREATE POLICY "Users can only access their own logs"
ON catalog_sync_logs FOR ALL
USING (auth.uid() = user_id);
