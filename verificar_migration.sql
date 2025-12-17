-- VERIFICAR SE AS TABELAS DO CARDÁPIO VIRTUAL EXISTEM
-- Execute este SQL no Supabase SQL Editor

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'product_variations',
    'product_addon_groups',
    'product_addons',
    'product_addon_group_links',
    'store_visual_settings'
)
ORDER BY table_name;

-- Se retornar 0 linhas = precisa aplicar a migration
-- Se retornar 5 linhas = migration já aplicada ✅
