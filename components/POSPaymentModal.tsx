import React, { useState, useMemo, useEffect } from 'react';
import {
    CreditCard, Banknote, Smartphone, DollarSign,
    X, Plus, Percent, Award, Gift, Check, AlertCircle, Receipt, Calculator, ShoppingCart
} from 'lucide-react';
import { POSPayment, PaymentMethod, Customer, OrderItem } from '../types';

interface POSPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    cartTotal: number;
    cart: OrderItem[];
    selectedCustomer: Customer | null;
    onConfirm: (
        payments: POSPayment[],
        customer: Customer | null,
        discount: number,
        serviceCharge: number,
        tip: number
    ) => void;
}

const POSPaymentModal: React.FC<POSPaymentModalProps> = ({
    isOpen,
    onClose,
    cartTotal,
    cart,
    selectedCustomer,
    onConfirm
}) => {
    const [payments, setPayments] = useState<POSPayment[]>([]);
    const [currentMethod, setCurrentMethod] = useState<PaymentMethod>('money');
    const [currentAmount, setCurrentAmount] = useState('');

    // Descontos e taxas
    const [discount, setDiscount] = useState(0);
    const [discountType, setDiscountType] = useState<'percent' | 'value'>('value');
    const [serviceCharge, setServiceCharge] = useState(0);
    const [tip, setTip] = useState(0);

    // Fidelidade
    const [useLoyaltyDiscount, setUseLoyaltyDiscount] = useState(false);
    const [loyaltyPointsToUse, setLoyaltyPointsToUse] = useState(0);

    // Dinheiro
    const [cashGiven, setCashGiven] = useState('');

    const paymentMethods: { id: PaymentMethod; name: string; icon: any; color: string }[] = [
        { id: 'money', name: 'Dinheiro', icon: Banknote, color: 'from-green-500 to-emerald-600' },
        { id: 'credit', name: 'Crédito', icon: CreditCard, color: 'from-blue-500 to-cyan-600' },
        { id: 'debit', name: 'Débito', icon: CreditCard, color: 'from-purple-500 to-pink-600' },
        { id: 'pix', name: 'PIX', icon: Smartphone, color: 'from-teal-500 to-green-600' }
    ];

    // Calcular totais
    const subtotal = cartTotal;

    const discountValue = useMemo(() => {
        if (discountType === 'percent') {
            return (subtotal * discount) / 100;
        }
        return discount;
    }, [discount, discountType, subtotal]);

    const serviceChargeValue = (subtotal * serviceCharge) / 100;

    const finalTotal = subtotal + serviceChargeValue + tip - discountValue;

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, finalTotal - totalPaid);
    // Calcular troco baseado no total final ou no restante
    const cashValue = parseFloat(cashGiven || '0');
    const amountToPay = payments.length > 0 ? remaining : finalTotal;
    const change = currentMethod === 'money' && cashGiven && cashValue > 0 ?
        Math.max(0, cashValue - amountToPay) : 0;

    // Adicionar pagamento
    const addPayment = () => {
        const amount = parseFloat(currentAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Digite um valor válido');
            return;
        }

        if (amount > remaining) {
            setPayments([...payments, { method: currentMethod, amount: remaining }]);
            setCurrentAmount('');
            return;
        }

        setPayments([...payments, { method: currentMethod, amount }]);
        setCurrentAmount('');
    };

    // Remover pagamento
    const removePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    // Atalho: Pagar total com método selecionado
    const payFullWithMethod = (method: PaymentMethod) => {
        setPayments([{ method, amount: finalTotal }]);
    };

    // Confirmar
    const handleConfirm = () => {
        if (totalPaid < finalTotal) {
            alert('Pagamento incompleto! Falta: R$ ' + (finalTotal - totalPaid).toFixed(2));
            return;
        }

        onConfirm(payments, selectedCustomer, discountValue, serviceCharge, tip);
    };

    // Sugestões de desconto de fidelidade
    const loyaltyDiscountPercent = selectedCustomer?.currentLevel ? 10 : 0;
    const maxLoyaltyDiscount = (subtotal * loyaltyDiscountPercent) / 100;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100">
                {/* Header Premium */}
                <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 p-6 flex items-center justify-between z-10 rounded-t-3xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                            <Receipt className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">Finalizar Pagamento</h2>
                            <p className="text-white/90">
                                {selectedCustomer ? selectedCustomer.name : 'Cliente Balcão'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* v2.0 - Resumo do Pedido - ÚNICO */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200">
                        <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-orange-600" />
                            Resumo do Pedido
                        </h3>
                        <div className="space-y-2">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-gray-700">
                                    <span className="font-medium">{item.quantity}x {item.productName}</span>
                                    <span className="font-semibold">R$ {item.total.toFixed(2)}</span>
                                </div>
                            ))}
                            <div className="border-t border-gray-300 pt-3 mt-3 flex justify-between text-gray-900 font-bold text-lg">
                                <span>Subtotal:</span>
                                <span>R$ {subtotal.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Descontos e Taxas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Desconto */}
                        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                            <label className="text-gray-700 text-sm font-semibold mb-3 flex items-center gap-2">
                                <Percent className="w-4 h-4 text-red-600" />
                                Desconto
                            </label>
                            <div className="space-y-2">
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDiscountType('value')}
                                        className={`flex-1 py-2 rounded-lg font-semibold transition-all ${discountType === 'value'
                                            ? 'bg-orange-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        R$
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDiscountType('percent')}
                                        className={`flex-1 py-2 rounded-lg font-semibold transition-all ${discountType === 'percent'
                                            ? 'bg-orange-500 text-white shadow-md'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        %
                                    </button>
                                </div>
                            </div>
                            {discount > 0 && (
                                <p className="text-red-600 font-semibold text-sm mt-2">
                                    - R$ {discountValue.toFixed(2)}
                                </p>
                            )}
                        </div>

                        {/* Taxa de Serviço */}
                        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                            <label className="text-gray-700 text-sm font-semibold mb-3 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-blue-600" />
                                Taxa Serviço (%)
                            </label>
                            <input
                                type="number"
                                value={serviceCharge}
                                onChange={(e) => setServiceCharge(parseFloat(e.target.value) || 0)}
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            {serviceCharge > 0 && (
                                <p className="text-green-600 font-semibold text-sm mt-2">
                                    + R$ {serviceChargeValue.toFixed(2)}
                                </p>
                            )}
                        </div>

                        {/* Gorjeta */}
                        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                            <label className="text-gray-700 text-sm font-semibold mb-3 flex items-center gap-2">
                                <Gift className="w-4 h-4 text-purple-600" />
                                Gorjeta (R$)
                            </label>
                            <input
                                type="number"
                                value={tip}
                                onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            {tip > 0 && (
                                <p className="text-green-600 font-semibold text-sm mt-2">
                                    + R$ {tip.toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Fidelidade */}
                    {selectedCustomer && loyaltyDiscountPercent > 0 && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border-2 border-amber-300">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-amber-500 rounded-xl">
                                    <Award className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-900 font-bold">Desconto Fidelidade</p>
                                    <p className="text-gray-700 text-sm">
                                        {loyaltyDiscountPercent}% de desconto disponível
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setUseLoyaltyDiscount(!useLoyaltyDiscount);
                                    if (!useLoyaltyDiscount) {
                                        setDiscount(loyaltyDiscountPercent);
                                        setDiscountType('percent');
                                    } else {
                                        setDiscount(0);
                                    }
                                }}
                                className={`w-full py-3 rounded-xl font-semibold transition-all ${useLoyaltyDiscount
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                                    : 'bg-white border-2 border-amber-300 text-amber-700 hover:bg-amber-50'
                                    }`}
                            >
                                {useLoyaltyDiscount ? '✓ Desconto Aplicado' : 'Aplicar Desconto'}
                            </button>
                        </div>
                    )}

                    {/* Total Final DESTAQUE */}
                    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Calculator className="w-6 h-6 text-white" />
                                <span className="text-white/90 text-lg font-semibold">Total a Pagar:</span>
                            </div>
                            <span className="text-5xl font-bold text-white drop-shadow-lg">
                                R$ {finalTotal.toFixed(2)}
                            </span>
                        </div>

                        {totalPaid > 0 && (
                            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-white">
                                    <span>Pago:</span>
                                    <span className="font-bold">R$ {totalPaid.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-white font-bold text-lg">
                                    <span>Restante:</span>
                                    <span className={remaining > 0 ? 'text-yellow-300' : 'text-green-300'}>
                                        R$ {remaining.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Métodos de Pagamento */}
                    <div>
                        <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-orange-600" />
                            Forma de Pagamento
                        </h3>

                        {/* Seleção de Método */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {paymentMethods.map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setCurrentMethod(method.id)}
                                    className={`p-4 rounded-xl border-2 transition-all ${currentMethod === method.id
                                        ? 'border-orange-500 bg-orange-50 shadow-md'
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    <method.icon className={`w-8 h-8 mx-auto mb-2 ${currentMethod === method.id ? 'text-orange-600' : 'text-gray-600'
                                        }`} />
                                    <p className={`text-sm font-semibold ${currentMethod === method.id ? 'text-orange-600' : 'text-gray-700'
                                        }`}>
                                        {method.name}
                                    </p>
                                </button>
                            ))}
                        </div>

                        {/* Atalhos de Pagamento Rápido */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            {paymentMethods.map(method => (
                                <button
                                    key={`quick-${method.id}`}
                                    onClick={() => payFullWithMethod(method.id)}
                                    disabled={remaining === 0}
                                    className={`p-3 rounded-xl bg-gradient-to-r ${method.color} text-white font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm`}
                                >
                                    Pagar tudo em {method.name}
                                </button>
                            ))}
                        </div>

                        {/* Adicionar Pagamento Parcial */}
                        {remaining > 0 && (
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div className="flex gap-3">
                                    <input
                                        type="number"
                                        placeholder="Valor parcial"
                                        value={currentAmount}
                                        onChange={(e) => setCurrentAmount(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addPayment()}
                                        className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={addPayment}
                                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Adicionar
                                    </button>
                                </div>
                                <p className="text-gray-600 text-sm mt-2">
                                    Método selecionado: <span className="text-gray-900 font-semibold">
                                        {paymentMethods.find(m => m.id === currentMethod)?.name}
                                    </span>
                                </p>
                            </div>
                        )}

                        {/* Dinheiro - Campo de Troco MELHORADO */}
                        {currentMethod === 'money' && remaining > 0 && (
                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-300 mt-4">
                                <label className="text-gray-900 font-bold mb-3 block flex items-center gap-2">
                                    <Banknote className="w-5 h-5 text-green-600" />
                                    Dinheiro Recebido do Cliente:
                                </label>

                                {/* Valor a pagar */}
                                <div className="mb-3 p-3 bg-white rounded-lg border border-green-200">
                                    <p className="text-gray-600 text-sm">Valor a pagar:</p>
                                    <p className="text-gray-900 font-bold text-xl">
                                        R$ {(payments.length > 0 ? remaining : finalTotal).toFixed(2)}
                                    </p>
                                </div>

                                {/* Botões de atalho */}
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    <button
                                        type="button"
                                        onClick={() => setCashGiven('50')}
                                        className="py-2 bg-white border-2 border-green-300 rounded-lg font-semibold text-gray-700 hover:bg-green-50 hover:border-green-400 transition-all"
                                    >
                                        R$ 50
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCashGiven('100')}
                                        className="py-2 bg-white border-2 border-green-300 rounded-lg font-semibold text-gray-700 hover:bg-green-50 hover:border-green-400 transition-all"
                                    >
                                        R$ 100
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCashGiven('200')}
                                        className="py-2 bg-white border-2 border-green-300 rounded-lg font-semibold text-gray-700 hover:bg-green-50 hover:border-green-400 transition-all"
                                    >
                                        R$ 200
                                    </button>
                                </div>

                                {/* Input de valor */}
                                <input
                                    type="number"
                                    placeholder="Ou digite o valor exato"
                                    value={cashGiven}
                                    onChange={(e) => setCashGiven(e.target.value)}
                                    className="w-full bg-white border-2 border-green-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-xl font-bold"
                                />

                                {/* Mostrar troco */}
                                {cashGiven && parseFloat(cashGiven) > 0 && (
                                    <div className="mt-4">
                                        {change > 0 ? (
                                            <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg animate-pulse">
                                                <p className="text-white/80 text-sm mb-1">💰 Troco a devolver:</p>
                                                <p className="text-white font-bold text-3xl">
                                                    R$ {change.toFixed(2)}
                                                </p>
                                            </div>
                                        ) : change === 0 && cashValue >= (payments.length > 0 ? remaining : finalTotal) ? (
                                            <div className="p-4 bg-blue-500 rounded-xl">
                                                <p className="text-white font-bold text-lg flex items-center gap-2">
                                                    <Check className="w-5 h-5" />
                                                    Valor exato! Sem troco.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-amber-100 rounded-xl border-2 border-amber-300">
                                                <p className="text-amber-800 font-semibold flex items-center gap-2">
                                                    <AlertCircle className="w-5 h-5" />
                                                    Valor insuficiente! Falta R$ {(Math.abs(cashValue - (payments.length > 0 ? remaining : finalTotal))).toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Pagamentos Adicionados */}
                    {payments.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
                            <h3 className="text-gray-900 font-bold mb-4">Pagamentos Registrados:</h3>
                            <div className="space-y-2">
                                {payments.map((payment, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${paymentMethods.find(m => m.id === payment.method)?.color
                                                } flex items-center justify-center shadow-md`}>
                                                {React.createElement(
                                                    paymentMethods.find(m => m.id === payment.method)?.icon || CreditCard,
                                                    { className: 'w-5 h-5 text-white' }
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-gray-900 font-semibold">
                                                    {paymentMethods.find(m => m.id === payment.method)?.name}
                                                </p>
                                                <p className="text-gray-600 font-bold">
                                                    R$ {payment.amount.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removePayment(idx)}
                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Aviso se pagamento incompleto */}
                    {totalPaid > 0 && totalPaid < finalTotal && (
                        <div className="flex items-center gap-3 bg-yellow-50 rounded-xl p-4 border-2 border-yellow-300">
                            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                            <p className="text-yellow-900 font-semibold">
                                Ainda falta <strong className="text-lg">R$ {(finalTotal - totalPaid).toFixed(2)}</strong> para completar o pagamento.
                            </p>
                        </div>
                    )}

                    {/* Botões de Ação */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-2xl font-bold hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={totalPaid < finalTotal}
                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl font-bold hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            <Check className="w-6 h-6" />
                            Confirmar Pagamento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POSPaymentModal;
