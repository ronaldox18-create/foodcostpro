// ========================================
// WHATSAPP WEBHOOK ENDPOINT
// Vercel Serverless Function
// ========================================

import { VercelRequest, VercelResponse } from '@vercel/node';
import WhatsAppWebhookService from '../../services/whatsappWebhook';

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    // ========================================
    // GET: Verificação do Webhook (Meta)
    // ========================================
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'] as string;
        const token = req.query['hub.verify_token'] as string;
        const challenge = req.query['hub.challenge'] as string;

        const verifyResult = WhatsAppWebhookService.verifyWebhook(mode, token, challenge);

        if (verifyResult) {
            return res.status(200).send(verifyResult);
        } else {
            return res.status(403).send('Forbidden');
        }
    }

    // ========================================
    // POST: Receber Mensagens/Status
    // ========================================
    if (req.method === 'POST') {
        try {
            const body = req.body;

            console.log('📥 Webhook recebido:', JSON.stringify(body, null, 2));

            // Verificar se tem dados
            if (!body.entry || body.entry.length === 0) {
                return res.status(200).send('OK');
            }

            // Processar cada entrada
            for (const entry of body.entry) {
                // Obter o phone_number_id (para identificar a conta)
                const phoneNumberId = entry.changes?.[0]?.value?.metadata?.phone_number_id;

                // Processar mensagens
                if (entry.changes?.[0]?.value?.messages) {
                    const messages = entry.changes[0].value.messages;

                    for (const message of messages) {
                        // Buscar userId pelo phone_number_id
                        const userId = await getUserIdByPhoneNumberId(phoneNumberId);

                        if (userId) {
                            await WhatsAppWebhookService.processInboundMessage(
                                userId,
                                message
                            );
                        }
                    }
                }

                // Processar status de mensagens
                if (entry.changes?.[0]?.value?.statuses) {
                    const statuses = entry.changes[0].value.statuses;

                    for (const status of statuses) {
                        await WhatsAppWebhookService.processMessageStatus(status);
                    }
                }
            }

            return res.status(200).send('OK');
        } catch (error) {
            console.error('❌ Erro no webhook:', error);
            // Retornar 200 mesmo com erro para não ficar retentando
            return res.status(200).send('OK');
        }
    }

    return res.status(405).send('Method Not Allowed');
}

// ========================================
// HELPER: Buscar User ID pelo Phone Number ID
// ========================================
async function getUserIdByPhoneNumberId(phoneNumberId: string): Promise<string | null> {
    try {
        const { createClient } = await import('@supabase/supabase-js');

        const supabase = createClient(
            process.env.VITE_SUPABASE_URL!,
            process.env.VITE_SUPABASE_ANON_KEY!
        );

        const { data, error } = await supabase
            .from('whatsapp_config')
            .select('user_id')
            .eq('phone_number_id', phoneNumberId)
            .eq('is_enabled', true)
            .single();

        if (error || !data) {
            console.error('User não encontrado para phone_number_id:', phoneNumberId);
            return null;
        }

        return data.user_id;
    } catch (error) {
        console.error('Erro ao buscar user_id:', error);
        return null;
    }
}
