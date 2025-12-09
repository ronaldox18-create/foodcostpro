-- Migration to support external integrations (iFood, etc)

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS external_id text,
ADD COLUMN IF NOT EXISTS integration_source text DEFAULT 'interna', -- 'ifood', 'interna'
ADD COLUMN IF NOT EXISTS external_metadata jsonb; -- Store raw json from provider

-- Index for faster lookups to prevent duplicates
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON public.orders(external_id);
CREATE INDEX IF NOT EXISTS idx_orders_integration_source ON public.orders(integration_source);
