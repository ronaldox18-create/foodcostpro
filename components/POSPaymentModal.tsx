import React, { useState, useMemo, useEffect } from 'react';
import {
    CreditCard, Banknote, Smartphone, DollarSign,
    X, Plus, Percent, Award, Gift, Check, AlertCircle, Receipt, Calculator, ShoppingCart, Music,
    ChevronDown, ChevronUp
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
    const [showExtras, setShowExtras] = useState(false);

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

    // Atalho: Pagar restante com método selecionado
    const payRemainingWithMethod = (method: PaymentMethod) => {
        if (remaining <= 0) return;
        setPayments([...payments, { method, amount: remaining }]);
        setCurrentAmount('');
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

                    {/* 1. Total Final DESTAQUE (Moved to top) */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl text-white">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 className="text-gray-400 font-medium mb-1 uppercase text-xs tracking-wider">Total a Pagar</h3>
                                <div className="text-5xl font-black tracking-tight drop-shadow-md">
                                    R$ {finalTotal.toFixed(2)}
                                </div>
                            </div>

                            {totalPaid > 0 && (
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 min-w-[200px] w-full md:w-auto border border-white/10">
                                    <div className="flex justify-between mb-1 text-gray-300 text-sm">
                                        <span>Pago:</span>
                                        <span className="font-bold text-white">R$ {totalPaid.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t border-white/10 pt-2 mt-1">
                                        <span>Restante:</span>
                                        <span className={remaining === 0 ? 'text-green-400' : 'text-yellow-400'}>
                                            R$ {remaining.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Seleção de Método (More compact) */}
                    <div>
                        <h3 className="text-gray-900 font-bold mb-3 flex items-center gap-2 text-sm">
                            Selecione a Forma de Pagamento
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {paymentMethods.map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => setCurrentMethod(method.id)}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${currentMethod === method.id
                                        ? 'border-orange-500 bg-orange-50 shadow-md transform scale-[1.02]'
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
                    </div>

                    {/* 3. Área de Pagamento (Input) */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                        {currentMethod === 'money' ? (
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Sugestões</label>
                                        <div className="flex gap-2">
                                            {[50, 100, 200].map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => setCashGiven(val.toString())}
                                                    className="flex-1 bg-green-50 border border-green-200 text-green-700 font-bold py-2 rounded-lg hover:bg-green-100 transition-colors"
                                                >
                                                    {val}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Valor Recebido</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                            <input
                                                type="number"
                                                placeholder="0,00"
                                                value={cashGiven}
                                                onChange={(e) => setCashGiven(e.target.value)}
                                                className="w-full text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {remaining > 0 && (
                                    <button
                                        onClick={() => {
                                            const cashVal = parseFloat(cashGiven);
                                            if (isNaN(cashVal) || cashVal <= 0) {
                                                alert('Digite um valor válido');
                                                return;
                                            }
                                            const amountToRegister = Math.min(cashVal, remaining);
                                            setPayments([...payments, { method: 'money', amount: amountToRegister }]);
                                            setCashGiven('');
                                        }}
                                        className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-100 active:scale-[0.98] transition-all"
                                    >
                                        Confirmar Pagamento em Dinheiro
                                    </button>
                                )}

                                {/* Troco Visual */}
                                {cashGiven && parseFloat(cashGiven) > (payments.length > 0 ? remaining : finalTotal) && (
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-200 flex justify-between items-center">
                                        <span className="text-green-800 font-bold uppercase text-sm">Troco a Devolver</span>
                                        <span className="text-3xl font-black text-green-600">
                                            R$ {(parseFloat(cashGiven) - (payments.length > 0 ? remaining : finalTotal)).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <div className="relative flex-1 w-full">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                                    <input
                                        type="number"
                                        placeholder={remaining.toFixed(2)}
                                        value={currentAmount}
                                        onChange={(e) => setCurrentAmount(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                                        className="w-full pl-12 pr-4 py-3 text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                                    />
                                </div>
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <button
                                        onClick={addPayment}
                                        disabled={!currentAmount}
                                        className="flex-1 sm:flex-none bg-gray-900 text-white font-bold px-8 py-3 rounded-xl hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Adicionar
                                    </button>
                                    {remaining > 0 && (
                                        <button
                                            onClick={() => payRemainingWithMethod(currentMethod)}
                                            className="flex-1 sm:flex-none bg-orange-100 text-orange-700 font-bold px-6 py-3 rounded-xl hover:bg-orange-200 transition-colors whitespace-nowrap"
                                        >
                                            Valor Restante
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 4. Lista de Pagamentos Já Efetuados */}
                    {payments.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-gray-900 font-bold text-sm">Pagamentos Adicionados</h3>
                            {payments.map((p, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-gray-200 shadow-sm text-gray-600">
                                            {React.createElement(paymentMethods.find(m => m.id === p.method)?.icon || CreditCard, { size: 20 })}
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-800 capitalize block leading-tight">{paymentMethods.find(m => m.id === p.method)?.name}</span>
                                            <span className="text-xs text-gray-500">Registrado</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-gray-900 text-lg">R$ {p.amount.toFixed(2)}</span>
                                        <button onClick={() => removePayment(idx)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors">
                                            <X size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 5. Descontos e Taxas (Collapsible at bottom) */}
                    <div className="border-t border-gray-200 pt-4">
                        <button
                            onClick={() => setShowExtras(!showExtras)}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg border border-gray-200 text-orange-600 group-hover:border-orange-200 transition-colors">
                                    <Percent size={18} />
                                </div>
                                <div className="text-left">
                                    <span className="font-bold text-gray-700 block">Descontos e Taxas Adicionais</span>
                                    <span className="text-xs text-gray-500">Serviço, Gorjeta, Couvert, Descontos manuais</span>
                                </div>
                            </div>
                            {showExtras ? <ChevronUp className="text-gray-400" /> : <ChevronDown className="text-gray-400" />}
                        </button>

                        {showExtras && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Resumo Original</label>
                                    <div className="flex justify-between text-gray-900 font-bold mb-1">
                                        <span>Subtotal Itens:</span>
                                        <span>R$ {subtotal.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Desconto */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block text-red-600">Desconto</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-100"
                                        />
                                        <div className="flex bg-gray-100 rounded-lg p-1">
                                            <button
                                                type="button"
                                                onClick={() => setDiscountType('value')}
                                                className={`px-3 rounded-md text-xs font-bold transition-all ${discountType === 'value' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                                            >R$</button>
                                            <button
                                                type="button"
                                                onClick={() => setDiscountType('percent')}
                                                className={`px-3 rounded-md text-xs font-bold transition-all ${discountType === 'percent' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                                            >%</button>
                                        </div>
                                    </div>
                                    {discount > 0 && <p className="text-red-600 font-bold text-xs mt-1 text-right">- R$ {discountValue.toFixed(2)}</p>}
                                </div>

                                {/* Taxa Serviço */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block text-blue-600">Taxa de Serviço (%)</label>
                                    <input
                                        type="number"
                                        value={serviceCharge}
                                        onChange={(e) => setServiceCharge(Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                    {serviceCharge > 0 && <p className="text-blue-600 font-bold text-xs mt-1 text-right">+ R$ {serviceChargeValue.toFixed(2)}</p>}
                                </div>

                                {/* Gorjeta */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block text-purple-600">Gorjeta (R$)</label>
                                    <input
                                        type="number"
                                        value={tip}
                                        onChange={(e) => setTip(Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-100"
                                    />
                                </div>

                                {/* Couvert */}
                                <div className="bg-white rounded-xl p-4 border border-gray-200">
                                    <label className="text-xs font-bold text-gray-500 uppercase mb-2 block text-pink-600">Couvert (Total R$)</label>
                                    <input
                                        type="number"
                                        value={couvert}
                                        onChange={(e) => setCouvert(Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-100"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
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
