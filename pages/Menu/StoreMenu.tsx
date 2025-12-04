import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Product, BusinessHours, SpecialHours, StoreStatus } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { Search, Plus, Minus, ShoppingCart, Star, X, Trash2, ArrowRight, CheckCircle, Clock, Award, Sparkles } from 'lucide-react';
import CheckoutModal, { CheckoutData } from '../../components/CheckoutModal';
import { checkStoreStatus } from '../../utils/businessHours';
import CustomerLoyaltyBadge from '../../components/CustomerLoyaltyBadge';

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

const StoreMenu: React.FC = () => {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [storeName, setStoreName] = useState('Nosso Cardápio');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [cart, setCart] = useState<{ productId: string, quantity: number }[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [customerData, setCustomerData] = useState<{ phone?: string; address?: string }>({});
    const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);

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
                        recipe: []
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

    const filteredProducts = useMemo(() => {
        let filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if (selectedCategory !== 'Todos') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }
        return filtered;
    }, [products, searchTerm, selectedCategory]);

    const addToCart = (productId: string) => {
        if (storeStatus && !storeStatus.isOpen) {
            alert(`A loja está fechada no momento.\n\n${storeStatus.message}`);
            return;
        }

        setCart(prev => {
            const existing = prev.find(item => item.productId === productId);
            if (existing) {
                return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { productId, quantity: 1 }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === productId);
            if (existing && existing.quantity > 1) {
                return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item);
            }
            return prev.filter(item => item.productId !== productId);
        });
    };

    const clearItemFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const getQuantity = (productId: string) => {
        return cart.find(item => item.productId === productId)?.quantity || 0;
    };

    const cartTotal = useMemo(() => {
        return cart.reduce((acc, item) => {
            const product = products.find(p => p.id === item.productId);
            return acc + (product ? product.currentPrice * item.quantity : 0);
        }, 0);
    }, [cart, products]);

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
                    total: (product?.currentPrice || 0) * item.quantity
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

    return (
        <div className="animate-fade-in min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white px-4 py-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl">
                                🍽️
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight">{storeName}</h1>
                                <p className="text-white/90 text-xs flex items-center gap-1">
                                    <Star size={12} fill="currentColor" />
                                    Peça online agora
                                </p>
                            </div>
                        </div>

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

                    {/* Loyalty Badge */}
                    {showLoyalty && isLoggedIn && currentLevel && (
                        <div className="mt-3">
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
                            />
                        </div>
                    )}

                    {/* Login prompt if not logged in and loyalty is enabled */}
                    {showLoyalty && !isLoggedIn && (
                        <button
                            onClick={() => navigate(`/menu/${storeId}/auth`)}
                            className="mt-3 w-full bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center gap-3 hover:bg-white/30 transition"
                        >
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Award size={20} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-bold">Ganhe Pontos e Descontos!</p>
                                <p className="text-xs opacity-80">Faça login para participar</p>
                            </div>
                            <ArrowRight size={18} />
                        </button>
                    )}

                    {/* Status Message */}
                    {storeStatus && (
                        <div className="mt-3 text-white/90 text-xs font-medium flex items-center gap-1.5">
                            <Clock size={12} />
                            {storeStatus.message}
                        </div>
                    )}
                </div>
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
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === 'Todos' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
                    >
                        🍴 Todos
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${selectedCategory === cat ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200'}`}
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
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                    <span className="text-3xl">🍔</span>
                                </div>
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
                                                <button onClick={() => addToCart(product.id)} className="w-6 h-6 flex items-center justify-center bg-gray-900 rounded text-white active:bg-black">
                                                    <Plus size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => addToCart(product.id)}
                                                disabled={storeStatus && !storeStatus.isOpen}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${storeStatus && !storeStatus.isOpen
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-gray-900 text-white active:bg-black'
                                                    }`}
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
                        <button onClick={() => setShowCart(true)} className="w-full bg-gradient-to-r from-gray-900 to-black text-white p-4 rounded-xl shadow-2xl flex justify-between items-center active:scale-[0.98] transition-transform">
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
                                        <div key={item.productId} className="flex gap-3 bg-gray-50 p-3 rounded-xl">
                                            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                                                <span className="text-2xl">🍔</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{product.name}</h3>
                                                <p className="text-xs text-gray-500 mb-2">{formatCurrency(product.currentPrice)} cada</p>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 bg-white rounded-lg p-1 border border-gray-200">
                                                        <button onClick={() => removeFromCart(item.productId)} className="w-6 h-6 flex items-center justify-center rounded text-gray-600 active:bg-red-50 active:text-red-500">
                                                            <Minus size={12} />
                                                        </button>
                                                        <span className="font-bold text-xs w-6 text-center">{item.quantity}</span>
                                                        <button onClick={() => addToCart(item.productId)} className="w-6 h-6 flex items-center justify-center bg-gray-900 rounded text-white active:bg-black">
                                                            <Plus size={12} />
                                                        </button>
                                                    </div>
                                                    <button onClick={() => clearItemFromCart(item.productId)} className="text-red-500 text-[10px] font-bold flex items-center gap-1">
                                                        <Trash2 size={11} />
                                                        Remover
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="font-bold text-sm text-gray-900 self-start">
                                                {formatCurrency(product.currentPrice * item.quantity)}
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
                                        : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white active:from-green-700 active:to-emerald-700'
                                        }`}
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
        </div >
    );
};

export default StoreMenu;
