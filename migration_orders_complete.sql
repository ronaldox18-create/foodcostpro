-- Migration: Complete Orders System
-- Execute este SQL no Supabase SQL Editor

-- 1. Adicionar colunas faltantes na tabela orders (se não existirem)
DO $$ 
BEGIN
    -- Add customer_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders' AND column_name='customer_id') THEN
        ALTER TABLE public.orders ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
    END IF;

    -- Add items column if not exists (JSONB para armazenar array de items)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders' AND column_name='items') THEN
        ALTER TABLE public.orders ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Add status column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='orders' AND column_name='status') THEN
        ALTER TABLE public.orders ADD COLUMN status TEXT DEFAULT 'pending';
    END IF;
END $$;

-- 2. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 3. Enable RLS if not already enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policy for customers to view their own orders
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" ON public.orders
  FOR SELECT USING (
    customer_id IS NOT NULL
  );

-- 5. Create RLS policy for inserting new orders (anyone can create)
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

-- Done! Now the orders table is ready for the customer menu system
