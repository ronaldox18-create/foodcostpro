import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { Search, Plus, Minus, ShoppingCart, Star, X, Trash2, ArrowRight, CheckCircle } from 'lucide-react';
import CheckoutModal, { CheckoutData } from '../../components/CheckoutModal';

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

    useEffect(() => {
        if (!storeId) return;

        const fetchData = async () => {
            try {
                const { data: settingsData } = await supabase
                    .from('user_settings')
                    .select('business_name')
                    .eq('user_id', storeId)
                    .single();

                if (settingsData?.business_name) {
                    setStoreName(settingsData.business_name);
                }

                const { data: productsData } = await supabase
                    .from('products')
                    .select('*')
                    .eq('user_id', storeId);

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

                // Buscar dados do cliente se logado
                const customerAuth = localStorage.getItem('customer_auth');
                if (customerAuth) {
                    const customer = JSON.parse(customerAuth);
                    const { data: customerData } = await supabase
                        .from('customers')
                        .select('phone, address')
                        .eq('id', customer.id)
                        .single();

                    if (customerData) {
                        setCustomerData({
                            phone: customerData.phone || '',
                            address: customerData.address || ''
                        });
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

            // Calcular total com taxa de entrega
            const deliveryFee = checkoutData.deliveryType === 'delivery' ? 5.00 : 0;
            const totalAmount = cartTotal + deliveryFee;

            console.log('Creating order with data:', {
                user_id: storeId,
                customer_id: customer.id,
                customer_name: customer.name,
                total_amount: totalAmount,
                delivery_type: checkoutData.deliveryType,
                delivery_address: checkoutData.deliveryAddress,
                phone: checkoutData.phone,
                payment_method: checkoutData.paymentMethod,
                notes: checkoutData.notes,
                status: 'pending',
                items: orderItems
            });

            // 1. Criar o pedido
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
                    status: 'pending'
                }])
                .select()
                .single();

            if (orderError) {
                console.error('Supabase error creating order:', orderError);
                throw orderError;
            }

            console.log('✅ Order created successfully:', orderData);

            // 2. Criar os items do pedido
            try {
                const itemsToInsert = orderItems.map(item => ({
                    ...item,
                    order_id: orderData.id
                }));

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(itemsToInsert);

                if (itemsError) {
                    console.warn('⚠️ Could not save order items (table may not exist):', itemsError);
                    console.log('💡 Run the SQL script: create_order_items_table.sql');
                } else {
                    console.log('✅ Order items created successfully');
                }
            } catch (itemsError) {
                console.warn('⚠️ Error saving items:', itemsError);
            }

            // 3. Atualizar dados do cliente se necessário
            if (checkoutData.phone || checkoutData.deliveryAddress) {
                try {
                    await supabase
                        .from('customers')
                        .update({
                            phone: checkoutData.phone,
                            address: checkoutData.deliveryAddress || null
                        })
                        .eq('id', customer.id);
                    console.log('✅ Customer data updated');
                } catch (updateError) {
                    console.warn('⚠️ Could not update customer data:', updateError);
                }
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

    return (
        <>
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white px-4 py-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10">
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
                </div>
            </div>

            <div className="px-3 pb-36 space-y-4">
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
                                            <button onClick={() => addToCart(product.id)} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold active:bg-black flex items-center gap-1">
                                                <Plus size={12} />
                                                Add
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {cart.length > 0 && (
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
                                <p className="font-black text-lg leading-none">{formatCurrency(cartTotal)}</p>
                            </div>
                        </div>
                        <div className="bg-white text-gray-900 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1">
                            Sacola
                            <ArrowRight size={14} />
                        </div>
                    </button>
                </div>
            )}

            {showCart && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-end">
                    <div className="bg-white w-full rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up">
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

                        <div className="p-4 border-t border-gray-100 space-y-3 bg-white flex-shrink-0">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-gray-600">Total</span>
                                <span className="font-black text-2xl text-gray-900">{formatCurrency(cartTotal)}</span>
                            </div>
                            <button
                                onClick={() => setShowCheckoutModal(true)}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-bold text-base active:from-green-700 active:to-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                            >
                                Finalizar Pedido
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Modal */}
            {showCheckoutModal && (
                <CheckoutModal
                    cartTotal={cartTotal}
                    customerPhone={customerData.phone}
                    customerAddress={customerData.address}
                    onConfirm={handleCheckout}
                    onClose={() => setShowCheckoutModal(false)}
                />
            )}

            {checkoutSuccess && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 text-center max-w-xs animate-scale-up">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <CheckCircle size={32} className="text-green-500" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-1">Pedido Enviado! 🎉</h3>
                        <p className="text-sm text-gray-500">Estamos preparando com carinho.</p>
                    </div>
                </div>
            )}
        </>
    );
};

export default StoreMenu;
