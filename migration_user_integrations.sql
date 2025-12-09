-- Create table to store user-specific integration settings
CREATE TABLE IF NOT EXISTS public.user_integrations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider text NOT NULL, -- 'ifood', 'rappi', etc
    is_enabled boolean DEFAULT false,
    credentials jsonb DEFAULT '{}'::jsonb, -- encrypted tokens or keys
    status text DEFAULT 'disconnected', -- 'active', 'error', 'disconnected'
    last_synced_at timestamptz,
    error_message text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, provider)
);

-- RLS Policies
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own integrations" ON public.user_integrations;
CREATE POLICY "Users can manage their own integrations" 
    ON public.user_integrations 
    FOR ALL 
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON public.user_integrations(user_id);
