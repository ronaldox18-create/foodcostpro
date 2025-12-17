# 🚀 GUIA COMPLETO - FINALIZAR FASE 3

## ⚠️ IMPORTANTE
Este guia contém todas as alterações necessárias para completar a FASE 3.  
Siga os passos na ordem para evitar erros.

---

## 📝 RESUMO DO QUE FAREMOS:

1. ✅ Adicionar modal de customização no StoreMenu
2. ✅ Modificar estrutura do carrinho
3. ✅ Exibir customizações no carrinho
4. ✅ Vincular complementos/variações aos produtos

---

## 🔧 PASSO 1: Atualizar StoreMenu.tsx

### 1.1 - Adicionar Imports

No início do arquivo `pages/Menu/StoreMenu.tsx`, adicione:

```typescript
import ProductCustomizationModal, { ProductCustomization } from '../../components/ProductCustomizationModal';
```

### 1.2 - Adicionar State

Após a linha 50, adicione:

```typescript
// Customization Modal
const [customizationModal, setCustomizationModal] = useState<{
    show: boolean;
    product: Product | null;
}>({ show: false, product: null });
```

### 1.3 - Atualizar Type do Carrinho

Substitua a linha 34:

**ANTES:**
```typescript
const [cart, setCart] = useState<{ productId: string, quantity: number }[]>([]);
```

**DEPOIS:**
```typescript
interface CartItemExtended {
    id: string; // Unique ID for cart item
    productId: string;
    quantity: number;
    variation?: any;
    selectedAddons?: any[];
    notes?: string;
    totalPrice: number;
}

const [cart, setCart] = useState<CartItemExtended[]>([]);
```

### 1.4 - Adicionar Função para Verificar Customizações

Após a função `fetchData`, adicione:

```typescript
const productHasCustomizations = async (productId: string): Promise<boolean> => {
    try {
        // Check variations
        const { data: variations } = await supabase
            .from('product_variations')
            .select('id')
            .eq('product_id', productId)
            .eq('is_available', true)
            .limit(1);

        if (variations && variations.length > 0) return true;

        // Check addon groups
        const { data: links } = await supabase
            .from('product_addon_group_links')
            .select('id')
            .eq('product_id', productId)
            .limit(1);

        return !!(links && links.length > 0);
    } catch (error) {
        console.error('Error checking customizations:', error);
        return false;
    }
};
```

### 1.5 - Modificar addToCart

Encontre a função `addToCart` e substitua por:

```typescript
const addToCart = async (productId: string) => {
    if (storeStatus && !storeStatus.isOpen) {
        alert(`A loja está fechada no momento.\n\n${storeStatus.message}`);
        return;
    }

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Check if product has customizations
    const hasCustomizations = await productHasCustomizations(productId);

    if (hasCustomizations) {
        // Open customization modal
        setCustomizationModal({ show: true, product });
    } else {
        // Add directly to cart (simple product)
        const existingItem = cart.find(item => 
            item.productId === productId && 
            !item.variation && 
            (!item.selectedAddons || item.selectedAddons.length === 0)
        );
        
        if (existingItem) {
            setCart(cart.map(item =>
                item.id === existingItem.id
                    ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * product.currentPrice }
                    : item
            ));
        } else {
            setCart([...cart, { 
                id: Date.now().toString(),
                productId, 
                quantity: 1,
                totalPrice: product.currentPrice
            }]);
        }
    }
};
```

### 1.6 - Adicionar handleAddCustomization

Depois da função `addToCart`, adicione:

```typescript
const handleAddCustomization = (customization: ProductCustomization) => {
    const customizedItem: CartItemExtended = {
        id: Date.now().toString(),
        productId: customization.productId,
        quantity: customization.quantity,
        variation: customization.variation,
        selectedAddons: customization.selectedAddons,
        notes: customization.notes,
        totalPrice: customization.totalPrice
    };

    setCart([...cart, customizedItem]);
};
```

### 1.7 - Atualizar removeFromCart

Encontre e substitua:

**ANTES:**
```typescript
const removeFromCart = (productId: string) => {
    const item = cart.find(item => item.productId === productId);
    if (item && item.quantity > 1) {
        setCart(cart.map(item =>
            item.productId === productId
                ? { ...item, quantity: item.quantity - 1 }
                : item
        ));
    } else {
        setCart(cart.filter(item => item.productId !== productId));
    }
};
```

**DEPOIS:**
```typescript
const removeFromCart = (itemId: string) => {
    const item = cart.find(i => i.id === itemId);
    if (!item) return;

    if (item.quantity > 1) {
        const product = products.find(p => p.id === item.productId);
        const unitPrice = item.variation?.price || product?.currentPrice || 0;
        const addonsPrice = (item.selectedAddons || []).reduce((sum, addon) => sum + addon.price_adjustment, 0);
        const newTotal = (unitPrice + addonsPrice) * (item.quantity - 1);

        setCart(cart.map(i =>
            i.id === itemId
                ? { ...i, quantity: i.quantity - 1, totalPrice: newTotal }
                : i
        ));
    } else {
        setCart(cart.filter(i => i.id !== itemId));
    }
};
```

### 1.8 - Atualizar deleteCartItem

**ANTES:**
```typescript
const deleteCartItem = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
};
```

**DEPOIS:**
```typescript
const deleteCartItem = (itemId: string) => {
    setCart(cart.filter(i => i.id !== itemId));
};
```

### 1.9 - Atualizar getQuantity

**ANTES:**
```typescript
const getQuantity = (productId: string) => {
    return cart.find(item => item.productId === productId)?.quantity || 0;
};
```

**DEPOIS:**
```typescript
const getQuantity = (productId: string) => {
    return cart
        .filter(item => item.productId === productId)
        .reduce((sum, item) => sum + item.quantity, 0);
};
```

### 1.10 - Atualizar cartTotal

**ANTES:**
```typescript
const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
        const product = products.find(p => p.id === item.productId);
        return total + (product?.currentPrice || 0) * item.quantity;
    }, 0);
}, [cart, products]);
```

**DEPOIS:**
```typescript
const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
}, [cart]);
```

### 1.11 - Renderizar Modal no Final do Componente

Antes do fechamento final `</div>`, adicione:

```typescript
{customizationModal.show && customizationModal.product && (
    <ProductCustomizationModal
        product={customizationModal.product}
        onClose={() => setCustomizationModal({ show: false, product: null })}
        onAddToCart={handleAddCustomization}
    />
)}
```

### 1.12 - Atualizar Renderização dos Itens do Carrinho

Encontre onde renderiza os itens do carrinho (dentro do modal do carrinho) e substitua por:

```tsx
{cart.map((item) => {
    const product = products.find(p => p.id === item.productId);
    if (!product) return null;

    return (
        <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
            {product.image_url && (
                <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-20 h-20 rounded-xl object-cover"
                />
            )}
            <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-sm">{product.name}</h4>
                        
                        {/* Show variation */}
                        {item.variation && (
                            <p className="text-xs text-blue-600 font-medium">
                                📦 {item.variation.name}
                            </p>
                        )}
                        
                        {/* Show addons */}
                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                            <div className="text-xs text-gray-600 mt-1">
                                {item.selectedAddons.map((addon, idx) => (
                                    <span key={idx} className="block">
                                        + {addon.addon_name} 
                                        {addon.price_adjustment > 0 && ` (+${formatCurrency(addon.price_adjustment)})`}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        {/* Show notes */}
                        {item.notes && (
                            <p className="text-xs text-gray-500 italic mt-1">
                                💬 {item.notes}
                            </p>
                        )}
                    </div>
                    
                    <button
                        onClick={() => deleteCartItem(item.id)}
                        className="p-1 hover:bg-red-50 rounded text-red-600"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-2 py-1">
                        <button 
                            onClick={() => removeFromCart(item.id)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-gray-200 rounded"
                        >
                            <Minus size={12} />
                        </button>
                        <span className="font-bold text-xs w-6 text-center">{item.quantity}</span>
                        <button 
                            onClick={() => addToCart(item.productId)} 
                            className="w-6 h-6 flex items-center justify-center rounded text-white"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                    <span className="font-black text-orange-600">
                        {formatCurrency(item.totalPrice)}
                    </span>
                </div>
            </div>
        </div>
    );
})}
```

---

## ✅ PASSO 2: Testar!

Após fazer todas as alterações:

1. **Salve todos os arquivos**
2. **Recarregue a aplicação** (F5)
3. **Teste o fluxo:**
   - Adicionar produto simples (sem customizações) ✅
   - Adicionar produto com customizações (deve abrir modal) ✅
   - Selecionar variação ✅
   - Selecionar complementos ✅
   - Adicionar observação ✅
   - Ver no carrinho ✅
   - Finalizar pedido ✅

---

## 🎉 FASE 3 COMPLETA!

Após isso, você terá 100% da Fase 3 implementada!

```
████████████████████ 100%
```

---

## 📋 PRÓXIMOS PASSOS (Opcional):

### Vincular Complementos/Variações aos Produtos

Editar produto no MenuManager e adicionar:

```tsx
// Em ProductForm dentro do MenuManager
<div>
    <label>Variações Disponíveis</label>
    <select multiple>
        {/* Listar variações criadas */}
    </select>
</div>

<div>
    <label>Grupos de Complementos</label>
    <select multiple>
        {/* Listar grupos de complementos */}
    </select>
</div>
```

Isso permitirá que você escolha quais complementos e variações cada produto terá.

---

**Boa sorte! Qualquer dúvida, me avise!** 🚀
