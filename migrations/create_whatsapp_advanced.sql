-- ========================================
-- WHATSAPP AVANÇADO - ESTRUTURA DE BANCO
-- ========================================

-- Tabela de Conversas
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Cliente
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
    
    -- Metadata
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message_from VARCHAR(20), -- 'customer' ou 'business'
    unread_count INTEGER DEFAULT 0,
    
    -- Tags
    tags TEXT[], -- ['reclamacao', 'elogio', 'duvida']
    
    -- Notas internas
    notes TEXT,
    assigned_to UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Mensagens
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id) ON DELETE CASCADE,
    
    -- WhatsApp IDs
    wa_message_id VARCHAR(255) UNIQUE,
    
    -- Conteúdo
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'location', 'interactive')),
    content TEXT,
    
    -- Metadata
    media_url TEXT,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
    error_message TEXT,
    
    -- Template (se for notificação)
    template_name VARCHAR(100),
    template_params JSONB,
    
    -- Contexto
    context JSONB, -- Dados extras (botão clicado, produto, etc)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de Templates de Resposta Rápida
CREATE TABLE IF NOT EXISTS whatsapp_quick_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50), -- 'saudacao', 'agradecimento', 'desculpa', etc
    template TEXT NOT NULL,
    
    -- Atalho
    shortcut VARCHAR(20), -- Ex: '/ag' para agradecimento
    
    -- Uso
    use_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de FAQ (Perguntas e Respostas)
CREATE TABLE IF NOT EXISTS whatsapp_faq (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Pergunta
    keywords TEXT[] NOT NULL, -- Palavras-chave que ativam
    question_examples TEXT[], -- Exemplos de como perguntam
    
    -- Resposta
    answer TEXT NOT NULL,
    answer_type VARCHAR(20) DEFAULT 'text' CHECK (answer_type IN ('text', 'template', 'button')),
    
    -- Botões (se answer_type = 'button')
    buttons JSONB,
    
    -- Config
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0, -- Maior prioridade = disparada primeiro
    
    -- Estatísticas
    triggered_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

-- Conversas
CREATE INDEX idx_wa_conversations_user ON whatsapp_conversations(user_id);
CREATE INDEX idx_wa_conversations_phone ON whatsapp_conversations(customer_phone);
CREATE INDEX idx_wa_conversations_status ON whatsapp_conversations(status);
CREATE INDEX idx_wa_conversations_last_message ON whatsapp_conversations(last_message_at DESC);

-- Mensagens
CREATE INDEX idx_wa_messages_conversation ON whatsapp_messages(conversation_id);
CREATE INDEX idx_wa_messages_wa_id ON whatsapp_messages(wa_message_id);
CREATE INDEX idx_wa_messages_created ON whatsapp_messages(created_at DESC);
CREATE INDEX idx_wa_messages_direction ON whatsapp_messages(direction);

-- Quick Replies
CREATE INDEX idx_wa_quick_replies_user ON whatsapp_quick_replies(user_id);
CREATE INDEX idx_wa_quick_replies_category ON whatsapp_quick_replies(category);

-- FAQ
CREATE INDEX idx_wa_faq_user ON whatsapp_faq(user_id);
CREATE INDEX idx_wa_faq_active ON whatsapp_faq(is_active);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Conversas
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
    ON whatsapp_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations"
    ON whatsapp_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
    ON whatsapp_conversations FOR UPDATE
    USING (auth.uid() = user_id);

-- Mensagens
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from own conversations"
    ON whatsapp_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM whatsapp_conversations
            WHERE id = whatsapp_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to own conversations"
    ON whatsapp_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM whatsapp_conversations
            WHERE id = whatsapp_messages.conversation_id
            AND user_id = auth.uid()
        )
    );

-- Quick Replies
ALTER TABLE whatsapp_quick_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own quick replies"
    ON whatsapp_quick_replies FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- FAQ
ALTER TABLE whatsapp_faq ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own FAQ"
    ON whatsapp_faq FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ========================================
-- FUNÇÕES ÚTEIS
-- ========================================

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_whatsapp_conversations_updated_at
    BEFORE UPDATE ON whatsapp_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_quick_replies_updated_at
    BEFORE UPDATE ON whatsapp_quick_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_faq_updated_at
    BEFORE UPDATE ON whatsapp_faq
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- COMENTÁRIOS
-- ========================================

COMMENT ON TABLE whatsapp_conversations IS 'Conversas do WhatsApp com clientes';
COMMENT ON TABLE whatsapp_messages IS 'Mensagens individuais de cada conversa';
COMMENT ON TABLE whatsapp_quick_replies IS 'Templates de resposta rápida';
COMMENT ON TABLE whatsapp_faq IS 'Perguntas frequentes com respostas automáticas';

-- ========================================
-- DADOS INICIAIS (EXEMPLOS FAQ)
-- ========================================

-- Nota: Estes serão inseridos via interface admin
-- Apenas como referência:

/*
INSERT INTO whatsapp_faq (user_id, keywords, question_examples, answer, is_active) VALUES
(
    auth.uid(),
    ARRAY['horario', 'hora', 'abre', 'fecha', 'funciona'],
    ARRAY['Qual o horário?', 'Que horas abre?', 'Está aberto?'],
    'Olá! Nosso horário de funcionamento é de segunda a domingo, das 11h às 23h. 😊',
    true
),
(
    auth.uid(),
    ARRAY['endereco', 'local', 'onde', 'localização'],
    ARRAY['Qual o endereço?', 'Onde fica?', 'Como chegar?'],
    'Estamos localizados na Rua Exemplo, 123 - Centro.\n📍 Clique aqui para ver no mapa: [link]',
    true
);
*/
