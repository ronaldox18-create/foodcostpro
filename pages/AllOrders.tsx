import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../utils/calculations';
import { Order, OrderStatus } from '../types';
import {
    Package, Clock, CheckCircle, XCircle, Truck, User, Phone, MapPin,
    ShoppingBag, DollarSign, FileText, Utensils, Store, Globe,
    Filter, Search, Calendar, Grid3x3, ChefHat, CheckCircle2
} from 'lucide-react';

const AllOrders: React.FC = () => {
    const navigate = useNavigate();
    const { orders, loading: contextLoading, updateOrder } = useApp();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');
    const [selectedSource, setSelectedSource] = useState<'all' | 'virtual' | 'table' | 'counter'>('all');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Helpers
    const getOrderSource = (order: Order): 'virtual' | 'table' | 'counter' => {
        if (order.deliveryType) return 'virtual';
        if (order.tableId) return 'table';
        return 'counter';
    };

    const getStatusInfo = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return { label: 'Pendente', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', icon: Clock };
            case 'confirmed': return { label: 'Confirmado', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: CheckCircle };
            case 'preparing': return { label: 'Preparando', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', icon: ChefHat };
            case 'ready': return { label: 'Pronto', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: CheckCircle2 };
            case 'delivered': return { label: 'Entregue', color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: Truck };
            case 'completed': return { label: 'Concluído', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: CheckCircle2 };
            case 'canceled': return { label: 'Cancelado', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: XCircle };
            default: return { label: status, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: Clock };
        }
    };

    const getSourceInfo = (source: string) => {
        const map = {
            virtual: { label: 'Cardápio Virtual', icon: Globe },
            table: { label: 'Mesa/Salão', icon: Utensils },
            counter: { label: 'Balcão/PDV', icon: Store }
        };
        return map[source as keyof typeof map] || map.counter;
    };

    // Filtragem
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (selectedStatus !== 'all' && order.status !== selectedStatus) return false;

            if (selectedSource !== 'all') {
                const isVirtual = (order as any).delivery_type || (order as any).deliveryType;
                const isTable = order.tableId;

                if (selectedSource === 'virtual' && !isVirtual) return false;
                if (selectedSource === 'table' && !isTable) return false;
                if (selectedSource === 'counter' && (isVirtual || isTable)) return false;
            }

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesCustomer = order.customerName?.toLowerCase().includes(term);
                const matchesId = order.id.toLowerCase().includes(term);
                const matchesItems = order.items?.some(item => item.productName.toLowerCase().includes(term));

                if (!matchesCustomer && !matchesId && !matchesItems) return false;
            }

            return true;
        });
    }, [orders, selectedStatus, selectedSource, searchTerm]);

    const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
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
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Todos os Pedidos</h1>
                    <p className="text-gray-600 mt-1">Gerencie todos os pedidos em um só lugar</p>
                </div>
                <button
                    onClick={() => navigate('/tables')}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition shadow-md"
                >
                    <Grid3x3 size={18} />
                    Ver Mesas
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar cliente, ID ou produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100"
                    />
                </div>

                <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as OrderStatus | 'all')}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100"
                >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendente</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="preparing">Preparando</option>
                    <option value="ready">Pronto</option>
                    <option value="delivered">Entregue</option>
                    <option value="completed">Concluído</option>
                    <option value="canceled">Cancelado</option>
                </select>

                <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value as any)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100"
                >
                    <option value="all">Todas as Origens</option>
                    <option value="table">Mesas</option>
                    <option value="virtual">Delivery/Virtual</option>
                    <option value="counter">Balcão</option>
                </select>
            </div>

            <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Package size={64} className="mx-auto mb-4 opacity-50" />
                        <p>Nenhum pedido encontrado</p>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const statusInfo = getStatusInfo(order.status);
                        const StatusIcon = statusInfo.icon;
                        const source = getOrderSource(order);
                        const sourceInfo = getSourceInfo(source);
                        const SourceIcon = sourceInfo.icon;

                        return (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden cursor-pointer hover:border-orange-200"
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider">
                                                    #{order.id.slice(0, 8)}
                                                </span>
                                                <span className="text-gray-400 text-xs">•</span>
                                                <span className="text-gray-500 text-xs font-medium">
                                                    {new Date(order.date).toLocaleString('pt-BR')}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-lg text-gray-900">{order.customerName}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                                    <SourceIcon size={12} />
                                                    {sourceInfo.label}
                                                    {order.tableNumber && ` ${order.tableNumber}`}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}>
                                            <StatusIcon size={16} />
                                            <span className="text-xs font-bold uppercase">{statusInfo.label}</span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
                                        {order.items && order.items.length > 0 ? (
                                            order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900 w-6 text-center">{item.quantity}x</span>
                                                        <span className="text-gray-700">{item.productName}</span>
                                                    </div>
                                                    <span className="text-gray-500 font-medium">{formatCurrency(item.total)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic text-center">Nenhum item neste pedido</p>
                                        )}
                                        <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
                                            <span className="font-bold text-gray-600 text-sm">Total</span>
                                            <span className="font-black text-gray-900 text-lg">{formatCurrency(order.totalAmount)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        {order.status === 'open' && (
                                            <button onClick={() => handleStatusChange(order, 'completed')} disabled={updatingOrderId === order.id} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition disabled:opacity-50">
                                                Concluir
                                            </button>
                                        )}
                                        {order.status === 'pending' && (
                                            <button onClick={() => handleStatusChange(order, 'confirmed')} disabled={updatingOrderId === order.id} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50">
                                                Aceitar
                                            </button>
                                        )}
                                        {order.status === 'confirmed' && (
                                            <button onClick={() => handleStatusChange(order, 'preparing')} disabled={updatingOrderId === order.id} className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700 transition disabled:opacity-50">
                                                Preparar
                                            </button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button onClick={() => handleStatusChange(order, 'ready')} disabled={updatingOrderId === order.id} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition disabled:opacity-50">
                                                Pronto
                                            </button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button onClick={() => handleStatusChange(order, 'delivered')} disabled={updatingOrderId === order.id} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50">
                                                Entregue
                                            </button>
                                        )}
                                        {order.status === 'delivered' && (
                                            <button onClick={() => handleStatusChange(order, 'completed')} disabled={updatingOrderId === order.id} className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition disabled:opacity-50">
                                                Finalizar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl z-10">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900">Detalhes do Pedido</h2>
                                    <p className="text-sm text-gray-500 mt-1">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                                </div>
                                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 transition">
                                    <XCircle size={28} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-600 mb-1">Status Atual</p>
                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusInfo(selectedOrder.status).bgColor} ${getStatusInfo(selectedOrder.status).color} ${getStatusInfo(selectedOrder.status).borderColor}`}>
                                            {React.createElement(getStatusInfo(selectedOrder.status).icon, { size: 18 })}
                                            <span className="text-sm font-bold uppercase">{getStatusInfo(selectedOrder.status).label}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-600 mb-1">Data e Hora</p>
                                        <p className="text-sm text-gray-900 font-medium">{new Date(selectedOrder.date).toLocaleString('pt-BR')}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-bold text-gray-600 mb-2">Cliente</p>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="font-bold text-gray-900">{selectedOrder.customerName}</p>
                                    {((selectedOrder as any).delivery_type || (selectedOrder as any).phone) && (
                                        <div className="mt-2 space-y-1">
                                            {(selectedOrder as any).phone && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Phone size={14} />
                                                    <span>{(selectedOrder as any).phone}</span>
                                                </div>
                                            )}
                                            {(selectedOrder as any).delivery_address && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <MapPin size={14} />
                                                    <span>{(selectedOrder as any).delivery_address}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-bold text-gray-600 mb-2">Itens do Pedido</p>
                                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                        selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-gray-900 text-lg w-8 text-center">{item.quantity}x</span>
                                                    <span className="text-gray-700 font-medium">{item.productName}</span>
                                                </div>
                                                <span className="text-gray-900 font-bold">{formatCurrency(item.total)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400 italic text-center">Nenhum item neste pedido</p>
                                    )}
                                    <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                        <span className="font-bold text-gray-900 text-lg">Total</span>
                                        <span className="font-black text-gray-900 text-2xl">{formatCurrency(selectedOrder.totalAmount)}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-bold text-gray-600 mb-2">Mudar Status</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedOrder.status === 'pending' && (
                                        <>
                                            <button onClick={() => { handleStatusChange(selectedOrder, 'confirmed'); setSelectedOrder(null); }} className="px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
                                                ✓ Aceitar Pedido
                                            </button>
                                            <button onClick={() => { if (confirm('Cancelar este pedido?')) { handleStatusChange(selectedOrder, 'canceled'); setSelectedOrder(null); } }} className="px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition">
                                                ✕ Cancelar
                                            </button>
                                        </>
                                    )}
                                    {selectedOrder.status === 'confirmed' && (
                                        <button onClick={() => { handleStatusChange(selectedOrder, 'preparing'); setSelectedOrder(null); }} className="px-4 py-3 col-span-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition">
                                            👨‍🍳 Iniciar Preparo
                                        </button>
                                    )}
                                    {selectedOrder.status === 'preparing' && (
                                        <button onClick={() => { handleStatusChange(selectedOrder, 'ready'); setSelectedOrder(null); }} className="px-4 py-3 col-span-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition">
                                            ✓ Marcar como Pronto
                                        </button>
                                    )}
                                    {selectedOrder.status === 'ready' && (
                                        <button onClick={() => { handleStatusChange(selectedOrder, 'delivered'); setSelectedOrder(null); }} className="px-4 py-3 col-span-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">
                                            🚚 Marcar como Entregue
                                        </button>
                                    )}
                                    {selectedOrder.status === 'delivered' && (
                                        <button onClick={() => { handleStatusChange(selectedOrder, 'completed'); setSelectedOrder(null); }} className="px-4 py-3 col-span-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition">
                                            ✓ Finalizar Pedido
                                        </button>
                                    )}
                                    {selectedOrder.status === 'open' && (
                                        <button onClick={() => { handleStatusChange(selectedOrder, 'completed'); setSelectedOrder(null); }} className="px-4 py-3 col-span-2 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition">
                                            ✓ Concluir Pedido
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllOrders;
