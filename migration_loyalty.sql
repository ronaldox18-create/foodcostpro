-- Migration for Loyalty System & Customer Auth

-- 1. Update Customers Table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS password text,
ADD COLUMN IF NOT EXISTS points int DEFAULT 0,
ADD COLUMN IF NOT EXISTS level text DEFAULT 'bronze'; -- bronze, silver, gold

-- 2. Create Loyalty Rules (Optional, can be hardcoded in front for MVP, but good to have structure)
-- We will stick to hardcoded logic in frontend for now as per plan:
-- Bronze: 0-499
-- Silver: 500-999
-- Gold: 1000+

-- 3. RLS Policies for Customers (Public Access for Auth)
-- Allow public to insert (register)
CREATE POLICY "Allow public registration" ON public.customers
FOR INSERT WITH CHECK (true);

-- Allow public to select (login check) - BE CAREFUL, usually we use a secure function for this.
-- For this MVP, we will allow reading customers by email to verify password hash in frontend (NOT SECURE for production, but fits MVP request).
-- A better approach is a Postgres function `login_customer(email, password)`.

-- Let's create a secure function for login to be more professional
CREATE OR REPLACE FUNCTION public.customer_login(p_email text, p_password text)
RETURNS SETOF public.customers AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.customers WHERE email = p_email AND password = p_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Add 'points_earned' to orders to track history
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS points_earned int DEFAULT 0;
