import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
    try {
        const signature = req.headers.get('Stripe-Signature')
        const body = await req.text()

        if (!signature || !STRIPE_WEBHOOK_SECRET) {
            return new Response('Missing signature or secret', { status: 400 });
        }

        let event
        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET, undefined, cryptoProvider)
        } catch (err) {
            return new Response(err.message, { status: 400 })
        }

        console.log(`🔔 Event received: ${event.type}`);

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object
            if (session.mode === 'subscription') {
                const subscriptionId = session.subscription
                const customerId = session.customer
                const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)

                const planType = subscription.metadata.plan_type || session.metadata?.plan_type || 'pro'
                const supabaseUserId = subscription.metadata.supabase_user_id || session.metadata?.supabase_user_id

                console.log(`✅ Nova assinatura processada: ${subscriptionId} para User ${supabaseUserId}`);

                if (supabaseUserId) {
                    // 1. Atualiza o banco de dados
                    await supabase
                        .from('user_settings')
                        .update({
                            plan: planType,
                            stripe_customer_id: customerId,
                            stripe_subscription_id: subscriptionId,
                            subscription_status: 'active'
                        })
                        .eq('user_id', supabaseUserId)

                    // 2. LIMPEMANTO: Cancela assinaturas antigas duplicadas
                    if (customerId) {
                        try {
                            const subscriptions = await stripe.subscriptions.list({
                                customer: customerId as string,
                                status: 'active',
                            });

                            for (const sub of subscriptions.data) {
                                if (sub.id !== subscriptionId) {
                                    console.log(`🗑️ Cancelando assinatura duplicada/antiga: ${sub.id}`);
                                    await stripe.subscriptions.del(sub.id);
                                }
                            }
                        } catch (err) {
                            console.error('Erro ao limpar assinaturas antigas:', err);
                        }
                    }
                }
            }
        }

        // Lida com cancelamentos
        if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object;
            const supabaseUserId = subscription.metadata.supabase_user_id;
            const status = subscription.status;

            if (supabaseUserId) {
                // Se cancelou, volta para free
                const newPlan = status === 'active' ? (subscription.metadata.plan_type || 'pro') : 'free';

                // Só atualiza se o ID da assinatura bater (para evitar que o cancelamento de uma antiga sobrescreva a nova)
                const { data: currentSettings } = await supabase
                    .from('user_settings')
                    .select('stripe_subscription_id')
                    .eq('user_id', supabaseUserId)
                    .single()

                if (currentSettings?.stripe_subscription_id === subscription.id || status === 'active') {
                    await supabase.from('user_settings')
                        .update({ subscription_status: status, plan: newPlan })
                        .eq('user_id', supabaseUserId)
                }
            }
        }

        return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } })
    } catch (err) {
        console.error('Webhook Error:', err);
        return new Response(err.message, { status: 400 });
    }
})
