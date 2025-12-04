-- Habilitar acesso público para leitura de dados do cardápio

-- Products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public products access" ON products;
CREATE POLICY "Public products access" ON products FOR SELECT USING (true);

-- User Settings (Nome da Loja, etc)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public user_settings access" ON user_settings;
CREATE POLICY "Public user_settings access" ON user_settings FOR SELECT USING (true);

-- Business Hours
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public business_hours access" ON business_hours;
CREATE POLICY "Public business_hours access" ON business_hours FOR SELECT USING (true);

-- Special Hours
ALTER TABLE special_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public special_hours access" ON special_hours;
CREATE POLICY "Public special_hours access" ON special_hours FOR SELECT USING (true);

-- Categories (se houver tabela separada, mas parece que é string no produto)
-- Se houver tabela de categorias:
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Public categories access" ON categories;
-- CREATE POLICY "Public categories access" ON categories FOR SELECT USING (true);

-- Loyalty Settings
ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public loyalty_settings access" ON loyalty_settings;
CREATE POLICY "Public loyalty_settings access" ON loyalty_settings FOR SELECT USING (true);

-- Loyalty Levels
ALTER TABLE loyalty_levels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public loyalty_levels access" ON loyalty_levels;
CREATE POLICY "Public loyalty_levels access" ON loyalty_levels FOR SELECT USING (true);

-- Ingredients (Opcional: se precisar mostrar ingredientes, mas geralmente não precisa ser público se não for detalhado)
-- Por segurança, manter ingredientes privado por enquanto, a menos que seja necessário para exibir composição.
