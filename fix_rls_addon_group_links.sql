-- FIX: Row Level Security para product_addon_group_links
-- Este SQL corrige o erro: "new row violates row-level security policy"

-- Habilitar RLS
ALTER TABLE product_addon_group_links ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can insert their own product addon group links" ON product_addon_group_links;
DROP POLICY IF EXISTS "Users can view their own product addon group links" ON product_addon_group_links;
DROP POLICY IF EXISTS "Users can update their own product addon group links" ON product_addon_group_links;
DROP POLICY IF EXISTS "Users can delete their own product addon group links" ON product_addon_group_links;

-- Política para INSERT (criar links)
CREATE POLICY "Users can insert their own product addon group links"
ON product_addon_group_links FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_addon_group_links.product_id
    AND products.user_id = auth.uid()
  )
);

-- Política para SELECT (ler links)
CREATE POLICY "Users can view their own product addon group links"
ON product_addon_group_links FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_addon_group_links.product_id
    AND products.user_id = auth.uid()
  )
);

-- Política para UPDATE (atualizar links)
CREATE POLICY "Users can update their own product addon group links"
ON product_addon_group_links FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_addon_group_links.product_id
    AND products.user_id = auth.uid()
  )
);

-- Política para DELETE (deletar links)
CREATE POLICY "Users can delete their own product addon group links"
ON product_addon_group_links FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM products
    WHERE products.id = product_addon_group_links.product_id
    AND products.user_id = auth.uid()
  )
);

-- Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'product_addon_group_links';
