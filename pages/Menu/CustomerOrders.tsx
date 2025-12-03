import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { formatCurrency } from '../../utils/calculations';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck, Sparkles, Award } from 'lucide-react';

interface Order {
    id: string;
    total_amount: number;
    status: string;
    created_at: string;
    points_earned?: number;
    loyalty_discount?: number;
    items?: {
        product_name: string;
        quantity: number;
        price: number;
        total: number;
    }[];
}

const CustomerOrders: React.FC = () => {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            const customerAuth = localStorage.getItem('customer_auth');
            if (!customerAuth) {
                navigate(`/menu/${storeId}/auth`);
                return;
            }

            const customer = JSON.parse(customerAuth);

            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        *,
                        items:order_items (
                            product_name,
                            quantity,
                            price,
                            total
                        )
                    `)
                    .eq('customer_id', customer.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setOrders(data || []);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();

        // Realtime subscription para atualizações de status
        const customerAuth = localStorage.getItem('customer_auth');
        if (customerAuth) {
            const customer = JSON.parse(customerAuth);
            console.log('🔄 Setting up Realtime for customer:', customer.id);

            const subscription = supabase
                .channel('customer_orders')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `customer_id=eq.${customer.id}`
                }, (payload) => {
                    console.log('📦 Order status updated:', payload.new);
                    setOrders(prev =>
                        prev.map(order =>
                            order.id === payload.new.id
                                ? { ...order, status: payload.new.status }
                                : order
                        )
                    );
                })
                .subscribe((status) => {
                    console.log('🔌 Realtime connection status:', status);
                });

            return () => {
                console.log('🔌 Unsubscribing from customer_orders');
                subscription.unsubscribe();
            };
        }
    }, [storeId, navigate]);

    const getStatusInfo = (status: string) => {
        const statusMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
            pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
            confirmed: { label: 'Confirmado', icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
            preparing: { label: 'Preparando', icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-100' },
            ready: { label: 'Pronto', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
            delivered: { label: 'Entregue', icon: Truck, color: 'text-gray-600', bgColor: 'bg-gray-100' },
            completed: { label: 'Concluído', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
            cancelled: { label: 'Cancelado', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' }
        };
        return statusMap[status] || statusMap.pending;
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm font-medium">Carregando pedidos...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 animate-fade-in">
            {/* Header - Sem sticky para evitar problemas de layout */}
            <div className="bg-white border-b border-gray-100">
                <div className="p-4 flex items-center gap-3">
                    <button onClick={() => navigate(`/menu/${storeId}/profile`)} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center active:bg-gray-200 transition">
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-xl font-black text-gray-900">Meus Pedidos</h1>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Nenhum pedido ainda</h3>
                        <p className="text-gray-400 text-sm mb-6">Que tal experimentar algo delicioso hoje?</p>
                        <button
                            onClick={() => navigate(`/menu/${storeId}`)}
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform shadow-lg shadow-orange-200"
                        >
                            Ver Cardápio
                        </button>
                    </div>
                ) : (
                    orders.map(order => {
                        const statusInfo = getStatusInfo(order.status);
                        const StatusIcon = statusInfo.icon;
                        const date = new Date(order.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        return (
                            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {/* Header do Pedido */}
                                <div className="p-4 border-b border-gray-50 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-gray-900">Pedido #{order.id.slice(0, 6)}</span>
                                            <span className="text-xs text-gray-400">• {date}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 line-clamp-1">
                                            {order.items?.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${statusInfo.bgColor} ${statusInfo.color} px-2.5 py-1 rounded-lg shrink-0`}>
                                        <StatusIcon size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-wide">{statusInfo.label}</span>
                                    </div>
                                </div>

                                {/* Informações de Fidelidade */}
                                {(order.points_earned && order.points_earned > 0 || order.loyalty_discount && order.loyalty_discount > 0) && (
                                    <div className="px-4 py-2 bg-purple-50 flex items-center justify-between text-xs border-b border-purple-100">
                                        {order.points_earned && order.points_earned > 0 && (
                                            <div className="flex items-center gap-1.5 text-purple-700 font-medium">
                                                <Award size={14} />
                                                Ganhou +{order.points_earned} pontos
                                            </div>
                                        )}
                                        {order.loyalty_discount && order.loyalty_discount > 0 && (
                                            <div className="flex items-center gap-1.5 text-green-600 font-bold ml-auto">
                                                <Sparkles size={14} />
                                                Economizou {formatCurrency(order.loyalty_discount)}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Footer com Total */}
                                <div className="p-4 flex justify-between items-center bg-gray-50/50">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
                                    >
                                        Ver detalhes
                                    </button>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400 font-medium uppercase">Total</p>
                                        <p className="text-lg font-black text-gray-900 leading-none">{formatCurrency(order.total_amount)}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Modal de Detalhes */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white border-b border-gray-100 p-5 rounded-t-3xl z-10 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Detalhes do Pedido</h2>
                                <p className="text-xs text-gray-500">#{selectedOrder.id.slice(0, 8)}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
                            >
                                <XCircle size={20} />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Status */}
                            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-600">Status</span>
                                <div className={`flex items-center gap-1.5 ${getStatusInfo(selectedOrder.status).bgColor} ${getStatusInfo(selectedOrder.status).color} px-3 py-1 rounded-lg`}>
                                    {React.createElement(getStatusInfo(selectedOrder.status).icon, { size: 14 })}
                                    <span className="text-xs font-bold uppercase tracking-wide">{getStatusInfo(selectedOrder.status).label}</span>
                                </div>
                            </div>

                            {/* Itens */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Itens do Pedido</h3>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start text-sm">
                                            <div className="flex gap-3">
                                                <span className="font-bold text-gray-900 w-6 text-center bg-gray-100 rounded h-6 flex items-center justify-center text-xs">
                                                    {item.quantity}x
                                                </span>
                                                <span className="text-gray-700 font-medium">{item.product_name}</span>
                                            </div>
                                            <span className="text-gray-900 font-bold">
                                                {item.total ? formatCurrency(item.total) : '-'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resumo Financeiro */}
                            <div className="border-t border-gray-100 pt-4 space-y-2">
                                {selectedOrder.loyalty_discount && selectedOrder.loyalty_discount > 0 && (
                                    <div className="flex justify-between items-center text-green-600 text-sm">
                                        <span className="flex items-center gap-1.5">
                                            <Sparkles size={14} />
                                            Desconto Fidelidade
                                        </span>
                                        <span className="font-bold">-{formatCurrency(selectedOrder.loyalty_discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="font-black text-2xl text-gray-900">{formatCurrency(selectedOrder.total_amount)}</span>
                                </div>
                            </div>

                            {/* Pontos Ganhos */}
                            {selectedOrder.points_earned && selectedOrder.points_earned > 0 && (
                                <div className="bg-purple-50 rounded-xl p-4 flex items-center gap-3 text-purple-700">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                                        <Award size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Você ganhou +{selectedOrder.points_earned} pontos!</p>
                                        <p className="text-xs text-purple-600/80">Continue comprando para ganhar mais recompensas.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerOrders;
