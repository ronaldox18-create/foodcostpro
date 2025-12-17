# 🔄 REFATORAÇÃO COMPLETA - COMPLEMENTOS VINCULADOS AO ESTOQUE

**Data:** 17/12/2025 10:16  
**Status:** ⏳ **EM ANDAMENTO**

---

## 🎯 NOVA ABORDAGEM (CORRETA!)

### ❌ **ANTES (Errado):**
- Complemento tinha `stock_quantity` próprio
- Cada complemento era um item de estoque separado

### ✅ **AGORA (Correto):**
- Complemento **vincula** a um ingrediente do estoque geral
- Quando cliente adiciona "Bacon Extra", desconta do estoque de bacon
- Complementos sem ingrediente = preferências (ex: "Sem cebola")

---

## 📊 **EXEMPLO PRÁTICO:**

**Estoque Geral:**
- Bacon: 1 kg (1000g)

**Produto: X-Bacon**
- Receita: 100g de bacon

**Comple mentos Configurados:**
- "Bacon Extra" → Ingrediente: Bacon, Quantidade: 100g
- "Sem cebola" → Sem ingrediente (apenas preferência)

**Cliente pediu:**
- 1× X-Bacon com "Bacon Extra"

**Desconto no estoque:**
- Receita: -100g bacon
- "Bacon Extra": -100g bacon
- **Total: -200g do estoque de bacon**

---

## ✅ **O QUE JÁ FOI FEITO:**

### 1. ✅ Migration SQL
- **Arquivo:** `migration_addons_ingredient_link.sql`
- Remove `stock_quantity`
- Adiciona `ingredient_id`, `quantity_used`, `unit_used`

### 2. ✅ types.ts
- ProductAddon atualizado com novos campos

### 3. ✅ ProductEditModal.tsx
- Carrega lista de ingredientes
- Tabela de complementos com:
  - **Ingrediente** (select)
  - **Qtd** (number)
  - **Un** (select: g, kg, ml, l, un)
- Campos desabilitados quando sem ingrediente
- Salva corretamente no banco

---

## ⏳ **O QUE FALTA FAZER:**

### 4. ⏸️ ProductCustomizationModal.tsx
**Ações necessárias:**
- ❌ Remover validação de `addon.stock_quantity`
- ✅ Validar estoque do `ingredient_id` vinculado
- ✅ Buscar estoque atual do ingrediente
- ✅ Bloquear se estoque insuficiente
- ✅ Mostrar "Esgotado" quando ingrediente acabou

**Código aproximado:**
```typescript
// Validar estoque de addons vinculados a ingredientes
for (const addon of selectedAddons) {
    if (addon.ingredient_id) {
        // Buscar estoque do ingrediente
        const { data: ingredient } = await supabase
            .from('ingredients')
            .select('stock_quantity, unit')
            .eq('id', addon.ingredient_id)
            .single();
        
        if (ingredient && ingredient.stock_quantity !== null) {
            // Converter unidades e verificar
            const needed = convertToBaseUnit(addon.quantity_used, addon.unit_used);
            const available = ingredient.stock_quantity;
            
            if (available < needed) {
                alert(`${addon.name} esgotado!`);
                return;
            }
        }
    }
}
```

### 5. ⏸️ StoreMenu.tsx (handleCheckout)
**Ações necessárias:**
- ❌ Remover desconto de `addon.stock_quantity`
- ✅ Para cada addon com `ingredient_id`:
  - Buscar estoque atual do ingrediente
  - Descontar `quantity_used` (convertendo unidades)
  - Atualizar `ingredients.stock_quantity`

**Código aproximado:**
```typescript
// Descontar estoque dos addons
if (item.selectedAddons) {
    for (const addon of item.selectedAddons) {
        if (addon.ingredient_id && addon.quantity_used) {
            // Buscar addon completo do banco
            const { data: addonData } = await supabase
                .from('product_addons')
                .select('ingredient_id, quantity_used, unit_used')
                .eq('id', addon.addon_id)
                .single();
            
            if (addonData?.ingredient_id) {
                // Buscar ingrediente
                const { data: ing } = await supabase
                    .from('ingredients')
                    .select('stock_quantity, unit')
                    .eq('id', addonData.ingredient_id)
                    .single();
                
                if (ing && ing.stock_quantity !== null) {
                    // Calcular quanto descontar (converter unidades)
                    const toDeduct = convertUnits(
                        addonData.quantity_used,
                        addonData.unit_used,
                        ing.unit
                    ) * item.quantity;
                    
                    const newStock = Math.max(0, ing.stock_quantity - toDeduct);
                    
                    // Atualizar estoque
                    await supabase
                        .from('ingredients')
                        .update({ stock_quantity: newStock })
                        .eq('id', addonData.ingredient_id);
                }
            }
        }
    }
}
```

---

## 🛠️ **FUNÇÃO AUXILIAR NECESSÁRIA:**

```typescript
// Converter unidades para mesma base
function convertUnits(value: number, fromUnit: string, toUnit: string): number {
    // kg → g
    if (fromUnit === 'kg' && toUnit === 'g') return value * 1000;
    // g → kg
    if (fromUnit === 'g' && toUnit === 'kg') return value / 1000;
    
    // l → ml
    if (fromUnit === 'l' && toUnit === 'ml') return value * 1000;
    // ml → l
    if (fromUnit === 'ml' && toUnit === 'l') return value / 1000;
    
    // Mesma unidade
    return value;
}
```

---

## ⚠️ **MIGRATION SQL - EXECUTAR AGORA:**

```sql
-- Remover coluna antiga
ALTER TABLE product_addons 
DROP COLUMN IF EXISTS stock_quantity;

-- Adicionar novos campos
ALTER TABLE product_addons 
ADD COLUMN IF NOT EXISTS ingredient_id UUID REFERENCES ingredients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS quantity_used DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS unit_used VARCHAR(10);
```

---

## 📋 **CHECKLIST DE IMPLEMENTAÇÃO:**

- [x] Migration SQL criada
- [x] types.ts atualizado
- [x] ProductEditModal atualizado
- [ ] Executar migration no Supabase
- [ ] ProductCustomizationModal - validação
- [ ] StoreMenu - desconto de estoque
- [ ] Criar helper convertUnits
- [ ] Testar fluxo completo

---

## 🎯 **COMO TESTAR:**

1. Execute a migration SQL
2. Crie um produto (ex: "X-Bacon")
3. Adicione grupo "Adicionais"
4. Adicione "Bacon Extra":
   - Ingrediente: Bacon
   - Quantidade: 100
   - Unidade: g
5. No cardápio do cliente, peça o X-Bacon com "Bacon Extra"
6. Verifique se 200g foram descontados do bacon (100g receita + 100g extra)

---

**Status:** Próximo passo é atualizar `ProductCustomizationModal.tsx` e `StoreMenu.tsx`

*Esta é a abordagem CORRETA para gestão de estoque integrada!* 🎯
