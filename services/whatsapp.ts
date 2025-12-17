import { supabase } from '../utils/supabaseClient';
import {
    WhatsAppConfig,
    WhatsAppMessage,
    WhatsAppNotificationType,
    WhatsAppTemplatePayload,
    Order,
    Customer
} from '../types';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Service para integração com WhatsApp Business Cloud API
 */
export const WhatsAppService = {
    /**
     * Buscar configuração do WhatsApp do usuário
     */
    async getConfig(): Promise<WhatsAppConfig | null> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('Usuário não autenticado');
                return null;
            }

            const { data, error } = await supabase
                .from('whatsapp_config')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) {
                console.error('Erro ao buscar config WhatsApp:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Erro ao buscar config WhatsApp:', error);
            return null;
        }
    },

    /**
     * Salvar/Atualizar configuração do WhatsApp
     */
    async saveConfig(config: Partial<WhatsAppConfig>): Promise<boolean> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.error('Usuário não autenticado');
                return false;
            }

            const { error } = await supabase
                .from('whatsapp_config')
                .upsert({
                    user_id: user.id,
                    ...config,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) {
                console.error('Erro ao salvar config WhatsApp:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Erro ao salvar config WhatsApp:', error);
            return false;
        }
    },

    /**
     * Testar conexão com WhatsApp API
     */
    async testConnection(): Promise<{ success: boolean; message: string }> {
        try {
            const config = await this.getConfig();

            if (!config || !config.is_enabled) {
                return {
                    success: false,
                    message: 'WhatsApp não configurado ou desabilitado'
                };
            }

            // Fazer uma requisição simples para verificar o token
            const response = await fetch(
                `${WHATSAPP_API_URL}/${config.phone_number_id}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${config.access_token}`
                    }
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Erro ao testar conexão');
            }

            // Atualizar status da config
            await supabase
                .from('whatsapp_config')
                .update({
                    status: 'active',
                    last_tested_at: new Date().toISOString(),
                    error_message: null
                })
                .eq('user_id', config.user_id);

            return {
                success: true,
                message: 'Conexão testada com sucesso! WhatsApp configurado corretamente.'
            };
        } catch (error: any) {
            console.error('Erro ao testar conexão WhatsApp:', error);

            // Atualizar status de erro
            const config = await this.getConfig();
            if (config) {
                await supabase
                    .from('whatsapp_config')
                    .update({
                        status: 'error',
                        error_message: error.message
                    })
                    .eq('user_id', config.user_id);
            }

            return {
                success: false,
                message: `Falha na conexão: ${error.message}`
            };
        }
    },

    /**
     * Enviar mensagem template
     */
    async sendTemplateMessage(
        payload: WhatsAppTemplatePayload
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            // 1. Buscar configuração
            const config = await this.getConfig();

            if (!config || !config.is_enabled) {
                return {
                    success: false,
                    error: 'WhatsApp não configurado ou desabilitado'
                };
            }

            // 2. Formatar telefone (remover caracteres não numéricos)
            const formattedPhone = payload.recipientPhone.replace(/\D/g, '');

            // Validar telefone brasileiro (deve ter 13 dígitos: 55 + DDD + número)
            if (!formattedPhone.startsWith('55') || formattedPhone.length < 12) {
                return {
                    success: false,
                    error: 'Número de telefone inválido. Deve estar no formato: 5511999999999'
                };
            }

            // 3. Montar payload da API do WhatsApp
            const whatsappPayload = {
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'template',
                template: {
                    name: payload.templateName,
                    language: { code: 'pt_BR' },
                    components: [
                        {
                            type: 'body',
                            parameters: payload.parameters.map(param => ({
                                type: 'text',
                                text: String(param)
                            }))
                        }
                    ]
                }
            };

            // 4. Enviar para WhatsApp API
            const response = await fetch(
                `${WHATSAPP_API_URL}/${config.phone_number_id}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${config.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(whatsappPayload)
                }
            );

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(
                    responseData.error?.message ||
                    'Erro ao enviar mensagem WhatsApp'
                );
            }

            // 5. Salvar log da mensagem
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                await supabase.from('whatsapp_messages').insert({
                    user_id: user.id,
                    customer_id: payload.customerId,
                    order_id: payload.orderId,
                    message_type: payload.notificationType,
                    template_name: payload.templateName,
                    recipient_phone: formattedPhone,
                    whatsapp_message_id: responseData.messages?.[0]?.id,
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                    message_content: whatsappPayload
                });
            }

            return {
                success: true,
                messageId: responseData.messages?.[0]?.id
            };
        } catch (error: any) {
            console.error('Erro ao enviar mensagem WhatsApp:', error);

            // Salvar log de erro
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('whatsapp_messages').insert({
                    user_id: user.id,
                    customer_id: payload.customerId,
                    order_id: payload.orderId,
                    message_type: payload.notificationType,
                    template_name: payload.templateName,
                    recipient_phone: payload.recipientPhone.replace(/\D/g, ''),
                    status: 'failed',
                    failed_at: new Date().toISOString(),
                    error_message: error.message
                });
            }

            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Notificar confirmação de pedido
     */
    async notifyOrderConfirmed(
        order: Order,
        customer: Customer
    ): Promise<boolean> {
        try {
            const config = await this.getConfig();

            if (!config || !config.is_enabled || !config.auto_send_order_confirmed) {
                return false;
            }

            if (!customer.phone) {
                console.warn('Cliente sem telefone cadastrado');
                return false;
            }

            // Calcular tempo estimado (pode ser configurável)
            const estimatedTime = order.deliveryType === 'delivery' ? '40-50 minutos' : '25-35 minutos';

            const result = await this.sendTemplateMessage({
                recipientPhone: customer.phone,
                templateName: 'order_confirmed', // ⚠️ Usando template antigo (sem _v2)
                parameters: [
                    customer.name || 'Cliente', // {{1}}
                    order.id.substring(0, 8).toUpperCase(), // {{2}}
                    order.items.length.toString(), // {{3}} Quantidade de itens
                    order.totalAmount.toFixed(2), // {{4}} Valor total
                    order.deliveryType === 'delivery' ? 'Entrega' : 'Retirada', // {{5}} Tipo
                    estimatedTime, // {{6}} Tempo estimado
                    `https://app.foodcostpro.com/track/${order.id}`, // {{7}} Link
                    'FoodCostPro' // {{8}} Nome do restaurante
                ],
                notificationType: 'order_confirmed',
                orderId: order.id,
                customerId: customer.id
            });

            return result.success;
        } catch (error) {
            console.error('Erro ao notificar pedido confirmado:', error);
            return false;
        }
    },

    /**
     * Notificar mudança de status do pedido
     */
    async notifyOrderStatusChange(
        order: Order,
        customer: Customer,
        newStatus: string
    ): Promise<boolean> {
        try {
            const config = await this.getConfig();

            if (!config || !config.is_enabled) {
                return false;
            }

            if (!customer.phone) {
                return false;
            }

            // Mapear status para tipo de notificação e template
            const statusMap: Record<string, { type: WhatsAppNotificationType; template: string; autoSend: boolean }> = {
                'preparing': {
                    type: 'order_preparing',
                    template: 'order_preparing', // ⚠️ Usando template antigo
                    autoSend: config.auto_send_order_preparing
                },
                'ready': {
                    type: 'order_ready',
                    template: 'order_ready', // ✅ Já está correto
                    autoSend: config.auto_send_order_ready
                },
                'delivered': {
                    type: 'order_delivered',
                    template: 'order_delivered', // ⚠️ Usando template antigo
                    autoSend: config.auto_send_order_delivered
                }
            };

            const statusInfo = statusMap[newStatus];

            if (!statusInfo || !statusInfo.autoSend) {
                return false;
            }

            // Parâmetros básicos (podem variar por template)
            const parameters = [order.id.substring(0, 8).toUpperCase()];

            // Adicionar parâmetros específicos por status
            if (newStatus === 'preparing') {
                // Template v2: pedido# + tempo
                parameters.push('20'); // {{2}} tempo estimado em minutos
            } else if (newStatus === 'ready') {
                // Template: pedido# + código
                parameters.push('RET-' + order.id.substring(0, 4).toUpperCase()); // {{2}} Código de retirada
            } else if (newStatus === 'delivered') {
                // Template antigo: pedido# + link + pontos ganhos + total pontos
                parameters.push(
                    `https://app.foodcostpro.com/review/${order.id}`, // {{2}} Link avaliação
                    Math.floor(order.totalAmount).toString(), // {{3}} Pontos ganhos
                    '1350' // {{4}} Total de pontos (idealmente buscar do customer)
                );
            }

            const result = await this.sendTemplateMessage({
                recipientPhone: customer.phone,
                templateName: statusInfo.template,
                parameters,
                notificationType: statusInfo.type,
                orderId: order.id,
                customerId: customer.id
            });

            return result.success;
        } catch (error) {
            console.error('Erro ao notificar mudança de status:', error);
            return false;
        }
    },

    /**
     * Notificar pontos de fidelidade ganhos
     */
    async notifyLoyaltyPointsEarned(
        customer: Customer,
        pointsEarned: number,
        totalPoints: number,
        currentLevel: string
    ): Promise<boolean> {
        try {
            const config = await this.getConfig();

            if (!config || !config.is_enabled || !config.auto_send_loyalty_points) {
                return false;
            }

            if (!customer.phone) {
                return false;
            }

            const result = await this.sendTemplateMessage({
                recipientPhone: customer.phone,
                templateName: 'loyalty_points_earned',
                parameters: [
                    customer.name || 'Cliente',
                    pointsEarned.toString(),
                    totalPoints.toString(),
                    currentLevel,
                    'Próximo benefício', // Calcular baseado no sistema de níveis
                    '150', // Pontos faltantes (calcular)
                    `https://app.foodcostpro.com/rewards`
                ],
                notificationType: 'loyalty_points_earned',
                customerId: customer.id
            });

            return result.success;
        } catch (error) {
            console.error('Erro ao notificar pontos ganhos:', error);
            return false;
        }
    },

    /**
     * Buscar histórico de mensagens
     */
    async getMessages(filters?: {
        customerId?: string;
        orderId?: string;
        status?: string;
        limit?: number;
    }): Promise<WhatsAppMessage[]> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return [];

            let query = supabase
                .from('whatsapp_messages')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (filters?.customerId) {
                query = query.eq('customer_id', filters.customerId);
            }
            if (filters?.orderId) {
                query = query.eq('order_id', filters.orderId);
            }
            if (filters?.status) {
                query = query.eq('status', filters.status);
            }
            if (filters?.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Erro ao buscar mensagens:', error);
                return [];
            }

            return data || [];
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
            return [];
        }
    },

    /**
     * Buscar métricas do WhatsApp
     */
    async getMetrics(startDate?: string, endDate?: string) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            let query = supabase
                .from('whatsapp_metrics')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });

            if (startDate) {
                query = query.gte('date', startDate);
            }
            if (endDate) {
                query = query.lte('date', endDate);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Erro ao buscar métricas:', error);
                return null;
            }

            // Calcular totais
            const totals = {
                messages_sent: 0,
                messages_delivered: 0,
                messages_read: 0,
                messages_failed: 0,
                delivery_rate: 0,
                read_rate: 0
            };

            if (data && data.length > 0) {
                data.forEach(metric => {
                    totals.messages_sent += metric.messages_sent;
                    totals.messages_delivered += metric.messages_delivered;
                    totals.messages_read += metric.messages_read;
                    totals.messages_failed += metric.messages_failed;
                });

                totals.delivery_rate = totals.messages_sent > 0
                    ? (totals.messages_delivered / totals.messages_sent) * 100
                    : 0;

                totals.read_rate = totals.messages_delivered > 0
                    ? (totals.messages_read / totals.messages_delivered) * 100
                    : 0;
            }

            return {
                daily: data,
                totals
            };
        } catch (error) {
            console.error('Erro ao buscar métricas:', error);
            return null;
        }
    }
};
