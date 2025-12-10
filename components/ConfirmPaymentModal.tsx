import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, CreditCard, Banknote, X, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { Order, PaymentMethod } from '../types';
import { useApp } from '../contexts/AppContext';

interface ConfirmPaymentModalProps {
    order: Order;
    onConfirm: (paymentMethod: PaymentMethod, cashRegisterId: string | null) => void;
    onCancel: () => void;
}

const ConfirmPaymentModal: React.FC<ConfirmPaymentModalProps> = ({ order, onConfirm, onCancel }) => {
    const { activeCashRegisterId } = useApp();
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
        (order.paymentMethod as PaymentMethod) || 'money'
    );
    // Warning state if method is money but no cash register is valid
    const showRegisterWarning = selectedMethod === 'money' && !activeCashRegisterId;

    const handleConfirm = () => {
        if (showRegisterWarning && !window.confirm('Nenhum caixa aberto! O pagamento em dinheiro não será registrado no fluxo de caixa. Deseja continuar mesmo assim?')) {
            return;
        }
        onConfirm(selectedMethod, activeCashRegisterId);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
                {/* Header */}
                <div className="bg-green-50 p-6 border-b border-green-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-black text-green-800">Confirmar Pagamento</h2>
                            <p className="text-sm text-green-600 mt-1">Finalizar pedido #{order.id.slice(0, 6)}</p>
                        </div>
                        <div className="bg-white p-2 rounded-full shadow-sm">
                            <DollarSign className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Amount Display */}
                    <div className="text-center">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">Valor a Receber</p>
                        <p className="text-4xl font-black text-gray-900 mt-1">{formatCurrency(order.totalAmount)}</p>
                    </div>

                    {/* Method Selection */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Forma de Pagamento</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'money', label: 'Dinheiro', icon: Banknote },
                                { id: 'pix', label: 'PIX', icon: AlertTriangle }, // Update Icon later if needed
                                { id: 'cartao_credito', label: 'Crédito', icon: CreditCard },
                                { id: 'cartao_debito', label: 'Débito', icon: CreditCard },
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id as PaymentMethod)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${selectedMethod === method.id
                                            ? 'border-green-500 bg-green-50 text-green-700'
                                            : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    <method.icon size={20} className="mb-1" />
                                    <span className="text-xs font-bold">{method.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Warning Box */}
                    {showRegisterWarning && (
                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-3">
                            <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                <h4 className="font-bold text-amber-800 text-sm">Atenção: Nenhum Caixa Aberto</h4>
                                <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                                    O valor em dinheiro não será somado ao fechamento do dia se não houver um caixa aberto.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                    >
                        <CheckCircle size={20} />
                        Confirmar Pagamento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmPaymentModal;
