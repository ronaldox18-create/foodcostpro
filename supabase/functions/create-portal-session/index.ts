import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"
import { decode } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const { returnUrl, accessToken } = await req.json()
        let token = req.headers.get('Authorization')?.replace('Bearer ', '') || accessToken

        if (!token) throw new Error('Token ausente')

        // Decodifica JWT para obter user ID
        const [header, payload, signature] = decode(token) as [any, any, any];
        const userId = payload.sub;

        if (!userId) throw new Error('Token inválido (sem sub)')

        // Usa Service Role para buscar dados com permissão total
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: userSettings, error: profileError } = await supabaseAdmin
            .from('user_settings')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .single()

        if (profileError || !userSettings?.stripe_customer_id) {
            throw new Error('Nenhuma assinatura ativa encontrada para este usuário.')
        }

        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        const stripe = new Stripe(stripeKey, { apiVersion: '2022-11-15', httpClient: Stripe.createFetchHttpClient() })

        const session = await stripe.billingPortal.sessions.create({
            customer: userSettings.stripe_customer_id,
            return_url: returnUrl || 'https://foodcostpro.com.br/account',
        })

        return new Response(JSON.stringify({ url: session.url }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    } catch (error) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
