-- Adiciona suporte a planos na tabela de configurações
-- Tipos de plano: 'free', 'starter', 'pro'

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'plan') THEN
        ALTER TABLE public.user_settings ADD COLUMN plan text DEFAULT 'free';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_settings' AND column_name = 'plan_expires_at') THEN
        ALTER TABLE public.user_settings ADD COLUMN plan_expires_at timestamp with time zone;
    END IF;
END $$;
