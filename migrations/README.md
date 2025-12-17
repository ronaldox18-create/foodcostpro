# 🚀 Como Aplicar a Migration do Cardápio Virtual Profissional

## 📋 Pré-requisitos
- Acesso ao Dashboard do Supabase
- Permissões de administrador

## 🔧 Passo a Passo

### 1. Acessar o SQL Editor do Supabase
1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione seu projeto **foodcostpro**
3. No menu lateral, clique em **SQL Editor**

### 2. Executar a Migration
1. Clique em **"New query"**
2. Copie TODO o conteúdo do arquivo `migrations/cardapio_virtual_complete.sql`
3. Cole no editor SQL
4. Clique em **"Run"** (ou pressione Ctrl/Cmd + Enter)

### 3. Verificar Sucesso
Se tudo correr bem, você verá:
```
✅ Migração completa executada com sucesso!
📊 Tabelas criadas: 17
🔐 Políticas RLS configuradas
⚡ Índices criados para performance
🎯 Sistema pronto para Cardápio Virtual Profissional!
```

### 4. Verificar Tabelas Criadas
Execute este comando para listar todas as novas tabelas:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'product_%' 
   OR table_name LIKE 'store_%' 
   OR table_name LIKE 'promotion%'
   OR table_name LIKE 'discount_%'
   OR table_name LIKE 'combo_%'
   OR table_name LIKE 'customer_favorites'
   OR table_name LIKE 'search_history'
ORDER BY table_name;
```

## 📦 Novas Tabelas Criadas

1. ✅ `product_addon_groups` - Grupos de complementos
2. ✅ `product_addons` - Complementos individuais
3. ✅ `product_addon_group_links` - Vínculo produto ↔ grupo
4. ✅ `product_variations` - Variações (tamanhos, volumes)
5. ✅ `product_images` - Galeria de imagens
6. ✅ `product_reviews` - Avaliações de clientes
7. ✅ `store_visual_settings` - Personalização visual
8. ✅ `store_contact_info` - Informações de contato
9. ✅ `promotions` - Promoções
10. ✅ `promotion_products` - Produtos em promoção
11. ✅ `discount_coupons` - Cupons de desconto
12. ✅ `coupon_usage` - Histórico de uso de cupons
13. ✅ `product_combos` - Combos de produtos
14. ✅ `combo_items` - Itens dos combos
15. ✅ `customer_favorites` - Favoritos dos clientes
16. ✅ `product_analytics` - Analytics de produtos
17. ✅ `search_history` - Histórico de buscas

## 🔄 Alterações em Tabelas Existentes

### Tabela `products`
Novos campos adicionados:
- `is_featured` - Produto em destaque
- `is_available` - Disponibilidade
- `badges` - Badges visuais (novo, promoção, etc)
- `tags` - Tags de filtro (vegetariano, vegano, etc)
- `view_count` - Contador de visualizações
- `purchase_count` - Contador de compras
- `average_rating` - Média de avaliações
- `review_count` - Número de avaliações
- `preparation_time` - Tempo de preparo
- `calories` - Calorias
- `allergens` - Alérgenos

### Tabela `order_items`
Novos campos adicionados:
- `variation_id` - Variação selecionada
- `selected_addons` - Complementos selecionados (JSONB)
- `item_notes` - Observações do cliente

### Tabela `orders`
Novos campos adicionados:
- `coupon_id` - Cupom utilizado
- `coupon_discount` - Desconto do cupom

## ⚡ Próximos Passos

Após aplicar a migration, você pode:

1. **Criar complementos** para seus produtos
2. **Personalizar a aparência** da sua loja
3. **Configurar promoções** e cupons
4. **Adicionar mais fotos** aos produtos
5. **Começar a rastrear** analytics

## 🆘 Troubleshooting

### Erro: "permission denied"
**Solução:** Verifique se você está logado como administrador do projeto.

### Erro: "relation already exists"
**Solução:** A migration já foi aplicada. Você pode ignorar este erro ou dropar as tabelas antes.

### Erro: "syntax error"
**Solução:** Certifique-se de copiar TODO o arquivo SQL, do início ao fim.

## 📞 Suporte
Se encontrar problemas, verifique:
1. Logs no Supabase Dashboard > Logs
2. Console do Browser (F12)
3. Status das migrações anteriores

---

**Última Atualização:** 16/12/2025
**Versão da Migration:** 1.0.0
