-- ==============================================================================
-- CORREÇÃO DE PERMISSÕES DO SUPABASE (RLS)
-- ==============================================================================
-- O erro 401 (Unauthorized) ou 406 (Not Acceptable) no Cardápio Virtual ocorre 
-- porque as tabelas estão protegidas por RLS (Row Level Security) e não permitem 
-- acesso público (usuários não logados no painel admin).
--
-- PARA CORRIGIR:
-- 1. Acesse o painel do Supabase (https://app.supabase.com)
-- 2. Vá em "SQL Editor" (ícone de terminal na esquerda)
-- 3. Crie uma "New Query"
-- 4. Copie e cole TODO o conteúdo abaixo e clique em RUN.
-- ==============================================================================

-- 1. Habilitar RLS na tabela customers (garantia)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 2. Remover policies antigas que possam estar bloqueando (opcional, mas seguro)
DROP POLICY IF EXISTS "Public Scan Customers" ON customers;
DROP POLICY IF EXISTS "Public Insert Customers" ON customers;
DROP POLICY IF EXISTS "Public Update Customers" ON customers;

-- 3. Permitir que QUALQUER UM (incluindo anônimos) leia a tabela de clientes
-- Necessário para o login funcionar (verificar se o email existe)
CREATE POLICY "Public Scan Customers" 
ON customers 
FOR SELECT 
USING (true);

-- 4. Permitir que QUALQUER UM cadastre um novo cliente
-- Necessário para o "Criar Conta" funcionar
CREATE POLICY "Public Insert Customers" 
ON customers 
FOR INSERT 
WITH CHECK (true);

-- 5. Permitir alterações (para atualizar pontos/pedidos)
-- Em um cenário ideal, usaria auth.uid(), mas para o MVP usamos tabela direta
CREATE POLICY "Public Update Customers" 
ON customers 
FOR UPDATE 
USING (true);

-- ==============================================================================
-- FIM DA CORREÇÃO
-- Agora tente criar a conta novamente no Cardápio Virtual.
-- ==============================================================================
