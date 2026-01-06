import makeWASocket, {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    Browsers
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { supabase } from '../utils/supabaseClient';
import axios from 'axios';

// ========================================
// WHATSAPP BOT - BAILEYS + DEEPSEEK
// Sistema 100% Gratuito e Didático
// ========================================

interface WhatsAppConfig {
    userId: string;
    isEnabled: boolean;
    aiEnabled: boolean;
    businessName: string;
    welcomeMessage?: string;
}

export class WhatsAppBotService {
    private sock: any = null;
    private config: WhatsAppConfig | null = null;
    private isConnected = false;

    // ========================================
    // INICIALIZAR BOT
    // ========================================
    async start(userId: string) {
        console.log('🤖 Iniciando WhatsApp Bot...');

        try {
            // 1. Carregar configuração do usuário
            this.config = await this.loadConfig(userId);

            if (!this.config.isEnabled) {
                console.log('⏸️ Bot desabilitado nas configurações');
                return;
            }

            // 2. Configurar autenticação
            const { state, saveCreds } = await useMultiFileAuthState(`./whatsapp_sessions/${userId}`);

            // 3. Versão mais recente do Baileys
            const { version } = await fetchLatestBaileysVersion();

            // 4. Criar conexão
            this.sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
                },
                printQRInTerminal: true, // Mostra QR no terminal
                logger: pino({ level: 'silent' }), // Sem logs verbosos
                browser: Browsers.macOS('Desktop'), // Aparece como Desktop
                markOnlineOnConnect: true
            });

            // 5. Salvar credenciais quando atualizam
            this.sock.ev.on('creds.update', saveCreds);

            // 6. Monitorar conexão
            this.sock.ev.on('connection.update', async (update: any) => {
                await this.handleConnection(update, userId);
            });

            // 7. Receber mensagens
            this.sock.ev.on('messages.upsert', async (m: any) => {
                await this.handleMessage(m, userId);
            });

            console.log('✅ WhatsApp Bot iniciado!');
        } catch (error) {
            console.error('❌ Erro ao iniciar bot:', error);
            throw error;
        }
    }

    // ========================================
    // GERENCIAR CONEXÃO
    // ========================================
    private async handleConnection(update: any, userId: string) {
        const { connection, lastDisconnect, qr } = update;

        // QR Code gerado - salvar no banco para mostrar no admin
        if (qr) {
            console.log('📱 QR Code gerado!');
            await this.saveQRCode(userId, qr);
        }

        // Conectado
        if (connection === 'open') {
            console.log('✅ WhatsApp conectado com sucesso!');
            this.isConnected = true;

            // Atualizar status no banco
            await supabase
                .from('whatsapp_bot_config')
                .update({
                    is_connected: true,
                    connected_at: new Date().toISOString(),
                    qr_code: null // Limpar QR
                })
                .eq('user_id', userId);
        }

        // Desconectado
        if (connection === 'close') {
            const shouldReconnect =
                (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log('🔌 Conexão fechada. Reconectar?', shouldReconnect);

            this.isConnected = false;

            await supabase
                .from('whatsapp_bot_config')
                .update({ is_connected: false })
                .eq('user_id', userId);

            if (shouldReconnect) {
                console.log('🔄 Reconectando em 5 segundos...');
                setTimeout(() => this.start(userId), 5000);
            }
        }
    }

    // ========================================
    // PROCESSAR MENSAGEM RECEBIDA
    // ========================================
    private async handleMessage(messageUpdate: any, userId: string) {
        try {
            const message = messageUpdate.messages[0];

            // Ignorar mensagens próprias
            if (!message.key.fromMe && message.message) {
                const from = message.key.remoteJid; // Número do cliente
                const name = message.pushName || 'Cliente';
                const text = message.message.conversation ||
                    message.message.extendedTextMessage?.text || '';

                console.log(`📥 Mensagem de ${name} (${from}): ${text}`);

                // Salvar no banco
                await this.saveMessage(userId, from, name, text, 'received');

                // Processar resposta
                const response = await this.generateResponse(userId, from, text, name);

                if (response) {
                    await this.sendMessage(from, response);
                    await this.saveMessage(userId, from, name, response, 'sent');
                }
            }
        } catch (error) {
            console.error('❌ Erro ao processar mensagem:', error);
        }
    }

    // ========================================
    // GERAR RESPOSTA (FAQ + IA)
    // ========================================
    private async generateResponse(
        userId: string,
        phoneNumber: string,
        messageText: string,
        customerName: string
    ): Promise<string | null> {

        // 1. Verificar FAQ primeiro (mais rápido e grátis)
        const faqResponse = await this.checkFAQ(userId, messageText);
        if (faqResponse) {
            console.log('💬 Resposta do FAQ');
            return faqResponse;
        }

        // 2. Se IA está habilitada, usar DeepSeek
        if (this.config?.aiEnabled) {
            console.log('🤖 Usando IA (DeepSeek)...');
            return await this.getAIResponse(userId, phoneNumber, messageText, customerName);
        }

        // 3. Mensagem padrão se não tem resposta
        return null;
    }

    // ========================================
    // VERIFICAR FAQ
    // ========================================
    private async checkFAQ(userId: string, messageText: string): Promise<string | null> {
        const lowerText = messageText.toLowerCase();

        // Buscar FAQs do usuário
        const { data: faqs } = await supabase
            .from('whatsapp_faq')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('priority', { ascending: false });

        if (!faqs || faqs.length === 0) return null;

        // Verificar keywords
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
    // RESPOSTA DA IA (DEEPSEEK)
    // ========================================
    private async getAIResponse(
        userId: string,
        phoneNumber: string,
        messageText: string,
        customerName: string
    ): Promise<string> {
        try {
            // Buscar contexto (últimas 5 mensagens)
            const { data: history } = await supabase
                .from('whatsapp_messages')
                .select('content, direction')
                .eq('user_id', userId)
                .eq('customer_phone', phoneNumber)
                .order('created_at', { ascending: false })
                .limit(5);

            // Montar contexto da conversa
            const conversationHistory = history?.reverse().map(h => ({
                role: h.direction === 'received' ? 'user' : 'assistant',
                content: h.content
            })) || [];

            // Buscar cardápio do usuário
            const { data: products } = await supabase
                .from('products')
                .select('name, current_price, description')
                .eq('user_id', userId)
                .eq('visible', true)
                .limit(20);

            const menuText = products?.map(p =>
                `${p.name} - R$ ${p.current_price}${p.description ? ` (${p.description})` : ''}`
            ).join('\n') || 'Cardápio não disponível';

            // Prompt para a IA
            const systemPrompt = `Você é um atendente virtual do restaurante "${this.config?.businessName || 'nosso restaurante'}".

Seja educado, prestativo e natural. Use emojis quando apropriado.

CARDÁPIO DISPONÍVEL:
${menuText}

REGRAS:
1. Se cliente perguntar preços/cardápio, mostre as opções
2. Se quiser fazer pedido, confirme os itens e valores
3. Seja cordial e use o nome do cliente (${customerName})
4. Não invente preços - use apenas os do cardápio
5. Se não souber, diga que vai transferir para atendente humano

IMPORTANTE: Seja breve e objetivo. Máximo 3-4 linhas por resposta.`;

            // Chamar API do DeepSeek
            const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...conversationHistory,
                    { role: 'user', content: messageText }
                ],
                temperature: 0.7,
                max_tokens: 200
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY || 'sk-xxx'}`,
                    'Content-Type': 'application/json'
                }
            });

            const aiMessage = response.data.choices[0].message.content;
            console.log('🤖 Resposta da IA:', aiMessage);

            return aiMessage;
        } catch (error) {
            console.error('❌ Erro na IA:', error);
            return 'Desculpe, tive um problema técnico. Um atendente já vai te responder! 😊';
        }
    }

    // ========================================
    // ENVIAR MENSAGEM
    // ========================================
    async sendMessage(to: string, text: string) {
        if (!this.sock || !this.isConnected) {
            throw new Error('WhatsApp não conectado');
        }

        try {
            await this.sock.sendMessage(to, { text });
            console.log(`📤 Mensagem enviada para ${to}`);
        } catch (error) {
            console.error('❌ Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    // ========================================
    // SALVAR MENSAGEM NO BANCO
    // ========================================
    private async saveMessage(
        userId: string,
        phone: string,
        name: string,
        content: string,
        direction: 'received' | 'sent'
    ) {
        try {
            await supabase.from('whatsapp_messages').insert({
                user_id: userId,
                customer_phone: phone.replace(/\D/g, ''),
                customer_name: name,
                content,
                direction,
                created_at: new Date().toISOString()
            });
        } catch (error) {
            console.error('Erro ao salvar mensagem:', error);
        }
    }

    // ========================================
    // SALVAR QR CODE
    // ========================================
    private async saveQRCode(userId: string, qr: string) {
        try {
            await supabase
                .from('whatsapp_bot_config')
                .upsert({
                    user_id: userId,
                    qr_code: qr,
                    qr_generated_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Erro ao salvar QR:', error);
        }
    }

    // ========================================
    // CARREGAR CONFIGURAÇÃO
    // ========================================
    private async loadConfig(userId: string): Promise<WhatsAppConfig> {
        const { data } = await supabase
            .from('whatsapp_bot_config')
            .select('*')
            .eq('user_id', userId)
            .single();

        const { data: settings } = await supabase
            .from('settings')
            .select('business_name')
            .eq('user_id', userId)
            .single();

        return {
            userId,
            isEnabled: data?.is_enabled || false,
            aiEnabled: data?.ai_enabled || false,
            businessName: settings?.business_name || 'Restaurante',
            welcomeMessage: data?.welcome_message
        };
    }

    // ========================================
    // DESCONECTAR
    // ========================================
    async disconnect() {
        if (this.sock) {
            await this.sock.logout();
            this.sock = null;
            this.isConnected = false;
            console.log('👋 WhatsApp desconectado');
        }
    }

    // ========================================
    // STATUS
    // ========================================
    getStatus() {
        return {
            connected: this.isConnected,
            config: this.config
        };
    }
}

// Singleton instance
export const whatsappBot = new WhatsAppBotService();
