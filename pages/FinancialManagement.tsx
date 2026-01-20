import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    PieChart as PieChartIcon,
    Users,
    Shield,
    Rocket,
    Lightbulb,
    Award,
    Target,
    Calendar,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Plus,
    Settings,
    BarChart3,
    Wallet,
    Edit,
    Trash2,
    X
} from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Line, LineChart } from 'recharts';
import DistributionModal from '../components/DistributionModal';
import GoalModal from '../components/GoalModal';
import InvestmentModal from '../components/InvestmentModal';

interface Goal {
    id: string;
    name: string;
    type: 'revenue' | 'profit' | 'margin' | 'ticket' | 'customers';
    targetValue: number;
    currentValue: number;
    period: 'monthly' | 'quarterly' | 'yearly';
    deadline?: string;
}

interface Investment {
    id: string;
    name: string;
    category: 'equipment' | 'renovation' | 'marketing' | 'technology' | 'expansion' | 'other';
    amount: number;
    expectedROI: number;
    actualROI?: number;
    status: 'planned' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
    startDate?: string;
    completionDate?: string;
    notes?: string;
}

const FinancialManagement: React.FC = () => {
    const { orders, fixedCosts, products, ingredients, settings } = useApp();

    // Estados para modals
    const [showDistributionModal, setShowDistributionModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showInvestmentModal, setShowInvestmentModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

    // Estado para configuração de distribuição (com localStorage)
    const [distribution, setDistribution] = useState(() => {
        const saved = localStorage.getItem('financialDistribution');
        return saved ? JSON.parse(saved) : {
            prolabore: 45,
            emergency: 25,
            investment: 15,
            improvement: 10,
            profit: 5
        };
    });

    // Estados para metas e investimentos (com localStorage)
    const [goals, setGoals] = useState<Goal[]>(() => {
        const saved = localStorage.getItem('financialGoals');
        return saved ? JSON.parse(saved) : [];
    });

    const [investments, setInvestments] = useState<Investment[]>(() => {
        const saved = localStorage.getItem('financialInvestments');
        return saved ? JSON.parse(saved) : [];
    });

    // Salvar no localStorage quando mudar
    useEffect(() => {
        localStorage.setItem('financialDistribution', JSON.stringify(distribution));
    }, [distribution]);

    useEffect(() => {
        localStorage.setItem('financialGoals', JSON.stringify(goals));
    }, [goals]);

    useEffect(() => {
        localStorage.setItem('financialInvestments', JSON.stringify(investments));
    }, [investments]);

    // Handlers
    const handleSaveGoal = (goal: Goal) => {
        const existing = goals.find(g => g.id === goal.id);
        if (existing) {
            setGoals(goals.map(g => g.id === goal.id ? goal : g));
        } else {
            setGoals([...goals, goal]);
        }
        setEditingGoal(null);
    };

    const handleDeleteGoal = (id: string) => {
        if (confirm('Deseja realmente excluir esta meta?')) {
            setGoals(goals.filter(g => g.id !== id));
        }
    };

    const handleSaveInvestment = (investment: Investment) => {
        const existing = investments.find(i => i.id === investment.id);
        if (existing) {
            setInvestments(investments.map(i => i.id === investment.id ? investment : i));
        } else {
            setInvestments([...investments, investment]);
        }
        setEditingInvestment(null);
    };

    const handleDeleteInvestment = (id: string) => {
        if (confirm('Deseja realmente excluir este investimento?')) {
            setInvestments(investments.filter(i => i.id !== id));
        }
    };

    // Configuração das contas
    const ACCOUNTS = [
        {
            id: 'prolabore',
            name: 'Pró-labore',
            icon: '👔',
            color: 'blue',
            description: 'Remuneração dos sócios',
            percentage: distribution.prolabore
        },
        {
            id: 'emergency',
            name: 'Reserva de Emergência',
            icon: '🏦',
            color: 'green',
            description: 'Segurança financeira (meta: 6-12 meses de custos)',
            percentage: distribution.emergency
        },
        {
            id: 'investment',
            name: 'Investimentos',
            icon: '📈',
            color: 'purple',
            description: 'Expansão e equipamentos',
            percentage: distribution.investment
        },
        {
            id: 'improvement',
            name: 'Melhorias',
            icon: '💡',
            color: 'orange',
            description: 'Treinamento e inovação',
            percentage: distribution.improvement
        },
        {
            id: 'profit',
            name: 'Distribuição de Lucros',
            icon: '💰',
            color: 'yellow',
            description: 'Bonificação extra',
            percentage: distribution.profit
        }
    ];

    // Cálculos financeiros do último mês
    const financialData = useMemo(() => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const monthOrders = orders.filter(o => {
            const orderDate = new Date(o.date);
            return orderDate >= thirtyDaysAgo && o.status !== 'canceled';
        });

        //Receita
        const revenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);

        // Custos Variáveis (CMV)
        let variableCosts = 0;
        monthOrders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    let itemCost = 0;
                    product.recipe.forEach(r => {
                        const ing = ingredients.find(i => i.id === r.ingredientId);
                        if (ing) {
                            let qty = r.quantityUsed;
                            if (ing.purchaseUnit === 'kg' && r.unitUsed === 'g') qty /= 1000;
                            if (ing.purchaseUnit === 'l' && r.unitUsed === 'ml') qty /= 1000;
                            itemCost += (ing.purchasePrice / ing.purchaseQuantity) * qty;
                        }
                    });
                    variableCosts += itemCost * item.quantity;
                }
            });
        });

        // Custos Fixos (mensal)
        const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + c.amount, 0);

        // Impostos
        const taxPercent = settings?.taxAndLossPercent || 0;
        const taxes = revenue * (taxPercent / 100);

        // Lucro Líquido
        const netProfit = revenue - variableCosts - totalFixedCosts - taxes;

        // Distribuição
        const distributions = {
            prolabore: (netProfit * distribution.prolabore) / 100,
            emergency: (netProfit * distribution.emergency) / 100,
            investment: (netProfit * distribution.investment) / 100,
            improvement: (netProfit * distribution.improvement) / 100,
            profit: (netProfit * distribution.profit) / 100
        };

        // Meta de reserva (6 meses de custos fixos)
        const emergencyTarget = totalFixedCosts * 6;

        return {
            revenue,
            variableCosts,
            fixedCosts: totalFixedCosts,
            taxes,
            netProfit,
            distributions,
            emergencyTarget,
            margin: revenue > 0 ? (netProfit / revenue) * 100 : 0
        };
    }, [orders, products, ingredients, fixedCosts, settings, distribution]);

    // Dados para gráfico de pizza
    const pieData = [
        { name: 'Pró-labore', value: financialData.distributions.prolabore, fill: '#3B82F6' },
        { name: 'Reserva', value: financialData.distributions.emergency, fill: '#10B981' },
        { name: 'Investimentos', value: financialData.distributions.investment, fill: '#8B5CF6' },
        { name: 'Melhorias', value: financialData.distributions.improvement, fill: '#F97316' },
        { name: 'Lucros', value: financialData.distributions.profit, fill: '#EAB308' }
    ].filter(d => d.value > 0);

    // Score de saúde financeira
    const healthScore = useMemo(() => {
        let score = 50; // Base

        // Margem líquida
        if (financialData.margin >= 20) score += 20;
        else if (financialData.margin >= 10) score += 10;
        else if (financialData.margin >= 5) score += 5;

        // Receita positiva
        if (financialData.revenue > 0) score += 10;

        // Lucro positivo
        if (financialData.netProfit > 0) score += 20;
        else score -= 30;

        return Math.max(0, Math.min(100, score));
    }, [financialData]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return 'Excelente';
        if (score >= 60) return 'Bom';
        if (score >= 40) return 'Regular';
        return 'Crítico';
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 mb-2">💼 Gestão Financeira Empresarial</h1>
                        <p className="text-gray-500">Centro de comando para distribuição inteligente de lucros</p>
                    </div>
                    <div className="text-center">
                        <div className={`text-5xl font-black ${getScoreColor(healthScore)}`}>{healthScore}</div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">{getScoreLabel(healthScore)}</p>
                    </div>
                </div>
            </div>

            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-emerald-50 rounded-xl">
                            <DollarSign className="text-emerald-600" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Faturamento (30d)</p>
                            <h3 className="text-2xl font-black text-gray-900">{formatCurrency(financialData.revenue)}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <TrendingUp className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Lucro Líquido</p>
                            <h3 className={`text-2xl font-black ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(financialData.netProfit)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl">
                            <BarChart3 className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Margem Líquida</p>
                            <h3 className="text-2xl font-black text-gray-900">{financialData.margin.toFixed(1)}%</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-orange-50 rounded-xl">
                            <Wallet className="text-orange-600" size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Custos Totais</p>
                            <h3 className="text-2xl font-black text-gray-900">
                                {formatCurrency(financialData.variableCosts + financialData.fixedCosts + financialData.taxes)}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conteúdo Principal - 2 Colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna Principal (2/3) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Gráfico de Distribuição */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <PieChartIcon size={20} className="text-gray-400" />
                            Distribuição de Lucros
                        </h3>

                        {financialData.netProfit > 0 ? (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 flex items-center justify-center">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto text-gray-300 mb-3" size={48} />
                                    <p className="text-gray-500 font-medium">Sem lucro para distribuir no momento</p>
                                    <p className="text-xs text-gray-400 mt-1">Foque em aumentar receitas ou reduzir custos</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cards de Contas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ACCOUNTS.map(account => {
                            const amount = financialData.distributions[account.id as keyof typeof financialData.distributions] || 0;
                            const isEmergency = account.id === 'emergency';
                            const target = isEmergency ? financialData.emergencyTarget : undefined;
                            const progress = isEmergency && target ? Math.min((amount / target) * 100, 100) : 100;

                            return (
                                <div
                                    key={account.id}
                                    className={`p-5 rounded-xl border-2 transition-all hover:shadow-lg ${account.color === 'blue' ? 'border-blue-200 bg-blue-50/50' :
                                        account.color === 'green' ? 'border-green-200 bg-green-50/50' :
                                            account.color === 'purple' ? 'border-purple-200 bg-purple-50/50' :
                                                account.color === 'orange' ? 'border-orange-200 bg-orange-50/50' :
                                                    'border-yellow-200 bg-yellow-50/50'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl">{account.icon}</span>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{account.name}</h4>
                                                <p className="text-xs text-gray-500">{account.description}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded-full">
                                            {account.percentage}%
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-xs text-gray-500">Este mês</span>
                                            <span className="text-xl font-black text-gray-900">{formatCurrency(amount)}</span>
                                        </div>

                                        {isEmergency && target && (
                                            <>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="h-2 bg-green-500 rounded-full transition-all"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 text-right">
                                                    Meta: {formatCurrency(target)} ({progress.toFixed(0)}%)
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* Coluna Lateral (1/3) */}
                <div className="space-y-6">

                    {/* Breakdown de Custos */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Breakdown de Custos</h3>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                                <span className="text-xs font-bold text-gray-700">Receita Bruta</span>
                                <span className="font-black text-emerald-700">{formatCurrency(financialData.revenue)}</span>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                <span className="text-xs font-bold text-gray-700">(-) CMV</span>
                                <span className="font-black text-red-700">-{formatCurrency(financialData.variableCosts)}</span>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                                <span className="text-xs font-bold text-gray-700">(-) Custos Fixos</span>
                                <span className="font-black text-orange-700">-{formatCurrency(financialData.fixedCosts)}</span>
                            </div>

                            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                                <span className="text-xs font-bold text-gray-700">(-) Impostos</span>
                                <span className="font-black text-yellow-700">-{formatCurrency(financialData.taxes)}</span>
                            </div>

                            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg">
                                <span className="text-xs font-black text-white">(=) Lucro Líquido</span>
                                <span className={`font-black text-lg ${financialData.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {formatCurrency(financialData.netProfit)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Alertas e Recomendações */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-4">
                            <Lightbulb size={20} />
                            <h3 className="font-bold">Recomendações</h3>
                        </div>

                        <div className="space-y-3">
                            {financialData.netProfit > 0 ? (
                                <>
                                    <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                                        <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
                                        <p className="text-xs">
                                            Lucro positivo! Continue monitorando custos para manter saúde financeira.
                                        </p>
                                    </div>

                                    {financialData.margin < 15 && (
                                        <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                                            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                            <p className="text-xs">
                                                Margem líquida abaixo de 15%. Considere revisar preços ou reduzir custos.
                                            </p>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-yellow-300" />
                                    <p className="text-xs">
                                        Atenção! Prejuízo detectado. Priorize redução de custos e aumento de vendas.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-2 bg-white/10 backdrop-blur-sm p-3 rounded-lg">
                                <Target size={16} className="flex-shrink-0 mt-0.5" />
                                <p className="text-xs">
                                    Configure suas metas mensais para acompanhar o crescimento do negócio.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-3">Ações Rápidas</h3>

                        <div className="space-y-2">
                            <button
                                onClick={() => setShowDistributionModal(true)}
                                className="w-full p-3 bg-gray-900 text-white rounded-lg hover:bg-black transition text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <Settings size={16} />
                                Configurar Distribuição
                            </button>

                            <button
                                onClick={() => setShowGoalModal(true)}
                                className="w-full p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <Plus size={16} />
                                Adicionar Meta
                            </button>

                            <button
                                onClick={() => setShowInvestmentModal(true)}
                                className="w-full p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition text-sm font-bold flex items-center justify-center gap-2"
                            >
                                <Rocket size={16} />
                                Planejar Investimento
                            </button>
                        </div>
                    </div>

                </div>

            </div>

            {/* SEÇÃO DE METAS */}
            {goals.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Target size={24} className="text-blue-500" />
                            Metas Ativas
                        </h3>
                        <button
                            onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}
                            className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            <Plus size={16} /> Nova Meta
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {goals.map(goal => {
                            const progress = (goal.currentValue / goal.targetValue) * 100;
                            const isCompleted = progress >= 100;
                            const typeIcons: any = {
                                revenue: '💰',
                                profit: '📈',
                                margin: '📊',
                                ticket: '🎫',
                                customers: '👥'
                            };

                            return (
                                <div key={goal.id} className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{typeIcons[goal.type]}</span>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{goal.name}</h4>
                                                <p className="text-xs text-gray-500 capitalize">{goal.period}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }}
                                                className="p-1 text-gray-400 hover:text-blue-600 transition"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGoal(goal.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-600">Atual</span>
                                            <span className="font-bold text-gray-900">{goal.currentValue.toFixed(2)}</span>
                                        </div>
                                        <div className="w-full bg-blue-200 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${Math.min(progress, 100)}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className={`font-bold ${isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                                                {progress.toFixed(0)}%
                                            </span>
                                            <span className="text-gray-600">Meta: {goal.targetValue.toFixed(2)}</span>
                                        </div>
                                        {goal.deadline && (
                                            <p className="text-xs text-gray-500 mt-2">
                                                📅 {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SEÇÃO DE INVESTIMENTOS */}
            {investments.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Rocket size={24} className="text-purple-500" />
                            Investimentos
                        </h3>
                        <button
                            onClick={() => { setEditingInvestment(null); setShowInvestmentModal(true); }}
                            className="text-sm font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                        >
                            <Plus size={16} /> Novo Investimento
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {investments.map(inv => {
                            const categoryIcons: any = {
                                equipment: '🔧',
                                renovation: '🏗️',
                                marketing: '📣',
                                technology: '💻',
                                expansion: '🚀',
                                other: '📦'
                            };

                            const statusColors: any = {
                                planned: 'bg-gray-100 text-gray-700',
                                approved: 'bg-blue-100 text-blue-700',
                                in_progress: 'bg-yellow-100 text-yellow-700',
                                completed: 'bg-green-100 text-green-700',
                                cancelled: 'bg-red-100 text-red-700'
                            };

                            const statusLabels: any = {
                                planned: 'Planejado',
                                approved: 'Aprovado',
                                in_progress: 'Em Andamento',
                                completed: 'Concluído',
                                cancelled: 'Cancelado'
                            };

                            return (
                                <div key={inv.id} className="p-5 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-2xl">{categoryIcons[inv.category]}</span>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-900 text-sm">{inv.name}</h4>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[inv.status]}`}>
                                                    {statusLabels[inv.status]}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => { setEditingInvestment(inv); setShowInvestmentModal(true); }}
                                                className="p-1 text-gray-400 hover:text-purple-600 transition"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteInvestment(inv.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 transition"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="text-center p-2 bg-white rounded-lg">
                                            <p className="text-xs text-gray-500">Investimento</p>
                                            <p className="font-black text-purple-600">{formatCurrency(inv.amount)}</p>
                                        </div>
                                        <div className="text-center p-2 bg-white rounded-lg">
                                            <p className="text-xs text-gray-500">ROI Esperado</p>
                                            <p className="font-black text-green-600">{inv.expectedROI}%</p>
                                        </div>
                                    </div>

                                    {inv.actualROI !== undefined && (
                                        <div className="p-2 bg-white rounded-lg mb-2">
                                            <p className="text-xs text-gray-500 text-center">ROI Atual</p>
                                            <p className="font-black text-center text-lg" style={{
                                                color: inv.actualROI >= inv.expectedROI ? '#10B981' : '#F59E0B'
                                            }}>
                                                {inv.actualROI}%
                                            </p>
                                        </div>
                                    )}

                                    {inv.notes && (
                                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{inv.notes}</p>
                                    )}

                                    {inv.startDate && (
                                        <p className="text-xs text-gray-500 mt-2">
                                            📅 {new Date(inv.startDate).toLocaleDateString('pt-BR')}
                                            {inv.completionDate && ` → ${new Date(inv.completionDate).toLocaleDateString('pt-BR')}`}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MODALS */}
            <DistributionModal
                isOpen={showDistributionModal}
                onClose={() => setShowDistributionModal(false)}
                distribution={distribution}
                onSave={(newDist) => setDistribution(newDist)}
            />

            <GoalModal
                isOpen={showGoalModal}
                onClose={() => { setShowGoalModal(false); setEditingGoal(null); }}
                onSave={handleSaveGoal}
                editingGoal={editingGoal}
            />

            <InvestmentModal
                isOpen={showInvestmentModal}
                onClose={() => { setShowInvestmentModal(false); setEditingInvestment(null); }}
                onSave={handleSaveInvestment}
                editingInvestment={editingInvestment}
            />

        </div>
    );
};

export default FinancialManagement;
