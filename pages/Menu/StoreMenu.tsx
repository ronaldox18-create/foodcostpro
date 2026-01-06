import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Product, BusinessHours, SpecialHours, StoreStatus, StoreVisualSettings } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { Search, Plus, Minus, ShoppingCart, Star, X, Trash2, ArrowRight, CheckCircle, Clock, Award, Sparkles } from 'lucide-react';
import CheckoutModal, { CheckoutData } from '../../components/CheckoutModal';
import { checkStoreStatus } from '../../utils/businessHours';
import CustomerLoyaltyBadge from '../../components/CustomerLoyaltyBadge';
import ProductCustomizationModal, { ProductCustomization } from '../../components/ProductCustomizationModal';

interface LoyaltyLevel {
    id: string;
    name: string;
    points_required: number;
    discount_percent: number;
    color: string;
    icon: string;
}

interface LoyaltySettings {
    is_enabled: boolean;
    points_per_real: number;
}

interface CartItemExtended {
    id: string;
    productId: string;
    quantity: number;
    variation?: any;
    selectedAddons?: any[];
    notes?: string;
    totalPrice: number;
}

const StoreMenu: React.FC = () => {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [storeName, setStoreName] = useState('Nosso Cardápio');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [cart, setCart] = useState<CartItemExtended[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [customerData, setCustomerData] = useState<{ phone?: string; address?: string }>({});
    const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);

    // Visual Settings
    const [visualSettings, setVisualSettings] = useState<StoreVisualSettings | null>(null);

    // Customization Modal
    const [customizationModal, setCustomizationModal] = useState<{
        show: boolean;
        product: Product | null;
    }>({ show: false, product: null });

    // Loyalty System
    const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
    const [loyaltyLevels, setLoyaltyLevels] = useState<LoyaltyLevel[]>([]);
    const [customerPoints, setCustomerPoints] = useState(0);
    const [currentLevel, setCurrentLevel] = useState<LoyaltyLevel | null>(null);
    const [nextLevel, setNextLevel] = useState<LoyaltyLevel | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        if (!storeId) return;

        const fetchData = async () => {
            try {
                // Fetch store settings
                const { data: settingsData } = await supabase
                    .from('user_settings')
                    .select('business_name')
                    .eq('user_id', storeId)
                    .single();

                if (settingsData?.business_name) {
                    setStoreName(settingsData.business_name);
                }

                // Fetch visual settings
                const { data: visualData } = await supabase
                    .from('store_visual_settings')
                    .select('*')
                    .eq('user_id', storeId)
                    .single();

                if (visualData) {
                    setVisualSettings(visualData);
                }

                // Fetch business hours
                const { data: hoursData } = await supabase
                    .from('business_hours')
                    .select('*')
                    .eq('user_id', storeId);

                const { data: specialData } = await supabase
                    .from('special_hours')
                    .select('*')
                    .eq('user_id', storeId)
                    .gte('date', new Date().toISOString().split('T')[0]);

                if (hoursData && hoursData.length > 0) {
                    const status = checkStoreStatus(hoursData, specialData || []);
                    setStoreStatus(status);
                }

                // Fetch products
                const { data: productsData, error: prodError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('user_id', storeId);

                if (prodError) {
                    console.error('❌ Error fetching products:', prodError);
                } else {
                    console.log(`✅ Fetched ${productsData?.length || 0} products for store ${storeId}`);
                }

                if (productsData) {
                    setProducts(productsData.map(p => ({
                        id: p.id,
                        name: p.name,
                        category: p.category,
                        description: p.description,
                        currentPrice: p.current_price,
                        preparationMethod: p.preparation_method,
                        recipe: [],
                        image_url: p.image_url
                    })));

                    const uniqueCats = Array.from(new Set(productsData.map(p => p.category).filter(Boolean)));
                    setCategories(uniqueCats);
                }

                // Fetch loyalty settings
                const { data: loyaltySettingsData } = await supabase
                    .from('loyalty_settings')
                    .select('*')
                    .eq('user_id', storeId)
                    .single();

                if (loyaltySettingsData) {
                    setLoyaltySettings(loyaltySettingsData);
                }

                // Fetch loyalty levels
                const { data: levelsData } = await supabase
                    .from('loyalty_levels')
                    .select('*')
                    .eq('user_id', storeId)
                    .order('order', { ascending: true });

                if (levelsData) {
                    setLoyaltyLevels(levelsData);
                }

                // Check if customer is logged in
                const customerAuth = localStorage.getItem('customer_auth');
                if (customerAuth) {
                    setIsLoggedIn(true);
                    const customer = JSON.parse(customerAuth);

                    // Fetch fresh customer data
                    const { data: customerData } = await supabase
                        .from('customers')
                        .select('phone, address, points, current_level')
                        .eq('id', customer.id)
                        .single();

                    if (customerData) {
                        setCustomerData({
                            phone: customerData.phone || '',
                            address: customerData.address || ''
                        });
                        setCustomerPoints(customerData.points || 0);

                        // Determine current level
                        if (levelsData && levelsData.length > 0) {
                            const points = customerData.points || 0;
                            const sortedLevels = [...levelsData].sort((a, b) => b.points_required - a.points_required);
                            const current = sortedLevels.find(l => points >= l.points_required) || levelsData[0];
                            setCurrentLevel(current);

                            // Determine next level
                            const next = levelsData
                                .sort((a, b) => a.points_required - b.points_required)
                                .find(l => l.points_required > points);
                            setNextLevel(next || null);
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [storeId]);

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

    const filteredProducts = useMemo(() => {
        let filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (selectedCategory !== 'Todos') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }
        return filtered;
    }, [products, searchTerm, selectedCategory]);

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

    const clearItemFromCart = (itemId: string) => {
        setCart(cart.filter(i => i.id !== itemId));
    };

    const getQuantity = (productId: string) => {
        return cart
            .filter(item => item.productId === productId)
            .reduce((sum, item) => sum + item.quantity, 0);
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((total, item) => total + item.totalPrice, 0);
    }, [cart]);

    const cartItemsCount = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.quantity, 0);
    }, [cart]);

    // Calculate loyalty discount
    const loyaltyDiscount = useMemo(() => {
        if (!loyaltySettings?.is_enabled || !currentLevel || !isLoggedIn) return 0;
        return (cartTotal * currentLevel.discount_percent) / 100;
    }, [cartTotal, currentLevel, loyaltySettings, isLoggedIn]);

    // Calculate points to earn
    const pointsToEarn = useMemo(() => {
        if (!loyaltySettings?.is_enabled || !isLoggedIn) return 0;
        return Math.floor(cartTotal * (loyaltySettings.points_per_real || 1));
    }, [cartTotal, loyaltySettings, isLoggedIn]);

    const finalTotal = cartTotal - loyaltyDiscount;

    const handleCheckout = async (checkoutData: CheckoutData) => {
        const customerAuth = localStorage.getItem('customer_auth');
        if (!customerAuth) {
            navigate(`/menu/${storeId}/auth`);
            return;
        }

        const customer = JSON.parse(customerAuth);

        try {
            const orderItems = cart.map(item => {
                const product = products.find(p => p.id === item.productId);
                return {
                    product_id: item.productId,
                    product_name: product?.name || 'Produto',
                    quantity: item.quantity,
                    price: product?.currentPrice || 0,
                    total: (product?.currentPrice || 0) * item.quantity,
                    selected_addons: item.selectedAddons || []
                };
            });

            const deliveryFee = checkoutData.deliveryType === 'delivery' ? 5.00 : 0;
            const totalAmount = finalTotal + deliveryFee;

            // Create order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    user_id: storeId,
                    customer_id: customer.id,
                    customer_name: customer.name,
                    total_amount: totalAmount,
                    delivery_type: checkoutData.deliveryType,
                    delivery_address: checkoutData.deliveryAddress || null,
                    phone: checkoutData.phone,
                    payment_method: checkoutData.paymentMethod,
                    notes: checkoutData.notes || null,
                    status: 'pending',
                    loyalty_discount: loyaltyDiscount,
                    points_earned: pointsToEarn
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // Create order items
            try {
                const itemsToInsert = orderItems.map(item => ({
                    ...item,
                    order_id: orderData.id
                }));

                await supabase.from('order_items').insert(itemsToInsert);
            } catch (itemsError) {
                console.warn('Could not save order items:', itemsError);
            }

            // Discount stock from variations or products
            try {
                for (const item of cart) {
                    // 1. Descontar estoque da RECEITA BASE do produto
                    const product = products.find(p => p.id === item.productId);
                    if (product) {
                        // Buscar receita do produto
                        const { data: recipeItems } = await supabase
                            .from('product_recipes')
                            .select('ingredient_id, quantity_needed, unit')
                            .eq('product_id', product.id);

                        if (recipeItems && recipeItems.length > 0) {
                            console.log(`📝 Descontando receita de "${product.name}" (x${item.quantity})`);

                            for (const recipeItem of recipeItems) {
                                // Buscar ingrediente
                                const { data: ingredient } = await supabase
                                    .from('ingredients')
                                    .select('stock_quantity, unit, name')
                                    .eq('id', recipeItem.ingredient_id)
                                    .single();

                                // Se ingrediente tem controle de estoque
                                if (ingredient && ingredient.stock_quantity !== null) {
                                    // Calcular quanto descontar (converter unidades se necessário)
                                    let toDeduct = recipeItem.quantity_needed * item.quantity;

                                    // Conversão de unidades
                                    if (recipeItem.unit && ingredient.unit && recipeItem.unit !== ingredient.unit) {
                                        if (recipeItem.unit === 'kg' && ingredient.unit === 'g') toDeduct *= 1000;
                                        else if (recipeItem.unit === 'g' && ingredient.unit === 'kg') toDeduct /= 1000;
                                        else if (recipeItem.unit === 'l' && ingredient.unit === 'ml') toDeduct *= 1000;
                                        else if (recipeItem.unit === 'ml' && ingredient.unit === 'l') toDeduct /= 1000;
                                    }

                                    const newStock = Math.max(0, ingredient.stock_quantity - toDeduct);

                                    console.log(`  - ${ingredient.name}: ${ingredient.stock_quantity} → ${newStock} (${toDeduct} ${ingredient.unit})`);

                                    // Atualizar estoque do ingrediente
                                    await supabase
                                        .from('ingredients')
                                        .update({ stock_quantity: newStock })
                                        .eq('id', recipeItem.ingredient_id);
                                }
                            }
                        }
                    }

                    // 2. Descontar estoque de VARIAÇÕES (se houver)
                    if (item.variation && item.variation.id) {
                        // Has variation - discount from variation stock
                        const { data: currentVariation } = await supabase
                            .from('product_variations')
                            .select('stock_quantity')
                            .eq('id', item.variation.id)
                            .single();

                        if (currentVariation && currentVariation.stock_quantity !== null) {
                            const newStock = Math.max(0, currentVariation.stock_quantity - item.quantity);
                            await supabase
                                .from('product_variations')
                                .update({ stock_quantity: newStock })
                                .eq('id', item.variation.id);
                        }
                    } else {
                        // No variation - discount from product stock (existing logic)
                        const product = products.find(p => p.id === item.productId);
                        if (product && (product as any).stock_quantity !== undefined) {
                            const newStock = Math.max(0, (product as any).stock_quantity - item.quantity);
                            await supabase
                                .from('products')
                                .update({ stock_quantity: newStock })
                                .eq('id', item.productId);
                        }
                    }

                    // 3. Descontar estoque de COMPLEMENTOS (from linked ingredients)
                    if (item.selectedAddons && item.selectedAddons.length > 0) {
                        console.log(`🧩 Descontando complementos (${item.selectedAddons.length})`);

                        for (const selectedAddon of item.selectedAddons) {
                            // Buscar dados completos do addon
                            const { data: addonData } = await supabase
                                .from('product_addons')
                                .select('ingredient_id, quantity_used, unit_used, name')
                                .eq('id', selectedAddon.addon_id)
                                .single();

                            // Se addon tem ingrediente vinculado
                            if (addonData?.ingredient_id && addonData.quantity_used) {
                                // Buscar ingrediente
                                const { data: ingredient } = await supabase
                                    .from('ingredients')
                                    .select('stock_quantity, unit, name')
                                    .eq('id', addonData.ingredient_id)
                                    .single();

                                // Se ingrediente tem controle de estoque
                                if (ingredient && ingredient.stock_quantity !== null) {
                                    // Calcular quanto descontar (converter unidades se necessário)
                                    let toDeduct = addonData.quantity_used * item.quantity;

                                    // Conversão simples de unidades
                                    if (addonData.unit_used && ingredient.unit && addonData.unit_used !== ingredient.unit) {
                                        if (addonData.unit_used === 'kg' && ingredient.unit === 'g') toDeduct *= 1000;
                                        else if (addonData.unit_used === 'g' && ingredient.unit === 'kg') toDeduct /= 1000;
                                        else if (addonData.unit_used === 'l' && ingredient.unit === 'ml') toDeduct *= 1000;
                                        else if (addonData.unit_used === 'ml' && ingredient.unit === 'l') toDeduct /= 1000;
                                    }

                                    const newStock = Math.max(0, ingredient.stock_quantity - toDeduct);

                                    console.log(`  - ${addonData.name} (${ingredient.name}): ${ingredient.stock_quantity} → ${newStock} (${toDeduct} ${ingredient.unit})`);

                                    // Atualizar estoque do ingrediente
                                    await supabase
                                        .from('ingredients')
                                        .update({ stock_quantity: newStock })
                                        .eq('id', addonData.ingredient_id);
                                }
                            }
                        }
                    }
                }
            } catch (stockError) {
                console.error('Error updating stock:', stockError);
                // Don't throw - order was created successfully
            }

            // ========== REGISTRAR MOVIMENTAÇÃO DE ESTOQUE ==========
            try {
                const user = await supabase.auth.getUser();
                if (!user.data.user) return;

                console.log('📊 Registrando movimentações de estoque...');

                // Para cada item do pedido
                for (const item of cart) {
                    const product = products.find(p => p.id === item.productId);

                    // 1. Registrar desconto da RECEITA
                    if (product) {
                        const { data: recipeItems } = await supabase
                            .from('product_recipes')
                            .select('ingredient_id, quantity_needed, unit')
                            .eq('product_id', product.id);

                        if (recipeItems && recipeItems.length > 0) {
                            for (const recipeItem of recipeItems) {
                                await supabase.from('stock_movements').insert({
                                    user_id: user.data.user.id,
                                    ingredient_id: recipeItem.ingredient_id,
                                    type: 'sale',
                                    quantity: -(recipeItem.quantity_needed * item.quantity),
                                    unit: recipeItem.unit,
                                    reason: `Venda: ${item.quantity}× ${product.name}${item.variation ? ` (${item.variation.name})` : ''}`,
                                    order_id: orderData.id,
                                    product_id: product.id
                                });
                            }
                        }
                    }

                    // 2. Registrar desconto dos COMPLEMENTOS
                    if (item.selectedAddons && item.selectedAddons.length > 0) {
                        for (const selectedAddon of item.selectedAddons) {
                            const { data: addonData } = await supabase
                                .from('product_addons')
                                .select('ingredient_id, quantity_used, unit_used, name')
                                .eq('id', selectedAddon.addon_id)
                                .single();

                            if (addonData && addonData.ingredient_id && addonData.quantity_used) {
                                await supabase.from('stock_movements').insert({
                                    user_id: user.data.user.id,
                                    ingredient_id: addonData.ingredient_id,
                                    type: 'sale',
                                    quantity: -(addonData.quantity_used * item.quantity),
                                    unit: addonData.unit_used || 'un',
                                    reason: `Venda: ${item.quantity}× ${addonData.name} (complemento)`,
                                    order_id: orderData.id,
                                    addon_id: selectedAddon.addon_id
                                });
                            }
                        }
                    }
                }

                console.log('✅ Movimentações registradas com sucesso!');
            } catch (movementError) {
                console.error('Error logging stock movements:', movementError);
                // Não bloqueia a venda se falhar o registro
            }

            // Update customer data
            if (checkoutData.phone || checkoutData.deliveryAddress) {
                await supabase
                    .from('customers')
                    .update({
                        phone: checkoutData.phone,
                        address: checkoutData.deliveryAddress || null
                    })
                    .eq('id', customer.id);
            }

            // Add points to customer (if loyalty is enabled)
            if (loyaltySettings?.is_enabled && pointsToEarn > 0) {
                const newPoints = customerPoints + pointsToEarn;
                await supabase
                    .from('customers')
                    .update({ points: newPoints })
                    .eq('id', customer.id);

                // Add to points history
                await supabase
                    .from('points_history')
                    .insert([{
                        user_id: storeId,
                        customer_id: customer.id,
                        points: pointsToEarn,
                        type: 'earned',
                        description: `Compra de ${formatCurrency(cartTotal)}`,
                        order_id: orderData.id
                    }]);
            }

            setShowCheckoutModal(false);
            setCheckoutSuccess(true);
            setTimeout(() => {
                setCart([]);
                setShowCart(false);
                setCheckoutSuccess(false);
                navigate(`/menu/${storeId}/orders`);
            }, 2000);

        } catch (error: any) {
            console.error('Error creating order:', error);
            alert(`Erro ao finalizar pedido: ${error.message || 'Tente novamente.'}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    const showLoyalty = loyaltySettings?.is_enabled && loyaltyLevels.length > 0;

    // Get colors from visual settings or use defaults
    const primaryColor = visualSettings?.primary_color || '#ea580c';
    const secondaryColor = visualSettings?.secondary_color || '#dc2626';

    return (
        <div className="animate-fade-in min-h-screen bg-gray-50">
            {/* Header - Banner decorativo */}
            <div
                className="text-white px-4 py-4 relative overflow-hidden"
                style={{
                    background: visualSettings?.banner_url
                        ? `url(${visualSettings.banner_url})`
                        : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '120px'
                }}
            >
                <div className="absolute inset-0 bg-black/10"></div>

                <div className="relative z-10 flex justify-end">
                    {/* Status Badge */}
                    {storeStatus && (
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm ${storeStatus.isOpen
                            ? 'bg-green-500/90 text-white'
                            : storeStatus.reason === 'pause'
                                ? 'bg-orange-500/90 text-white'
                                : 'bg-gray-900/80 text-white'
                            }`}>
                            <Clock size={14} />
                            {storeStatus.isOpen
                                ? 'Aberto'
                                : storeStatus.reason === 'pause'
                                    ? 'Em Pausa'
                                    : 'Fechado'}
                        </div>
                    )}
                </div>
            </div>

            {/* Informações da Loja - Fora do banner */}
            <div className="bg-white px-4 py-4 border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                    {visualSettings?.logo_url ? (
                        <img
                            src={visualSettings.logo_url}
                            alt={storeName}
                            className="w-14 h-14 rounded-xl object-cover border-2 border-gray-100"
                        />
                    ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center text-2xl border-2 border-gray-100">
                            🍽️
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-xl font-black text-gray-900 tracking-tight">
                            {storeName}
                        </h1>
                        <p className="text-gray-500 text-xs flex items-center gap-1">
                            <Star size={12} fill="currentColor" className="text-yellow-500" />
                            Peça online agora
                        </p>
                    </div>
                </div>

                {/* Loyalty Badge */}
                {showLoyalty && isLoggedIn && currentLevel && (
                    <div className="mb-3">
                        <CustomerLoyaltyBadge
                            points={customerPoints}
                            currentLevel={{
                                id: currentLevel.id,
                                name: currentLevel.name,
                                icon: currentLevel.icon,
                                color: currentLevel.color,
                                discountPercent: currentLevel.discount_percent,
                                pointsRequired: currentLevel.points_required
                            }}
                            nextLevel={nextLevel ? {
                                name: nextLevel.name,
                                icon: nextLevel.icon,
                                pointsRequired: nextLevel.points_required
                            } : null}
                            compact={true}
                            variant="light"
                        />
                    </div>
                )}

                {/* Login prompt if not logged in and loyalty is enabled */}
                {showLoyalty && !isLoggedIn && (
                    <button
                        onClick={() => navigate(`/menu/${storeId}/auth`)}
                        className="mb-3 w-full bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-3 flex items-center gap-3 hover:from-orange-100 hover:to-red-100 transition"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                            <Award size={20} className="text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-sm font-bold text-gray-900">Ganhe Pontos e Descontos!</p>
                            <p className="text-xs text-gray-600">Faça login para participar</p>
                        </div>
                        <ArrowRight size={18} className="text-gray-400" />
                    </button>
                )}

                {/* Status Message */}
                {storeStatus && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Clock size={12} />
                        {storeStatus.message}
                    </div>
                )}
            </div>

            <div className="px-3 pb-36 space-y-4">
                {/* Search */}
                <div className="relative -mt-4 z-10">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar produto..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 bg-white border border-gray-100 rounded-xl shadow-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    />
                </div>

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3">
                    <button
                        onClick={() => setSelectedCategory('Todos')}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === 'Todos' ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
                        style={selectedCategory === 'Todos' ? { background: primaryColor } : {}}
                    >
                        🍴 Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === cat ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
                            style={selectedCategory === cat ? { background: primaryColor } : {}}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products */}
                <div className="space-y-3">
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                            <p className="text-gray-400 font-medium">Nenhum produto encontrado</p>
                        </div>
                    ) : (
                        filteredProducts.map(product => (
                            <div key={product.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform flex gap-3">
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                        <span className="text-3xl">🍔</span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-0.5">{product.name}</h3>
                                    {product.category && (
                                        <span className="inline-block text-[10px] text-orange-600 font-semibold bg-orange-50 px-1.5 py-0.5 rounded mb-1">{product.category}</span>
                                    )}
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-2">{product.description || 'Delicioso!'}</p>

                                    <div className="flex justify-between items-center">
                                        <span className="font-black text-base text-gray-900">{formatCurrency(product.currentPrice)}</span>

                                        {getQuantity(product.id) > 0 ? (
                                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                                                <button onClick={() => removeFromCart(product.id)} className="w-6 h-6 flex items-center justify-center bg-white rounded text-gray-700 active:bg-red-50 active:text-red-500">
                                                    <Minus size={12} />
                                                </button>
                                                <span className="font-bold text-xs w-5 text-center">{getQuantity(product.id)}</span>
                                                <button
                                                    onClick={() => addToCart(product.id)}
                                                    className="w-6 h-6 flex items-center justify-center rounded text-white"
                                                    style={{ backgroundColor: primaryColor }}
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => addToCart(product.id)}
                                                disabled={storeStatus && !storeStatus.isOpen}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${storeStatus && !storeStatus.isOpen
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'text-white'
                                                    }`}
                                                style={storeStatus && storeStatus.isOpen ? { backgroundColor: primaryColor } : {}}
                                            >
                                                {storeStatus && !storeStatus.isOpen ? (
                                                    'Fechado'
                                                ) : (
                                                    <>
                                                        <Plus size={12} />
                                                        Add
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Cart Button */}
            {
                cart.length > 0 && (
                    <div className="fixed bottom-20 left-3 right-3 z-50">
                        <button
                            onClick={() => setShowCart(true)}
                            className="w-full text-white p-4 rounded-xl shadow-2xl flex justify-between items-center active:scale-[0.98] transition-transform"
                            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center relative">
                                    <ShoppingCart size={20} />
                                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-500 rounded-full text-[10px] font-black flex items-center justify-center">
                                        {cartItemsCount}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] text-gray-400 font-semibold uppercase">Pedido</p>
                                    <p className="font-black text-lg leading-none">{formatCurrency(finalTotal)}</p>
                                    {loyaltyDiscount > 0 && (
                                        <p className="text-[10px] text-green-400 font-semibold">
                                            Economizando {formatCurrency(loyaltyDiscount)}!
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1">
                                Sacola
                                <ArrowRight size={14} />
                            </div>
                        </button>
                    </div>
                )
            }

            {/* Cart Modal */}
            {
                showCart && (
                    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end">
                        <div className="bg-white w-full rounded-t-2xl max-h-[80vh] flex flex-col animate-slide-up">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">Minha Sacola</h2>
                                    <p className="text-xs text-gray-500">{cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'}</p>
                                </div>
                                <button onClick={() => setShowCart(false)} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center active:bg-gray-200">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {cart.map(item => {
                                    const product = products.find(p => p.id === item.productId);
                                    if (!product) return null;
                                    return (
                                        <div key={item.id} className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                                            ) : (
                                                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                                    <span className="text-2xl">🍔</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{product.name}</h3>

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

                                                <p className="text-xs text-gray-500 mb-2">{formatCurrency(item.totalPrice / item.quantity)} cada</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 bg-white rounded-lg p-1 border border-gray-200">
                                                        <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 flex items-center justify-center rounded text-gray-600 active:bg-red-50 active:text-red-500">
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
                                                    <button onClick={() => clearItemFromCart(item.id)} className="text-red-500 text-[10px] font-bold flex items-center gap-1">
                                                        <Trash2 size={11} />
                                                        Remover
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="font-bold text-sm text-gray-900 self-start">
                                                {formatCurrency(item.totalPrice)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-4 border-t border-gray-100 space-y-3 bg-white flex-shrink-0 pb-32">
                                {/* Loyalty Info */}
                                {showLoyalty && isLoggedIn && (
                                    <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-xl p-3 border border-purple-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles size={14} className="text-purple-600" />
                                            <p className="text-xs font-bold text-purple-900">Benefícios de Fidelidade</p>
                                        </div>
                                        <div className="space-y-1 text-xs">
                                            {loyaltyDiscount > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">Desconto {currentLevel?.name}:</span>
                                                    <span className="font-bold text-green-600">-{formatCurrency(loyaltyDiscount)}</span>
                                                </div>
                                            )}
                                            {pointsToEarn > 0 && (
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-600">Pontos que vai ganhar:</span>
                                                    <span className="font-bold text-purple-600">+{pointsToEarn} pts</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-semibold text-gray-900">{formatCurrency(cartTotal)}</span>
                                    </div>
                                    {loyaltyDiscount > 0 && (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-green-600">Desconto Fidelidade</span>
                                            <span className="font-semibold text-green-600">-{formatCurrency(loyaltyDiscount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                        <span className="text-sm font-bold text-gray-600">Total</span>
                                        <span className="font-black text-2xl text-gray-900">{formatCurrency(finalTotal)}</span>
                                    </div>
                                </div>

                                <button
                                    disabled={storeStatus && !storeStatus.isOpen}
                                    onClick={() => {
                                        if (storeStatus && !storeStatus.isOpen) return;
                                        setShowCart(false);
                                        setShowCheckoutModal(true);
                                    }}
                                    className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-colors ${storeStatus && !storeStatus.isOpen
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'text-white'
                                        }`}
                                    style={storeStatus && storeStatus.isOpen ? { background: `linear-gradient(135deg, #10b981, #059669)` } : {}}
                                >
                                    {storeStatus && !storeStatus.isOpen ? 'Loja Fechada' : 'Finalizar Pedido'}
                                    {(!storeStatus || storeStatus.isOpen) && <ArrowRight size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Checkout Modal */}
            {
                showCheckoutModal && (
                    <CheckoutModal
                        cartTotal={finalTotal}
                        customerPhone={customerData.phone}
                        customerAddress={customerData.address}
                        onConfirm={handleCheckout}
                        onClose={() => setShowCheckoutModal(false)}
                    />
                )
            }

            {/* Success Modal */}
            {
                checkoutSuccess && (
                    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl p-6 text-center max-w-xs animate-scale-up">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <CheckCircle size={32} className="text-green-500" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-1">Pedido Enviado! 🎉</h3>
                            <p className="text-sm text-gray-500 mb-3">Estamos preparando com carinho.</p>
                            {pointsToEarn > 0 && (
                                <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                    <p className="text-xs font-bold text-purple-900 mb-1">Você ganhou!</p>
                                    <p className="text-2xl font-black text-purple-600">+{pointsToEarn} pontos</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {/* Customization Modal */}
            {customizationModal.show && customizationModal.product && (
                <ProductCustomizationModal
                    product={customizationModal.product}
                    onClose={() => setCustomizationModal({ show: false, product: null })}
                    onAddToCart={handleAddCustomization}
                />
            )}
        </div >
    );
};

export default StoreMenu;
