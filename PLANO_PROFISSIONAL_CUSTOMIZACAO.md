# 🎯 PLANO PROFISSIONAL - SISTEMA DE CUSTOMIZAÇÃO COMPLETO

## 📊 ANÁLISE DOS CASOS DE USO

### **CASO 1: LANCHE (Ex: Hambúrguer)**
```
Produto Base: X-Burger - R$ 15,00
└─ Adicionais (Opcional, 0-5):
   ├─ Bacon - R$ 5,00 [Estoque: 100g]
   ├─ Queijo Extra - R$ 4,00 [Estoque: 50g]
   ├─ Ovo - R$ 3,00 [Estoque: 10 unid]
   └─ Catupiry - R$ 6,00 [Estoque: 200g]
```

**Estoque:** Desconta dos ingredientes individuais

---

### **CASO 2: BEBIDA (Ex: Coca-Cola)**
```
Produto Base: Coca-Cola

Variações (Tamanhos) - OBRIGATÓRIO escolher 1:
├─ 300ml - R$ 5,00 [Estoque: 50 unid]
├─ 500ml - R$ 7,00 [Estoque: 30 unid]
├─ 1L - R$ 10,00 [Estoque: 20 unid]
└─ 2L - R$ 15,00 [Estoque: 10 unid]
```

**Estoque:** Cada tamanho tem estoque separado (já implementado)

---

### **CASO 3: AÇAÍ (Complexo)**
```
Produto Base: Açaí

1. Tamanhos (Obrigatório, escolher 1):
   ├─ 300ml (P) - R$ 10,00 [Estoque: Pote 300ml]
   ├─ 500ml (M) - R$ 15,00 [Estoque: Pote 500ml]
   └─ 700ml (G) - R$ 20,00 [Estoque: Pote 700ml]

2. Frutas (Opcional, 0-3):
   ├─ Banana - R$ 2,00 [Estoque: 50 unid]
   ├─ Morango - R$ 3,00 [Estoque: 30 unid]
   ├─ Kiwi - R$ 4,00 [Estoque: 20 unid]
   └─ Manga - R$ 3,00 [Estoque: 25 unid]

3. Coberturas (Opcional, 0-2):
   ├─ Leite Condensado - R$ 2,00 [Estoque: 500ml]
   ├─ Mel - R$ 3,00 [Estoque: 300ml]
   └─ Calda Chocolate - R$ 2,50 [Estoque: 400ml]

4. Complementos (Opcional, 0-4):
   ├─ Granola - R$ 2,00 [Estoque: 1kg]
   ├─ Paçoca - R$ 2,50 [Estoque: 500g]
   ├─ Leite Ninho - R$ 3,00 [Estoque: 800g]
   └─ M&M's - R$ 3,50 [Estoque: 300g]
```

**Estoque:** Tamanho + cada adicional descontado separadamente

---

## 🏗️ MODELO DE DADOS (JÁ TEMOS!)

### **Tabelas Existentes:**
```sql
✅ product_variations
   - id, product_id, name, price, stock_quantity
   - Ex: "300ml", "P", "M", "G"

✅ product_addon_groups
   - id, product_id, name, is_required, min_selections, max_selections
   - Ex: "Frutas", "Coberturas", "Complementos"

✅ product_addons
   - id, group_id, name, price_adjustment
   - Ex: "Banana", "Morango", "Granola"
```

### **PROBLEMA ATUAL:**
❌ `product_addons` NÃO TEM `stock_quantity`!

### **SOLUÇÃO:**
Adicionar campo `stock_quantity` em `product_addons`

```sql
ALTER TABLE product_addons 
ADD COLUMN stock_quantity INTEGER DEFAULT NULL;
```

---

## 💡 SOLUÇÃO PROFISSIONAL PROPOSTA

### **OPÇÃO A: MODELO SIMPLIFICADO (RECOMENDADO)**

**Conceito:**
- **Variações** = Tamanhos obrigatórios com estoque próprio
- **Complementos** = Adicionais opcionais SEM controle de estoque rigoroso

**Casos de Uso:**
```
Hambúrguer:
  - SEM variações (só tem 1 tamanho)
  - COM complementos (bacon, queijo) 
    → Estoque do complemento é informativo apenas

Coca-Cola:
  - COM variações (300ml, 500ml, 1L)
    → Cada uma com estoque próprio
  - SEM complementos

Açaí:
  - COM variações (P, M, G)
    → Cada uma com estoque próprio
  - COM complementos (frutas, coberturas)
    → Estoque dos complementos é informativo
```

**Prós:**
✅ Simples de implementar
✅ Fácil de usar
✅ Atende 90% dos casos

**Contras:**
❌ Complementos não descontam estoque automaticamente
❌ Precisa gerenciar manualmente

---

### **OPÇÃO B: MODELO COMPLETO (COMPLEXO)**

**Conceito:**
- Variações = Tamanhos com estoque
- Complementos = Adicionais com estoque individual
- Sistema desconta estoque de TUDO automaticamente

**Implementação:**
1. Adicionar `stock_quantity` em `product_addons`
2. Ao confirmar pedido, descontar:
   - Estoque da variação escolhida
   - Estoque de cada complemento adicionado
3. Validar estoque antes de adicionar ao carrinho

**Prós:**
✅ Controle total de estoque
✅ Nunca vende mais do que tem
✅ 100% profissional

**Contras:**
❌ Mais complexo de implementar
❌ Mais difícil de gerenciar (muitos estoques)
❌ Cliente pode ver "esgotado" em muitos itens

---

## 🎯 MINHA RECOMENDAÇÃO

### **MODELO HÍBRIDO (MELHOR DOS 2 MUNDOS)**

```typescript
product_addons {
    id: string
    group_id: string
    name: string
    price_adjustment: number
    
    // NOVO:
    tracks_stock: boolean  // true/false
    stock_quantity: number | null
}
```

**Como funciona:**

```
Hambúrguer > Adicionais:
  - Bacon (+R$5) [tracks_stock: false] → Não controla
  - Queijo (+R$4) [tracks_stock: false] → Não controla

Açaí > Frutas:
  - Morango (+R$3) [tracks_stock: true, stock: 30] → Controla!
  - Banana (+R$2) [tracks_stock: true, stock: 50] → Controla!
  
Açaí > Coberturas:
  - Mel (+R$3) [tracks_stock: false] → Não controla
```

**Benefícios:**
✅ Flexível - você escolhe o que controlar
✅ Simples para itens que não precisa rastrear
✅ Rigoroso para itens que precisa controlar
✅ Cliente não vê "esgotado" em tudo

---

## 🛠️ INTERFACE PROPOSTA

### **AO EDITAR PRODUTO:**

```
┌────────────────────────────────────────────┐
│ EDITAR: Açaí                               │
├────────────────────────────────────────────┤
│                                            │
│ 📋 INFORMAÇÕES BÁSICAS                     │
│ Nome: [Açaí Completo]                      │
│ Categoria: [Sobremesas]                    │
│ Descrição: [......]                        │
│                                            │
│ ────────────────────────────────────────   │
│                                            │
│ 📦 TAMANHOS (VARIAÇÕES)                    │
│ ☑ Este produto tem tamanhos diferentes    │
│                                            │
│ ┌─────────────────────────────────────┐   │
│ │ Tamanho │ Preço  │ Estoque │ Ações │   │
│ ├─────────────────────────────────────┤   │
│ │ P(300ml)│ R$10,00│   20    │  🗑️  │   │
│ │ M(500ml)│ R$15,00│   15    │  🗑️  │   │
│ │ G(700ml)│ R$20,00│   10    │  🗑️  │   │
│ └─────────────────────────────────────┘   │
│ [+ Adicionar Tamanho]                     │
│                                            │
│ ────────────────────────────────────────   │
│                                            │
│ 🍓 COMPLEMENTOS                            │
│                                            │
│ ▼ Frutas (Opcional, 0-3)                  │
│   ┌────────────────────────────────────┐  │
│   │Nome    │Preço │Estoque│Rastrear?│Del│  │
│   ├────────────────────────────────────┤  │
│   │Morango │+R$3  │  30   │   ✓     │🗑️│  │
│   │Banana  │+R$2  │  50   │   ✓     │🗑️│  │
│   │Kiwi    │+R$4  │  20   │   ✓     │🗑️│  │
│   └────────────────────────────────────┘  │
│   [+ Adicionar Fruta]                     │
│                                            │
│ ▼ Coberturas (Opcional, 0-2)              │
│   │Nome        │Preço │Estoque│Rastrear?│ │
│   │Leite Cond. │+R$2  │   -   │   ✗     │ │
│   │Mel         │+R$3  │   -   │   ✗     │ │
│   [+ Adicionar Cobertura]                 │
│                                            │
│ [+ Novo Grupo]                            │
│                                            │
│ ────────────────────────────────────────   │
│                                            │
│      [Cancelar]  [Salvar Produto]         │
└────────────────────────────────────────────┘
```

---

## 📊 COMPARAÇÃO DAS OPÇÕES

| Aspecto | Opção A | Opção B | HÍBRIDO ⭐ |
|---------|---------|---------|------------|
| Complexidade | Baixa | Alta | Média |
| Controle Estoque | Parcial | Total | Flexível |
| Facilidade Uso | ✅ Fácil | ❌ Difícil | ✅ Fácil |
| Profissional | ⚠️ 70% | ✅ 100% | ✅ 95% |
| **Recomendação** | - | - | ⭐ **MELHOR** |

---

## 🚀 IMPLEMENTAÇÃO DO MODELO HÍBRIDO

### **PASSO 1: Atualizar Banco**
```sql
ALTER TABLE product_addons 
ADD COLUMN tracks_stock BOOLEAN DEFAULT FALSE,
ADD COLUMN stock_quantity INTEGER DEFAULT NULL;
```

### **PASSO 2: Interface de Edição**
- Checkbox "Rastrear Estoque?" para cada complemento
- Se marcado, mostra campo de estoque
- Se desmarcado, não mostra

### **PASSO 3: Lógica de Validação**
```typescript
// Ao adicionar ao carrinho:
for (addon of selectedAddons) {
    if (addon.tracks_stock && addon.stock_quantity !== null) {
        if (addon.stock_quantity < 1) {
            alert(`${addon.name} esgotado!`);
            return;
        }
    }
}
```

### **PASSO 4: Desconto de Estoque**
```typescript
// Ao confirmar pedido:
for (addon of selectedAddons) {
    if (addon.tracks_stock && addon.stock_quantity !== null) {
        await supabase
            .from('product_addons')
            .update({ 
                stock_quantity: addon.stock_quantity - 1 
            })
            .eq('id', addon.id);
    }
}
```

---

## 🎯 DECISÃO FINAL

**Qual modelo você prefere?**

1. **OPÇÃO A - Simples:** Só variações com estoque
2. **OPÇÃO B - Completo:** Tudo com estoque (complexo)
3. **HÍBRIDO ⭐:** Você escolhe o que rastrear (RECOMENDADO)

**Me diga qual prefere e eu implemento!** 😊
