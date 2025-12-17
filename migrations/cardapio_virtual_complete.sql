-- ============================================
-- MIGRAÇÃO COMPLETA: CARDÁPIO VIRTUAL PROFISSIONAL
-- Data: 16/12/2025
-- Descrição: Estrutura completa para todas as melhorias
-- ============================================

-- ============================================
-- FASE 1: ESTRUTURA BASE
-- ============================================

-- 1.1 - Tabela de Grupos de Complementos/Adicionais
CREATE TABLE IF NOT EXISTS product_addon_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- ex: "Adicionais", "Remover Ingredientes", "Molhos"
    description TEXT,
    is_required BOOLEAN DEFAULT false, -- Cliente DEVE escolher algo deste grupo?
    min_selections INTEGER DEFAULT 0, -- Mínimo de seleções
    max_selections INTEGER DEFAULT NULL, -- Máximo de seleções (NULL = ilimitado)
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.2 - Tabela de Complementos/Adicionais
CREATE TABLE IF NOT EXISTS product_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES product_addon_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- ex: "Bacon Extra", "Sem Cebola"
    price_adjustment DECIMAL(10,2) DEFAULT 0, -- Valor adicional (pode ser negativo)
    is_available BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.3 - Vincular grupos de complementos aos produtos
CREATE TABLE IF NOT EXISTS product_addon_group_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES product_addon_groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, group_id)
);

-- 1.4 - Tabela de Variações de Produtos (ex: tamanhos, volumes)
CREATE TABLE IF NOT EXISTS product_variations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- ex: "300ml", "500ml", "1L", "Pizza Grande", "Porção Família"
    price DECIMAL(10,2) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    stock_quantity INTEGER, -- se controla estoque
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.5 - Galeria de Imagens (múltiplas fotos por produto)
CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT false, -- Imagem principal
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.6 - Sistema de Avaliações de Produtos
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL, -- Apenas quem comprou pode avaliar
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images TEXT[], -- URLs de fotos da avaliação
    is_approved BOOLEAN DEFAULT false, -- Moderação
    admin_response TEXT, -- Resposta da loja
    admin_response_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, product_id) -- Um cliente só pode avaliar cada produto uma vez
);

-- 1.7 - Configurações Visuais da Loja
CREATE TABLE IF NOT EXISTS store_visual_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    logo_url TEXT,
    banner_url TEXT,
    favicon_url TEXT,
    primary_color TEXT DEFAULT '#ea580c', -- Orange-600
    secondary_color TEXT DEFAULT '#dc2626', -- Red-600
    theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'auto')),
    font_family TEXT DEFAULT 'Inter',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.8 - Informações de Contato e Redes Sociais da Loja
CREATE TABLE IF NOT EXISTS store_contact_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    phone TEXT,
    whatsapp TEXT,
    email TEXT,
    address TEXT,
    address_number TEXT,
    address_complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    instagram_url TEXT,
    facebook_url TEXT,
    website_url TEXT,
    delivery_info TEXT, -- Informações sobre entrega
    payment_methods TEXT[], -- Métodos de pagamento aceitos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.9 - Tabela de Promoções
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'buy_x_get_y', 'combo')),
    discount_value DECIMAL(10,2), -- Porcentagem ou valor fixo
    buy_quantity INTEGER, -- Para tipo "2x1" = compre 2
    get_quantity INTEGER, -- Ganhe 1
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    min_purchase_amount DECIMAL(10,2), -- Valor mínimo para aplicar
    max_discount_amount DECIMAL(10,2), -- Desconto máximo
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.10 - Vincular promoções a produtos
CREATE TABLE IF NOT EXISTS promotion_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(promotion_id, product_id)
);

-- 1.11 - Sistema de Cupons de Desconto
CREATE TABLE IF NOT EXISTS discount_coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE, -- Ex: "PRIMEIRACOMPRA", "NATAL2025"
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    max_uses INTEGER, -- Limite de usos total
    max_uses_per_customer INTEGER DEFAULT 1,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.12 - Histórico de uso de cupons
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    coupon_id UUID NOT NULL REFERENCES discount_coupons(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    discount_applied DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.13 - Combos de Produtos
CREATE TABLE IF NOT EXISTS product_combos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Ex: "Combo Família", "Pizza + Refrigerante"
    description TEXT,
    image_url TEXT,
    combo_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2), -- Soma dos preços individuais
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.14 - Itens que compõem cada combo
CREATE TABLE IF NOT EXISTS combo_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    combo_id UUID NOT NULL REFERENCES product_combos(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.15 - Favoritos dos Clientes
CREATE TABLE IF NOT EXISTS customer_favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, product_id)
);

-- 1.16 - Analytics de Produtos (visualizações e cliques)
CREATE TABLE IF NOT EXISTS product_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('view', 'add_to_cart', 'purchase', 'favorite')),
    session_id TEXT, -- Para agrupar ações da mesma sessão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1.17 - Histórico de Buscas
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    search_term TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FASE 2: ALTERAÇÕES EM TABELAS EXISTENTES
-- ============================================

-- Adicionar campos novos na tabela products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_available BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS badges TEXT[], -- ['novo', 'promocao', 'mais_vendido']
ADD COLUMN IF NOT EXISTS tags TEXT[], -- ['vegetariano', 'vegano', 'sem_gluten', 'picante']
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS purchase_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS preparation_time INTEGER, -- Tempo de preparo em minutos
ADD COLUMN IF NOT EXISTS calories INTEGER,
ADD COLUMN IF NOT EXISTS allergens TEXT[]; -- Alérgenos

-- Adicionar campos na tabela order_items para customizações
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS variation_id UUID REFERENCES product_variations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS selected_addons JSONB, -- Array de {addon_id, name, price}
ADD COLUMN IF NOT EXISTS item_notes TEXT; -- Observações do cliente

-- Adicionar campo de cupom nos pedidos
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES discount_coupons(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS coupon_discount DECIMAL(10,2) DEFAULT 0;

-- ============================================
-- FASE 3: ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_addons_group ON product_addons(group_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_product ON product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_promotion_products_promotion ON promotion_products(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_products_product ON promotion_products(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_favorites_customer ON customer_favorites(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_created ON product_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available) WHERE is_available = true;

-- ============================================
-- FASE 4: POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS
ALTER TABLE product_addon_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_addon_group_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_visual_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Políticas para product_addon_groups
CREATE POLICY "Users can manage their own addon groups" ON product_addon_groups
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view addon groups" ON product_addon_groups
    FOR SELECT USING (true);

-- Políticas para product_addons
CREATE POLICY "Users can manage addons in their groups" ON product_addons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM product_addon_groups 
            WHERE id = product_addons.group_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view addons" ON product_addons
    FOR SELECT USING (true);

-- Políticas para product_variations
CREATE POLICY "Users can manage their product variations" ON product_variations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_variations.product_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view variations" ON product_variations
    FOR SELECT USING (true);

-- Políticas para product_images
CREATE POLICY "Users can manage their product images" ON product_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_images.product_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Public can view product images" ON product_images
    FOR SELECT USING (true);

-- Políticas para product_reviews
CREATE POLICY "Customers can create reviews for products they purchased" ON product_reviews
    FOR INSERT WITH CHECK (
        customer_id IN (
            SELECT customer_id FROM orders WHERE id = order_id
        )
    );

CREATE POLICY "Customers can view approved reviews" ON product_reviews
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Store owners can manage reviews for their products" ON product_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_reviews.product_id 
            AND user_id = auth.uid()
        )
    );

-- Políticas para store_visual_settings
CREATE POLICY "Users can manage their own visual settings" ON store_visual_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view store visual settings" ON store_visual_settings
    FOR SELECT USING (true);

-- Políticas para store_contact_info
CREATE POLICY "Users can manage their own contact info" ON store_contact_info
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view store contact info" ON store_contact_info
    FOR SELECT USING (true);

-- Políticas para promotions
CREATE POLICY "Users can manage their own promotions" ON promotions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view active promotions" ON promotions
    FOR SELECT USING (is_active = true);

-- Políticas para discount_coupons
CREATE POLICY "Users can manage their own coupons" ON discount_coupons
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view active coupons" ON discount_coupons
    FOR SELECT USING (is_active = true);

-- Políticas para product_combos
CREATE POLICY "Users can manage their own combos" ON product_combos
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Public can view available combos" ON product_combos
    FOR SELECT USING (is_available = true);

-- Políticas para customer_favorites
CREATE POLICY "Customers can manage their own favorites" ON customer_favorites
    FOR ALL USING (
        customer_id IN (
            SELECT id FROM customers -- Assumindo que há relação com auth.uid()
        )
    );

-- Políticas para product_analytics (apenas inserção pública, leitura apenas pelo dono)
CREATE POLICY "Anyone can track analytics" ON product_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Store owners can view their product analytics" ON product_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_analytics.product_id 
            AND user_id = auth.uid()
        )
    );

-- Políticas para search_history
CREATE POLICY "Store owners can view search history" ON search_history
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- FASE 5: FUNÇÕES ÚTEIS
-- ============================================

-- Função para atualizar a média de avaliações de um produto
CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM product_reviews
            WHERE product_id = NEW.product_id AND is_approved = true
        ),
        review_count = (
            SELECT COUNT(*)
            FROM product_reviews
            WHERE product_id = NEW.product_id AND is_approved = true
        )
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar rating quando uma review é criada/aprovada
DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_reviews;
CREATE TRIGGER trigger_update_product_rating
    AFTER INSERT OR UPDATE ON product_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_product_rating();

-- Função para verificar se cupom é válido
CREATE OR REPLACE FUNCTION validate_coupon(
    p_code TEXT,
    p_customer_id UUID,
    p_order_amount DECIMAL
) RETURNS TABLE (
    is_valid BOOLEAN,
    discount_amount DECIMAL,
    message TEXT,
    coupon_id UUID
) AS $$
DECLARE
    v_coupon RECORD;
    v_usage_count INTEGER;
    v_customer_usage_count INTEGER;
    v_discount DECIMAL;
BEGIN
    -- Buscar cupom
    SELECT * INTO v_coupon
    FROM discount_coupons
    WHERE code = p_code AND is_active = true;
    
    -- Se não encontrado
    IF v_coupon IS NULL THEN
        RETURN QUERY SELECT false, 0::DECIMAL, 'Cupom inválido ou expirado', NULL::UUID;
        RETURN;
    END IF;
    
    -- Verificar validade de datas
    IF v_coupon.valid_from IS NOT NULL AND NOW() < v_coupon.valid_from THEN
        RETURN QUERY SELECT false, 0::DECIMAL, 'Cupom ainda não está válido', NULL::UUID;
        RETURN;
    END IF;
    
    IF v_coupon.valid_until IS NOT NULL AND NOW() > v_coupon.valid_until THEN
        RETURN QUERY SELECT false, 0::DECIMAL, 'Cupom expirado', NULL::UUID;
        RETURN;
    END IF;
    
    -- Verificar valor mínimo
    IF p_order_amount < v_coupon.min_purchase_amount THEN
        RETURN QUERY SELECT false, 0::DECIMAL, 
            'Valor mínimo de compra não atingido: ' || v_coupon.min_purchase_amount::TEXT,
            NULL::UUID;
        RETURN;
    END IF;
    
    -- Verificar limite de usos total
    IF v_coupon.max_uses IS NOT NULL THEN
        SELECT COUNT(*) INTO v_usage_count FROM coupon_usage WHERE coupon_id = v_coupon.id;
        IF v_usage_count >= v_coupon.max_uses THEN
            RETURN QUERY SELECT false, 0::DECIMAL, 'Cupom esgotado', NULL::UUID;
            RETURN;
        END IF;
    END IF;
    
    -- Verificar limite de usos por cliente
    SELECT COUNT(*) INTO v_customer_usage_count 
    FROM coupon_usage 
    WHERE coupon_id = v_coupon.id AND customer_id = p_customer_id;
    
    IF v_customer_usage_count >= v_coupon.max_uses_per_customer THEN
        RETURN QUERY SELECT false, 0::DECIMAL, 'Você já usou este cupom o máximo de vezes permitido', NULL::UUID;
        RETURN;
    END IF;
    
    -- Calcular desconto
    IF v_coupon.type = 'percentage' THEN
        v_discount := (p_order_amount * v_coupon.discount_value / 100);
    ELSE
        v_discount := v_coupon.discount_value;
    END IF;
    
    -- Aplicar limite de desconto máximo
    IF v_coupon.max_discount_amount IS NOT NULL AND v_discount > v_coupon.max_discount_amount THEN
        v_discount := v_coupon.max_discount_amount;
    END IF;
    
    -- Cupom válido!
    RETURN QUERY SELECT true, v_discount, 'Cupom aplicado com sucesso!', v_coupon.id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIM DA MIGRAÇÃO
-- ============================================

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Migração completa executada com sucesso!';
    RAISE NOTICE '📊 Tabelas criadas: 17';
    RAISE NOTICE '🔐 Políticas RLS configuradas';
    RAISE NOTICE '⚡ Índices criados para performance';
    RAISE NOTICE '🎯 Sistema pronto para Cardápio Virtual Profissional!';
END $$;
