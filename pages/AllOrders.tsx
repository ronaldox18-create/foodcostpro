import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../utils/supabaseClient';
import { formatCurrency } from '../utils/calculations';
import {
    Package, Clock, CheckCircle, XCircle, Truck, User, Phone, MapPin,
    ShoppingBag, DollarSign, FileText, Utensils, Store, Globe,
    Filter, Search, Calendar, Plus, Grid3x3
} from 'lucide-react';

interface OrderItem {
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
}

interface OrderData {
    id: string;
    customer_id: string;
    customer_name: string;
    total_amount: number;
    status: string;
    payment_method: string;
    delivery_type?: string;
    delivery_address?: string;
    phone?: string;
    notes?: string;
    created_at: string;
    date: string;
    table_id?: string;
    table_number?: number;
    items?: OrderItem[];
}

const AllOrders: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { handleStockUpdate } = useApp();
    const [orders, setOrders] = useState<OrderData[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedSource, setSelectedSource] = useState<string>('all'); // all, virtual, table, counter
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchOrders();

        if (user?.id) {
            const channel = supabase
                .channel(`allorders-updates-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'orders',
                        filter: `user_id=eq.${user.id}`
                    },
                    () => {
                        console.log('📝 Order changed - refreshing list');
                        fetchOrders();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user]);

    const fetchOrders = async () => {
        if (!user) return;

        try {
            // 1. Fetch Orders
            const { data: ordersData, error: ordersError } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            if (!ordersData || ordersData.length === 0) {
                setOrders([]);
                setLoading(false);
                return;
            }

            // 2. Fetch Items for these orders
            const orderIds = ordersData.map(o => o.id);
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .in('order_id', orderIds);

            if (itemsError) console.warn('Error fetching items:', itemsError);

            // 3. Combine data
            const ordersWithItems = ordersData.map(order => ({
                ...order,
                items: itemsData?.filter(item => item.order_id === order.id) || []
            }));

            setOrders(ordersWithItems);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdatingOrderId(orderId);
        try {
            const order = orders.find(o => o.id === orderId);
            if (!order) {
                alert('Pedido não encontrado');
                return;
            }

            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Determinar se deve baixar estoque baseado no status atual e novo status
            const shouldDeductStock =
                // Cardápio Virtual: pending -> confirmed (primeira vez que confirma)
                (order.status === 'pending' && newStatus === 'confirmed') ||
                // Mesa/Balcão: ready -> completed (estava pronto e está finalizando, sem delivery_type)
                // Nota: open -> completed NÃO baixa aqui porque já foi baixado na criação
                (order.status === 'ready' && newStatus === 'completed' && !order.delivery_type);

            if (shouldDeductStock && order.items && order.items.length > 0) {
                const itemsToDeduct = order.items.map(item => ({
                    productId: item.product_id,
                    productName: item.product_name,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    total: item.total
                }));

                await handleStockUpdate(itemsToDeduct);
                console.log('📉 Estoque atualizado para o pedido', orderId, '- Transição:', order.status, '->', newStatus);
            } else {
                console.log('ℹ️ Sem baixa de estoque para transição:', order.status, '->', newStatus);
            }

            await fetchOrders();
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Erro ao atualizar status do pedido');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const getOrderSource = (order: OrderData): 'virtual' | 'table' | 'counter' => {
        if (order.delivery_type) return 'virtual';
        if (order.table_id) return 'table';
        return 'counter';
    };

    const getSourceInfo = (source: string) => {
        const map = {
            virtual: { label: 'Cardápio Virtual', icon: Globe, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
            table: { label: 'Mesa/Salão', icon: Utensils, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
            counter: { label: 'Balcão/PDV', icon: Store, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' }
        };
        return map[source as keyof typeof map] || map.counter;
    };

    const getStatusInfo = (status: string) => {
        const statusMap: Record<string, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
            pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
            confirmed: { label: 'Confirmado', icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
            preparing: { label: 'Preparando', icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
            ready: { label: 'Pronto', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
            delivered: { label: 'Entregue', icon: Truck, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
            completed: { label: 'Concluído', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
            open: { label: 'Aberto', icon: Clock, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
            cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
            canceled: { label: 'Cancelado', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
        };
        return statusMap[status] || statusMap.pending;
    };

    const getPaymentMethodLabel = (method: string) => {
        const map: Record<string, string> = {
            'dinheiro': 'Dinheiro',
            'money': 'Dinheiro',
            'pix': 'PIX',
            'credit': 'Crédito',
            'debit': 'Débito',
            'cartao_credito': 'Cartão de Crédito',
            'cartao_debito': 'Cartão de Débito',
            'pending': 'Pendente'
        };
        return map[method] || method || 'Não informado';
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            // Filter by status
            if (selectedStatus !== 'all' && order.status !== selectedStatus) return false;

            // Filter by source
            if (selectedSource !== 'all') {
                const source = getOrderSource(order);
                if (source !== selectedSource) return false;
            }

            // Filter by search
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                const matchesCustomer = order.customer_name?.toLowerCase().includes(searchLower);
                const matchesId = order.id.toLowerCase().includes(searchLower);
                const matchesItems = order.items?.some(item =>
                    item.product_name.toLowerCase().includes(searchLower)
                );
                if (!matchesCustomer && !matchesId && !matchesItems) return false;
            }

            return true;
        });
    }, [orders, selectedStatus, selectedSource, searchTerm]);

    const statusCounts = {
        all: orders.length,
        pending: orders.filter(o => o.status === 'pending').length,
        open: orders.filter(o => o.status === 'open').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        ready: orders.filter(o => o.status === 'ready').length,
        completed: orders.filter(o => o.status === 'completed').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
    };

    const sourceCounts = {
        all: orders.length,
        virtual: orders.filter(o => getOrderSource(o) === 'virtual').length,
        table: orders.filter(o => getOrderSource(o) === 'table').length,
        counter: orders.filter(o => getOrderSource(o) === 'counter').length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Todos os Pedidos</h1>
                    <p className="text-gray-600 mt-1">Gerencie pedidos do cardápio virtual, mesas e balcão em um só lugar</p>
                </div>
                <button
                    onClick={() => navigate('/tables')}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition shadow-md"
                >
                    <Grid3x3 size={18} />
                    Ver Mesas
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por cliente, ID ou produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 text-gray-900 placeholder-gray-400"
                />
            </div>

            {/* Source Filter */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Filter size={16} className="text-gray-500" />
                    <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Origem</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: 'all', label: 'Todos', count: sourceCounts.all },
                        { id: 'virtual', label: 'Cardápio Virtual', count: sourceCounts.virtual },
                        { id: 'table', label: 'Mesas', count: sourceCounts.table },
                        { id: 'counter', label: 'Balcão', count: sourceCounts.counter },
                    ].map(source => (
                        <button
                            key={source.id}
                            onClick={() => setSelectedSource(source.id)}
                            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${selectedSource === source.id
                                ? 'bg-orange-600 text-white shadow-lg transform scale-105'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {source.label} <span className="ml-1 opacity-70 text-xs">({source.count})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Status Filter */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-gray-500" />
                    <span className="text-sm font-bold text-gray-600 uppercase tracking-wide">Status</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {[
                        { id: 'all', label: 'Todos', count: statusCounts.all },
                        { id: 'pending', label: 'Pendentes', count: statusCounts.pending },
                        { id: 'open', label: 'Abertos', count: statusCounts.open },
                        { id: 'confirmed', label: 'Confirmados', count: statusCounts.confirmed },
                        { id: 'preparing', label: 'Preparando', count: statusCounts.preparing },
                        { id: 'ready', label: 'Prontos', count: statusCounts.ready },
                        { id: 'completed', label: 'Concluídos', count: statusCounts.completed },
                    ].map(status => (
                        <button
                            key={status.id}
                            onClick={() => setSelectedStatus(status.id)}
                            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${selectedStatus === status.id
                                ? 'bg-gray-900 text-white shadow-lg transform scale-105'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {status.label} <span className="ml-1 opacity-70 text-xs">({status.count})</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredOrders.length === 0 ? (
                    <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <Package size={64} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">Nenhum pedido encontrado</h3>
                        <p className="text-gray-400">
                            {searchTerm ? 'Tente ajustar sua busca' : 'Aguardando novos pedidos...'}
                        </p>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const statusInfo = getStatusInfo(order.status);
                        const StatusIcon = statusInfo.icon;
                        const source = getOrderSource(order);
                        const sourceInfo = getSourceInfo(source);
                        const SourceIcon = sourceInfo.icon;

                        return (
                            <div key={order.id} className={`bg-white rounded-3xl border-2 ${statusInfo.borderColor} overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col`}>
                                {/* Card Header */}
                                <div className={`${statusInfo.bgColor} p-5 border-b ${statusInfo.borderColor}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-black text-gray-500 uppercase tracking-wider">#{order.id.slice(0, 8)}</span>
                                                <span className="text-xs text-gray-400">•</span>
                                                <span className="text-xs font-bold text-gray-500">
                                                    {new Date(order.created_at || order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-lg text-gray-900">{order.customer_name}</h3>
                                            {order.phone && (
                                                <div className="flex items-center gap-1 mt-1 text-sm font-medium text-gray-600">
                                                    <Phone size={14} />
                                                    {order.phone}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`flex items-center gap-1.5 ${statusInfo.color} bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/50 shadow-sm`}>
                                            <StatusIcon size={16} />
                                            <span className="font-bold text-xs uppercase tracking-wide">{statusInfo.label}</span>
                                        </div>
                                    </div>

                                    {/* Source Badge */}
                                    <div className={`inline-flex items-center gap-1.5 ${sourceInfo.color} ${sourceInfo.bgColor} px-3 py-1.5 rounded-full border ${sourceInfo.borderColor}`}>
                                        <SourceIcon size={14} />
                                        <span className="font-bold text-xs uppercase tracking-wide">{sourceInfo.label}</span>
                                        {order.table_number && <span className="text-xs">• Mesa {order.table_number}</span>}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5 flex-1 flex flex-col gap-4">
                                    {/* Delivery Info (if virtual menu) */}
                                    {order.delivery_type && (
                                        <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl">
                                            <div className={`p-2 rounded-lg ${order.delivery_type === 'delivery' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {order.delivery_type === 'delivery' ? <Truck size={18} /> : <ShoppingBag size={18} />}
                                            </div>
                                            <div>
                                                <p className={`text-xs font-bold uppercase ${order.delivery_type === 'delivery' ? 'text-green-700' : 'text-orange-700'}`}>
                                                    {order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}
                                                </p>
                                                {order.delivery_type === 'delivery' && order.delivery_address && (
                                                    <p className="text-sm text-gray-600 leading-tight mt-0.5">{order.delivery_address}</p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Items List */}
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Itens do Pedido</p>
                                        {order.items && order.items.length > 0 ? (
                                            order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900 bg-gray-100 w-6 h-6 flex items-center justify-center rounded-md text-xs">
                                                            {item.quantity}x
                                                        </span>
                                                        <span className="text-gray-700 font-medium">{item.product_name}</span>
                                                    </div>
                                                    <span className="text-gray-500">{formatCurrency(item.total)}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">Itens não disponíveis</p>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    {order.notes && (
                                        <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-xl">
                                            <div className="flex items-center gap-2 mb-1 text-yellow-700">
                                                <FileText size={14} />
                                                <span className="text-xs font-bold uppercase">Observações</span>
                                            </div>
                                            <p className="text-sm text-gray-700 italic">"{order.notes}"</p>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-100 my-1"></div>

                                    {/* Payment & Total */}
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pagamento</p>
                                            <div className="flex items-center gap-1.5 text-gray-700 font-medium text-sm bg-gray-50 px-2 py-1 rounded-lg inline-flex">
                                                <DollarSign size={14} className="text-gray-400" />
                                                {getPaymentMethodLabel(order.payment_method)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Total</p>
                                            <p className="text-2xl font-black text-gray-900">{formatCurrency(order.total_amount)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Footer */}
                                <div className="p-4 bg-gray-50 border-t border-gray-100 grid gap-2">
                                    {/* PEDIDOS PENDENTES (Cardápio Virtual) */}
                                    {order.status === 'pending' && source === 'virtual' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                                disabled={updatingOrderId === order.id}
                                                className="bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50"
                                            >
                                                {updatingOrderId === order.id ? '...' : 'Recusar'}
                                            </button>
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                                disabled={updatingOrderId === order.id}
                                                className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-md shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {updatingOrderId === order.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Aceitar'}
                                            </button>
                                        </div>
                                    )}

                                    {/* PEDIDOS CONFIRMADOS */}
                                    {order.status === 'confirmed' && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, 'preparing')}
                                            disabled={updatingOrderId === order.id}
                                            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-md shadow-orange-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {updatingOrderId === order.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Package size={18} /> Iniciar Preparo</>}
                                        </button>
                                    )}

                                    {/* PEDIDOS PREPARANDO */}
                                    {order.status === 'preparing' && (
                                        <button
                                            onClick={() => updateOrderStatus(order.id, 'ready')}
                                            disabled={updatingOrderId === order.id}
                                            className="w-full bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-md shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {updatingOrderId === order.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle size={18} /> Marcar como Pronto</>}
                                        </button>
                                    )}

                                    {/* PEDIDOS PRONTOS */}
                                    {order.status === 'ready' && (
                                        <div className="grid grid-cols-1 gap-2">
                                            {/* Se for cardápio virtual, opção de enviar/entregar */}
                                            {source === 'virtual' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'delivered')}
                                                    disabled={updatingOrderId === order.id}
                                                    className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {updatingOrderId === order.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Truck size={18} /> {order.delivery_type === 'delivery' ? 'Saiu para Entrega' : 'Entregue ao Cliente'}</>}
                                                </button>
                                            )}
                                            {/* Se for mesa ou balcão, opção de finalizar */}
                                            {(source === 'table' || source === 'counter') && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'completed')}
                                                    disabled={updatingOrderId === order.id}
                                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {updatingOrderId === order.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><DollarSign size={18} /> Finalizar Pedido</>}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* PEDIDOS ABERTOS (Mesas e Balcão) */}
                                    {order.status === 'open' && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {source === 'table' && (
                                                <button
                                                    onClick={() => navigate(`/orders?tableId=${order.table_id}&orderId=${order.id}`)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={16} />
                                                    Adicionar Itens
                                                </button>
                                            )}
                                            {source === 'counter' && (
                                                <button
                                                    onClick={() => navigate('/orders')}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={16} />
                                                    Adicionar Itens
                                                </button>
                                            )}
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                                disabled={updatingOrderId === order.id}
                                                className="bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {updatingOrderId === order.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><DollarSign size={18} /> Fechar Conta</>}
                                            </button>
                                        </div>
                                    )}

                                    {/* PEDIDOS CONCLUÍDOS */}
                                    {order.status === 'completed' && (
                                        <div className="flex items-center justify-between py-2">
                                            <span className="text-sm text-green-700 font-bold flex items-center gap-2">
                                                <CheckCircle size={18} className="text-green-600" />
                                                Pedido Finalizado
                                            </span>
                                            {source === 'table' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'open')}
                                                    disabled={updatingOrderId === order.id}
                                                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-lg font-bold transition disabled:opacity-50"
                                                >
                                                    Reabrir Mesa
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* PEDIDOS ENTREGUES */}
                                    {order.status === 'delivered' && (
                                        <div className="text-center py-2">
                                            <span className="text-sm text-gray-700 font-bold flex items-center justify-center gap-2">
                                                <Truck size={18} className="text-gray-600" />
                                                Pedido Entregue
                                            </span>
                                        </div>
                                    )}

                                    {/* PEDIDOS CANCELADOS */}
                                    {(order.status === 'cancelled' || order.status === 'canceled') && (
                                        <div className="text-center py-2">
                                            <span className="text-sm text-red-700 font-bold flex items-center justify-center gap-2">
                                                <XCircle size={18} className="text-red-600" />
                                                Pedido Cancelado
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* FAB - Floating Action Button */}
            <button
                onClick={() => navigate('/orders')}
                className="fixed bottom-8 right-8 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-2xl transition transform hover:scale-110 z-50 flex items-center gap-2"
            >
                <Plus size={24} />
                <span className="font-bold">Novo Pedido</span>
            </button>
        </div >
    );
};

export default AllOrders;
