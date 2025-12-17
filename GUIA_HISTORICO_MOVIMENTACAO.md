# 🎯 GUIA COMPLETO - PRÓXIMA SESSÃO: HISTÓRICO DE MOVIMENTAÇÃO

**Data de criação:** 17/12/2025 12:20  
**Sessão:** Fase 2 - Analytics e Relatórios  
**Duração estimada:** 2-3 horas  

---

## 📊 **PROGRESSO ATUAL:**

```
████████████████████░░░░ 87% COMPLETO!
```

**Concluído:**
- ✅ Fase 1: Database (100%)
- ✅ Fase 2: Visual (100%)
- ✅ Fase 3: Customização (100%)
- ✅ Indicadores Visuais de Estoque (100%)
- ⏳ Histórico de Movimentação (0%)

---

## 🚀 **PRÓXIMA FEATURE: HISTÓRICO DE MOVIMENTAÇÃO**

### **Por que é importante:**
- Base para TODOS os relatórios
- Rastreabilidade total do estoque
- Identifica desperdícios
- Auditoria completa

### **O que vai permitir:**
- Saber exatamente onde foi usado cada ingrediente
- Relatórios de vendas por variação
- Dashboard de ingredientes mais usados
- Análise de custo real por pedido

---

## 📋 **IMPLEMENTAÇÃO - PASSO A PASSO:**

### **PASSO 1: Criar Tabela no Banco (15min)**

Execute este SQL no Supabase SQL Editor:

```sql
-- Tabela de movimentação de estoque
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    
    -- Tipo de movimentação
    type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'entry', 'adjustment', 'loss')),
    
    -- Quantidade (positiva para entrada, negativa para saída)
    quantity DECIMAL(10,3) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    
    -- Motivo/Descrição
    reason TEXT,
    
    -- Referências
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    addon_id UUID REFERENCES product_addons(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_stock_movements_user ON stock_movements(user_id);
CREATE INDEX idx_stock_movements_ingredient ON stock_movements(ingredient_id);
CREATE INDEX idx_stock_movements_type ON stock_movements(type);
CREATE INDEX idx_stock_movements_created ON stock_movements(created_at DESC);
CREATE INDEX idx_stock_movements_order ON stock_movements(order_id);

-- RLS Policies
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver só seus movimentos
CREATE POLICY "Users can view own movements"
    ON stock_movements FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Usuários podem inserir seus movimentos
CREATE POLICY "Users can insert own movements"
    ON stock_movements FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Comentários
COMMENT ON TABLE stock_movements IS 'Histórico completo de movimentações de estoque';
COMMENT ON COLUMN stock_movements.type IS 'sale=venda, entry=entrada, adjustment=ajuste, loss=perda';
COMMENT ON COLUMN stock_movements.quantity IS 'Quantidade movimentada (negativo para saída)';
```

**Salvar como:** `migrations/create_stock_movements.sql`

---

### **PASSO 2: Atualizar StoreMenu.tsx - Registrar Vendas (30min)**

**Arquivo:** `pages/Menu/StoreMenu.tsx`

**Localização:** Função `handleCheckout`, após descontar estoque

**Adicionar:**

```typescript
// Após linha ~450 (onde desconta estoque de variações e complementos)

// ========== REGISTRAR MOVIMENTAÇÃO DE ESTOQUE ==========

try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    // Para cada item do pedido
    for (const item of cart) {
        // 1. Registrar desconto da receita
        if (item.productId) {
            // Buscar receita do produto
            const { data: recipeItems } = await supabase
                .from('product_recipes')
                .select('ingredient_id, quantity_needed, unit')
                .eq('product_id', item.productId);

            if (recipeItems && recipeItems.length > 0) {
                for (const recipeItem of recipeItems) {
                    await supabase.from('stock_movements').insert({
                        user_id: user.id,
                        ingredient_id: recipeItem.ingredient_id,
                        type: 'sale',
                        quantity: -(recipeItem.quantity_needed * item.quantity),
                        unit: recipeItem.unit,
                        reason: `Venda: ${item.quantity}× produto`,
                        order_id: orderData.id,
                        product_id: item.productId
                    });
                }
            }
        }

        // 2. Registrar desconto dos complementos
        if (item.selectedAddons && item.selectedAddons.length > 0) {
            for (const addon of item.selectedAddons) {
                // Buscar dados do addon
                const { data: addonData } = await supabase
                    .from('product_addons')
                    .select('ingredient_id, quantity_used, unit_used')
                    .eq('id', addon.addon_id)
                    .single();

                if (addonData && addonData.ingredient_id) {
                    await supabase.from('stock_movements').insert({
                        user_id: user.id,
                        ingredient_id: addonData.ingredient_id,
                        type: 'sale',
                        quantity: -(addonData.quantity_used * item.quantity),
                        unit: addonData.unit_used,
                        reason: `Venda: ${item.quantity}× complemento`,
                        order_id: orderData.id,
                        addon_id: addon.addon_id
                    });
                }
            }
        }
    }
} catch (error) {
    console.error('Error logging stock movements:', error);
    // Não bloqueia a venda se falhar o registro
}
```

---

### **PASSO 3: Criar Página de Histórico (1h)**

**Criar arquivo:** `pages/StockMovements.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/calculations';
import { TrendingDown, TrendingUp, Activity, Filter } from 'lucide-react';

interface StockMovement {
    id: string;
    ingredient_id: string;
    ingredient_name: string;
    type: 'sale' | 'entry' | 'adjustment' | 'loss';
    quantity: number;
    unit: string;
    reason: string;
    created_at: string;
}

const StockMovements: React.FC = () => {
    const { user } = useAuth();
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedIngredient, setSelectedIngredient] = useState<string>('all');

    useEffect(() => {
        loadMovements();
    }, [selectedType, selectedIngredient]);

    const loadMovements = async () => {
        if (!user) return;
        
        setLoading(true);
        try {
            let query = supabase
                .from('stock_movements')
                .select(`
                    *,
                    ingredients(name)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(100);

            if (selectedType !== 'all') {
                query = query.eq('type', selectedType);
            }

            if (selectedIngredient !== 'all') {
                query = query.eq('ingredient_id', selectedIngredient);
            }

            const { data, error } = await query;

            if (error) throw error;

            setMovements(data?.map(m => ({
                ...m,
                ingredient_name: m.ingredients?.name || 'Ingrediente'
            })) || []);
        } catch (error) {
            console.error('Error loading movements:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'sale': return <TrendingDown className="text-red-600" size={18} />;
            case 'entry': return <TrendingUp className="text-green-600" size={18} />;
            default: return <Activity className="text-blue-600" size={18} />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'sale': return 'Venda';
            case 'entry': return 'Entrada';
            case 'adjustment': return 'Ajuste';
            case 'loss': return 'Perda';
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'sale': return 'bg-red-50 text-red-700 border-red-200';
            case 'entry': return 'bg-green-50 text-green-700 border-green-200';
            case 'adjustment': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'loss': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Histórico de Movimentação
                </h1>
                <p className="text-gray-600 mt-1">
                    Rastreamento completo de entradas e saídas de estoque
                </p>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-6">
                <div className="flex items-center gap-4">
                    <Filter size={20} className="text-gray-400" />
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="all">Todos os tipos</option>
                        <option value="sale">Vendas</option>
                        <option value="entry">Entradas</option>
                        <option value="adjustment">Ajustes</option>
                        <option value="loss">Perdas</option>
                    </select>
                </div>
            </div>

            {/* Lista de Movimentações */}
            <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                Data/Hora
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                Tipo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                Ingrediente
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                                Quantidade
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                                Motivo
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {movements.map((movement) => (
                            <tr key={movement.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {new Date(movement.created_at).toLocaleString('pt-BR')}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        {getTypeIcon(movement.type)}
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(movement.type)}`}>
                                            {getTypeLabel(movement.type)}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {movement.ingredient_name}
                                </td>
                                <td className="px-6 py-4 text-sm text-right">
                                    <span className={`font-bold ${movement.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {movement.quantity > 0 ? '+' : ''}{movement.quantity} {movement.unit}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {movement.reason || '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {movements.length === 0 && !loading && (
                    <div className="text-center py-12">
                        <Activity size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">Nenhuma movimentação encontrada</p>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockMovements;
```

---

### **PASSO 4: Adicionar Rota (5min)**

**Arquivo:** `App.tsx` ou onde as rotas são definidas

```typescript
import StockMovements from './pages/StockMovements';

// Adicionar rota:
<Route path="/stock-movements" element={<StockMovements />} />
```

**Menu Lateral:** Adicionar link para `/stock-movements`

---

## 🧪 **COMO TESTAR:**

### **1. Criar a tabela:**
- Execute o SQL no Supabase
- Verifique se a tabela foi criada

### **2. Fazer uma venda:**
- Acesse o cardápio do cliente
- Faça um pedido com produto que tem receita
- Adicione complementos
- Finalize

### **3. Ver o histórico:**
- Acesse `/stock-movements`
- Veja registros da venda
- Verifique se quantidade está negativa
- Confirme que ingredientes corretos foram descontados

---

## 📊 **APÓS IMPLEMENTAR:**

Com o histórico funcionando, você terá dados para:

1. **Relatórios de Vendas por Variação** (próximo)
2. **Dashboard de Ingredientes Mais Usados**
3. **Análise de Custo Real**
4. **Identificação de Desperdícios**

---

## 🎯 **FRASE PARA CONTINUAR NA PRÓXIMA SESSÃO:**

```
Implementar histórico de movimentação de estoque.
Preciso criar a tabela stock_movements, registrar 
vendas automaticamente e criar interface de visualização.
Referência: GUIA_HISTORICO_MOVIMENTACAO.md
```

---

## ⏱️ **CRONOGRAMA SUGERIDO:**

**Sessão 1 (2h):**
- Criar tabela (15min)
- Atualizar checkout (30min)
- Criar página de histórico (1h)
- Testes (15min)

**Sessão 2 (1h30):**
- Relatórios de vendas por variação (1h)
- Dashboard de ingredientes (30min)

**Sessão 3 (2h):**
- Análise de custo real (2h)

---

**Data:** 17/12/2025 12:20  
**Próxima Feature:** Histórico de Movimentação  
**Status:** Guia completo pronto! ✅
