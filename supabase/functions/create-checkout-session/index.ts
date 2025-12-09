import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { plan, returnUrl, accessToken } = await req.json()
        console.log(`[DEBUG] Iniciando checkout. Plano: ${plan}`)

        // 1. Tenta recuperar o token de todas as formas
        let token = req.headers.get('Authorization')?.replace('Bearer ', '')
        if (!token || token === 'undefined') token = accessToken

        if (!token) {
            console.error('[DEBUG] Token não encontrado nos headers nem no body')
            throw new Error('Token de autenticação (JWT) não fornecido')
        }

        // 2. Cria cliente com persistSession: false (Vital para Edge Functions)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: { headers: { Authorization: `Bearer ${token}` } },
                auth: { persistSession: false }
            }
        )

        // 3. Tenta obter o usuário
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

        if (authError || !user) {
            console.error('[DEBUG] Erro Auth:', authError)
            // Retorna infos de debug no erro para sabermos o que houve
            throw new Error(`Falha Auth: ${authError?.message || 'User null'} (URL: ${Deno.env.get('SUPABASE_URL')?.slice(0, 20)}...)`)
        }

        console.log(`[DEBUG] Usuário autenticado: ${user.email}`)

        // 4. Valida Secrets
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) throw new Error('STRIPE_SECRET_KEY não configurada')

        const PLANS = {
            'starter': 'price_1Sc5jeFRJ9p8kl6BMIQqpYtZ',
            'online': 'price_1Sc5kwFRJ9p8kl6BCDx3IYXK',
            'pro': 'price_1Sc5mXFRJ9p8kl6BO0KHgToJ'
        }

        const priceId = PLANS[plan as keyof typeof PLANS];
        if (!priceId) throw new Error(`Plano inválido: ${plan}`)

        // 5. Stripe
        const stripe = new Stripe(stripeKey, { apiVersion: '2022-11-15', httpClient: Stripe.createFetchHttpClient() })

        const customerSearch = await stripe.customers.search({ query: `email:'${user.email}'` });
        let customerId = customerSearch.data.length > 0
            ? customerSearch.data[0].id
            : (await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } })).id;

        // Correção da URL de retorno com separador dinâmico
        const separator = returnUrl.includes('?') ? '&' : '?';

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `${returnUrl}${separator}session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl}${separator}canceled=true`,
            subscription_data: { metadata: { supabase_user_id: user.id, plan_type: plan } }
        })

        return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error('[ERRO FATAL]', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
