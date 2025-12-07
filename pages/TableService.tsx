import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Product, OrderItem, POSPayment, Customer, Order } from '../types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search, Plus, Minus, Trash2, Clock, ArrowLeft, ChefHat, XCircle,
    Printer, Receipt, CheckCircle2, AlertCircle, Package, Utensils,
    MoreVertical, CreditCard, DollarSign
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import POSPaymentModal from '../components/POSPaymentModal';
import BillConferenceModal from '../components/BillConferenceModal';

const TableService: React.FC = () => {
    const { products, orders, tables, addOrder, updateOrder, checkStockAvailability, handleStockUpdate } = useApp();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Parâmetros
    const tableId = searchParams.get('tableId');
    const existingOrderId = searchParams.get('orderId');

    // Estado Local
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [originalItems, setOriginalItems] = useState<OrderItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

    // UI States
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Mobile Drawer
    const [showKitchenModal, setShowKitchenModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showConferenceModal, setShowConferenceModal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [lastKitchenOrderItems, setLastKitchenOrderItems] = useState<OrderItem[]>([]);

    // Dados Computados
    const currentTable = useMemo(() => tables.find(t => t.id === tableId), [tables, tableId]);

    const currentOrder = useMemo(() => {
        let order = orders.find(o => o.id === existingOrderId);
        if (!order && tableId) {
            order = orders.find(o => o.tableId === tableId && o.status === 'open');
        }
        return order;
    }, [orders, existingOrderId, tableId]);

    // Calcular totais
    const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);
    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
    const waitingForKitchen = cart.length > originalItems.length || cart.some(item => {
        const original = originalItems.find(i => i.productId === item.productId);
        return !original || item.quantity > original.quantity;
    });

    // Effect: Carregar Pedido
    useEffect(() => {
        if (currentOrder && currentOrder.items) {
            setCart(currentOrder.items);
            setOriginalItems(currentOrder.items);
        } else if (!existingOrderId && !currentOrder) {
            setCart([]);
            setOriginalItems([]);
        }
    }, [existingOrderId, currentOrder]);

    // Categorias
    const categories = useMemo(() => {
        const cats = new Set(products.map(p => p.category || 'Outros'));
        return ['Todos', ...Array.from(cats)];
    }, [products]);

    // Filtragem de Produtos
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchTerm, selectedCategory]);

    // Gestão do Carrinho
    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
                        : item
                );
            }
            return [...prev, {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                unitPrice: product.currentPrice,
                total: product.currentPrice,
                addedAt: new Date().toISOString()
            }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
        if (cart.length <= 1) setIsDrawerOpen(false);
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => {
            return prev.map(item => {
                if (item.productId === productId) {
                    const newQty = Math.max(1, item.quantity + delta);
                    return { ...item, quantity: newQty, total: newQty * item.unitPrice };
                }
                return item;
            });
        });
    };

    // Ações Principais
    const handleSendToKitchen = async () => {
        if (cart.length === 0 || !tableId || !currentTable) return;
        setIsSending(true);

        try {
            const orderData = {
                id: currentOrder?.id || crypto.randomUUID(),
                customerId: 'guest',
                customerName: `Mesa ${currentTable.number}`,
                items: cart,
                totalAmount: cartTotal,
                paymentMethod: 'money' as const,
                status: 'open' as const,
                date: currentOrder?.date || new Date().toISOString(),
                tableId: tableId,
                tableNumber: currentTable.number
            };

            const newItemsToPrint: OrderItem[] = [];
            cart.forEach(cartItem => {
                const originalItem = originalItems.find(oi => oi.productId === cartItem.productId);
                if (!originalItem) {
                    newItemsToPrint.push(cartItem);
                } else if (cartItem.quantity > originalItem.quantity) {
                    const diffQty = cartItem.quantity - originalItem.quantity;
                    newItemsToPrint.push({ ...cartItem, quantity: diffQty, total: diffQty * cartItem.unitPrice });
                }
            });

            if (newItemsToPrint.length === 0 && cart.length > 0) {
                setLastKitchenOrderItems(cart);
            } else {
                const { available, missingItems } = await checkStockAvailability(newItemsToPrint);
                if (!available) {
                    alert(`Estoque insuficiente:\n${missingItems.join('\n')}`);
                    setIsSending(false);
                    return;
                }
                setLastKitchenOrderItems(newItemsToPrint);
            }

            if (currentOrder?.id) await updateOrder(orderData);
            else await addOrder(orderData);

            // Baixar estoque dos itens enviados para cozinha
            if (newItemsToPrint.length > 0) {
                await handleStockUpdate(newItemsToPrint);
            }

            setShowKitchenModal(true);
        } catch (error) {
            console.error('Erro ao enviar:', error);
            alert('Erro ao enviar pedido.');
        } finally {
            setIsSending(false);
        }
    };

    const handleConfirmPayment = async (
        payments: POSPayment[],
        customer: Customer | null,
        discount: number,
        serviceChargePercent: number,
        tip: number,
        couvert: number
    ) => {
        if (!currentOrder?.id) return;

        const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
        const serviceValue = (subtotal * serviceChargePercent) / 100;
        const finalTotalAmount = subtotal + serviceValue + tip + couvert - discount;

        const updatedOrder: any = {
            ...currentOrder,
            status: 'completed',
            totalAmount: finalTotalAmount,
            paymentMethod: payments.length > 1 ? 'multiple' : payments[0].method,
            items: cart,
            couvert: couvert
        };

        try {
            await updateOrder(updatedOrder);
            setShowPaymentModal(false);
            navigate('/tables');
        } catch (error) {
            console.error("Erro ao finalizar:", error);
            alert("Erro ao finalizar mesa.");
        }
    };

    const handleCancelTable = async () => {
        if (!currentOrder?.id || !tableId) return;
        try {
            await updateOrder({ ...currentOrder, status: 'canceled', totalAmount: 0 });
            navigate('/tables');
        } catch (e) { console.error(e); }
    };

    const printKitchenTicket = () => {
        const itemsToPrint = lastKitchenOrderItems.length > 0 ? lastKitchenOrderItems : cart;
        const receiptWindow = window.open('', '', 'width=350,height=600');
        if (!receiptWindow) return;

        const html = `<html>
        <head>
             <style>
                body { font-family: 'Courier New', monospace; font-size: 14px; margin: 0; padding: 15px; width: 80mm; }
             </style>
        </head><body>
            <h2 style="text-align:center; margin-bottom: 5px;">COZINHA - MESA ${currentTable?.number}</h2>
            <p style="text-align:center; margin-top: 0; border-bottom: 2px solid black; padding-bottom: 10px;">${new Date().toLocaleString('pt-BR')}</p>
            ${itemsToPrint.map(i => `<div style="display:flex; justify-content:space-between; margin-bottom: 5px; font-weight:bold; font-size: 16px;"><span>${i.quantity}x</span> <span>${i.productName}</span></div>`).join('')}
            <script>window.onload=function(){window.focus(); setTimeout(() => { window.print(); window.close(); }, 250);}</script>
        </body></html>`;
        receiptWindow.document.write(html);
        receiptWindow.document.close();
    };

    const printBillConference = () => {
        if (cart.length === 0) return;
        setShowConferenceModal(true);
    };

    if (!tableId || !currentTable) return <div className="p-10 text-center">Mesa não encontrada.</div>;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/tables')} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                                Mesa {String(currentTable.number).padStart(2, '0')}
                                {currentOrder && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">Ocupada</span>}
                            </h1>
                            {currentOrder && (
                                <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                                    <Clock size={12} /> Aberta às {new Date(currentOrder.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white px-6 pb-4 pt-0 border-b border-gray-100 flex gap-2 overflow-x-auto hide-scrollbar shrink-0">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                                ? 'bg-orange-600 text-white shadow-md shadow-orange-200'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20 md:pb-0">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-orange-200 transition-all text-left group flex flex-col h-full"
                            >
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 block">{product.category}</span>
                                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-auto line-clamp-2">{product.name}</h3>
                                <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50 group-hover:border-dashed group-hover:border-gray-200">
                                    <span className="font-black text-xl text-gray-900">{formatCurrency(product.currentPrice)}</span>
                                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                        <Plus size={18} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`
                fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-2xl z-20 flex flex-col transform transition-transform duration-300 md:translate-x-0 md:static
                ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                    <h2 className="font-black text-gray-900 text-lg flex items-center gap-2">
                        <Utensils size={20} className="text-orange-600" /> Confirmar Pedido
                    </h2>
                    <button onClick={() => setIsDrawerOpen(false)} className="md:hidden p-2 text-gray-400">
                        <XCircle size={24} />
                    </button>
                    <button onClick={() => setShowCancelModal(true)} className="hidden md:block text-xs font-bold text-red-500 hover:text-red-700 uppercase tracking-wider">
                        Cancelar Mesa
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.map(item => (
                        <div key={item.productId} className={`p-4 rounded-2xl border ${originalItems.find(oi => oi.productId === item.productId && oi.quantity >= item.quantity)
                            ? 'bg-gray-50 border-gray-100'
                            : 'bg-orange-50 border-orange-100'
                            }`}>
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-gray-900">{item.productName}</h4>
                                <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-1">
                                    <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:bg-gray-100 rounded">
                                        <Minus size={14} className="text-gray-600" />
                                    </button>
                                    <span className="font-bold text-sm min-w-[20px] text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:bg-gray-100 rounded">
                                        <Plus size={14} className="text-gray-600" />
                                    </button>
                                </div>
                                <span className="font-bold text-gray-900">{formatCurrency(item.total)}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-5 border-t border-gray-200 bg-gray-50 space-y-4">
                    <div className="flex justify-between items-center text-lg font-black text-gray-900">
                        <span>Total</span>
                        <span>{formatCurrency(cartTotal)}</span>
                    </div>

                    <button
                        onClick={printBillConference}
                        className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-all flex items-center justify-center gap-2"
                        disabled={cart.length === 0}
                    >
                        <Receipt size={20} />
                        Imprimir Conferência
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleSendToKitchen}
                            disabled={!waitingForKitchen || isSending}
                            className={`py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${waitingForKitchen
                                ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-xl shadow-orange-200'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isSending ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <ChefHat size={20} />}
                            Enviar Cozinha
                        </button>

                        <button
                            onClick={() => setShowPaymentModal(true)}
                            disabled={cart.length === 0}
                            className="py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-xl shadow-green-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CreditCard size={20} />
                            Pagamento
                        </button>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {showKitchenModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Pedido Enviado!</h2>
                        <p className="text-gray-500 mb-8 font-medium">Os itens foram enviados para a cozinha.</p>
                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={printKitchenTicket}
                                className="w-full py-4 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                            >
                                <Printer size={20} />
                                Imprimir Via (Cozinha)
                            </button>
                            <button
                                onClick={() => setShowKitchenModal(false)}
                                className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-colors"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showConferenceModal && (
                <BillConferenceModal
                    isOpen={showConferenceModal}
                    onClose={() => setShowConferenceModal(false)}
                    cart={cart}
                    tableNumber={currentTable?.number}
                />
            )}

            {showPaymentModal && (
                <POSPaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    cartTotal={cartTotal}
                    cart={cart}
                    selectedCustomer={null}
                    onConfirm={handleConfirmPayment}
                />
            )}

            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center relative overflow-hidden">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Cancelar Mesa?</h2>
                        <p className="text-gray-500 mb-8 font-medium">Todos os itens serão cancelados. Esta ação não pode ser desfeita.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-4 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleCancelTable}
                                className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableService;
