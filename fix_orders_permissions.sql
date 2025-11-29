-- =================================================================
-- CORREÇÃO DE PERMISSÕES RLS NA TABELA ORDERS
-- =================================================================
-- Garante que o dono da loja possa atualizar o status dos pedidos.

-- 1. Habilitar RLS (caso não esteja)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 2. Remover policies antigas para evitar conflitos
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Public can insert orders" ON orders;

-- 3. Criar policies corretas

-- Permitir que o dono veja seus pedidos
CREATE POLICY "Users can view their own orders" 
ON orders FOR SELECT 
USING (auth.uid() = user_id);

-- Permitir que o dono ATUALIZE seus pedidos (MUITO IMPORTANTE)
CREATE POLICY "Users can update their own orders" 
ON orders FOR UPDATE 
USING (auth.uid() = user_id);

-- Permitir que qualquer um (público) crie pedidos
CREATE POLICY "Public can insert orders" 
ON orders FOR INSERT 
WITH CHECK (true);

-- 4. Recarregar configurações
NOTIFY pgrst, 'reload config';
