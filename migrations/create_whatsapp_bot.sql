-- ========================================
-- WHATSAPP BOT - LIMPEZA E RECRIAÇÃO TOTAL
-- Execute este SQL para começar do ZERO!
-- ========================================

-- PASSO 1: DROPAR TUDO (se existir)
-- ========================================

DROP TABLE IF EXISTS whatsapp_messages CASCADE;
DROP TABLE IF EXISTS whatsapp_faq CASCADE;
DROP TABLE IF EXISTS whatsapp_bot_config CASCADE;
DROP TABLE IF EXISTS whatsapp_conversations CASCADE;
DROP TABLE IF EXISTS whatsapp_quick_replies CASCADE;

-- PASSO 2: CRIAR DO ZERO
-- ========================================

-- Tabela de Configuração do Bot
CREATE TABLE whatsapp_bot_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Status
    is_enabled BOOLEAN DEFAULT false,
    is_connected BOOLEAN DEFAULT false,
    
    -- IA
    ai_enabled BOOLEAN DEFAULT false,
    
    -- Conexão
    qr_code TEXT,
    qr_generated_at TIMESTAMP WITH TIME ZONE,
    connected_at TIMESTAMP WITH TIME ZONE,
    
    -- Mensagens personalizadas
    welcome_message TEXT DEFAULT 'Olá! Como posso ajudar? 😊',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Mensagens
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Cliente
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255),
    
    -- Mensagem
    content TEXT NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('received', 'sent')),
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de FAQ
CREATE TABLE whatsapp_faq (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Pergunta
    keywords TEXT[] NOT NULL,
    question_examples TEXT[],
    
    -- Resposta
    answer TEXT NOT NULL,
    
    -- Config
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    
    -- Estatísticas
    triggered_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 3: ÍNDICES
-- ========================================

CREATE INDEX idx_whatsapp_messages_user ON whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_messages_phone ON whatsapp_messages(customer_phone);
CREATE INDEX idx_whatsapp_messages_created ON whatsapp_messages(created_at DESC);

CREATE INDEX idx_whatsapp_faq_user ON whatsapp_faq(user_id);
CREATE INDEX idx_whatsapp_faq_active ON whatsapp_faq(is_active);

-- PASSO 4: RLS (SEGURANÇA)
-- ========================================

-- Config
ALTER TABLE whatsapp_bot_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whatsapp_bot_config_policy" ON whatsapp_bot_config
    FOR ALL USING (auth.uid() = user_id);

-- Mensagens
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whatsapp_messages_policy" ON whatsapp_messages
    FOR ALL USING (auth.uid() = user_id);

-- FAQ
ALTER TABLE whatsapp_faq ENABLE ROW LEVEL SECURITY;
CREATE POLICY "whatsapp_faq_policy" ON whatsapp_faq
    FOR ALL USING (auth.uid() = user_id);

-- PASSO 5: COMENTÁRIOS
-- ========================================

COMMENT ON TABLE whatsapp_bot_config IS 'WhatsApp Bot Config (Baileys + DeepSeek) - 100% Grátis';
COMMENT ON TABLE whatsapp_messages IS 'Histórico de mensagens';
COMMENT ON TABLE whatsapp_faq IS 'FAQ - Respostas automáticas';

-- ========================================
-- PRONTO! ✅
-- ========================================
