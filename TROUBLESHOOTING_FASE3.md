# 🔧 SOLUÇÃO RÁPIDA PARA OS 2 PROBLEMAS

## ❗ PROBLEMA 1: ESTOQUE DAS VARIAÇÕES

Execute este SQL para desabilitar estoque nas variações (vai usar o estoque do produto principal):

```sql
-- Comentar field de estoque como NULL sempre (ignora o campo)
-- A lógica ficará: produto tem estoque, variações só mudam o preço

-- Você pode continuar usando, mas o sistema vai sempre verificar o estoque do produto principal

-- Ou, se quiser usar estoque individual:
-- Precisa atualizar a lógica de verificação de estoque em todos os lugares
```

**SOLUÇÃO TEMPORÁRIA:** Use as variações apenas para mudar preços. O estoque continua sendo do produto principal.

---

## ❗ PROBLEMA 2: COMPLEMENTOS NÃO APARECEM

### Passo 1: Verificar RLS da tabela de links

Execute no Supabase:

```sql
-- Verificar se a policy existe
SELECT * FROM pg_policies 
WHERE tablename = 'product_addon_group_links';

-- Se não retornar nada, criar a policy:
ALTER TABLE product_addon_group_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own addon group links" 
ON product_addon_group_links FOR ALL 
USING (auth.uid() = user_id);

-- Permitir leitura pública também (para o modal funcionar)
CREATE POLICY "Public can read addon group links" 
ON product_addon_group_links FOR SELECT 
USING (true);
```

### Passo 2: Verificar se foi vinculado

```sql
-- Ver os vínculos existentes
SELECT 
    p.name as produto,
    g.name as grupo
FROM product_addon_group_links l
JOIN products p ON p.id = l.product_id
JOIN product_addon_groups g ON g.id = l.group_id
WHERE l.user_id = auth.uid();
```

Se não retornar nadinha = não foi vinculado!

### Passo 3: Vincular manualmente para testar

```sql
-- 1. Pegar ID do produto (hambúrguer)
SELECT id, name FROM products WHERE name ILIKE '%hambur%' LIMIT 1;

-- 2. Pegar ID do grupo de complementos
SELECT id, name FROM product_addon_groups WHERE user_id = auth.uid();

-- 3. Fazer o vínculo (SUBSTITUA OS IDs)
INSERT INTO product_addon_group_links (product_id, group_id, user_id)
VALUES (
    'ID_DO_HAMBURGUER',  -- Cole aqui
    'ID_DO_GRUPO_ADICIONAIS',  -- Cole aqui
    auth.uid()
);
```

---

## 🧪 TESTE RÁPIDO:

Depois de executar os SQLs:

1. **Recarregue** a página (Ctrl + F5)
2. **Adicione o hambúrguer**
3. **Deve aparecer** os complementos agora!

---

## 📋 SE AINDA NÃO APARECER:

Adicione este console.log temporário no modal para ver o que está acontecendo.

Abra `ProductCustomizationModal.tsx` e na linha 75, após `setAddonGroups`, adicione:

```typescript
setAddonGroups(groupsData || []);
console.log('🔍 Addon Groups loaded:', groupsData);
console.log('🔗 Links found:', linksData);
```

Depois abra o console do navegador (F12) e me diga o que aparece!

---

**Execute os SQLs e me avise!** 🔧
