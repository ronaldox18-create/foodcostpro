import React, { useState, useEffect } from 'react';
import {
    X, DollarSign, TrendingUp, TrendingDown,
    Lock, Unlock, Calculator, AlertCircle,
    CheckCircle, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { CashRegister, CashMovement } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';

interface CashRegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCashRegister: CashRegister | null;
    onCashRegisterOpened?: () => void;
    onCashRegisterClosed?: () => void;
}

const CashRegisterModal: React.FC<CashRegisterModalProps> = ({
    isOpen,
    onClose,
    currentCashRegister,
    onCashRegisterOpened,
    onCashRegisterClosed
}) => {
    const { user } = useAuth();
    const [mode, setMode] = useState<'open' | 'close' | 'movement' | 'view'>('view');

    // Abertura
    const [initialCash, setInitialCash] = useState('');
    const [operatorName, setOperatorName] = useState('');

    // Fechamento
    const [finalCash, setFinalCash] = useState('');
    const [closingStats, setClosingStats] = useState({
        totalSales: 0,
        totalCash: 0,
        totalCredit: 0,
        totalDebit: 0,
        totalPix: 0,
        withdrawals: 0,
        additions: 0,
        expectedCash: 0
    });

    // Movimento (Sangria/Reforço)
    const [movementType, setMovementType] = useState<'withdrawal' | 'addition'>('withdrawal');
    const [movementAmount, setMovementAmount] = useState('');
    const [movementReason, setMovementReason] = useState('');

    // Movimentos registrados
    const [movements, setMovements] = useState<CashMovement[]>([]);

    useEffect(() => {
        if (currentCashRegister) {
            setMode('view');
            loadClosingStats();
            loadMovements();
        } else {
            setMode('open');
        }
    }, [currentCashRegister]);

    const loadClosingStats = async () => {
        if (!currentCashRegister) return;

        // Buscar vendas do caixa
        const { data: sales } = await supabase
            .from('orders')
            .select('total_amount, payment_method')
            .eq('cash_register_id', currentCashRegister.id);

        // Buscar movimentos
        const { data: movs } = await supabase
            .from('cash_movements')
            .select('*')
            .eq('cash_register_id', currentCashRegister.id);

        const totalSales = sales?.reduce((sum, s) => sum + s.total_amount, 0) || 0;
        const totalCash = sales?.filter(s => s.payment_method === 'money')
            .reduce((sum, s) => sum + s.total_amount, 0) || 0;
        const totalCredit = sales?.filter(s => s.payment_method === 'credit')
            .reduce((sum, s) => sum + s.total_amount, 0) || 0;
        const totalDebit = sales?.filter(s => s.payment_method === 'debit')
            .reduce((sum, s) => sum + s.total_amount, 0) || 0;
        const totalPix = sales?.filter(s => s.payment_method === 'pix')
            .reduce((sum, s) => sum + s.total_amount, 0) || 0;

        const withdrawals = movs?.filter(m => m.type === 'withdrawal')
            .reduce((sum, m) => sum + m.amount, 0) || 0;
        const additions = movs?.filter(m => m.type === 'addition')
            .reduce((sum, m) => sum + m.amount, 0) || 0;

        const expectedCash = (currentCashRegister.initial_cash || currentCashRegister.initialCash || 0) + totalCash + additions - withdrawals;

        setClosingStats({
            totalSales,
            totalCash,
            totalCredit,
            totalDebit,
            totalPix,
            withdrawals,
            additions,
            expectedCash
        });
    };

    const loadMovements = async () => {
        if (!currentCashRegister) return;

        const { data } = await supabase
            .from('cash_movements')
            .select('*')
            .eq('cash_register_id', currentCashRegister.id)
            .order('created_at', { ascending: false });

        if (data) {
            setMovements(data as CashMovement[]);
        }
    };

    const handleOpenCashRegister = async () => {
        const initial = parseFloat(initialCash);
        if (isNaN(initial) || initial < 0) {
            alert('Digite um valor inicial válido!');
            return;
        }

        if (!operatorName.trim()) {
            alert('Digite o nome do operador!');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('cash_registers')
                .insert({
                    user_id: user?.id,
                    opened_by: operatorName,
                    opened_at: new Date().toISOString(),
                    initial_cash: initial,
                    status: 'open'
                })
                .select()
                .single();

            if (error) throw error;

            alert('✅ Caixa aberto com sucesso!');
            setInitialCash('');
            setOperatorName('');
            onCashRegisterOpened?.();
            onClose();
        } catch (error) {
            console.error('Erro ao abrir caixa:', error);
            alert('❌ Erro ao abrir caixa!');
        }
    };

    const handleCloseCashRegister = async () => {
        const final = parseFloat(finalCash);
        if (isNaN(final) || final < 0) {
            alert('Digite o valor final do caixa!');
            return;
        }

        if (!currentCashRegister) return;

        const difference = final - closingStats.expectedCash;

        try {
            const { error } = await supabase
                .from('cash_registers')
                .update({
                    closed_at: new Date().toISOString(),
                    final_cash: final,
                    expected_cash: closingStats.expectedCash,
                    difference: difference,
                    status: 'closed'
                })
                .eq('id', currentCashRegister.id);

            if (error) throw error;

            alert(`✅ Caixa fechado!\n\nDiferença: R$ ${difference.toFixed(2)}\n${difference > 0 ? '(Sobra)' : difference < 0 ? '(Falta)' : '(Exato)'
                }`);

            setFinalCash('');
            onCashRegisterClosed?.();
            onClose();
        } catch (error) {
            console.error('Erro ao fechar caixa:', error);
            alert('❌ Erro ao fechar caixa!');
        }
    };

    const handleAddMovement = async () => {
        const amount = parseFloat(movementAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Digite um valor válido!');
            return;
        }

        if (!movementReason.trim()) {
            alert('Digite o motivo da movimentação!');
            return;
        }

        if (!currentCashRegister) return;

        try {
            const { error } = await supabase
                .from('cash_movements')
                .insert({
                    user_id: user?.id,
                    cash_register_id: currentCashRegister.id,
                    type: movementType,
                    amount: amount,
                    reason: movementReason,
                    performed_by: currentCashRegister.opened_by || currentCashRegister.openedBy,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;

            alert(`✅ ${movementType === 'withdrawal' ? 'Sangria' : 'Reforço'} registrado!`);
            setMovementAmount('');
            setMovementReason('');
            loadMovements();
            loadClosingStats();
            setMode('view');
        } catch (error) {
            console.error('Erro ao registrar movimento:', error);
            alert('❌ Erro ao registrar movimento!');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
                {/* Header */}
                <div className={`sticky top-0 p-6 flex items-center justify-between border-b border-white/20 z-10 ${currentCashRegister
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600'
                    }`}>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                            {currentCashRegister ? (
                                <>
                                    <Unlock className="w-7 h-7" />
                                    Caixa Aberto
                                </>
                            ) : (
                                <>
                                    <Lock className="w-7 h-7" />
                                    Abrir Caixa
                                </>
                            )}
                        </h2>
                        {currentCashRegister && (
                            <p className="text-white/80">
                                Operador: {currentCashRegister.opened_by || currentCashRegister.openedBy} • Aberto às {new Date(currentCashRegister.opened_at || currentCashRegister.openedAt).toLocaleTimeString('pt-BR')}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                        <X className="w-6 h-6 text-white" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Modo: Abrir Caixa */}
                    {mode === 'open' && !currentCashRegister && (
                        <div className="space-y-4">
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <DollarSign className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-white text-xl font-bold text-center mb-6">
                                    Iniciar Novo Caixa
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-white/80 text-sm font-medium mb-2 block">
                                            Nome do Operador:
                                        </label>
                                        <input
                                            type="text"
                                            value={operatorName}
                                            onChange={(e) => setOperatorName(e.target.value)}
                                            placeholder="Digite seu nome"
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-white/80 text-sm font-medium mb-2 block">
                                            Valor Inicial do Caixa (R$):
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={initialCash}
                                            onChange={(e) => setInitialCash(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-amber-500"
                                        />
                                    </div>

                                    <button
                                        onClick={handleOpenCashRegister}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Unlock className="w-5 h-5" />
                                        Abrir Caixa
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modo: Visualizar Caixa */}
                    {mode === 'view' && currentCashRegister && (
                        <div className="space-y-4">
                            {/* Stats Resumo */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <p className="text-white/60 text-sm mb-1">Caixa Inicial</p>
                                    <p className="text-2xl font-bold text-white">
                                        R$ {(currentCashRegister.initial_cash || currentCashRegister.initialCash || 0).toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <p className="text-white/60 text-sm mb-1">Vendas Totais</p>
                                    <p className="text-2xl font-bold text-green-400">
                                        R$ {closingStats.totalSales.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Detalhamento por Forma de Pagamento */}
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                <h4 className="text-white font-semibold mb-3">Por Forma de Pagamento:</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-white/60 text-xs mb-1">Dinheiro</p>
                                        <p className="text-lg font-bold text-green-400">
                                            R$ {closingStats.totalCash.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-white/60 text-xs mb-1">Crédito</p>
                                        <p className="text-lg font-bold text-blue-400">
                                            R$ {closingStats.totalCredit.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-white/60 text-xs mb-1">Débito</p>
                                        <p className="text-lg font-bold text-purple-400">
                                            R$ {closingStats.totalDebit.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <p className="text-white/60 text-xs mb-1">PIX</p>
                                        <p className="text-lg font-bold text-teal-400">
                                            R$ {closingStats.totalPix.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Movimentações */}
                            {(closingStats.withdrawals > 0 || closingStats.additions > 0) && (
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <h4 className="text-white font-semibold mb-3">Movimentações:</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {closingStats.additions > 0 && (
                                            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
                                                <p className="text-green-400 text-xs mb-1 flex items-center gap-1">
                                                    <ArrowUpCircle className="w-3 h-3" />
                                                    Reforços
                                                </p>
                                                <p className="text-lg font-bold text-green-400">
                                                    + R$ {closingStats.additions.toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                        {closingStats.withdrawals > 0 && (
                                            <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/30">
                                                <p className="text-red-400 text-xs mb-1 flex items-center gap-1">
                                                    <ArrowDownCircle className="w-3 h-3" />
                                                    Sangrias
                                                </p>
                                                <p className="text-lg font-bold text-red-400">
                                                    - R$ {closingStats.withdrawals.toFixed(2)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Caixa Esperado */}
                            <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl p-4 border border-amber-500/30">
                                <div className="flex items-center gap-3">
                                    <Calculator className="w-8 h-8 text-amber-400" />
                                    <div>
                                        <p className="text-white/80 text-sm">Caixa Esperado (dinheiro):</p>
                                        <p className="text-3xl font-bold text-white">
                                            R$ {closingStats.expectedCash.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Histórico de Movimentos */}
                            {movements.length > 0 && (
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                    <h4 className="text-white font-semibold mb-3">Histórico:</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {movements.map(mov => (
                                            <div
                                                key={mov.id}
                                                className={`flex items-center justify-between p-2 rounded-lg ${mov.type === 'addition'
                                                    ? 'bg-green-500/10 border border-green-500/20'
                                                    : 'bg-red-500/10 border border-red-500/20'
                                                    }`}
                                            >
                                                <div>
                                                    <p className={`font-medium text-sm ${mov.type === 'addition' ? 'text-green-400' : 'text-red-400'
                                                        }`}>
                                                        {mov.type === 'addition' ? 'Reforço' : 'Sangria'}
                                                    </p>
                                                    <p className="text-white/60 text-xs">{mov.reason}</p>
                                                </div>
                                                <p className={`font-bold ${mov.type === 'addition' ? 'text-green-400' : 'text-red-400'
                                                    }`}>
                                                    {mov.type === 'addition' ? '+' : '-'} R$ {mov.amount.toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ações */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setMode('movement')}
                                    className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <TrendingUp className="w-5 h-5" />
                                    Sangria / Reforço
                                </button>
                                <button
                                    onClick={() => setMode('close')}
                                    className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Lock className="w-5 h-5" />
                                    Fechar Caixa
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Modo: Movimento (Sangria/Reforço) */}
                    {mode === 'movement' && currentCashRegister && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setMode('view')}
                                className="text-white/60 hover:text-white flex items-center gap-2 text-sm"
                            >
                                ← Voltar
                            </button>

                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <h3 className="text-white text-xl font-bold mb-4">
                                    Movimentação de Caixa
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-white/80 text-sm font-medium mb-2 block">
                                            Tipo de Movimentação:
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setMovementType('withdrawal')}
                                                className={`p-4 rounded-xl border-2 transition-all ${movementType === 'withdrawal'
                                                    ? 'border-red-500 bg-red-500/20'
                                                    : 'border-white/10 bg-white/5'
                                                    }`}
                                            >
                                                <ArrowDownCircle className={`w-8 h-8 mx-auto mb-2 ${movementType === 'withdrawal' ? 'text-red-400' : 'text-white/40'
                                                    }`} />
                                                <p className="text-white font-medium">Sangria</p>
                                                <p className="text-white/60 text-xs">Retirar dinheiro</p>
                                            </button>
                                            <button
                                                onClick={() => setMovementType('addition')}
                                                className={`p-4 rounded-xl border-2 transition-all ${movementType === 'addition'
                                                    ? 'border-green-500 bg-green-500/20'
                                                    : 'border-white/10 bg-white/5'
                                                    }`}
                                            >
                                                <ArrowUpCircle className={`w-8 h-8 mx-auto mb-2 ${movementType === 'addition' ? 'text-green-400' : 'text-white/40'
                                                    }`} />
                                                <p className="text-white font-medium">Reforço</p>
                                                <p className="text-white/60 text-xs">Adicionar dinheiro</p>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-white/80 text-sm font-medium mb-2 block">
                                            Valor (R$):
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={movementAmount}
                                            onChange={(e) => setMovementAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="text-white/80 text-sm font-medium mb-2 block">
                                            Motivo:
                                        </label>
                                        <input
                                            type="text"
                                            value={movementReason}
                                            onChange={(e) => setMovementReason(e.target.value)}
                                            placeholder="Ex: Pagamento de fornecedor, Troco"
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                                        />
                                    </div>

                                    <button
                                        onClick={handleAddMovement}
                                        className={`w-full px-6 py-4 rounded-2xl font-semibold hover:shadow-2xl transition-all flex items-center justify-center gap-2 ${movementType === 'withdrawal'
                                            ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white hover:shadow-red-500/50'
                                            : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-green-500/50'
                                            }`}
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Registrar {movementType === 'withdrawal' ? 'Sangria' : 'Reforço'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modo: Fechar Caixa */}
                    {mode === 'close' && currentCashRegister && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setMode('view')}
                                className="text-white/60 hover:text-white flex items-center gap-2 text-sm"
                            >
                                ← Voltar
                            </button>

                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-8 h-8 text-white" />
                                </div>
                                <h3 className="text-white text-xl font-bold text-center mb-6">
                                    Fechar Caixa
                                </h3>

                                {/* Resumo */}
                                <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30 mb-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <AlertCircle className="w-6 h-6 text-amber-400" />
                                        <p className="text-white font-semibold">Caixa Esperado:</p>
                                    </div>
                                    <p className="text-3xl font-bold text-amber-400 text-center">
                                        R$ {closingStats.expectedCash.toFixed(2)}
                                    </p>
                                    <p className="text-white/60 text-sm text-center mt-2">
                                        (Inicial + Entradas - Saídas)
                                    </p>
                                </div>

                                <div>
                                    <label className="text-white/80 text-sm font-medium mb-2 block">
                                        Dinheiro Real no Caixa (R$):
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={finalCash}
                                        onChange={(e) => setFinalCash(e.target.value)}
                                        placeholder="Conte o dinheiro e digite o valor"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-red-500"
                                    />
                                    {finalCash && (
                                        <div className={`mt-3 p-3 rounded-lg ${parseFloat(finalCash) === closingStats.expectedCash
                                            ? 'bg-green-500/20 border border-green-500/40'
                                            : parseFloat(finalCash) > closingStats.expectedCash
                                                ? 'bg-blue-500/20 border border-blue-500/40'
                                                : 'bg-red-500/20 border border-red-500/40'
                                            }`}>
                                            <p className={`font-bold ${parseFloat(finalCash) === closingStats.expectedCash
                                                ? 'text-green-400'
                                                : parseFloat(finalCash) > closingStats.expectedCash
                                                    ? 'text-blue-400'
                                                    : 'text-red-400'
                                                }`}>
                                                {parseFloat(finalCash) === closingStats.expectedCash
                                                    ? '✓ Caixa fechado corretamente!'
                                                    : parseFloat(finalCash) > closingStats.expectedCash
                                                        ? `Sobra: R$ ${(parseFloat(finalCash) - closingStats.expectedCash).toFixed(2)}`
                                                        : `Falta: R$ ${(closingStats.expectedCash - parseFloat(finalCash)).toFixed(2)}`
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleCloseCashRegister}
                                    className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-4 rounded-2xl font-semibold hover:shadow-2xl hover:shadow-red-500/50 transition-all flex items-center justify-center gap-2 mt-4"
                                >
                                    <Lock className="w-5 h-5" />
                                    Confirmar Fechamento
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CashRegisterModal;
