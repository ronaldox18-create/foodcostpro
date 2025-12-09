
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// --- CONFIGURATION ---
const IFOOD_AUTH_URL = 'https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token';
const IFOOD_API_URL = 'https://merchant-api.ifood.com.br/order/v1.0';
const IFOOD_MERCHANT_API_URL = 'https://merchant-api.ifood.com.br/merchant/v1.0';

// --- ENV LOADING ---
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (!fs.existsSync(envPath)) return {};
        const envContent = fs.readFileSync(envPath, 'utf-8');
        return envContent.split('\n').reduce((acc, line) => {
            const [key, value] = line.split('=');
            if (key && value) acc[key.trim()] = value.trim().replace(/"/g, '');
            return acc;
        }, {} as Record<string, string>);
    } catch (e) {
        return {};
    }
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Tenta usar Service Role Key primeiro, senão Anon Key
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ ERRO: Credenciais do Supabase não encontradas no .env");
    console.error("Certifique-se de ter VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (recomendado) definidos.");
    process.exit(1);
}

if (!env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("\n⚠️  ATENÇÃO: Você não definiu a SUPABASE_SERVICE_ROLE_KEY no arquivo .env.");
    console.warn("   Sem essa chave, as regras de segurança (RLS) do banco vão esconder as integrações.");
    console.warn("   O script não vai encontrar nada. Adicione SUPABASE_SERVICE_ROLE_KEY=... no .env\n");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- HELPERS ---

async function getIfoodToken(creds: any): Promise<string | null> {
    try {
        console.log("🔑 Obtendo token do iFood...");
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
            console.error(`❌ Erro ao obter token: ${response.status} ${response.statusText}`);
            const txt = await response.text();
            console.error(txt);
            return null;
        }

        const data = await response.json();
        const token = data.accessToken;

        // DEBUG: Verificar quais lojas esse token acessa
        console.log("   🕵️  Verificando acesso a lojas...");
        const merchResp = await fetch('https://merchant-api.ifood.com.br/merchant/v1.0/merchants', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (merchResp.ok) {
            const merchants = await merchResp.json();
            console.log("   🏢 Lojas acessíveis:", merchants.map((m: any) => `${m.name} (${m.id})`).join(', '));

            // TRUQUE PARA FORÇAR EVENTOS:
            // Tentar status da loja
            if (merchants.length > 0) {
                const merchantId = merchants[0].id;
                console.log(`   🔧 Verificando status da loja ${merchantId}...`);
                const statusResp = await fetch(`${IFOOD_MERCHANT_API_URL}/merchants/${merchantId}/status`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (statusResp.ok) {
                    const statusData = await statusResp.json();
                    console.log("   🟢 Status da Loja:", JSON.stringify(statusData));
                }
            }
        } else {
            console.warn("   ⚠️  Não foi possível listar lojas:", merchResp.status);
        }

        return token;
    } catch (error) {
        console.error("❌ Exceção ao obter token:", error);
        return null;
    }
}

async function fetchOrders(token: string) {
    try {
        console.log("   📡 Fazendo polling no iFood...");
        const response = await fetch(`${IFOOD_API_URL}/events:polling`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 204) {
            console.log("   💤 iFood respondeu: Sem novos eventos (204)");
            return [];
        }

        if (!response.ok) {
            console.error(`   ⚠️ Erro no polling: ${response.status} ${response.statusText}`);
            const txt = await response.text();
            console.error("   Detalhes:", txt);
            return [];
        }

        const events = await response.json();
        console.log("   📦 Eventos recebidos:", events);
        return events || [];
    } catch (error) {
        console.error("   ⚠️ Erro ao fazer polling:", error);
        return [];
    }
}

// FALLBACK: Buscar pedidos recentes diretamente (útil para testes)
async function fetchRecentOrdersDirectly(token: string) {
    try {
        console.log("   🕵️  Busca direta de pedidos recentes (Fallback)...");
        // Busca pedidos de hoje
        const response = await fetch(`${IFOOD_API_URL}/orders?page=1&limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const orders = await response.json();
            if (orders && orders.length > 0) {
                console.log(`   📦 Encontrados ${orders.length} pedidos na busca direta!`);
                return orders.map((o: any) => ({
                    code: 'PLC',
                    orderId: o.id,
                    fullOrder: o // Passamos o pedido completo se já vier
                }));
            }
        }
        return [];
    } catch (e) {
        return [];
    }
}

async function acknowledgeEvents(token: string, events: any[]) {
    try {
        const payload = events.map(e => ({ id: e.id }));
        const response = await fetch(`${IFOOD_API_URL}/events/acknowledgment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) console.log(`✅ ${events.length} eventos confirmados.`);
        else console.error("⚠️ Falha ao confirmar eventos");
    } catch (error) {
        console.error("⚠️ Erro no acknowledgment:", error);
    }
}

async function getOrderDetails(token: string, orderId: string) {
    const response = await fetch(`${IFOOD_API_URL}/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) return await response.json();
    return null;
}

// --- MAIN LOOP ---

async function run() {
    console.log("🤖 Iniciando Sincronizador iFood (FoodCost Pro)...");

    while (true) {
        try {
            // 1. Buscar integrações ativas
            const { data: integrations, error } = await supabase
                .from('user_integrations')
                .select('*')
                .eq('provider', 'ifood')
            // .eq('is_enabled', true) // Se quiser filtrar

            if (error) {
                console.error("❌ Erro ao buscar integrações:", error.message);
                if (error.message.includes("RLS")) {
                    console.error("💡 DICA: Configure a SUPABASE_SERVICE_ROLE_KEY no .env para ignorar RLS.");
                }
            }

            if (integrations && integrations.length > 0) {
                console.log(`🔎 Verificando ${integrations.length} integrações...`);

                for (const integ of integrations) {
                    if (!integ.credentials?.clientId || !integ.credentials?.clientSecret) continue;

                    // Auth
                    const token = await getIfoodToken(integ.credentials);
                    if (!token) continue;

                    // Polling
                    let events = await fetchOrders(token);

                    // Se não tiver eventos no polling, tenta fallback direto (Apenas para garantir em testes)
                    if (events.length === 0) {
                        const directOrders = await fetchRecentOrdersDirectly(token);
                        if (directOrders.length > 0) {
                            events = directOrders;
                        }
                    }

                    if (events.length > 0) {
                        console.log(`📦 ${events.length} novos eventos para usuário ${integ.user_id}`);

                        const ordersToAck = [];

                        for (const event of events) {
                            if (event.orderId) {
                                console.log(`✨ Evento ${event.code} identificado para pedido ${event.orderId}`);

                                // Verificar se pedido já existe
                                const { data: existingOrder } = await supabase
                                    .from('orders')
                                    .select('id, status')
                                    .eq('external_id', event.orderId)
                                    .maybeSingle();

                                if (existingOrder) {
                                    // Atualizar status se necessário
                                    console.log(`   🔄 Pedido já existe. Atualizando status...`);
                                    // Mapeamento simples de status
                                    let newStatus = existingOrder.status;
                                    if (event.code === 'CAN') newStatus = 'canceled';
                                    if (event.code === 'CFM' || event.code === 'RDR') newStatus = 'preparing';
                                    if (event.code === 'DSP') newStatus = 'delivered';
                                    if (event.code === 'CON') newStatus = 'completed';

                                    if (newStatus !== existingOrder.status) {
                                        await supabase.from('orders').update({ status: newStatus }).eq('id', existingOrder.id);
                                        console.log(`   ✅ Status atualizado: ${existingOrder.status} -> ${newStatus}`);
                                    }
                                } else {
                                    // Pedido não existe: Baixar COMPLETO e Salvar
                                    console.log(`   📥 Novo pedido detectado (via ${event.code}). Baixando detalhes...`);
                                    const orderDetails = await getOrderDetails(token, event.orderId) || event.fullOrder; // fullOrder vem do fallback

                                    if (orderDetails) {
                                        // Definir status inicial baseado no evento
                                        let initialStatus = 'pending';
                                        if (event.code === 'CAN') initialStatus = 'canceled';

                                        const { error: insErr } = await supabase.from('orders').insert({
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

                                        if (insErr) console.error("❌ Erro ao salvar pedido:", insErr.message);
                                        else console.log("💾 Pedido salvo no banco com sucesso!");
                                    } else {
                                        console.warn("   ⚠️ Não foi possível baixar detalhes do pedido.");
                                    }
                                }
                            }
                            ordersToAck.push(event);
                        }

                        // Acknowledge (Confirmar recebimento)
                        if (ordersToAck.length > 0) {
                            await acknowledgeEvents(token, ordersToAck);
                        }
                    } else {
                        // console.log(".");
                    }
                }
            } else {
                console.log("💤 Nenhuma integração ativa encontrada.");
            }

        } catch (error) {
            console.error("❌ Erro fatal no loop:", error);
        }

        // Wait 30 seconds
        await new Promise(resolve => setTimeout(resolve, 30000));
    }
}

run();
