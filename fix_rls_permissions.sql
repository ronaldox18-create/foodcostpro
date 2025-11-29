-- =================================================================
-- CORREÇÃO DE PERMISSÕES RLS (Segurança)
-- =================================================================
-- Este script corrige as permissões para permitir que CLIENTES (público)
-- consigam salvar os itens do pedido.

-- 1. Remover policies antigas de INSERT que bloqueavam o público
DROP POLICY IF EXISTS "Users can insert their order items" ON order_items;

-- 2. Criar nova policy permitindo INSERT público (necessário para cardápio online)
CREATE POLICY "Public can insert order items" 
ON order_items FOR INSERT 
WITH CHECK (true);

-- 3. Manter SELECT restrito (apenas dono da loja vê os itens)
-- (Isso garante que um cliente não veja pedidos de outros)
DROP POLICY IF EXISTS "Users can view their order items" ON order_items;
CREATE POLICY "Users can view their order items" 
ON order_items FOR SELECT 
USING (
    -- Permite se o usuário for o dono do pedido (admin)
    EXISTS (
        SELECT 1 FROM orders 
        WHERE orders.id = order_items.order_id 
        AND orders.user_id = auth.uid()
    )
);

-- 4. Recarregar configurações
NOTIFY pgrst, 'reload config';
