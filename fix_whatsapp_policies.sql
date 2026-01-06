-- FIX: Corrigir policies que causaram erro

-- Remover policies antigas (se existirem)
DROP POLICY IF EXISTS "Users can view messages from own conversations" ON whatsapp_messages;
DROP POLICY IF EXISTS "Users can insert messages to own conversations" ON whatsapp_messages;

-- Criar policies corretas
CREATE POLICY "Users can view messages from own conversations"
    ON whatsapp_messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM whatsapp_conversations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages to own conversations"
    ON whatsapp_messages FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT id FROM whatsapp_conversations
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update messages from own conversations"
    ON whatsapp_messages FOR UPDATE
    USING (
        conversation_id IN (
            SELECT id FROM whatsapp_conversations
            WHERE user_id = auth.uid()
        )
    );
