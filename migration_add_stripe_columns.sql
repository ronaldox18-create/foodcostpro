-- Adiciona campos para integração com Stripe na tabela user_settings

DO $$
BEGIN
    -- ID do Cliente no Stripe (para não criar duplicados)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.user_settings ADD COLUMN stripe_customer_id text;
    END IF;

    -- ID da Assinatura ativa (para gerenciar cancelamentos)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE public.user_settings ADD COLUMN stripe_subscription_id text;
    END IF;

    -- Status da assinatura (active, past_due, canceled, trialing)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.user_settings ADD COLUMN subscription_status text DEFAULT 'active';
    END IF;
END $$;
