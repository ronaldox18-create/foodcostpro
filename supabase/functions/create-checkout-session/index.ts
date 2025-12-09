
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0"
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user } } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('User not found')
        }

        const { plan, returnUrl } = await req.json()

        // Mapeamento de Planos para Price IDs do Stripe
        // VOCÊ PRECISA CRIAR ESSES PREÇOS NO SEU DASHBOARD DO STRIPE
        const PLANS = {
            'starter': 'price_1Sc5jeFRJ9p8kl6BMIQqpYtZ', // Substitua pelo ID do plano Operação Local (R$ 89,90)
            'online': 'price_1Sc5kwFRJ9p8kl6BCDx3IYXK', // Substitua pelo ID do plano Operação Online (R$ 89,90)
            'pro': 'price_1Sc5mXFRJ9p8kl6BO0KHgToJ' // Seu ID já configurado para o FoodCost PRO
        }

        const priceId = PLANS[plan as keyof typeof PLANS]

        if (!priceId) {
            throw new Error('Invalid plan selected')
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
            apiVersion: '2022-11-15',
            httpClient: Stripe.createFetchHttpClient(),
        })

        // Verificar se o cliente já existe no Stripe (opcional, mas recomendado)
        // Para simplificar, vamos criar sempre ou usar email
        const customerSearch = await stripe.customers.search({
            query: `email:'${user.email}'`,
        });

        let customerId;
        if (customerSearch.data.length > 0) {
            customerId = customerSearch.data[0].id;
        } else {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id
                }
            });
            customerId = customer.id;
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${returnUrl}?canceled=true`,
            subscription_data: {
                metadata: {
                    supabase_user_id: user.id,
                    plan_type: plan
                }
            }
        })

        return new Response(
            JSON.stringify({ url: session.url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
    }
})
