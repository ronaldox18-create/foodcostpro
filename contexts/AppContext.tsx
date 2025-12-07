import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Ingredient, Product, AppSettings, FixedCost, Customer, Order, OrderItem, Table } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabaseClient';

interface AppContextType {
  ingredients: Ingredient[];
  products: Product[];
  fixedCosts: FixedCost[];
  customers: Customer[];
  orders: Order[];
  tables: Table[];
  categories: string[];
  settings: AppSettings;
  loading: boolean;

  addIngredient: (ing: Ingredient) => Promise<void>;
  updateIngredient: (ing: Ingredient) => Promise<void>;
  deleteIngredient: (id: string) => Promise<void>;

  addProduct: (prod: Product) => Promise<void>;
  updateProduct: (prod: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  addFixedCost: (cost: FixedCost) => Promise<void>;
  deleteFixedCost: (id: string) => Promise<void>;

  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  addOrder: (order: Order) => Promise<void>;
  updateOrder: (order: Order) => Promise<void>;

  addTable: (tableNumber: number) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;

  addCategory: (category: string) => Promise<void>;
  updateCategory: (oldName: string, newName: string) => Promise<void>;
  deleteCategory: (category: string) => Promise<void>;

  updateSettings: (settings: AppSettings) => Promise<void>;
  handleStockUpdate: (items: OrderItem[]) => Promise<void>;
  checkStockAvailability: (items: OrderItem[]) => Promise<{ available: boolean; missingItems: string[] }>;
  fixTableStatuses: () => Promise<void>;
  refreshOrders: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  targetMargin: 20,
  taxAndLossPercent: 12,
  businessName: "Meu Negócio",
  estimatedMonthlyBilling: 25000
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  const refreshOrders = async () => {
    if (!user) return;
    try {
      const { data: orderData } = await supabase.from('orders').select(`*, order_items (*)`).eq('user_id', user.id).order('date', { ascending: false });
      if (orderData) {
        const formattedOrders = orderData.map(o => ({
          id: o.id,
          customerId: o.customer_id || 'guest',
          customerName: o.customer_name,
          totalAmount: o.total_amount,
          paymentMethod: o.payment_method,
          status: o.status,
          date: o.date,
          tableId: o.table_id,
          tableNumber: o.table_number,
          notes: o.notes,
          deliveryType: o.delivery_type,
          deliveryAddress: o.delivery_address,
          phone: o.phone,
          delivery_type: o.delivery_type,
          delivery_address: o.delivery_address,
          items: o.order_items.map((oi: any) => ({
            productId: oi.product_id,
            productName: oi.product_name,
            quantity: oi.quantity,
            unitPrice: oi.price,
            total: oi.total,
            addedAt: oi.added_at || new Date().toISOString()
          }))
        }));
        setOrders(formattedOrders);
      }
    } catch (e) {
      console.error('Error refreshing orders:', e);
    }
  };

  useEffect(() => {
    if (!user) {
      setIngredients([]);
      setProducts([]);
      setFixedCosts([]);
      setCustomers([]);
      setOrders([]);
      setTables([]);
      setCategories([]);
      setSettings(defaultSettings);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: settingsData } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single();
        if (settingsData) setSettings({
          businessName: settingsData.business_name,
          targetMargin: settingsData.target_margin,
          taxAndLossPercent: settingsData.tax_and_loss_percent,
          estimatedMonthlyBilling: settingsData.estimated_monthly_billing
        });

        const { data: ingData } = await supabase.from('ingredients').select('*').eq('user_id', user.id);
        if (ingData) setIngredients(ingData.map(i => ({ ...i, purchaseUnit: i.purchase_unit, purchaseQuantity: i.purchase_quantity, purchasePrice: i.purchase_price, yieldPercent: i.yield_percent, currentStock: i.current_stock, minStock: i.min_stock })));

        const { data: prodData } = await supabase.from('products').select(`*, product_ingredients (*)`).eq('user_id', user.id);
        if (prodData) {
          setProducts(prodData.map(p => ({
            id: p.id, name: p.name, category: p.category, description: p.description, currentPrice: p.current_price, preparationMethod: p.preparation_method,
            recipe: p.product_ingredients.map((pi: any) => ({ ingredientId: pi.ingredient_id, quantityUsed: pi.quantity_used, unitUsed: pi.unit_used }))
          })));
        }

        const { data: custData } = await supabase.from('customers').select('*').eq('user_id', user.id);
        if (custData) setCustomers(custData.map(c => ({ ...c, totalSpent: c.total_spent, lastOrderDate: c.last_order_date, birthDate: c.birth_date })));

        const { data: costData } = await supabase.from('fixed_costs').select('*').eq('user_id', user.id);
        if (costData) setFixedCosts(costData);

        const { data: orderData } = await supabase.from('orders').select(`*, order_items (*)`).eq('user_id', user.id).order('date', { ascending: false });
        if (orderData) {
          const formattedOrders = orderData.map(o => ({
            id: o.id,
            customerId: o.customer_id || 'guest',
            customerName: o.customer_name,
            totalAmount: o.total_amount,
            paymentMethod: o.payment_method,
            status: o.status,
            date: o.date,
            tableId: o.table_id,
            tableNumber: o.table_number,
            notes: o.notes,
            deliveryType: o.delivery_type,
            deliveryAddress: o.delivery_address,
            phone: o.phone,
            delivery_type: o.delivery_type,
            delivery_address: o.delivery_address,
            items: o.order_items.map((oi: any) => ({
              productId: oi.product_id,
              productName: oi.product_name,
              quantity: oi.quantity,
              unitPrice: oi.price,
              total: oi.total,
              addedAt: oi.added_at || new Date().toISOString()
            }))
          }));
          setOrders(formattedOrders);
        }

        const { data: tableData } = await supabase.from('tables').select('*').eq('user_id', user.id).order('number');
        if (tableData) {
          setTables(tableData.map(t => ({
            id: t.id,
            number: t.number,
            status: t.status as 'free' | 'occupied'
          })));
        }

        // Load categories from Supabase
        const { data: catData } = await supabase.from('categories').select('*').eq('user_id', user.id).order('name');
        if (catData && catData.length > 0) {
          setCategories(catData.map(c => c.name));
        } else {
          // Insert default categories if none exist
          const defaultCategories = ['Lanches', 'Bebidas', 'Sobremesas', 'Combos', 'Pratos'];
          const categoriesToInsert = defaultCategories.map(name => ({ user_id: user.id, name }));
          await supabase.from('categories').insert(categoriesToInsert);
          setCategories(defaultCategories);
        }

      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // --- Helpers de Mesas ---
  useEffect(() => {
    if (tables.length > 0 && orders.length > 0) {
      setTables(prev => prev.map(t => {
        const openOrder = orders.find(o => o.tableId === t.id && o.status === 'open');
        return {
          ...t,
          status: openOrder ? 'occupied' : 'free',
          currentOrderId: openOrder?.id,
          currentOrderTotal: openOrder?.totalAmount
        };
      }));
    }
  }, [orders]);

  // --- Helper de Conversão de Unidades ---
  const convertToStockUnit = (recipeAmount: number, recipeUnit: string, stockUnit: string): number => {
    // Se as unidades são iguais, retorna direto
    if (recipeUnit === stockUnit) return recipeAmount;

    // Conversões de peso
    if (recipeUnit === 'g' && stockUnit === 'kg') return recipeAmount / 1000;
    if (recipeUnit === 'kg' && stockUnit === 'g') return recipeAmount * 1000;

    // Conversões de volume
    if (recipeUnit === 'ml' && stockUnit === 'l') return recipeAmount / 1000;
    if (recipeUnit === 'l' && stockUnit === 'ml') return recipeAmount * 1000;

    // Se não há conversão conhecida, retorna o valor original e alerta
    console.warn(`⚠️ Conversão não suportada: ${recipeUnit} → ${stockUnit}`);
    return recipeAmount;
  };

  // --- Verificação de Estoque ---
  const checkStockAvailability = async (items: OrderItem[]): Promise<{ available: boolean; missingItems: string[] }> => {
    const missingItems: string[] = [];

    if (!items || items.length === 0) return { available: true, missingItems: [] };

    // Mapa para acumular o consumo total de cada ingrediente no pedido
    // Chave: ingredientId, Valor: quantidade total necessária na unidade de estoque
    const ingredientConsumption = new Map<string, number>();

    for (const item of items) {
      // Buscar produto e receita (usando o estado local para ser mais rápido e evitar muitas requisições, 
      // mas idealmente deveria ser do banco para garantir consistência. Vamos usar o banco para garantir.)
      // Na verdade, usar o estado local 'products' e 'ingredients' é mais rápido e já deve estar sincronizado.
      // Mas para garantir que não estamos vendendo algo que acabou de acabar, vamos consultar o banco ou confiar no estado local se ele for realtime.
      // O estado local é atualizado após cada ação, então deve estar ok.

      // Vamos usar o banco para ter certeza absoluta do estoque atual.

      const { data: productData } = await supabase
        .from('products')
        .select(`
            id,
            name,
            product_ingredients (
              ingredient_id,
              quantity_used,
              unit_used
            )
          `)
        .eq('id', item.productId)
        .single();

      if (!productData) continue;

      const recipe = productData.product_ingredients as any[];
      if (!recipe || recipe.length === 0) continue;

      for (const recipeItem of recipe) {
        const { data: ingredient } = await supabase
          .from('ingredients')
          .select('id, name, current_stock, purchase_unit')
          .eq('id', recipeItem.ingredient_id)
          .single();

        if (!ingredient) continue;

        const recipeQuantityInRecipeUnit = recipeItem.quantity_used * item.quantity;
        const quantityToDeduct = convertToStockUnit(
          recipeQuantityInRecipeUnit,
          recipeItem.unit_used,
          ingredient.purchase_unit
        );

        const currentConsumption = ingredientConsumption.get(ingredient.id) || 0;
        ingredientConsumption.set(ingredient.id, currentConsumption + quantityToDeduct);

        // Verificar se o consumo total até agora excede o estoque
        // Precisamos checar o estoque TOTAL vs CONSUMO TOTAL
        // Como estamos iterando, vamos verificar no final ou acumular tudo primeiro.
        // Melhor acumular tudo primeiro.
      }
    }

    // Agora verificar disponibilidade para cada ingrediente acumulado
    for (const [ingredientId, totalNeeded] of ingredientConsumption.entries()) {
      const { data: ingredient } = await supabase
        .from('ingredients')
        .select('name, current_stock')
        .eq('id', ingredientId)
        .single();

      if (ingredient) {
        if ((ingredient.current_stock || 0) < totalNeeded) {
          missingItems.push(`${ingredient.name} (Necessário: ${totalNeeded.toFixed(3)}, Disponível: ${ingredient.current_stock})`);
        }
      }
    }

    return { available: missingItems.length === 0, missingItems };
  };

  // --- Helper de Estoque ---
  const handleStockUpdate = async (items: OrderItem[]) => {
    console.log('📦 ============ INICIANDO BAIXA DE ESTOQUE ============');
    console.log('📦 Items para processar:', items);

    if (!items || items.length === 0) {
      console.log('⚠️ Nenhum item para baixar do estoque');
      return;
    }

    try {
      // Para cada item do pedido
      for (const item of items) {
        // 1. Buscar o produto e sua receita
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            product_ingredients (
              ingredient_id,
              quantity_used,
              unit_used
            )
          `)
          .eq('id', item.productId)
          .single();

        if (productError || !productData) {
          console.warn(`⚠️ Produto ${item.productName} não encontrado ou sem receita`);
          continue;
        }

        const recipe = productData.product_ingredients as any[];
        if (!recipe || recipe.length === 0) {
          console.log(`ℹ️ Produto ${item.productName} não tem receita cadastrada`);
          continue;
        }

        console.log(`📋 Processando receita de ${item.productName} (${item.quantity}x)`);

        // 2. Para cada ingrediente da receita, baixar o estoque
        for (const recipeItem of recipe) {
          // Buscar o ingrediente atual para saber sua unidade de estoque
          const { data: ingredient, error: ingError } = await supabase
            .from('ingredients')
            .select('id, name, current_stock, purchase_unit')
            .eq('id', recipeItem.ingredient_id)
            .single();

          if (ingError || !ingredient) {
            console.warn(`⚠️ Ingrediente ${recipeItem.ingredient_id} não encontrado`);
            continue;
          }

          // Converter a quantidade da receita para a unidade de estoque (purchase_unit)
          const recipeQuantityInRecipeUnit = recipeItem.quantity_used * item.quantity;
          const quantityToDeduct = convertToStockUnit(
            recipeQuantityInRecipeUnit,
            recipeItem.unit_used,
            ingredient.purchase_unit // Usar purchase_unit como unidade de estoque
          );

          const newStock = (ingredient.current_stock || 0) - quantityToDeduct;

          console.log(`🔄 ${ingredient.name}: ${recipeQuantityInRecipeUnit}${recipeItem.unit_used} → ${quantityToDeduct.toFixed(3)}${ingredient.purchase_unit}`);

          // Atualizar o estoque
          const { error: updateError } = await supabase
            .from('ingredients')
            .update({ current_stock: newStock })
            .eq('id', ingredient.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar estoque de ${ingredient.name}:`, updateError);
          } else {
            console.log(`✅ ${ingredient.name}: ${ingredient.current_stock} → ${newStock.toFixed(3)} (${-quantityToDeduct.toFixed(3)})`);

            // Atualizar estado local
            setIngredients(prev => prev.map(ing =>
              ing.id === ingredient.id
                ? { ...ing, currentStock: newStock }
                : ing
            ));
          }
        }
      }

      console.log('✅ Baixa de estoque concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro na baixa de estoque:', error);
    }
  };

  // ... (Actions de ingredientes, produtos, etc - mantidos)

  // --- ACTIONS ---

  const addTable = async (number: number) => {
    if (!user) return;
    const { data } = await supabase.from('tables').insert([{ user_id: user.id, number, status: 'free' }]).select().single();
    if (data) setTables(prev => [...prev, { id: data.id, number: data.number, status: 'free' }]);
  };

  const deleteTable = async (id: string) => {
    if (!user) return;
    await supabase.from('tables').delete().eq('id', id);
    setTables(prev => prev.filter(t => t.id !== id));
  };

  const addIngredient = async (ing: Ingredient) => {
    if (!user) return;
    const { data } = await supabase.from('ingredients').insert([{
      user_id: user.id, name: ing.name, purchase_unit: ing.purchaseUnit, purchase_quantity: ing.purchaseQuantity, purchase_price: ing.purchasePrice, yield_percent: ing.yieldPercent, current_stock: ing.currentStock, min_stock: ing.minStock
    }]).select().single();
    if (data) setIngredients(prev => [...prev, { ...ing, id: data.id }]);
  };
  const updateIngredient = async (ing: Ingredient) => {
    if (!user) return;
    setIngredients(prev => prev.map(i => i.id === ing.id ? ing : i));
    await supabase.from('ingredients').update({
      name: ing.name, purchase_unit: ing.purchaseUnit, purchase_quantity: ing.purchaseQuantity, purchase_price: ing.purchasePrice, yield_percent: ing.yieldPercent, current_stock: ing.currentStock, min_stock: ing.minStock
    }).eq('id', ing.id);
  };
  const deleteIngredient = async (id: string) => {
    if (!user) return;
    setIngredients(prev => prev.filter(i => i.id !== id));
    await supabase.from('ingredients').delete().eq('id', id);
  };

  const addProduct = async (prod: Product) => {
    if (!user) return;
    const { data: prodData, error } = await supabase.from('products').insert([{
      user_id: user.id, name: prod.name, category: prod.category, description: prod.description, current_price: prod.currentPrice, preparation_method: prod.preparationMethod
    }]).select().single();
    if (error || !prodData) return;
    if (prod.recipe.length > 0) {
      const recipeItems = prod.recipe.map(r => ({
        user_id: user.id, product_id: prodData.id, ingredient_id: r.ingredientId, quantity_used: r.quantityUsed, unit_used: r.unitUsed
      }));
      await supabase.from('product_ingredients').insert(recipeItems);
    }
    setProducts(prev => [...prev, { ...prod, id: prodData.id }]);
  };

  const updateProduct = async (prod: Product) => {
    if (!user) return;
    setProducts(prev => prev.map(p => p.id === prod.id ? prod : p));
    await supabase.from('products').update({
      name: prod.name, category: prod.category, description: prod.description, current_price: prod.currentPrice, preparation_method: prod.preparationMethod
    }).eq('id', prod.id);
    await supabase.from('product_ingredients').delete().eq('product_id', prod.id);
    if (prod.recipe.length > 0) {
      const recipeItems = prod.recipe.map(r => ({
        user_id: user.id, product_id: prod.id, ingredient_id: r.ingredientId, quantity_used: r.quantityUsed, unit_used: r.unitUsed
      }));
      await supabase.from('product_ingredients').insert(recipeItems);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    setProducts(prev => prev.filter(p => p.id !== id));
    await supabase.from('products').delete().eq('id', id);
  };

  const addFixedCost = async (cost: FixedCost) => {
    if (!user) return;
    const { data } = await supabase.from('fixed_costs').insert([{ user_id: user.id, name: cost.name, amount: cost.amount }]).select().single();
    if (data) setFixedCosts(prev => [...prev, { ...cost, id: data.id }]);
  };
  const deleteFixedCost = async (id: string) => {
    if (!user) return;
    setFixedCosts(prev => prev.filter(c => c.id !== id));
    await supabase.from('fixed_costs').delete().eq('id', id);
  };

  const addCustomer = async (customer: Customer) => {
    if (!user) return;
    const { data } = await supabase.from('customers').insert([{ user_id: user.id, name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, notes: customer.notes, birth_date: customer.birthDate }]).select().single();
    if (data) setCustomers(prev => [...prev, { ...customer, id: data.id, totalSpent: 0, lastOrderDate: '' }]);
  };
  const updateCustomer = async (customer: Customer) => {
    if (!user) return;
    setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
    await supabase.from('customers').update({ name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, notes: customer.notes, birth_date: customer.birthDate }).eq('id', customer.id);
  };
  const deleteCustomer = async (id: string) => {
    if (!user) return;
    setCustomers(prev => prev.filter(c => c.id !== id));
    await supabase.from('customers').delete().eq('id', id);
  };

  const updateSettings = async (newSettings: AppSettings) => {
    if (!user) return;
    setSettings(newSettings);
    await supabase.from('user_settings').upsert({
      user_id: user.id, business_name: newSettings.businessName, target_margin: newSettings.targetMargin, tax_and_loss_percent: newSettings.taxAndLossPercent, estimated_monthly_billing: newSettings.estimatedMonthlyBilling
    });
  };

  // --- ORDER MANAGEMENT ---

  const addOrder = async (order: Order) => {
    if (!user) return;

    try {
      // 1. Insert Order
      const { data: orderData, error } = await supabase.from('orders').insert([{
        id: order.id,
        user_id: user.id,
        customer_id: order.customerId === 'guest' ? null : order.customerId,
        customer_name: order.customerName,
        total_amount: order.totalAmount,
        payment_method: order.paymentMethod,
        status: order.status,
        date: order.date,
        table_id: order.tableId,
        table_number: order.tableNumber,
        notes: order.notes,
        delivery_type: order.deliveryType || order.delivery_type,
        delivery_address: order.deliveryAddress || order.delivery_address,
        phone: order.phone,
        // Novos campos do PDV
        cash_register_id: (order as any).cashRegisterId || (order as any).cash_register_id,
        discount: (order as any).discount,
        discount_percent: (order as any).discountPercent,
        service_charge: (order as any).serviceCharge,
        tip: (order as any).tip,
        subtotal: (order as any).subtotal,
        change_given: (order as any).changeGiven
      }]).select().single();

      if (error) {
        console.error("Erro ao criar pedido (Supabase):", error);
        throw error;
      }

      const orderId = orderData.id;

      // 2. Insert Items
      if (order.items.length > 0) {
        // Normalizar itens (agrupar por productId) para evitar duplicação
        const normalizedItemsMap = new Map<string, any>();

        order.items.forEach(i => {
          if (normalizedItemsMap.has(i.productId)) {
            const existing = normalizedItemsMap.get(i.productId);
            existing.quantity += i.quantity;
            existing.total += i.total;
          } else {
            normalizedItemsMap.set(i.productId, { ...i });
          }
        });

        const normalizedItems = Array.from(normalizedItemsMap.values());

        const items = normalizedItems.map(i => ({
          order_id: orderId,
          product_id: i.productId,
          product_name: i.productName,
          quantity: i.quantity,
          price: i.unitPrice,
          total: i.total
        }));

        console.log('📦 Inserindo items no pedido:', orderId);
        console.log('📦 Quantidade de items:', items.length);
        console.log('📦 Estrutura do primeiro item:', items[0]);

        const { error: itemsError } = await supabase.from('order_items').insert(items);
        if (itemsError) {
          console.error("❌ Erro ao inserir itens:", itemsError);
          console.error("❌ Items que falharam:", items);
        } else {
          console.log('✅ Items inseridos com sucesso!');
        }
      }

      // 3. Update Table Status
      if (order.tableId) {
        // Se for completed, libera. Se for open, ocupa.
        const newStatus = order.status === 'open' ? 'occupied' : 'free';
        await supabase.from('tables').update({ status: newStatus }).eq('id', order.tableId);
      }

      // 4. Update Local State
      setOrders(prev => [{ ...order, id: orderId }, ...prev]);

      // 5. BAIXAR ESTOQUE
      // - Pedidos de Balcão/Mesa que nascem 'completed' (já foi pago/fechado)
      // - Pedidos de Balcão/Mesa que nascem 'open' (mesa em aberto)
      // - Pedidos do Cardápio Virtual baixam quando mudam para 'confirmed'
      if (order.status === 'completed' || order.status === 'open') {
        console.log('📉 Baixando estoque na criação do pedido:', orderId, '- Status:', order.status);
        await handleStockUpdate(order.items);
      }

    } catch (err) {
      console.error("Falha crítica no addOrder:", err);
      alert("Erro ao salvar pedido. Verifique sua conexão.");
    }
  };

  const updateOrder = async (order: Order) => {
    if (!user) return;

    try {
      // Check previous status to see if we need to deduct stock
      const prevOrder = orders.find(o => o.id === order.id);
      const wasOpen = prevOrder?.status === 'open';
      const isCompleted = order.status === 'completed';

      // Verificar se os itens mudaram para evitar delete/insert desnecessário
      // Isso previne que itens sumam se houver erro de rede durante atualização de status
      const itemsChanged = JSON.stringify(order.items) !== JSON.stringify(prevOrder?.items);

      // Update DB - Order details
      const { error } = await supabase.from('orders').update({
        total_amount: order.totalAmount,
        status: order.status,
        payment_method: order.paymentMethod,
        // Adicionar outros campos se necessário
      }).eq('id', order.id);

      if (error) throw error;

      // Re-sync items ONLY if they changed
      if (itemsChanged) {
        console.log(`🔄 Itens mudaram no pedido ${order.id}, atualizando...`);

        // 1. Delete old items
        console.log(`🗑️ Deletando itens do pedido ${order.id}...`);
        const { error: deleteError, count: deletedCount } = await supabase
          .from('order_items')
          .delete({ count: 'exact' })
          .eq('order_id', order.id);

        if (deleteError) {
          console.error("❌ Erro ao deletar itens antigos:", deleteError);
          throw deleteError;
        }
        console.log(`🗑️ Itens deletados: ${deletedCount}`);

        // 2. Insert new items
        if (order.items.length > 0) {
          // Normalizar itens (agrupar por productId) para evitar duplicação
          // Isso corrige casos onde o carrinho ou banco já estavam com itens duplicados
          const normalizedItemsMap = new Map<string, any>();

          order.items.forEach(i => {
            if (normalizedItemsMap.has(i.productId)) {
              const existing = normalizedItemsMap.get(i.productId);
              existing.quantity += i.quantity;
              existing.total += i.total; // Recalcular total se necessário, mas somar funciona se unitário for igual
            } else {
              // Clonar para não afetar o original
              normalizedItemsMap.set(i.productId, { ...i });
            }
          });

          const normalizedItems = Array.from(normalizedItemsMap.values());

          console.log(`📝 Inserindo ${normalizedItems.length} novos itens (normalizados de ${order.items.length})...`);

          const items = normalizedItems.map(i => ({
            order_id: order.id,
            product_id: i.productId,
            product_name: i.productName,
            quantity: i.quantity,
            price: i.unitPrice,
            total: i.total
          }));

          const { error: insertError } = await supabase.from('order_items').insert(items);
          if (insertError) {
            console.error("❌ ERRO CRÍTICO ao inserir novos itens:", insertError);
            throw insertError;
          }
          console.log(`✅ Novos itens inseridos com sucesso.`);
        }
      } else {
        console.log(`ℹ️ Itens não mudaram no pedido ${order.id}, pulando atualização de itens.`);
      }

      if (isCompleted && order.tableId) {
        await supabase.from('tables').update({ status: 'free' }).eq('id', order.tableId);
      }

      // Update local
      setOrders(prev => prev.map(o => o.id === order.id ? order : o));

      // 5. BAIXAR ESTOQUE
      // IMPORTANTE: A lógica de baixa de estoque é:
      // - Pedidos de mesa/balcão 'open': estoque é baixado na CRIAÇÃO (addOrder)
      // - Adicionar itens a pedido 'open': baixar apenas a DIFERENÇA
      // - Fechar pedido (open → completed): NÃO baixar (já foi baixado antes)
      // - Pedidos do cardápio virtual (pending → confirmed): baixar na confirmação

      // Caso: Itens foram adicionados/modificados em pedido open (ex: adicionar itens à mesa)
      if (itemsChanged && order.status === 'open' && prevOrder) {
        console.log('📉 Baixando estoque de itens novos/incrementados no pedido:', order.id);

        // Calcular diferença de itens para baixar apenas o que foi adicionado
        const itemsToDeduct: OrderItem[] = [];

        order.items.forEach(newItem => {
          const oldItem = prevOrder.items.find(i => i.productId === newItem.productId);

          if (!oldItem) {
            // Item totalmente novo - baixar tudo
            itemsToDeduct.push(newItem);
          } else if (newItem.quantity > oldItem.quantity) {
            // Quantidade aumentou - baixar apenas a diferença
            const diff = newItem.quantity - oldItem.quantity;
            itemsToDeduct.push({
              ...newItem,
              quantity: diff,
              total: diff * newItem.unitPrice
            });
          }
        });

        if (itemsToDeduct.length > 0) {
          console.log('📦 Items a baixar do estoque:', itemsToDeduct);
          await handleStockUpdate(itemsToDeduct);
        } else {
          console.log('ℹ️ Nenhum item novo para baixar do estoque.');
        }
      }
      // Caso: Pedido do cardápio virtual sendo confirmado (pending/open → confirmed)
      else if (order.status === 'confirmed' && prevOrder && prevOrder.status !== 'confirmed') {
        console.log('📉 Baixando estoque ao confirmar pedido do cardápio:', order.id);
        await handleStockUpdate(order.items);
      }
      // Nota: Pedidos fechados (open → completed) NÃO baixam estoque aqui
      // pois já foi baixado quando o pedido foi criado ou quando itens foram adicionados

    } catch (err) {
      console.error("Falha crítica no updateOrder:", err);
      alert("Erro ao atualizar pedido. Tente novamente.");
      // Recarregar dados para garantir consistência em caso de erro
      // fetchData(); // Não posso chamar fetchData aqui pois está dentro do useEffect. 
      // Idealmente deveríamos forçar um refresh.
    }
  };

  // --- CATEGORY MANAGEMENT ---
  const addCategory = async (category: string) => {
    if (!user) return;
    try {
      const { error } = await supabase.from('categories').insert([{ user_id: user.id, name: category }]);
      if (!error) {
        setCategories(prev => [...prev, category]);
      }
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const updateCategory = async (oldName: string, newName: string) => {
    if (!user) return;
    try {
      // Update category name in database
      const { data: catData } = await supabase.from('categories').select('id').eq('user_id', user.id).eq('name', oldName).single();
      if (catData) {
        await supabase.from('categories').update({ name: newName }).eq('id', catData.id);
        setCategories(prev => prev.map(c => c === oldName ? newName : c));

        // Update products using this category
        await supabase.from('products').update({ category: newName }).eq('user_id', user.id).eq('category', oldName);
        setProducts(prev => prev.map(p => p.category === oldName ? { ...p, category: newName } : p));
      }
    } catch (err) {
      console.error('Error updating category:', err);
    }
  };

  const deleteCategory = async (category: string) => {
    if (!user) return;
    try {
      const { data: catData } = await supabase.from('categories').select('id').eq('user_id', user.id).eq('name', category).single();
      if (catData) {
        await supabase.from('categories').delete().eq('id', catData.id);
        setCategories(prev => prev.filter(c => c !== category));
      }
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  };

  return (
    <AppContext.Provider value={{
      ingredients, products, fixedCosts, settings, customers, orders, tables, categories, loading,
      addIngredient, updateIngredient, deleteIngredient,
      addProduct, updateProduct, deleteProduct,
      addFixedCost, deleteFixedCost,
      addCustomer, updateCustomer, deleteCustomer,
      addOrder, updateOrder,
      addTable, deleteTable,
      addCategory, updateCategory, deleteCategory,
      updateSettings,
      handleStockUpdate,
      fixTableStatuses: async () => {
        if (!user) return;
        console.log('🔧 Fixing table statuses...');

        // 1. Get all open orders
        const { data: openOrders } = await supabase
          .from('orders')
          .select('id, table_id, total_amount')
          .eq('user_id', user.id)
          .eq('status', 'open')
          .not('table_id', 'is', null);

        const openTableIds = new Set(openOrders?.map(o => o.table_id) || []);
        const openOrdersMap = new Map(openOrders?.map(o => [o.table_id, o]) || []);

        // 2. Get all tables
        const { data: allTables } = await supabase
          .from('tables')
          .select('*')
          .eq('user_id', user.id);

        if (!allTables) return;

        // 3. Update tables that are wrong
        const updates = allTables.map(async (table) => {
          const shouldBeOccupied = openTableIds.has(table.id);
          const isOccupied = table.status === 'occupied';

          if (shouldBeOccupied !== isOccupied) {
            console.log(`Fixing table ${table.number}: ${isOccupied} -> ${shouldBeOccupied}`);
            const newStatus = shouldBeOccupied ? 'occupied' : 'free';
            await supabase.from('tables').update({ status: newStatus }).eq('id', table.id);
            return { ...table, status: newStatus };
          }
          return table;
        });

        await Promise.all(updates);

        // 4. Refresh local state
        const { data: refreshedTables } = await supabase.from('tables').select('*').eq('user_id', user.id).order('number');
        if (refreshedTables) {
          setTables(refreshedTables.map(t => {
            const openOrder = openOrdersMap.get(t.id);
            return {
              id: t.id,
              number: t.number,
              status: t.status as 'free' | 'occupied',
              currentOrderId: openOrder?.id,
              currentOrderTotal: openOrder?.total_amount
            };
          }));
        }
      },
      checkStockAvailability,
      refreshOrders
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
