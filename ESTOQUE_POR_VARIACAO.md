# 📦 IMPLEMENTAÇÃO - ESTOQUE INDIVIDUAL POR VARIAÇÃO

## ✅ O QUE JÁ TEMOS:

- Tabela `product_variations` com campo `stock_quantity`
- Interface para criar variações com estoque
- Modal de customização funcionando

---

## 🔧 MUDANÇAS NECESSÁRIAS:

### 1. **ProductVariationManager.tsx** - JÁ ESTÁ PRONTO! ✅

O componente já permite definir estoque individual para cada variação.

Exemplo:
- 300ml: 50 unidades
- 500ml: 30 unidades
- 1L: 20 unidades

---

### 2. **ProductCustomizationModal.tsx** - VERIFICAR ESTOQUE

Adicione validação antes de adicionar ao carrinho:

```typescript
// Adicionar antes de onAddToCart no validateAndAddToCart()

// Verificar estoque da variação
if (selectedVariation && selectedVariation.stock_quantity !== null) {
    if (selectedVariation.stock_quantity < quantity) {
        alert(`Estoque insuficiente! Disponível: ${selectedVariation.stock_quantity}`);
        return;
    }
}
```

---

### 3. **CheckoutModal.tsx** - DESCONTAR ESTOQUE DA VARIAÇÃO

Quando o pedido for confirmado, descontar do estoque da variação:

```typescript
// No handleCheckout, após criar o pedido:

for (const item of cart) {
    if (item.variation) {
        // Descontar do estoque da variação
        const { data: currentVariation } = await supabase
            .from('product_variations')
            .select('stock_quantity')
            .eq('id', item.variation.id)
            .single();

        if (currentVariation && currentVariation.stock_quantity !== null) {
            await supabase
                .from('product_variations')
                .update({ 
                    stock_quantity: currentVariation.stock_quantity - item.quantity 
                })
                .eq('id', item.variation.id);
        }
    } else {
        // Descontar do estoque do produto principal (como antes)
        const product = products.find(p => p.id === item.productId);
        if (product && product.stockQuantity !== undefined) {
            await updateProduct(item.productId, {
                ...product,
                stockQuantity: product.stockQuantity - item.quantity
            });
        }
    }
}
```

---

### 4. **ProductCustomizationModal.tsx** - EXIBIR ESTOQUE NO MODAL

Já está implementado! Linha 227-230:

```typescript
{variation.stock_quantity !== null && (
    <p className="text-xs text-gray-500 mt-1">
        {variation.stock_quantity} disponíveis
    </p>
)}
```

---

### 5. **ProductCustomizationModal.tsx** - DESABILITAR VARIAÇÃO SEM ESTOQUE

Modifique o botão da variação:

```typescript
<button
    key={variation.id}
    onClick={() => setSelectedVariation(variation)}
    disabled={variation.stock_quantity !== null && variation.stock_quantity === 0}
    className={`p-4 rounded-xl border-2 transition-all ${
        variation.stock_quantity === 0 
            ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-100'
            : selectedVariation?.id === variation.id
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
    }`}
>
    <p className="font-bold text-gray-900">{variation.name}</p>
    <p className="text-lg font-black text-orange-600 mt-1">
        {formatCurrency(variation.price)}
    </p>
    {variation.stock_quantity !== null && (
        <p className={`text-xs mt-1 ${
            variation.stock_quantity === 0 
                ? 'text-red-600 font-bold' 
                : 'text-gray-500'
        }`}>
            {variation.stock_quantity === 0 
                ? '❌ Esgotado' 
                : `${variation.stock_quantity} disponíveis`
            }
        </p>
    )}
</button>
```

---

## 🧪 COMO VAI FUNCIONAR:

### **Cenário 1: Coca-Cola com Estoque Individual**

**Estoque:**
- 300ml: 50 unidades
- 500ml: 30 unidades
- 1L: 20 unidades

**Cliente adiciona:**
- 2x Coca 500ml

**Sistema:**
1. Valida: 30 >= 2? ✅ SIM
2. Adiciona ao carrinho
3. No checkout, desconta: 30 - 2 = 28

**Próximo cliente:**
- Vê: "28 disponíveis" na 500ml

---

### **Cenário 2: Produto Esgotado**

**Estoque:**
- 300ml: 5 unidades
- 500ml: 0 unidades ❌
- 1L: 10 unidades

**Cliente tenta adicionar:**
- Coca 500ml

**Sistema:**
- Botão aparece cinza e travado
- Mostra: "❌ Esgotado"
- Só pode escolher 300ml ou 1L

---

## 📝 RESUMO DAS ALTERAÇÕES:

1. ✅ **Criar variações com estoque** (JÁ FUNCIONA)
2. 🔄 **Validar estoque antes de adicionar** (ADICIONAR)
3. 🔄 **Descontar estoque da variação no checkout** (ADICIONAR)
4. 🔄 **Exibir "Esgotado" nas variações** (ADICIONAR)
5. ✅ **Mostrar quantidade disponível** (JÁ FUNCIONA)

---

## ⚠️ IMPORTANTE:

- Produtos SEM variações continuam usando estoque do produto principal
- Produtos COM variações usam estoque de cada variação
- Se `stock_quantity` = NULL → estoque infinito

---

## 🚀 PRÓXIMOS PASSOS:

Vou aplicar as alterações 2, 3 e 4 agora!

Concorda? Digite "SIM" para eu implementar! 😊
