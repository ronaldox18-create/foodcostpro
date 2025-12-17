-- Ver todos os campos da tabela order_items
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;
