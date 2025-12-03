-- ============================================
-- SISTEMA DE FIDELIDADE E PONTOS
-- ============================================
-- Este script cria todas as tabelas necessárias para o sistema de fidelidade
-- Autor: Sistema FoodCostPro
-- Data: Dezembro 2025
-- ============================================

-- Tabela de Configurações do Programa de Fidelidade
CREATE TABLE IF NOT EXISTS loyalty_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Status do programa
    is_enabled BOOLEAN DEFAULT true,
    
    -- Configuração de pontos
    points_per_real DECIMAL(10, 2) DEFAULT 1.00,
    
    -- Configuração de expiração de nível
    level_expiration_enabled BOOLEAN DEFAULT true,
    level_expiration_days INTEGER DEFAULT 90,
    
    -- Configuração de resgate
    enable_points_redemption BOOLEAN DEFAULT false,
    points_to_real_rate DECIMAL(10, 2) DEFAULT 100.00,
    min_points_to_redeem INTEGER DEFAULT 500,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Garantir apenas uma configuração por usuário
    UNIQUE(user_id)
);

-- Índice para busca rápida por usuário
CREATE INDEX IF NOT EXISTS idx_loyalty_settings_user_id ON loyalty_settings(user_id);

-- ============================================

-- Tabela de Níveis de Fidelidade
CREATE TABLE IF NOT EXISTS loyalty_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informações do nível
    name VARCHAR(100) NOT NULL,
    points_required INTEGER NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    
    -- Aparência
    color VARCHAR(7) DEFAULT '#999999', -- Hex color
    icon VARCHAR(10) DEFAULT '⭐',
    
    -- Descrição
    benefits TEXT,
    
    -- Ordenação
    "order" INTEGER NOT NULL DEFAULT 1,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validações
    CONSTRAINT valid_discount CHECK (discount_percent >= 0 AND discount_percent <= 100),
    CONSTRAINT valid_points CHECK (points_required >= 0)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_loyalty_levels_user_id ON loyalty_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_levels_order ON loyalty_levels(user_id, "order");

-- ============================================

-- Adicionar colunas de fidelidade na tabela de clientes (se não existirem)
DO $$ 
BEGIN
    -- Adicionar coluna de pontos
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'points'
    ) THEN
        ALTER TABLE customers ADD COLUMN points INTEGER DEFAULT 0;
    END IF;
    
    -- Adicionar coluna de nível atual
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'current_level'
    ) THEN
        ALTER TABLE customers ADD COLUMN current_level UUID REFERENCES loyalty_levels(id) ON DELETE SET NULL;
    END IF;
    
    -- Adicionar coluna de expiração do nível
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'level_expires_at'
    ) THEN
        ALTER TABLE customers ADD COLUMN level_expires_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Adicionar coluna de última atualização de nível
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'last_level_update'
    ) THEN
        ALTER TABLE customers ADD COLUMN last_level_update TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_customers_points ON customers(points);
CREATE INDEX IF NOT EXISTS idx_customers_current_level ON customers(current_level);
CREATE INDEX IF NOT EXISTS idx_customers_level_expires ON customers(level_expires_at);

-- ============================================

-- Tabela de Histórico de Pontos
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Transação de pontos
    points INTEGER NOT NULL, -- Positivo = ganhou, Negativo = gastou
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjusted')),
    description TEXT NOT NULL,
    
    -- Referência opcional ao pedido
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_points_history_customer ON points_history(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_user ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_order ON points_history(order_id);

-- ============================================

-- Tabela de Histórico de Mudanças de Nível
CREATE TABLE IF NOT EXISTS level_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Mudança de nível
    from_level_id UUID REFERENCES loyalty_levels(id) ON DELETE SET NULL,
    to_level_id UUID NOT NULL REFERENCES loyalty_levels(id) ON DELETE CASCADE,
    reason VARCHAR(20) NOT NULL CHECK (reason IN ('points_earned', 'expired', 'manual')),
    
    -- Metadados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_level_history_customer ON level_history(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_level_history_user ON level_history(user_id);

-- ============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_loyalty_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_loyalty_settings_updated_at ON loyalty_settings;
CREATE TRIGGER trigger_update_loyalty_settings_updated_at
    BEFORE UPDATE ON loyalty_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_settings_updated_at();

-- ============================================

-- Função para calcular e atualizar nível do cliente baseado em pontos
CREATE OR REPLACE FUNCTION update_customer_level(p_customer_id UUID, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_customer_points INTEGER;
    v_new_level_id UUID;
    v_old_level_id UUID;
BEGIN
    -- Buscar pontos atuais do cliente
    SELECT points, current_level INTO v_customer_points, v_old_level_id
    FROM customers
    WHERE id = p_customer_id;
    
    -- Encontrar o nível apropriado baseado nos pontos
    SELECT id INTO v_new_level_id
    FROM loyalty_levels
    WHERE user_id = p_user_id
      AND points_required <= v_customer_points
    ORDER BY points_required DESC
    LIMIT 1;
    
    -- Se encontrou um nível e é diferente do atual
    IF v_new_level_id IS NOT NULL AND (v_old_level_id IS NULL OR v_old_level_id != v_new_level_id) THEN
        -- Atualizar nível do cliente
        UPDATE customers
        SET current_level = v_new_level_id,
            last_level_update = NOW()
        WHERE id = p_customer_id;
        
        -- Registrar no histórico
        INSERT INTO level_history (user_id, customer_id, from_level_id, to_level_id, reason)
        VALUES (p_user_id, p_customer_id, v_old_level_id, v_new_level_id, 'points_earned');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================

-- Função para adicionar pontos ao cliente
CREATE OR REPLACE FUNCTION add_customer_points(
    p_customer_id UUID,
    p_user_id UUID,
    p_points INTEGER,
    p_description TEXT,
    p_order_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Adicionar pontos ao cliente
    UPDATE customers
    SET points = COALESCE(points, 0) + p_points
    WHERE id = p_customer_id;
    
    -- Registrar no histórico
    INSERT INTO points_history (user_id, customer_id, points, type, description, order_id)
    VALUES (p_user_id, p_customer_id, p_points, 'earned', p_description, p_order_id);
    
    -- Atualizar nível se necessário
    PERFORM update_customer_level(p_customer_id, p_user_id);
END;
$$ LANGUAGE plpgsql;

-- ============================================

-- Função para resgatar pontos
CREATE OR REPLACE FUNCTION redeem_customer_points(
    p_customer_id UUID,
    p_user_id UUID,
    p_points INTEGER,
    p_description TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_customer_points INTEGER;
    v_settings RECORD;
BEGIN
    -- Buscar pontos do cliente
    SELECT points INTO v_customer_points
    FROM customers
    WHERE id = p_customer_id;
    
    -- Buscar configurações
    SELECT * INTO v_settings
    FROM loyalty_settings
    WHERE user_id = p_user_id;
    
    -- Validações
    IF NOT v_settings.enable_points_redemption THEN
        RAISE EXCEPTION 'Resgate de pontos está desabilitado';
    END IF;
    
    IF v_customer_points < p_points THEN
        RAISE EXCEPTION 'Pontos insuficientes';
    END IF;
    
    IF p_points < v_settings.min_points_to_redeem THEN
        RAISE EXCEPTION 'Mínimo de % pontos necessários', v_settings.min_points_to_redeem;
    END IF;
    
    -- Deduzir pontos
    UPDATE customers
    SET points = points - p_points
    WHERE id = p_customer_id;
    
    -- Registrar no histórico
    INSERT INTO points_history (user_id, customer_id, points, type, description)
    VALUES (p_user_id, p_customer_id, -p_points, 'redeemed', p_description);
    
    -- Atualizar nível (pode ter caído)
    PERFORM update_customer_level(p_customer_id, p_user_id);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================

-- Inserir configuração padrão para usuários existentes (se não tiverem)
INSERT INTO loyalty_settings (user_id, is_enabled, points_per_real, level_expiration_enabled, level_expiration_days)
SELECT DISTINCT u.id, true, 1.00, true, 90
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM loyalty_settings ls WHERE ls.user_id = u.id
);

-- ============================================

-- Inserir níveis padrão para usuários existentes (se não tiverem)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    FOR v_user_id IN SELECT DISTINCT id FROM auth.users LOOP
        -- Verificar se o usuário já tem níveis
        IF NOT EXISTS (SELECT 1 FROM loyalty_levels WHERE user_id = v_user_id) THEN
            -- Inserir níveis padrão
            INSERT INTO loyalty_levels (user_id, name, points_required, discount_percent, color, icon, benefits, "order")
            VALUES
                (v_user_id, 'Bronze', 0, 5.00, '#CD7F32', '🥉', 'Desconto básico em todos os pedidos', 1),
                (v_user_id, 'Prata', 500, 10.00, '#C0C0C0', '🥈', 'Desconto intermediário + prioridade no atendimento', 2),
                (v_user_id, 'Ouro', 1500, 15.00, '#FFD700', '🥇', 'Desconto premium + brindes exclusivos', 3),
                (v_user_id, 'Diamante', 3000, 20.00, '#B9F2FF', '💎', 'Máximo desconto + experiências VIP', 4);
        END IF;
    END LOOP;
END $$;

-- ============================================

-- Comentários nas tabelas para documentação
COMMENT ON TABLE loyalty_settings IS 'Configurações do programa de fidelidade por usuário';
COMMENT ON TABLE loyalty_levels IS 'Níveis de fidelidade configuráveis';
COMMENT ON TABLE points_history IS 'Histórico de todas as transações de pontos';
COMMENT ON TABLE level_history IS 'Histórico de mudanças de nível dos clientes';

COMMENT ON COLUMN loyalty_settings.is_enabled IS 'Se true, o sistema de pontos está ativo';
COMMENT ON COLUMN loyalty_settings.points_per_real IS 'Quantos pontos o cliente ganha por R$ 1,00 gasto';
COMMENT ON COLUMN loyalty_settings.level_expiration_enabled IS 'Se true, níveis expiram após inatividade';
COMMENT ON COLUMN loyalty_settings.level_expiration_days IS 'Dias sem compra para perder o nível';
COMMENT ON COLUMN loyalty_settings.enable_points_redemption IS 'Se true, permite trocar pontos por desconto';
COMMENT ON COLUMN loyalty_settings.points_to_real_rate IS 'Quantos pontos equivalem a R$ 1,00 de desconto';
COMMENT ON COLUMN loyalty_settings.min_points_to_redeem IS 'Mínimo de pontos necessários para resgatar';

-- ============================================

-- Políticas de segurança RLS (Row Level Security)

-- Habilitar RLS nas tabelas
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE level_history ENABLE ROW LEVEL SECURITY;

-- Políticas para loyalty_settings
CREATE POLICY "Users can view their own loyalty settings"
    ON loyalty_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loyalty settings"
    ON loyalty_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty settings"
    ON loyalty_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Políticas para loyalty_levels
CREATE POLICY "Users can view their own loyalty levels"
    ON loyalty_levels FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own loyalty levels"
    ON loyalty_levels FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own loyalty levels"
    ON loyalty_levels FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own loyalty levels"
    ON loyalty_levels FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para points_history
CREATE POLICY "Users can view their own points history"
    ON points_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own points history"
    ON points_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Políticas para level_history
CREATE POLICY "Users can view their own level history"
    ON level_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own level history"
    ON level_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================

-- Script concluído com sucesso!
-- Todas as tabelas, funções e políticas foram criadas.
