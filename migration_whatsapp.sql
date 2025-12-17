-- ================================================
-- MIGRAÇÃO: WhatsApp Business Integration
-- Data: Dezembro 2024
-- Descrição: Estrutura completa para WhatsApp Cloud API
-- ================================================

-- ================================================
-- 1. Configurações do WhatsApp por usuário
-- ================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Credenciais Meta/WhatsApp
    phone_number_id text NOT NULL,
    business_account_id text NOT NULL,
    access_token text NOT NULL, -- Será criptografado na aplicação
    webhook_verify_token text NOT NULL,
    
    -- Status
    is_enabled boolean DEFAULT false,
    status text DEFAULT 'disconnected', -- 'active', 'error', 'disconnected'
    last_tested_at timestamptz,
    error_message text,
    
    -- Configurações
    auto_send_order_confirmed boolean DEFAULT true,
    auto_send_order_preparing boolean DEFAULT true,
    auto_send_order_ready boolean DEFAULT true,
    auto_send_order_delivered boolean DEFAULT true,
    auto_send_loyalty_points boolean DEFAULT true,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(user_id)
);

-- ================================================
-- 2. Templates aprovados pelo Meta
-- ================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Informações do template
    name text NOT NULL,
    category text NOT NULL, -- 'utility', 'marketing', 'authentication'
    language text DEFAULT 'pt_BR',
    
    -- Status de aprovação Meta
    status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    meta_template_id text, -- ID do template no Meta
    
    -- Conteúdo do template
    template_body jsonb NOT NULL,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(user_id, name)
);

-- ================================================
-- 3. Mensagens enviadas (log e rastreamento)
-- ================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Relacionamentos
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
    
    -- Detalhes da mensagem
    message_type text NOT NULL, -- 'order_confirmed', 'order_preparing', etc
    template_name text,
    recipient_phone text NOT NULL,
    
    -- IDs do WhatsApp
    whatsapp_message_id text,
    whatsapp_conversation_id text,
    
    -- Status de entrega
    status text DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed'
    
    -- Timestamps de status
    sent_at timestamptz,
    delivered_at timestamptz,
    read_at timestamptz,
    failed_at timestamptz,
    
    -- Erro (se houver)
    error_code text,
    error_message text,
    
    -- Conteúdo enviado (para auditoria)
    message_content jsonb,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    
    -- Índices para performance
    CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed'))
);

-- ================================================
-- 4. Conversas (para atendimento)
-- ================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Cliente
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_phone text NOT NULL,
    customer_name text,
    
    -- WhatsApp IDs
    whatsapp_conversation_id text,
    
    -- Status da conversa
    status text DEFAULT 'open', -- 'open', 'closed', 'archived'
    
    -- Atribuição
    assigned_to text, -- Nome do operador
    
    -- Última atividade
    last_message_at timestamptz DEFAULT now(),
    last_message_from text, -- 'customer', 'business'
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    closed_at timestamptz,
    
    CHECK (status IN ('open', 'closed', 'archived'))
);

-- ================================================
-- 5. Mensagens da conversa (histórico de chat)
-- ================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE NOT NULL,
    
    -- Direção
    direction text NOT NULL, -- 'inbound' (cliente), 'outbound' (negócio)
    
    -- Tipo de mensagem
    message_type text NOT NULL, -- 'text', 'image', 'document', 'audio', 'video', 'location'
    
    -- Conteúdo
    content jsonb NOT NULL, -- { text, media_url, caption, etc }
    
    -- WhatsApp IDs
    whatsapp_message_id text,
    
    -- Status (apenas outbound)
    status text, -- 'sent', 'delivered', 'read', 'failed'
    
    -- Enviado por
    sent_by text, -- Nome do operador (se outbound)
    
    -- Timestamp
    created_at timestamptz DEFAULT now(),
    
    CHECK (direction IN ('inbound', 'outbound')),
    CHECK (message_type IN ('text', 'image', 'document', 'audio', 'video', 'location', 'interactive'))
);

-- ================================================
-- 6. Métricas e analytics
-- ================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_metrics (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Data da métrica
    date date NOT NULL,
    
    -- Contadores
    messages_sent integer DEFAULT 0,
    messages_delivered integer DEFAULT 0,
    messages_read integer DEFAULT 0,
    messages_failed integer DEFAULT 0,
    
    -- Por categoria
    utility_messages integer DEFAULT 0,
    marketing_messages integer DEFAULT 0,
    
    -- Conversões
    orders_from_whatsapp integer DEFAULT 0,
    total_revenue_attributed numeric(10,2) DEFAULT 0,
    
    -- Taxa de resposta
    conversations_started integer DEFAULT 0,
    customer_replies integer DEFAULT 0,
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    UNIQUE(user_id, date)
);

-- ================================================
-- RLS (Row Level Security) Policies
-- ================================================

-- WhatsApp Config
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own WhatsApp config" ON public.whatsapp_config;
CREATE POLICY "Users can manage their own WhatsApp config"
    ON public.whatsapp_config
    FOR ALL
    USING (auth.uid() = user_id);

-- WhatsApp Templates
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own templates" ON public.whatsapp_templates;
CREATE POLICY "Users can manage their own templates"
    ON public.whatsapp_templates
    FOR ALL
    USING (auth.uid() = user_id);

-- WhatsApp Messages
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON public.whatsapp_messages;
CREATE POLICY "Users can view their own messages"
    ON public.whatsapp_messages
    FOR ALL
    USING (auth.uid() = user_id);

-- WhatsApp Conversations
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own conversations" ON public.whatsapp_conversations;
CREATE POLICY "Users can manage their own conversations"
    ON public.whatsapp_conversations
    FOR ALL
    USING (auth.uid() = user_id);

-- WhatsApp Conversation Messages
ALTER TABLE public.whatsapp_conversation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.whatsapp_conversation_messages;
CREATE POLICY "Users can view messages in their conversations"
    ON public.whatsapp_conversation_messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.whatsapp_conversations
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

-- WhatsApp Metrics
ALTER TABLE public.whatsapp_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own metrics" ON public.whatsapp_metrics;
CREATE POLICY "Users can view their own metrics"
    ON public.whatsapp_metrics
    FOR ALL
    USING (auth.uid() = user_id);

-- ================================================
-- Índices para performance
-- ================================================

-- WhatsApp Messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON public.whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_customer_id ON public.whatsapp_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_order_id ON public.whatsapp_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_message_type ON public.whatsapp_messages(message_type);

-- WhatsApp Conversations
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_user_id ON public.whatsapp_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_customer_id ON public.whatsapp_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_status ON public.whatsapp_conversations(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_last_message_at ON public.whatsapp_conversations(last_message_at DESC);

-- WhatsApp Conversation Messages
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_messages_conversation_id ON public.whatsapp_conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conv_messages_created_at ON public.whatsapp_conversation_messages(created_at DESC);

-- WhatsApp Metrics
CREATE INDEX IF NOT EXISTS idx_whatsapp_metrics_user_date ON public.whatsapp_metrics(user_id, date DESC);

-- ================================================
-- Triggers para atualizar updated_at
-- ================================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para whatsapp_config
DROP TRIGGER IF EXISTS update_whatsapp_config_updated_at ON public.whatsapp_config;
CREATE TRIGGER update_whatsapp_config_updated_at
    BEFORE UPDATE ON public.whatsapp_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para whatsapp_templates
DROP TRIGGER IF EXISTS update_whatsapp_templates_updated_at ON public.whatsapp_templates;
CREATE TRIGGER update_whatsapp_templates_updated_at
    BEFORE UPDATE ON public.whatsapp_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para whatsapp_metrics
DROP TRIGGER IF EXISTS update_whatsapp_metrics_updated_at ON public.whatsapp_metrics;
CREATE TRIGGER update_whatsapp_metrics_updated_at
    BEFORE UPDATE ON public.whatsapp_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- Função para atualizar métricas diárias
-- ================================================

CREATE OR REPLACE FUNCTION update_whatsapp_daily_metrics()
RETURNS TRIGGER AS $$
DECLARE
    metric_date date;
    metric_user_id uuid;
BEGIN
    -- Usar NEW para INSERT/UPDATE, OLD para DELETE
    IF TG_OP = 'DELETE' THEN
        metric_date := DATE(OLD.created_at);
        metric_user_id := OLD.user_id;
    ELSE
        metric_date := DATE(NEW.created_at);
        metric_user_id := NEW.user_id;
    END IF;

    -- Inserir ou atualizar métricas
    INSERT INTO public.whatsapp_metrics (user_id, date, messages_sent, messages_delivered, messages_read, messages_failed)
    VALUES (
        metric_user_id,
        metric_date,
        CASE WHEN NEW.status = 'sent' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'read' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        messages_sent = whatsapp_metrics.messages_sent + CASE WHEN NEW.status = 'sent' THEN 1 ELSE 0 END,
        messages_delivered = whatsapp_metrics.messages_delivered + CASE WHEN NEW.status = 'delivered' THEN 1 ELSE 0 END,
        messages_read = whatsapp_metrics.messages_read + CASE WHEN NEW.status = 'read' THEN 1 ELSE 0 END,
        messages_failed = whatsapp_metrics.messages_failed + CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
        updated_at = now();

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar métricas quando mensagem for enviada/atualizada
DROP TRIGGER IF EXISTS trigger_update_whatsapp_metrics ON public.whatsapp_messages;
CREATE TRIGGER trigger_update_whatsapp_metrics
    AFTER INSERT OR UPDATE OF status ON public.whatsapp_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_daily_metrics();

-- ================================================
-- Comentários nas tabelas
-- ================================================

COMMENT ON TABLE public.whatsapp_config IS 'Configurações do WhatsApp Business Cloud API por usuário';
COMMENT ON TABLE public.whatsapp_templates IS 'Templates de mensagens aprovados pelo Meta';
COMMENT ON TABLE public.whatsapp_messages IS 'Log de todas as mensagens enviadas via WhatsApp';
COMMENT ON TABLE public.whatsapp_conversations IS 'Conversas de atendimento ao cliente';
COMMENT ON TABLE public.whatsapp_conversation_messages IS 'Mensagens dentro das conversas de atendimento';
COMMENT ON TABLE public.whatsapp_metrics IS 'Métricas diárias de uso do WhatsApp';

-- ================================================
-- FIM DA MIGRAÇÃO
-- ================================================

-- Verificar se as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename LIKE 'whatsapp%'
ORDER BY tablename;
