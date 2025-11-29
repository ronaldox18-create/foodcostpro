-- Migration: Categories Table
-- Execute este SQL no Supabase SQL Editor

-- 1. Criar tabela de categorias
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name) -- Cada usuário pode ter apenas uma categoria com o mesmo nome
);

-- 2. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS - usuários só veem suas próprias categorias
CREATE POLICY "Users can view own categories" ON public.categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.categories
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Inserir categorias padrão (opcional - descomente se quiser)
-- Isso insere categorias padrão para todos os usuários existentes
-- INSERT INTO public.categories (user_id, name)
-- SELECT DISTINCT user_id, unnest(ARRAY['Lanches', 'Bebidas', 'Sobremesas', 'Combos', 'Pratos'])
-- FROM public.products
-- WHERE user_id IS NOT NULL
-- ON CONFLICT DO NOTHING;
