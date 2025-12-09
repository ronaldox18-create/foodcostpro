
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- CONFIGURATION ---
const IFOOD_AUTH_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';
const IFOOD_API_URL = 'https://merchant-api.ifood.com.br/order/v1.0';

// Setup Supabase Client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- HELPERS ---

async function getIfoodToken(creds: any): Promise<string | null> {
    try {
        const params = new URLSearchParams();
        params.append('grantType', 'client_credentials');
        params.append('clientId', creds.clientId);
        params.append('clientSecret', creds.clientSecret);

        const response = await fetch(IFOOD_AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params
        });

        if (!response.ok) {
            console.error(`Erro Auth: ${await response.text()}`);
            return null;
        }

        const data = await response.json();
        return data.accessToken;
    } catch (error) {
        console.error("Erro token:", error);
        return null;
    }
}

async function fetchOrders(token: string) {
    try {
        const response = await fetch(`${IFOOD_API_URL}/events:polling`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 204) return [];
        if (!response.ok) return [];

        return await response.json();
    } catch (error) {
        console.error("Erro polling:", error);
        return [];
    }
}

async function getOrderDetails(token: string, orderId: string) {
    const response = await fetch(`${IFOOD_API_URL}/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) return await response.json();
    return null;
}

async function acknowledgeEvents(token: string, events: any[]) {
    try {
        const payload = events.map(e => ({ id: e.id }));
        await fetch(`${IFOOD_API_URL}/events/acknowledgment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
    } catch (error) {
        console.error("Erro ack:", error);
    }
}

// Fallback para buscar pedidos recentes se o polling falhar em testes
async function fetchRecentOrdersDirectly(token: string) {
    try {
        const response = await fetch(`${IFOOD_API_URL}/orders?page=1&limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const orders = await response.json();
            return orders.map((o: any) => ({
                orderId: o.id,
                code: 'PLC', // Força como se fosse um evento de pedido
                fullOrder: o
            }));
        }
        return [];
    } catch (e) {
        return [];
    }
}

// --- MAIN FUNCTION ---

Deno.serve(async (req) => {
    console.log("🤖 Edge Function iFood Sync Iniciada");

    try {
        // 1. Buscar integrações ativas
        const { data: integrations, error } = await supabase
            .from('user_integrations')
            .select('*')
            .eq('provider', 'ifood');

        if (error) throw error;
        if (!integrations || integrations.length === 0) {
            return new Response(JSON.stringify({ message: "Nenhuma integração ativa" }), { headers: { 'Content-Type': 'application/json' } });
        }

        let totalProcessed = 0;

        for (const integ of integrations) {
            if (!integ.credentials?.clientId || !integ.credentials?.clientSecret) continue;

            const token = await getIfoodToken(integ.credentials);
            if (!token) continue;

            // Tenta Polling Normal
            let events = await fetchOrders(token);

            // Fallback (Opcional, bom manter para garantir robustez)
            if (events.length === 0) {
                // Nota: Em produção, cuidado com o fallback excessivo para não estourar limite de requisições. 
                // Aqui vamos manter simples.
            }

            if (events.length > 0) {
                const ordersToAck = [];

                for (const event of events) {
                    if (event.orderId) {
                        // Verificar se pedido já existe
                        const { data: existingOrder } = await supabase
                            .from('orders')
                            .select('id, status')
                            .eq('external_id', event.orderId)
                            .maybeSingle();

                        if (existingOrder) {
                            // Atualizar Status
                            let newStatus = existingOrder.status;
                            if (event.code === 'CAN') newStatus = 'canceled';
                            if (event.code === 'CFM' || event.code === 'RDR') newStatus = 'preparing';
                            if (event.code === 'DSP') newStatus = 'delivered';
                            if (event.code === 'CON') newStatus = 'completed';

                            if (newStatus !== existingOrder.status) {
                                await supabase.from('orders').update({ status: newStatus }).eq('id', existingOrder.id);
                            }
                        } else {
                            // Criar Novo
                            const orderDetails = await getOrderDetails(token, event.orderId) || event.fullOrder;

                            if (orderDetails) {
                                let initialStatus = 'pending';
                                if (event.code === 'CAN') initialStatus = 'canceled';

                                await supabase.from('orders').insert({
                                    user_id: integ.user_id,
                                    external_id: event.orderId,
                                    integration_source: 'ifood',
                                    status: initialStatus,
                                    customer_name: orderDetails.customer.name,
                                    total_amount: orderDetails.total.orderAmount,
                                    payment_method: 'ifood',
                                    external_metadata: orderDetails,
                                    date: orderDetails.createdAt || new Date().toISOString()
                                });
                                totalProcessed++;
                            }
                        }
                    }
                    ordersToAck.push(event);
                }

                if (ordersToAck.length > 0) {
                    await acknowledgeEvents(token, ordersToAck);
                }
            }
        }

        return new Response(JSON.stringify({ message: "Sync concluído", processed: totalProcessed }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error("Erro fatal:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
