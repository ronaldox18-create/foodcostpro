import { supabase } from '../utils/supabaseClient';

// ========================================
// WHATSAPP WEBHOOK SERVICE
// Recebe e processa mensagens do WhatsApp
// ========================================

interface WhatsAppWebhookMessage {
    from: string; // Número do telefone
    id: string; // WhatsApp message ID
    timestamp: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'interactive';
    text?: {
        body: string;
    };
    interactive?: {
        type: string;
        button_reply?: {
            id: string;
            title: string;
        };
        list_reply?: {
            id: string;
            title: string;
        };
    };
    image?: {
        id: string;
        mime_type: string;
        sha256: string;
    };
}

interface WhatsAppStatus {
    id: string; // Message ID
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    errors?: any[];
}

export class WhatsAppWebhookService {

    // ========================================
    // VERIFICAÇÃO DO WEBHOOK (Meta envia isso para verificar)
    // ========================================
    static verifyWebhook(mode: string, token: string, challenge: string): string | null {
        const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'foodcostpro_webhook_2026';

        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verificado com sucesso!');
            return challenge;
        }

        console.error('❌ Webhook verification failed');
        return null;
    }

    // ========================================
    // PROCESSAR MENSAGEM RECEBIDA
    // ========================================
    static async processInboundMessage(
        userId: string,
        message: WhatsAppWebhookMessage
    ): Promise<void> {
        try {
            console.log('📥 Mensagem recebida:', message);

            // 1. Buscar ou criar conversa
            const conversation = await this.getOrCreateConversation(
                userId,
                message.from
            );

            // 2. Salvar mensagem
            const savedMessage = await this.saveMessage(
                conversation.id,
                message,
                'inbound'
            );

            // 3. Atualizar conversa
            await this.updateConversation(conversation.id, {
                last_message_at: new Date().toISOString(),
                last_message_from: 'customer',
                unread_count: (conversation.unread_count || 0) + 1
            });

            // 4. Processar FAQ automático
            if (message.type === 'text' && message.text?.body) {
                const faqResponse = await this.checkFAQ(userId, message.text.body);

                if (faqResponse) {
                    console.log('🤖 FAQ encontrado, enviando resposta automática');
                    await this.sendAutoReply(userId, message.from, faqResponse);
                }
            }

            // 5. Processar botões interativos
            if (message.type === 'interactive') {
                await this.handleInteractive(userId, message.from, message.interactive!);
            }

            console.log('✅ Mensagem processada com sucesso');
        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
            throw error;
        }
    }

    // ========================================
    // PROCESSAR STATUS DE MENSAGEM
    // ========================================
    static async processMessageStatus(
        status: WhatsAppStatus
    ): Promise<void> {
        try {
            console.log('📊 Status recebido:', status);

            // Atualizar status da mensagem
            const { error } = await supabase
                .from('whatsapp_messages')
                .update({
                    status: status.status,
                    delivered_at: status.status === 'delivered' ? new Date(status.timestamp) : undefined,
                    read_at: status.status === 'read' ? new Date(status.timestamp) : undefined,
                    error_message: status.errors ? JSON.stringify(status.errors) : null
                })
                .eq('wa_message_id', status.id);

            if (error) throw error;

            console.log(`✅ Status atualizado: ${status.id} → ${status.status}`);
        } catch (error) {
            console.error('❌ Erro ao processar status:', error);
        }
    }

    // ========================================
    // BUSCAR OU CRIAR CONVERSA
    // ========================================
    private static async getOrCreateConversation(
        userId: string,
        customerPhone: string
    ): Promise<any> {
        // Limpar número (apenas dígitos)
        const cleanPhone = customerPhone.replace(/\D/g, '');

        // Buscar conversa existente
        let { data: conversation, error } = await supabase
            .from('whatsapp_conversations')
            .select('*')
            .eq('user_id', userId)
            .eq('customer_phone', cleanPhone)
            .single();

        // Se não existe, criar
        if (error || !conversation) {
            // Tentar buscar cliente pelo telefone
            const { data: customer } = await supabase
                .from('customers')
                .select('id, name')
                .eq('user_id', userId)
                .eq('phone', cleanPhone)
                .single();

            const { data: newConversation, error: createError } = await supabase
                .from('whatsapp_conversations')
                .insert({
                    user_id: userId,
                    customer_phone: cleanPhone,
                    customer_name: customer?.name,
                    customer_id: customer?.id,
                    status: 'active'
                })
                .select()
                .single();

            if (createError) throw createError;
            conversation = newConversation;
        }

        return conversation;
    }

    // ========================================
    // SALVAR MENSAGEM
    // ========================================
    private static async saveMessage(
        conversationId: string,
        message: WhatsAppWebhookMessage,
        direction: 'inbound' | 'outbound'
    ): Promise<any> {
        const content = message.text?.body ||
            message.interactive?.button_reply?.title ||
            message.interactive?.list_reply?.title ||
            '[Mídia]';

        const messageData = {
            conversation_id: conversationId,
            wa_message_id: message.id,
            direction,
            message_type: message.type,
            content,
            status: 'delivered',
            context: message.interactive ? {
                type: message.interactive.type,
                button_id: message.interactive.button_reply?.id,
                list_id: message.interactive.list_reply?.id
            } : null
        };

        const { data, error } = await supabase
            .from('whatsapp_messages')
            .insert(messageData)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    // ========================================
    // ATUALIZAR CONVERSA
    // ========================================
    private static async updateConversation(
        conversationId: string,
        updates: any
    ): Promise<void> {
        const { error } = await supabase
            .from('whatsapp_conversations')
            .update(updates)
            .eq('id', conversationId);

        if (error) throw error;
    }

    // ========================================
    // VERIFICAR FAQ
    // ========================================
    private static async checkFAQ(
        userId: string,
        messageText: string
    ): Promise<string | null> {
        const lowerText = messageText.toLowerCase();

        // Buscar FAQs ativos do usuário
        const { data: faqs, error } = await supabase
            .from('whatsapp_faq')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('priority', { ascending: false });

        if (error || !faqs || faqs.length === 0) return null;

        // Verificar qual FAQ matches
        for (const faq of faqs) {
            const keywords = faq.keywords || [];
            const hasMatch = keywords.some((keyword: string) =>
                lowerText.includes(keyword.toLowerCase())
            );

            if (hasMatch) {
                // Incrementar contador
                await supabase
                    .from('whatsapp_faq')
                    .update({ triggered_count: (faq.triggered_count || 0) + 1 })
                    .eq('id', faq.id);

                return faq.answer;
            }
        }

        return null;
    }

    // ========================================
    // ENVIAR RESPOSTA AUTOMÁTICA
    // ========================================
    private static async sendAutoReply(
        userId: string,
        to: string,
        message: string
    ): Promise<void> {
        // Importar serviço de envio (reutilizar existente)
        const { WhatsAppService } = await import('./whatsapp');

        try {
            await WhatsAppService.sendTextMessage(to, message);
            console.log('✅ Resposta automática enviada');
        } catch (error) {
            console.error('❌ Erro ao enviar resposta automática:', error);
        }
    }

    // ========================================
    // PROCESSAR BOTÃO INTERATIVO
    // ========================================
    private static async handleInteractive(
        userId: string,
        from: string,
        interactive: any
    ): Promise<void> {
        const buttonId = interactive.button_reply?.id || interactive.list_reply?.id;

        console.log('🔘 Botão clicado:', buttonId);

        // Processar ações baseadas no ID do botão
        switch (buttonId) {
            case 'view_order':
                // Buscar último pedido e enviar detalhes
                break;

            case 'track_order':
                // Enviar localização do entregador
                break;

            case 'contact_support':
                // Marcar conversa como urgente
                await this.escalateConversation(userId, from);
                break;

            default:
                console.log('Botão não reconhecido:', buttonId);
        }
    }

    // ========================================
    // ESCALAR CONVERSA PARA SUPORTE
    // ========================================
    private static async escalateConversation(
        userId: string,
        customerPhone: string
    ): Promise<void> {
        const { error } = await supabase
            .from('whatsapp_conversations')
            .update({
                priority: 'urgent',
                tags: ['suporte']
            })
            .eq('user_id', userId)
            .eq('customer_phone', customerPhone.replace(/\D/g, ''));

        if (error) {
            console.error('Erro ao escalar conversa:', error);
        } else {
            console.log('✅ Conversa escalada para urgente');
        }
    }
}

export default WhatsAppWebhookService;
