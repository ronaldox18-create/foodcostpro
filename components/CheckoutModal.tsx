import React, { useState } from 'react';
import { Truck, ShoppingBag, CreditCard, Wallet, DollarSign, X, MapPin, Phone } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface CheckoutModalProps {
    cartTotal: number;
    onConfirm: (checkoutData: CheckoutData) => void;
    onClose: () => void;
    customerPhone?: string;
    customerAddress?: string;
}

export interface CheckoutData {
    deliveryType: 'delivery' | 'pickup';
    paymentMethod: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';
    deliveryAddress?: string;
    phone?: string;
    notes?: string;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
    cartTotal,
    onConfirm,
    onClose,
    customerPhone = '',
    customerAddress = ''
}) => {
    const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('pickup');
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [address, setAddress] = useState(customerAddress);
    const [phone, setPhone] = useState(customerPhone);
    const [notes, setNotes] = useState('');

    const deliveryFee = deliveryType === 'delivery' ? 5.00 : 0;
    const total = cartTotal + deliveryFee;

    const paymentMethods = [
        { id: 'dinheiro', label: 'Dinheiro', icon: DollarSign, color: 'green' },
        { id: 'pix', label: 'PIX', icon: DollarSign, color: 'blue' },
        { id: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard, color: 'purple' },
        { id: 'cartao_debito', label: 'Cartão de Débito', icon: Wallet, color: 'orange' },
    ];

    const handleConfirm = () => {
        if (!paymentMethod) {
            alert('Por favor, selecione uma forma de pagamento');
            return;
        }

        if (deliveryType === 'delivery' && !address.trim()) {
            alert('Por favor, informe o endereço de entrega');
            return;
        }

        if (!phone.trim()) {
            alert('Por favor, informe seu telefone para contato');
            return;
        }

        const checkoutData: CheckoutData = {
            deliveryType,
            paymentMethod: paymentMethod as any,
            phone: phone.trim(),
            notes: notes.trim()
        };

        if (deliveryType === 'delivery') {
            checkoutData.deliveryAddress = address.trim();
        }

        onConfirm(checkoutData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-end">
            <div className="bg-white w-full rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-t-3xl">
                    <div>
                        <h2 className="text-xl font-black text-white">Finalizar Pedido</h2>
                        <p className="text-white/90 text-sm">Complete as informações</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center active:bg-white/30">
                        <X size={20} className="text-white" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Delivery Type */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Tipo de Entrega</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDeliveryType('pickup')}
                                className={`p-4 rounded-xl border-2 transition-all ${deliveryType === 'pickup'
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-gray-200 bg-white'
                                    }`}
                            >
                                <ShoppingBag size={24} className={`mx-auto mb-2 ${deliveryType === 'pickup' ? 'text-orange-600' : 'text-gray-400'}`} />
                                <p className={`text-sm font-bold ${deliveryType === 'pickup' ? 'text-orange-700' : 'text-gray-600'}`}>Retirada</p>
                                <p className="text-xs text-gray-500 mt-1">Grátis</p>
                            </button>
                            <button
                                onClick={() => setDeliveryType('delivery')}
                                className={`p-4 rounded-xl border-2 transition-all ${deliveryType === 'delivery'
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-gray-200 bg-white'
                                    }`}
                            >
                                <Truck size={24} className={`mx-auto mb-2 ${deliveryType === 'delivery' ? 'text-orange-600' : 'text-gray-400'}`} />
                                <p className={`text-sm font-bold ${deliveryType === 'delivery' ? 'text-orange-700' : 'text-gray-600'}`}>Entrega</p>
                                <p className="text-xs text-gray-500 mt-1">+ {formatCurrency(deliveryFee)}</p>
                            </button>
                        </div>
                    </div>

                    {/* Delivery Address (if delivery) */}
                    {deliveryType === 'delivery' && (
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                                <MapPin size={16} />
                                Endereço de Entrega
                            </h3>
                            <textarea
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="Digite seu endereço completo (Rua, número, bairro, complemento...)"
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm resize-none"
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Phone */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide flex items-center gap-2">
                            <Phone size={16} />
                            Telefone para Contato
                        </h3>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(00) 00000-0000"
                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm"
                        />
                    </div>

                    {/* Payment Method */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Forma de Pagamento</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon;
                                const isSelected = paymentMethod === method.id;
                                return (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id)}
                                        className={`p-3 rounded-xl border-2 transition-all flex items-center gap-2 ${isSelected
                                            ? `border-${method.color}-500 bg-${method.color}-50`
                                            : 'border-gray-200 bg-white'
                                            }`}
                                    >
                                        <Icon size={20} className={isSelected ? `text-${method.color}-600` : 'text-gray-400'} />
                                        <span className={`text-xs font-bold ${isSelected ? `text-${method.color}-700` : 'text-gray-600'}`}>
                                            {method.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Observações (Opcional)</h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Sem cebola, ponto da carne bem passado..."
                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none text-sm resize-none"
                            rows={2}
                        />
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="p-4 border-t border-gray-200 space-y-3 bg-white flex-shrink-0 pb-32">
                    {/* Total Summary */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-bold text-gray-900">{formatCurrency(cartTotal)}</span>
                        </div>
                        {deliveryType === 'delivery' && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Taxa de Entrega</span>
                                <span className="font-bold text-gray-900">{formatCurrency(deliveryFee)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-sm font-bold text-gray-700">Total</span>
                            <span className="font-black text-2xl text-gray-900">{formatCurrency(total)}</span>
                        </div>
                    </div>

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirm}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-xl font-black text-base active:from-green-700 active:to-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        ✅ Confirmar Pedido
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutModal;
