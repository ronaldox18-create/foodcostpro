import React, { useState, useMemo, useEffect } from 'react';
import {
    CreditCard, Banknote, Smartphone, DollarSign,
    X, Plus, Percent, Award, Gift, Check, AlertCircle, Receipt, Calculator, ShoppingCart, Music
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
        tip: number,
        couvert: number
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
    const [couvert, setCouvert] = useState(0);

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

    // Reset ao abrir
    useEffect(() => {
        if (isOpen) {
            setPayments([]);
            setDiscount(0);
            setServiceCharge(0);
            setTip(0);
            setCouvert(0);
            setCashGiven('');
            setCurrentAmount('');
        }
    }, [isOpen]);

    // Calcular totais
    const subtotal = cartTotal;

    const discountValue = useMemo(() => {
        if (discountType === 'percent') {
            return (subtotal * discount) / 100;
        }
        return discount;
    }, [discount, discountType, subtotal]);

    const serviceChargeValue = (subtotal * serviceCharge) / 100;

    const finalTotal = subtotal + serviceChargeValue + tip + couvert - discountValue;

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, finalTotal - totalPaid);
    // Calcular troco baseado no total final ou no restante
    const cashValue = parseFloat(cashGiven || '0');
    // Se ainda não pagou tudo, o troco é sobre o que falta. Se já pagou, não faz sentido (mas o modal bloqueia).
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
        if (totalPaid < finalTotal - 0.01) { // Tolerância de 1 centavo
            alert('Pagamento incompleto! Falta: R$ ' + (finalTotal - totalPaid).toFixed(2));
            return;
        }

        onConfirm(payments, selectedCustomer, discountValue, serviceCharge, tip, couvert);
    };

    const loyaltyDiscountPercent = selectedCustomer?.currentLevel ? 10 : 0;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col">
                {/* Header Premium */}
                <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 p-6 flex items-center justify-between z-10 shrink-0">
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

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Resumo do Pedido */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border border-gray-200">
                        <h3 className="text-gray-900 font-bold mb-4 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-orange-600" />
                            Resumo do Pedido
                        </h3>
                        <div className="flex justify-between text-gray-900 font-bold text-lg border-b border-gray-300 pb-2 mb-2">
                            <span>Subtotal Itens:</span>
                            <span>R$ {subtotal.toFixed(2)}</span>
                        </div>
                        {/* Lista minimizada se quiser */}
                    </div>

                    {/* Descontos e Taxas (Grid 2x2 em Desktop) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDiscountType('value')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold ${discountType === 'value' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                                    >R$</button>
                                    <button
                                        type="button"
                                        onClick={() => setDiscountType('percent')}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold ${discountType === 'percent' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                                    >%</button>
                                </div>
                            </div>
                            {discount > 0 && <p className="text-red-600 font-bold text-sm mt-2">- R$ {discountValue.toFixed(2)}</p>}
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
                                onChange={(e) => setServiceCharge(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            {serviceCharge > 0 && <p className="text-green-600 font-bold text-sm mt-2">+ R$ {serviceChargeValue.toFixed(2)}</p>}
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
                                onChange={(e) => setTip(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            {tip > 0 && <p className="text-green-600 font-bold text-sm mt-2">+ R$ {tip.toFixed(2)}</p>}
                        </div>

                        {/* Couvert */}
                        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                            <label className="text-gray-700 text-sm font-semibold mb-3 flex items-center gap-2">
                                <Music className="w-4 h-4 text-pink-600" />
                                Couvert (Total R$)
                            </label>
                            <input
                                type="number"
                                value={couvert}
                                onChange={(e) => setCouvert(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            {couvert > 0 && <p className="text-pink-600 font-bold text-sm mt-2">+ R$ {couvert.toFixed(2)}</p>}
                        </div>
                    </div>

                    {/* Total Final DESTAQUE */}
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 shadow-xl text-white">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="text-lg font-semibold opacity-90 mb-1">Total a Pagar</h3>
                                <div className="text-5xl font-black tracking-tight drop-shadow-md">
                                    R$ {finalTotal.toFixed(2)}
                                </div>
                            </div>

                            {totalPaid > 0 && (
                                <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 min-w-[200px] w-full md:w-auto">
                                    <div className="flex justify-between mb-1">
                                        <span>Pago:</span>
                                        <span className="font-bold">R$ {totalPaid.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t border-white/30 pt-1 mt-1">
                                        <span>Restante:</span>
                                        <span className={remaining === 0 ? 'text-green-300' : 'text-yellow-300'}>
                                            R$ {remaining.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Área de Pagamento (Métodos e Input) */}
                    <div className="space-y-4">
                        {/* Seleção de Método */}
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {paymentMethods.map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setCurrentMethod(method.id)}
                                    className={`flex-1 min-w-[100px] p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${currentMethod === method.id
                                        ? 'border-orange-500 bg-orange-50 shadow-md transform scale-105'
                                        : 'border-gray-200 bg-white hover:bg-gray-50'
                                        }`}
                                >
                                    {React.createElement(method.icon, {
                                        className: `w-6 h-6 ${currentMethod === method.id ? 'text-orange-600' : 'text-gray-400'}`
                                    })}
                                    <span className={`text-sm font-bold ${currentMethod === method.id ? 'text-orange-900' : 'text-gray-500'}`}>
                                        {method.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Input Valor e Botão Adicionar */}
                        <div className="flex flex-col md:flex-row gap-4 items-stretch">
                            {/* Input Dinheiro Especial */}
                            {currentMethod === 'money' ? (
                                <div className="flex-1 bg-green-50 border-2 border-green-200 rounded-xl p-4">
                                    <label className="text-xs font-bold text-green-700 uppercase mb-2 block">Valor Recebido</label>
                                    <div className="flex gap-3 mb-3">
                                        {[50, 100, 200].map(val => (
                                            <button key={val} onClick={() => setCashGiven(val.toString())} className="bg-white border border-green-200 text-green-700 font-bold py-1 px-3 rounded hover:bg-green-100">
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-4">
                                        <input
                                            type="number"
                                            placeholder="R$ 0,00"
                                            value={cashGiven}
                                            onChange={(e) => setCashGiven(e.target.value)}
                                            className="flex-1 text-2xl font-bold bg-white border border-green-300 rounded-lg px-4 py-2 text-green-900 focus:ring-2 focus:ring-green-500 outline-none"
                                        />
                                        {remaining > 0 && (
                                            <button
                                                onClick={() => {
                                                    const cashVal = parseFloat(cashGiven);
                                                    if (isNaN(cashVal) || cashVal <= 0) {
                                                        alert('Digite um valor válido');
                                                        return;
                                                    }
                                                    // Registra apenas o necessário para quitar (ou o valor parcial se for menor)
                                                    const amountToRegister = Math.min(cashVal, remaining);
                                                    setPayments([...payments, { method: 'money', amount: amountToRegister }]);
                                                    setCashGiven('');
                                                }}
                                                className="bg-green-600 text-white font-bold px-6 rounded-lg hover:bg-green-700 shadow-lg shadow-green-200"
                                            >
                                                Confirmar
                                            </button>
                                        )}
                                    </div>
                                    {/* Troco Visual */}
                                    {cashGiven && parseFloat(cashGiven) > (remaining || finalTotal) && (
                                        <div className="mt-3 text-right">
                                            <span className="text-sm text-green-700 font-bold uppercase">Troco: </span>
                                            <span className="text-2xl font-black text-green-600">
                                                R$ {(parseFloat(cashGiven) - (payments.length > 0 ? remaining : finalTotal)).toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex gap-3">
                                    <div className="relative flex-1">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                                        <input
                                            type="number"
                                            placeholder="0,00"
                                            value={currentAmount}
                                            onChange={(e) => setCurrentAmount(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                                            className="w-full h-full pl-12 pr-4 text-2xl font-bold bg-white border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 outline-none transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={addPayment}
                                        disabled={!currentAmount}
                                        className="bg-gray-900 text-white font-bold px-8 rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            )}

                            {/* Botão Pagar Restante Rápido */}
                            {remaining > 0 && currentMethod !== 'money' && (
                                <button
                                    onClick={() => payFullWithMethod(currentMethod)}
                                    className="bg-orange-100 text-orange-700 font-bold px-6 py-4 rounded-xl hover:bg-orange-200 transition-colors whitespace-nowrap"
                                >
                                    Pagar Restante
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Lista de Pagamentos */}
                    {payments.length > 0 && (
                        <div className="space-y-2">
                            {payments.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                                            {React.createElement(paymentMethods.find(m => m.id === p.method)?.icon || CreditCard, { size: 16 })}
                                        </div>
                                        <span className="font-bold text-gray-700 capitalize">{paymentMethods.find(m => m.id === p.method)?.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-gray-900">R$ {p.amount.toFixed(2)}</span>
                                        <button onClick={() => removePayment(idx)} className="text-red-500 hover:text-red-700"><X size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-3xl sticky bottom-0 z-10 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={remaining > 0.01}
                        className="flex-[2] py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-green-200 flex items-center justify-center gap-2"
                    >
                        <Check size={20} />
                        Confirmar Pagamento
                    </button>
                </div>
            </div>
        </div>
    );
};

export default POSPaymentModal;
