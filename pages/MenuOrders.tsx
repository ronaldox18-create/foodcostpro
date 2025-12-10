import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../utils/calculations';
import { Order, OrderStatus, PaymentMethod } from '../types';
import {
    Package, Clock, CheckCircle, XCircle, Truck, User, Phone, MapPin,
    ShoppingBag, DollarSign, FileText, Utensils, Store, Globe,
    Filter, Search, Calendar, Grid3x3, ChefHat, CheckCircle2, ArrowRight
} from 'lucide-react';
import ConfirmPaymentModal from '../components/ConfirmPaymentModal';

const MenuOrders: React.FC = () => {
    const navigate = useNavigate();
    const { orders, loading: contextLoading, updateOrder, checkStockAvailability, handleStockUpdate } = useApp();

    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);

    const getStatusInfo = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return { label: 'Pendente', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', icon: Clock };
            case 'preparing': return { label: 'Preparando', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: ChefHat };
            case 'ready': return { label: 'Pronto', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: CheckCircle2 };
            case 'delivered': return { label: 'Entregue', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: Truck };
            case 'completed': return { label: 'Concluído', color: 'text-gray-600', bgColor: 'bg-gray-100', borderColor: 'border-gray-200', icon: CheckCircle2 };
            case 'canceled': return { label: 'Cancelado', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: XCircle };
            default: return { label: status, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: Clock };
        }
    };

    // Filtrar apenas pedidos que NÃO são de mesa (Delivery ou Balcão)
    // Ou talvez o usuário queira ver tudo aqui também? O nome é "MenuOrders" (Pedidos do Cardápio).
    // Geralmente isso se refere a pedidos online/delivery.
    // Mas vamos manter consistente com o AllOrders por enquanto, ou filtrar apenas delivery se for o caso.
    // O código anterior não filtrava explicitamente, mostrava tudo. Vamos manter mostrando tudo mas com foco em gestão visual (Kanban style seria ideal, mas vamos manter lista por enquanto).

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (selectedStatus !== 'all' && order.status !== selectedStatus) return false;
            return true;
        });
    }, [orders, selectedStatus]);

    const handleConfirmPayment = async (paymentMethod: PaymentMethod, cashRegisterId: string | null) => {
        if (!confirmingOrder) return;

        setUpdatingOrderId(confirmingOrder.id);
        try {
            // CRITICAL: Verificar estoque antes de finalizar
            const itemsToCheck = confirmingOrder.items.map(item => ({ ...item }));
            const { available, missingItems } = await checkStockAvailability(itemsToCheck);

            if (!available) {
                alert(`❌ ESTOQUE INSUFICIENTE!\n\nNão é possível finalizar o pedido. Itens em falta:\n\n${missingItems.join('\n')}\n\nReponha o estoque antes de continuar.`);
                setConfirmingOrder(null);
                setUpdatingOrderId(null);
                return;
            }

            await updateOrder({
                ...confirmingOrder,
                status: 'completed',
                paymentMethod: paymentMethod,
                cash_register_id: cashRegisterId
            } as any);

            setConfirmingOrder(null);
        } catch (error) {
            console.error("Erro ao finalizar pagamento:", error);
            alert("Erro ao finalizar pagamento.");
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
        if (newStatus === 'completed') {
            setConfirmingOrder(order);
            return;
        }

        setUpdatingOrderId(order.id);
        try {
            await updateOrder({ ...order, status: newStatus });
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status.");
        } finally {
            setUpdatingOrderId(null);
        }
    };

    if (contextLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Pedidos do Cardápio</h1>
                    <p className="text-gray-600 mt-1">Acompanhe o fluxo de pedidos em tempo real</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/all-orders')}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                    >
                        Ver Histórico
                    </button>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {[
                    { id: 'all', label: 'Todos' },
                    { id: 'pending', label: 'Pendentes' },
                    { id: 'preparing', label: 'Preparando' },
                    { id: 'ready', label: 'Prontos' },
                    { id: 'completed', label: 'Concluídos' }
                ].map(status => (
                    <button
                        key={status.id}
                        onClick={() => setSelectedStatus(status.id as any)}
                        className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${selectedStatus === status.id
                            ? 'bg-orange-600 text-white shadow-md'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {status.label}
                        <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                            {status.id === 'all'
                                ? orders.length
                                : orders.filter(o => o.status === status.id).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Grid de Pedidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-400">
                        <Package size={64} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhum pedido encontrado com este status</p>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const statusInfo = getStatusInfo(order.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div key={order.id} className={`bg-white rounded-2xl border-2 ${statusInfo.borderColor} overflow-hidden hover:shadow-lg transition-all`}>
                                <div className={`${statusInfo.bgColor} p-4 border-b ${statusInfo.borderColor} flex justify-between items-start`}>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-black text-gray-500 uppercase tracking-wider">#{order.id.slice(0, 8)}</span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs font-bold text-gray-500">
                                                {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <h3 className="font-black text-lg text-gray-900">{order.customerName}</h3>
                                    </div>
                                    <div className={`flex items-center gap-1.5 bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/50 shadow-sm ${statusInfo.color}`}>
                                        <StatusIcon size={16} />
                                        <span className="font-bold text-xs uppercase tracking-wide">{statusInfo.label}</span>
                                    </div>
                                </div>

                                <div className="p-4">
                                    {/* Items */}
                                    <div className="space-y-2 mb-4">
                                        {order.items && order.items.length > 0 ? (
                                            order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900 bg-gray-100 w-6 h-6 flex items-center justify-center rounded-md text-xs">
                                                            {item.quantity}x
                                                        </span>
                                                        <span className="text-gray-700 font-medium">{item.productName}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">Itens indisponíveis</p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {order.notes && (
                                        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-xl mb-4 text-sm text-yellow-800 italic">
                                            "{order.notes}"
                                        </div>
                                    )}

                                    {/* Footer / Actions */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <span className="font-black text-lg text-gray-900">{formatCurrency(order.totalAmount)}</span>

                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusChange(order, 'preparing')}
                                                disabled={updatingOrderId === order.id}
                                                className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50"
                                            >
                                                Aceitar <ArrowRight size={16} />
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button
                                                onClick={() => handleStatusChange(order, 'ready')}
                                                disabled={updatingOrderId === order.id}
                                                className="flex items-center gap-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-700 transition disabled:opacity-50"
                                            >
                                                Pronto <ArrowRight size={16} />
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button
                                                onClick={() => handleStatusChange(order, 'completed')}
                                                disabled={updatingOrderId === order.id}
                                                className="flex items-center gap-1 bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-700 transition disabled:opacity-50"
                                            >
                                                Entregar <ArrowRight size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Confirm Payment Modal */}
            {confirmingOrder && (
                <ConfirmPaymentModal
                    order={confirmingOrder}
                    onConfirm={handleConfirmPayment}
                    onCancel={() => setConfirmingOrder(null)}
                />
            )}
        </div>
    );
};

export default MenuOrders;
