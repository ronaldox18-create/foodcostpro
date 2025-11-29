import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { formatCurrency } from '../../utils/calculations';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

interface Order {
    id: string;
    total_amount: number;
    status: string;
}

const CustomerOrders: React.FC = () => {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
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
                    .select('*')
                    .eq('customer_id', customer.id);

                if (error) throw error;
                setOrders(data || []);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [storeId, navigate]);

    const getStatusInfo = (status: string) => {
        const statusMap: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
            pending: { label: 'Pendente', icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
            confirmed: { label: 'Confirmado', icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
            preparing: { label: 'Preparando', icon: Package, color: 'text-orange-600', bgColor: 'bg-orange-100' },
            ready: { label: 'Pronto', icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
            delivered: { label: 'Entregue', icon: Truck, color: 'text-gray-600', bgColor: 'bg-gray-100' },
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
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
                <div className="p-4 flex items-center gap-3">
                    <button onClick={() => navigate(`/menu/${storeId}`)} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center active:bg-gray-200">
                        <ArrowLeft size={18} />
                    </button>
                    <h1 className="text-xl font-black text-gray-900">Meus Pedidos</h1>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {orders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <Package size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-400 font-medium">Nenhum pedido ainda</p>
                        <p className="text-gray-400 text-sm mt-1">Faça seu primeiro pedido!</p>
                        <button onClick={() => navigate(`/menu/${storeId}`)} className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-xl font-bold text-sm active:bg-black">
                            Ver Cardápio
                        </button>
                    </div>
                ) : (
                    orders.map(order => {
                        const statusInfo = getStatusInfo(order.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Pedido #{order.id.slice(0, 8)}</p>
                                        <p className="text-xs text-gray-600">Aguardando confirmação</p>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${statusInfo.bgColor} ${statusInfo.color} px-3 py-1.5 rounded-full`}>
                                        <StatusIcon size={14} />
                                        <span className="text-xs font-bold">{statusInfo.label}</span>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50 flex justify-between items-center">
                                    <span className="text-sm font-bold text-gray-600">Total</span>
                                    <span className="text-xl font-black text-gray-900">{formatCurrency(order.total_amount)}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CustomerOrders;
