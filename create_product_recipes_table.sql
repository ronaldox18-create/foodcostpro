-- ============================================
-- CRIAR TABELA: product_recipes
-- ============================================
-- Esta tabela armazena a receita (ingredientes) de cada produto
-- Relaciona produtos com ingredientes e suas quantidades

CREATE TABLE IF NOT EXISTS public.product_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity_needed DECIMAL(10, 3) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_recipes_product_id ON public.product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_recipes_ingredient_id ON public.product_recipes(ingredient_id);

-- Comentários
COMMENT ON TABLE public.product_recipes IS 'Receitas dos produtos (ingredientes e quantidades necessárias)';
COMMENT ON COLUMN public.product_recipes.product_id IS 'ID do produto';
COMMENT ON COLUMN public.product_recipes.ingredient_id IS 'ID do ingrediente';
COMMENT ON COLUMN public.product_recipes.quantity_needed IS 'Quantidade necessária do ingrediente';
COMMENT ON COLUMN public.product_recipes.unit IS 'Unidade de medida (g, kg, ml, l, un)';

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS
ALTER TABLE public.product_recipes ENABLE ROW LEVEL SECURITY;

-- Política para SELECT (visualizar receitas)
CREATE POLICY "Users can view their own product recipes"
ON public.product_recipes FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_recipes.product_id
        AND products.user_id = auth.uid()
    )
);

-- Política para INSERT (adicionar ingredientes à receita)
CREATE POLICY "Users can insert their own product recipes"
ON public.product_recipes FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_recipes.product_id
        AND products.user_id = auth.uid()
    )
);

-- Política para UPDATE (atualizar ingredientes da receita)
CREATE POLICY "Users can update their own product recipes"
ON public.product_recipes FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_recipes.product_id
        AND products.user_id = auth.uid()
    )
);

-- Política para DELETE (remover ingredientes da receita)
CREATE POLICY "Users can delete their own product recipes"
ON public.product_recipes FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_recipes.product_id
        AND products.user_id = auth.uid()
    )
);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

-- Verificar se a tabela foi criada
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'product_recipes';

-- Verificar políticas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'product_recipes';
