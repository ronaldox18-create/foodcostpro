-- Migration: Orders System for Customer Menu
-- Execute este SQL no Supabase SQL Editor

-- 1. Ensure orders table has proper columns for customer orders
-- (This table should already exist from previous migrations)

-- 2. Add order status tracking
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- pending, confirmed, preparing, ready, delivered, cancelled

-- 3. Add customer reference
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- 4. Add order items (JSON) if not exists
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;

-- 5. Create index for customer orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- 6. RLS Policy - customers can view their own orders
CREATE POLICY IF NOT EXISTS "Customers can view own orders" ON public.orders
  FOR SELECT USING (customer_id IN (
    SELECT id FROM public.customers WHERE email = current_setting('request.jwt.claim.email', true)
  ));

-- Note: For MVP, we're using a simple approach where customers can read their orders
-- In production, you'd want more secure session management
