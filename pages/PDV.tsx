import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import PlanGuard from '../components/PlanGuard';
import {
    ShoppingCart, Search, User, DollarSign, Receipt,
    Clock, TrendingUp, Package, X, Plus, Minus,
    Calculator, AlertCircle, Award, Settings, ChevronRight,
    Zap, CreditCard, Sparkles, ShoppingBag, Users, BarChart3, Printer, ChefHat, Lock
} from 'lucide-react';
import { OrderItem, Customer, Product, CashRegister, POSPayment, Order } from '../types';
import POSPaymentModal from '../components/POSPaymentModal';
import CashRegisterModal from '../components/CashRegisterModal';
import OrderSuccessModal from '../components/OrderSuccessModal';
import BillConferenceModal from '../components/BillConferenceModal';
import { supabase } from '../utils/supabaseClient';

const PDV: React.FC = () => {
    const { products, customers, addOrder, handleStockUpdate, checkStockAvailability } = useApp();
    const { user, checkAccess } = useAuth();

    // Estados principais
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCashRegisterModal, setShowCashRegisterModal] = useState(false);
    const [showConferenceModal, setShowConferenceModal] = useState(false);

    // Novo estado para sucesso/impressão
    const [lastOrder, setLastOrder] = useState<Order | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Caixa
    const [currentCashRegister, setCurrentCashRegister] = useState<CashRegister | null>(null);
    const [cashRegisterStats, setCashRegisterStats] = useState({
        totalSales: 0,
        totalItems: 0,
        averageTicket: 0
    });

    // Categorias
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Carregar caixa aberto
    useEffect(() => {
        loadCurrentCashRegister();
    }, [user]);

    const loadCurrentCashRegister = async () => {
        if (!user?.id) return;

        const { data, error } = await supabase
            .from('cash_registers')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'open')
            .order('opened_at', { ascending: false })
            .limit(1)
            .single();

        if (data) {
            setCurrentCashRegister(data as CashRegister);
            loadCashRegisterStats(data.id);
        }
    };

    const loadCashRegisterStats = async (cashRegisterId: string) => {
        try {
            const { data: sales, error } = await supabase
                .from('orders')
                .select('id, total_amount')
                .eq('cash_register_id', cashRegisterId);

            if (error) {
                setCashRegisterStats({ totalSales: 0, totalItems: 0, averageTicket: 0 });
                return;
            }

            if (sales) {
                const totalSales = sales.reduce((sum, sale) => sum + sale.total_amount, 0);
                const orderIds = sales.map(s => s.id).filter(Boolean);
                let totalItems = 0;

                if (orderIds.length > 0) {
                    const { data: items } = await supabase
                        .from('order_items')
                        .select('quantity')
                        .in('order_id', orderIds);

                    if (items) {
                        totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
                    }
                }

                setCashRegisterStats({
                    totalSales,
                    totalItems,
                    averageTicket: sales.length > 0 ? totalSales / sales.length : 0
                });
            }
        } catch (error) {
            setCashRegisterStats({ totalSales: 0, totalItems: 0, averageTicket: 0 });
        }
    };

    // Filtrar produtos
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, selectedCategory]);

    // Categorias únicas
    const categories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category)));
        return ['all', ...cats];
    }, [products]);

    // Adicionar ao carrinho
    const addToCart = (product: Product) => {
        const existingItem = cart.find(item => item.productId === product.id);

        if (existingItem) {
            setCart(cart.map(item =>
                item.productId === product.id
                    ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
                    : item
            ));
        } else {
            setCart([...cart, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitPrice: product.currentPrice,
                total: product.currentPrice,
                addedAt: new Date().toISOString()
            }]);
        }
    };

    // Remover do carrinho
    const removeFromCart = (productId: string) => {
        setCart(cart.filter(item => item.productId !== productId));
    };

    // Atualizar quantidade
    const updateQuantity = (productId: string, delta: number) => {
        setCart(cart.map(item => {
            if (item.productId === productId) {
                const newQuantity = Math.max(0, item.quantity + delta);
                if (newQuantity === 0) return null as any;
                return {
                    ...item,
                    quantity: newQuantity,
                    total: newQuantity * item.unitPrice
                };
            }
            return item;
        }).filter(Boolean));
    };

    // Calcular total
    const cartTotal = useMemo(() => {
        return cart.reduce((sum, item) => sum + item.total, 0);
    }, [cart]);

    // Finalizar venda
    const handlePrintKitchen = () => {
        if (cart.length === 0) return;
        const receiptWindow = window.open('', '', 'width=350,height=600');
        if (!receiptWindow) return;

        const html = `<html>
        <head>
                <style>
                body { font-family: 'Courier New', monospace; font-size: 14px; margin: 0; padding: 15px; width: 80mm; }
                </style>
        </head><body>
            <h2 style="text-align:center; margin-bottom: 5px;">COZINHA - BALCÃO</h2>
            <p style="text-align:center; margin-top: 0; border-bottom: 2px solid black; padding-bottom: 10px;">${new Date().toLocaleString('pt-BR')}</p>
            ${cart.map(i => `<div style="display:flex; justify-content:space-between; margin-bottom: 5px; font-weight:bold; font-size: 16px;"><span>${i.quantity}x</span> <span>${i.productName}</span></div>`).join('')}
            <script>window.onload=function(){window.focus(); setTimeout(() => { window.print(); window.close(); }, 250);}</script>
        </body></html>`;
        receiptWindow.document.write(html);
        receiptWindow.document.close();
    };

    const handleCheckout = async () => {
        if (!currentCashRegister) {
            alert('❌ Você precisa abrir o caixa antes de realizar vendas!');
            setShowCashRegisterModal(true);
            return;
        }

        if (cart.length === 0) {
            alert('❌ Carrinho vazio!');
            return;
        }

        const stockCheck = await checkStockAvailability(cart);
        if (!stockCheck.available) {
            alert(`❌ Estoque insuficiente para:\n${stockCheck.missingItems.join('\n')}`);
            return;
        }

        setShowPaymentModal(true);
    };

    // Confirmar pagamento
    const handlePaymentConfirm = async (
        payments: POSPayment[],
        customerData: Customer | null,
        discount: number,
        serviceCharge: number,
        tip: number,
        couvert: number
    ) => {
        try {
            const subtotal = cartTotal;
            const totalWithAdditions = subtotal + (subtotal * serviceCharge / 100) + tip + couvert - discount;

            const order: any = {
                id: crypto.randomUUID(),
                customerId: customerData?.id || 'guest',
                customerName: customerData?.name || 'Cliente Balcão',
                items: cart,
                totalAmount: totalWithAdditions,
                subtotal: subtotal,
                discount: discount,
                serviceCharge: serviceCharge,
                tip: tip,
                couvert: couvert,
                paymentMethod: payments[0].method,
                date: new Date().toISOString(),
                status: 'completed' as const,
                phone: customerData?.phone,
                cash_register_id: currentCashRegister!.id
            };

            await addOrder(order);

            // Baixa de estoque baseada na ficha técnica
            await handleStockUpdate(cart);

            // Não limpa carrinho imediatamente, mostra modal de sucesso
            setShowPaymentModal(false);
            setLastOrder(order);
            setShowSuccessModal(true);

            loadCashRegisterStats(currentCashRegister!.id);
        } catch (error) {
            console.error('Erro ao processar venda:', error);
            alert('❌ Erro ao processar venda!');
        }
    };

    const handleNewOrder = () => {
        setCart([]);
        setSelectedCustomer(null);
        setLastOrder(null);
        setShowSuccessModal(false);
    };

    // VERIFICAR ACESSO AO PLANO ANTES DO CAIXA
    if (!checkAccess('pdv')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6 max-w-2xl mx-auto animate-fade-in">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center animate-pulse">
                    <CreditCard size={48} className="text-orange-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900">Frente de Caixa (PDV)</h2>
                <p className="text-lg text-gray-500">
                    Agilize suas vendas de balcão. Um sistema completo de caixa, controle de estoque em tempo real e emissão de comprovantes.
                </p>
                <div className="flex flex-col gap-2">
                    <button disabled className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold opacity-50 cursor-not-allowed shadow-xl">
                        Disponível no Plano FoodCost PRO
                    </button>
                    <Link to="/account" className="text-xs text-gray-400 hover:text-orange-600 transition-colors underline">
                        Faça upgrade em Configurações
                    </Link>
                </div>
            </div>
        );
    }

    // Se não houver caixa aberto
    if (!currentCashRegister) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 flex items-center justify-center p-8">
                <div className="bg-white rounded-3xl p-12 max-w-md text-center shadow-2xl border border-gray-100">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <DollarSign className="w-12 h-12 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Caixa Fechado</h2>
                    <p className="text-gray-600 mb-8">
                        Você precisa abrir o caixa antes de iniciar as vendas.
                    </p>
                    <button
                        onClick={() => setShowCashRegisterModal(true)}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:scale-105 transition-all duration-300"
                    >
                        Abrir Caixa
                    </button>
                </div>

                <CashRegisterModal
                    isOpen={showCashRegisterModal}
                    onClose={() => setShowCashRegisterModal(false)}
                    currentCashRegister={null}
                    onCashRegisterOpened={loadCurrentCashRegister}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 pb-20">
            <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Header Premium */}
                <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl shadow-2xl overflow-hidden mb-6">
                    <div className="p-6 text-white relative">
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                                        <ShoppingBag className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold">Ponto de Venda</h1>
                                        <p className="text-white/80">Sistema PDV - Caixa Aberto</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowCashRegisterModal(true)}
                                    className="flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 px-6 py-3 rounded-xl font-semibold transition-all"
                                >
                                    <Settings className="w-5 h-5" />
                                    <span className="hidden md:inline">Gerenciar Caixa</span>
                                </button>
                            </div>

                            {/* Stats Row */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-4 h-4" />
                                        <span className="text-xs text-white/70">Vendas</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        R$ {cashRegisterStats.totalSales.toFixed(2)}
                                    </div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Package className="w-4 h-4" />
                                        <span className="text-xs text-white/70">Itens</span>
                                    </div>
                                    <div className="text-2xl font-bold">{cashRegisterStats.totalItems}</div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calculator className="w-4 h-4" />
                                        <span className="text-xs text-white/70">Ticket Médio</span>
                                    </div>
                                    <div className="text-2xl font-bold">
                                        R$ {cashRegisterStats.averageTicket.toFixed(2)}
                                    </div>
                                </div>

                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-xs text-white/70">Aberto</span>
                                    </div>
                                    <div className="text-lg font-bold">
                                        {(() => {
                                            const openedAt = (currentCashRegister as any).openedAt || (currentCashRegister as any).opened_at;
                                            if (!openedAt) return '--:--';
                                            try {
                                                return new Date(openedAt).toLocaleTimeString('pt-BR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                });
                                            } catch {
                                                return '--:--';
                                            }
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Produtos - 2/3 da tela */}
                    <div className="xl:col-span-2 space-y-4">
                        {/* Busca e Categorias */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar produtos... (F2)"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {cat === 'all' ? 'Todos' : cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Grid de Produtos */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredProducts.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToCart(product)}
                                    className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-orange-300 hover:shadow-xl transition-all duration-300 text-left group"
                                >
                                    <div className="aspect-square bg-gradient-to-br from-orange-50 to-red-50 rounded-xl mb-3 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Package className="w-12 h-12 text-orange-400" />
                                    </div>
                                    <h3 className="text-gray-900 font-semibold mb-1 truncate">{product.name}</h3>
                                    <p className="text-gray-500 text-sm mb-2">{product.category}</p>
                                    <div className="flex items-center justify-between">
                                        <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                            R$ {product.currentPrice.toFixed(2)}
                                        </p>
                                        <Plus className="w-5 h-5 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Carrinho - 1/3 da tela */}
                    <div className="space-y-4">
                        {/* Cliente Selecionado */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
                            <button
                                onClick={() => setShowCustomerModal(true)}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${selectedCustomer
                                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                                        : 'bg-gradient-to-br from-gray-400 to-gray-500'
                                        }`}>
                                        {selectedCustomer ? (
                                            <Award className="w-6 h-6 text-white" />
                                        ) : (
                                            <User className="w-6 h-6 text-white" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-gray-900 font-semibold">
                                            {selectedCustomer?.name || 'Cliente Balcão'}
                                        </p>
                                        {selectedCustomer && (
                                            <p className="text-gray-500 text-sm">
                                                {selectedCustomer.points || 0} pontos
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        {/* Carrinho */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-gray-900 font-bold flex items-center gap-2">
                                        <ShoppingCart className="w-5 h-5 text-orange-600" />
                                        Carrinho ({cart.length})
                                    </h3>
                                    {cart.length > 0 && (
                                        <button
                                            onClick={() => setCart([])}
                                            className="text-red-600 hover:text-red-700 text-sm font-semibold"
                                        >
                                            Limpar
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                                {cart.length === 0 ? (
                                    <div className="text-center py-16">
                                        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-400 font-medium">Carrinho vazio</p>
                                        <p className="text-gray-400 text-sm mt-1">Adicione produtos para iniciar</p>
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div
                                            key={item.productId}
                                            className="bg-gray-50 rounded-xl p-3 border border-gray-200"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex-1">
                                                    <p className="text-gray-900 font-semibold">{item.productName}</p>
                                                    <p className="text-gray-500 text-sm">
                                                        R$ {item.unitPrice.toFixed(2)} cada
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.productId)}
                                                    className="text-red-500 hover:text-red-600 p-1"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, -1)}
                                                        className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                    >
                                                        <Minus className="w-4 h-4 text-gray-700" />
                                                    </button>
                                                    <span className="text-gray-900 font-bold w-10 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, 1)}
                                                        className="w-8 h-8 bg-white border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                    >
                                                        <Plus className="w-4 h-4 text-gray-700" />
                                                    </button>
                                                </div>
                                                <p className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                    R$ {item.total.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Total e Finalizar */}
                            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-700 text-lg font-semibold">Total:</span>
                                    <span className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                        R$ {cartTotal.toFixed(2)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <button
                                        onClick={handlePrintKitchen}
                                        disabled={cart.length === 0}
                                        className="py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <ChefHat size={18} />
                                        Cozinha
                                    </button>
                                    <button
                                        onClick={() => setShowConferenceModal(true)}
                                        disabled={cart.length === 0}
                                        className="py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <Printer size={18} />
                                        Conf.
                                    </button>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={cart.length === 0}
                                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    <Receipt className="w-5 h-5" />
                                    Finalizar Venda (F12)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showPaymentModal && (
                <POSPaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    cartTotal={cartTotal}
                    cart={cart}
                    selectedCustomer={selectedCustomer}
                    onConfirm={handlePaymentConfirm}
                />
            )}

            {showConferenceModal && (
                <BillConferenceModal
                    isOpen={showConferenceModal}
                    onClose={() => setShowConferenceModal(false)}
                    cart={cart}
                    tableNumber={undefined} // Balcão não tem número de mesa
                />
            )}

            <CashRegisterModal
                key={`cash-register-${showCashRegisterModal}`}
                isOpen={showCashRegisterModal}
                onClose={() => setShowCashRegisterModal(false)}
                currentCashRegister={currentCashRegister}
                onCashRegisterClosed={() => {
                    setCurrentCashRegister(null);
                    setShowCashRegisterModal(false);
                }}
                onCashRegisterOpened={() => {
                    loadCurrentCashRegister();
                }}
            />

            <OrderSuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                order={lastOrder}
                onNewOrder={handleNewOrder}
            />

            {/* Customer Modal */}
            {showCustomerModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Users className="w-6 h-6" />
                                    <h2 className="text-2xl font-bold">Selecionar Cliente</h2>
                                </div>
                                <button
                                    onClick={() => setShowCustomerModal(false)}
                                    className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
                            <button
                                onClick={() => {
                                    setSelectedCustomer(null);
                                    setShowCustomerModal(false);
                                }}
                                className="w-full p-4 mb-4 bg-gray-50 hover:bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-gray-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-semibold text-gray-900">Cliente Balcão</p>
                                        <p className="text-sm text-gray-500">Venda sem cadastro</p>
                                    </div>
                                </div>
                            </button>

                            <div className="space-y-2">
                                {customers.map(customer => (
                                    <button
                                        key={customer.id}
                                        onClick={() => {
                                            setSelectedCustomer(customer);
                                            setShowCustomerModal(false);
                                        }}
                                        className="w-full p-4 bg-white hover:bg-orange-50 rounded-xl border border-gray-200 hover:border-orange-300 transition-all text-left"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-bold">
                                                        {customer.name.substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{customer.name}</p>
                                                    <p className="text-sm text-gray-500">{customer.phone}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Pontos</p>
                                                <p className="text-lg font-bold text-orange-600">{customer.points || 0}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PDV;
