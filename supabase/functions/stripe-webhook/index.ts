
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
})

// Esta é a chave secreta do endpoint do webhook no Stripe Dashboard
// Você pega ela em Developers > Webhooks ao configurar o endpoint
const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
    const signature = req.headers.get('Stripe-Signature')
    const body = await req.text()
    const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

    let event
    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            signature!,
            endpointSecret!,
            undefined,
            cryptoProvider
        )
    } catch (err) {
        return new Response(err.message, { status: 400 })
    }

    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const userId = session.metadata?.supabase_user_id // Garantir que metadata seja passado na criação da sessão
        // Se não tiver no session root, buscar na subscription

        // Na função checkout, colocamos metadata na subscription_data também
        // Mas aqui vamos focar no que é mais garantido. A melhor prática é ler a subscription.

        // Recuperar a subscription para ter certeza
        // const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        // const userId = subscription.metadata.supabase_user_id;

        // Mas para simplificar neste exemplo, vamos pegar do client reference id ou metadata se tivermos passado corretamente
        // Vamos assumir que o supabase_user_id está no metadata do customer criado ou da session (verifique create-checkout-session)

        if (session.mode === 'subscription') {
            // Lógica para atualizar o usuário
            // Precisamos saber QUAL plano foi assinado.
            // Uma forma robusta é olhar os items da linha ou metadata. 
            // Vamos assumir que passamos 'plan_type' no metadata da subscription_data.

            const subscriptionId = session.subscription
            const subscription = await stripe.subscriptions.retrieve(subscriptionId as string)
            const planType = subscription.metadata.plan_type || 'pro' // Default ou ler do metadata
            const supabaseUserId = subscription.metadata.supabase_user_id

            if (supabaseUserId) {
                await supabase
                    .from('user_settings')
                    .update({
                        plan: planType,
                        stripe_customer_id: session.customer,
                        stripe_subscription_id: subscriptionId,
                        subscription_status: 'active'
                    })
                    .eq('user_id', supabaseUserId)
            }
        }
    }

    // Handle subscription update/cancellation
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        const supabaseUserId = subscription.metadata.supabase_user_id;
        const status = subscription.status; // active, past_due, canceled, etc.

        if (supabaseUserId) {
            // Se cancelado ou não pago, verifique a lógica de negócio (ex: voltar para free)
            const newPlan = status === 'active' ? (subscription.metadata.plan_type || 'pro') : 'free';

            await supabase
                .from('user_settings')
                .update({
                    subscription_status: status,
                    plan: newPlan
                })
                .eq('user_id', supabaseUserId)
        }
    }

    return new Response(JSON.stringify({ received: true }), {
        headers: { 'Content-Type': 'application/json' },
    })
})
