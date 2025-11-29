import React from 'react';
import { Bell, X, User, Phone, CheckCircle, XCircle, ShoppingBag } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface OrderItem {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
}

interface Order {
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
    items?: OrderItem[];
}

interface NewOrderModalProps {
    order: Order;
    onAccept: () => void;
    onReject: () => void;
    onDismiss: () => void;
}

const NewOrderModal: React.FC<NewOrderModalProps> = ({ order, onAccept, onReject, onDismiss }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl animate-scale-up max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-6 relative flex-shrink-0">
                    <button
                        onClick={onDismiss}
                        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition backdrop-blur-sm"
                    >
                        <X size={20} className="text-white" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center animate-bounce">
                            <Bell size={32} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-white mb-1">🎉 Novo Pedido!</h2>
                            <p className="text-white/90 text-sm font-medium">Recebido agora mesmo</p>
                        </div>
                    </div>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Order ID */}
                    <div className="bg-yellow-50 border-2 border-yellow-200 p-3 rounded-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Pedido</span>
                            <span className="text-sm font-black text-yellow-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                            <User size={18} className="text-blue-600" />
                            <span className="text-xs font-bold text-blue-700 uppercase">Cliente</span>
                        </div>
                        <p className="text-lg font-black text-blue-900">{order.customer_name}</p>
                        {order.phone && (
                            <div className="flex items-center gap-2 mt-2 text-sm text-blue-700">
                                <Phone size={14} />
                                <span>{order.phone}</span>
                            </div>
                        )}
                    </div>

                    {/* Delivery Info */}
                    {order.delivery_type && (
                        <div className={`border p-4 rounded-xl ${order.delivery_type === 'delivery' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                {order.delivery_type === 'delivery' ? '🚚' : '🏪'}
                                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: order.delivery_type === 'delivery' ? '#059669' : '#4B5563' }}>
                                    {order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}
                                </span>
                            </div>
                            {order.delivery_type === 'delivery' && order.delivery_address && (
                                <p className="text-sm text-gray-700 mt-1">{order.delivery_address}</p>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl">
                            <span className="text-xs font-bold text-yellow-700 uppercase block mb-1">Observações</span>
                            <p className="text-sm text-gray-700">{order.notes}</p>
                        </div>
                    )}

                    {/* Order Items */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <ShoppingBag size={18} className="text-gray-600" />
                            <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Itens do Pedido</span>
                        </div>

                        {order.items && order.items.length > 0 ? (
                            <div className="space-y-2">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-black">
                                                    {item.quantity}
                                                </span>
                                                <span className="font-bold text-gray-900">{item.product_name}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 ml-8">
                                                {formatCurrency(item.price)} cada
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-gray-900">{formatCurrency(item.total)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-center">
                                <p className="text-sm text-gray-500">Detalhes dos itens não disponíveis</p>
                                <p className="text-xs text-gray-400 mt-1">(Execute a migration para ver os itens)</p>
                            </div>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className="flex items-center justify-between bg-purple-50 border border-purple-200 p-3 rounded-xl">
                        <span className="text-sm font-bold text-purple-700">Pagamento</span>
                        <span className="bg-purple-100 text-purple-900 px-3 py-1 rounded-full text-xs font-bold uppercase">
                            {{
                                'dinheiro': 'Dinheiro',
                                'pix': 'PIX',
                                'cartao_credito': 'Cartão de Crédito',
                                'cartao_debito': 'Cartão de Débito',
                                'pending': 'Pendente'
                            }[order.payment_method] || order.payment_method || 'A Definir'}
                        </span>
                    </div>

                    {/* Total */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 p-5 rounded-2xl">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-green-700 uppercase tracking-wide">Valor Total</span>
                            <span className="text-4xl font-black text-green-900">{formatCurrency(order.total_amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Modal Footer - Fixed */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex-shrink-0">
                    <div className="flex gap-3">
                        <button
                            onClick={onReject}
                            className="flex-1 bg-white hover:bg-red-50 border-2 border-red-200 text-red-700 hover:text-red-800 px-6 py-4 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-sm"
                        >
                            <XCircle size={22} />
                            Recusar
                        </button>
                        <button
                            onClick={onAccept}
                            className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-4 rounded-xl font-black transition flex items-center justify-center gap-2 shadow-xl text-lg"
                        >
                            <CheckCircle size={24} />
                            ACEITAR PEDIDO
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-500 mt-3">
                        ⏰ Responda rapidamente para melhor experiência do cliente
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NewOrderModal;
