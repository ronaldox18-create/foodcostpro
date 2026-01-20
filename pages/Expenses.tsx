
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { FixedCost } from '../types';
import { Plus, Trash2, DollarSign, PieChart, Brain, Sparkles, Loader, CheckCircle2, TrendingDown, Gauge, ListChecks, AlertTriangle, Calendar, Tag, TrendingUp } from 'lucide-react';
import { formatCurrency, formatPercent } from '../utils/calculations';
import { askAI } from '../utils/aiHelper';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, Legend } from 'recharts';

interface AnalysisData {
    score: number;
    status: 'Healthy' | 'Warning' | 'Critical';
    statusLabel: string;
    summary: string;
    costDistribution: { name: string; value: number; fill: string }[];
    actionItems: string[];
}

const Expenses: React.FC = () => {
    const { fixedCosts, settings, orders, addFixedCost, deleteFixedCost, updateSettings } = useApp();
    const [newCostName, setNewCostName] = useState('');
    const [newCostAmount, setNewCostAmount] = useState('');

    // AI State
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
    const [isEstimating, setIsEstimating] = useState(false);

    // Local state for billing input to avoid glitchy typing
    const [billingInput, setBillingInput] = useState(settings.estimatedMonthlyBilling.toString());

    // Categorias predefinidas
    const CATEGORIES = [
        { id: 'rent', name: 'Aluguel', icon: '🏠', color: 'blue' },
        { id: 'utilities', name: 'Energia/Água/Gás', icon: '⚡', color: 'yellow' },
        { id: 'internet', name: 'Internet/Telefone', icon: '📶', color: 'purple' },
        { id: 'salaries', name: 'Salários', icon: '👥', color: 'green' },
        { id: 'insurance', name: 'Seguros', icon: '🛡️', color: 'red' },
        { id: 'software', name: 'Softwares/Assinaturas', icon: '💻', color: 'indigo' },
        { id: 'maintenance', name: 'Manutenção', icon: '🔧', color: 'orange' },
        { id: 'marketing', name: 'Marketing', icon: '📊', color: 'pink' },
        { id: 'other', name: 'Outros', icon: '💰', color: 'gray' }
    ];

    // Estado para categoria da nova despesa
    const [newCostCategory, setNewCostCategory] = useState('other');

    const totalFixedCosts = fixedCosts.reduce((sum, item) => sum + item.amount, 0);
    const fixedCostImpact = settings.estimatedMonthlyBilling > 0
        ? (totalFixedCosts / settings.estimatedMonthlyBilling) * 100
        : 0;

    // Agrupar por categoria
    const costsByCategory = CATEGORIES.map(cat => {
        const costs = fixedCosts.filter(c => (c.category || 'other') === cat.id);
        const total = costs.reduce((sum, c) => sum + c.amount, 0);
        return {
            ...cat,
            total,
            count: costs.length,
            percentage: totalFixedCosts > 0 ? (total / totalFixedCosts) * 100 : 0
        };
    }).filter(cat => cat.count > 0);

    const handleAddCost = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCostName || !newCostAmount) return;

        const cost: FixedCost = {
            id: crypto.randomUUID(),
            name: newCostName,
            amount: parseFloat(newCostAmount),
            category: newCostCategory
        };
        addFixedCost(cost);
        setNewCostName('');
        setNewCostAmount('');
        setNewCostCategory('other');
    };

    const handleBillingBlur = () => {
        const val = parseFloat(billingInput);
        if (!isNaN(val)) {
            updateSettings({ ...settings, estimatedMonthlyBilling: val });
        }
    };

    const handleEstimateBilling = async () => {
        if (orders.length === 0) {
            alert("Registre algumas vendas primeiro para que a IA possa analisar seu padrão.");
            return;
        }

        setIsEstimating(true);

        const today = new Date();
        const last30Days = orders.filter(o => {
            const d = new Date(o.date);
            const diffTime = Math.abs(today.getTime() - d.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 30;
        });

        const totalLast30 = last30Days.reduce((acc, o) => acc + o.totalAmount, 0);
        const daysWithSales = new Set(last30Days.map(o => new Date(o.date).toDateString())).size || 1;
        const dailyAverage = totalLast30 / daysWithSales;

        const prompt = `Atue como um analista financeiro.
      
      DADOS REAIS:
      - Vendas totais (últimos 30 dias): R$ ${totalLast30.toFixed(2)}
      - Dias operados (com vendas): ${daysWithSales}
      - Média diária (dias ativos): R$ ${dailyAverage.toFixed(2)}
      
      TAREFA:
      Estime um "Faturamento Mensal Padrão" realista para ser usado no cálculo de rateio de custos fixos.
      Considere que o mês tem em média 26 dias operacionais (se for comércio) ou 30 dias (se for online).
      Faça uma projeção conservadora baseada na média diária.
      
      Retorne APENAS o número final (ex: 25000.00). Use ponto para decimais.`;

        const result = await askAI(prompt);
        const val = parseFloat(result.replace(/[^0-9.]/g, ''));

        if (!isNaN(val) && val > 0) {
            setBillingInput(val.toString());
            updateSettings({ ...settings, estimatedMonthlyBilling: val });
        } else {
            alert("Não foi possível estimar. Tente novamente.");
        }

        setIsEstimating(false);
    };

    const handleAnalyzeFinances = async () => {
        if (fixedCosts.length === 0) {
            alert("Adicione despesas primeiro para analisar.");
            return;
        }

        setIsAiLoading(true);

        const expensesList = fixedCosts.map(c => `- ${c.name}: ${formatCurrency(c.amount)}`).join('\n');

        const prompt = `Atue como um Consultor Financeiro Sênior para Restaurantes.
    
    DADOS DO CLIENTE:
    - Faturamento Mensal Estimado: ${formatCurrency(settings.estimatedMonthlyBilling)}
    - Total Custos Fixos: ${formatCurrency(totalFixedCosts)}
    - Impacto Atual: ${formatPercent(fixedCostImpact)} do faturamento.
    
    LISTA DE DESPESAS:
    ${expensesList}
    
    TAREFA:
    Analise a saúde financeira e retorne um JSON puro (sem markdown) com a seguinte estrutura:
    {
      "score": (0 a 100, onde 100 é perfeito),
      "status": "Healthy" | "Warning" | "Critical",
      "statusLabel": "Saudável" | "Alerta" | "Crítico",
      "summary": "Resumo curto de 1 frase sobre a situação.",
      "costDistribution": [
        { "name": "Pessoal", "value": (soma em R$), "fill": "#8884d8" },
        { "name": "Ocupação (Aluguel/Luz)", "value": (soma em R$), "fill": "#82ca9d" },
        { "name": "Outros", "value": (soma em R$), "fill": "#ffc658" }
        (Agrupe as despesas da lista nessas categorias ou crie outras relevantes)
      ],
      "actionItems": ["Dica prática 1", "Dica prática 2", "Dica prática 3"]
    }`;

        try {
            const result = await askAI(prompt);
            // Clean markdown code blocks if present
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(cleanJson);
            setAnalysisData(parsed);
        } catch (e) {
            console.error("Failed to parse AI response", e);
            alert("A IA teve um problema ao formatar os dados. Tente novamente.");
        } finally {
            setIsAiLoading(false);
        }
    };

    // Helper for gauge color
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-red-500';
    };

    return (
        <div className="flex flex-col xl:flex-row gap-6 h-full">
            {/* LEFT COLUMN: OPERATIONS */}
            <div className="flex-1 space-y-6 overflow-y-auto">
                <div className="mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">Despesas Operacionais</h2>
                    <p className="text-gray-500">Cadastre seus custos fixos para calcular o peso deles no preço.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Billing Input */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 text-orange-600">
                                <DollarSign size={24} />
                                <h3 className="text-lg font-bold">Faturamento Estimado</h3>
                            </div>
                            <button
                                onClick={handleEstimateBilling}
                                disabled={isEstimating}
                                className="text-[10px] flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-bold hover:bg-indigo-100 transition disabled:opacity-50"
                                title="Calcular automaticamente com base no histórico de vendas"
                            >
                                {isEstimating ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                Auto-Calcular (IA)
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                            Média de vendas mensal. Usado para rateio dos custos.
                        </p>
                        <div className="relative">
                            <span className="absolute left-3 top-3 text-gray-500">R$</span>
                            <input
                                type="number"
                                value={billingInput}
                                onChange={e => setBillingInput(e.target.value)}
                                onBlur={handleBillingBlur}
                                className="w-full pl-10 p-3 border border-gray-300 rounded-lg text-lg font-semibold focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Impact Summary */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-500 font-medium">Total Custos Fixos</span>
                            <span className="text-xl font-bold text-red-600">{formatCurrency(totalFixedCosts)}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                            <div className={`h-2 rounded-full ${fixedCostImpact > 30 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(fixedCostImpact, 100)}%` }}></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <PieChart size={24} />
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Impacto no Preço</span>
                                <p className={`text-2xl font-bold ${fixedCostImpact > 30 ? 'text-red-500' : 'text-gray-900'}`}>
                                    {formatPercent(fixedCostImpact)}
                                </p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Fórmula: (Custos Fixos ÷ Faturamento) × 100
                        </p>
                    </div>
                </div>

                {/* BREAKDOWN POR CATEGORIA */}
                {costsByCategory.length > 0 && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 mb-6">
                            <Tag size={20} className="text-gray-400" />
                            <h3 className="font-bold text-gray-900">Despesas por Categoria</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {costsByCategory.map(cat => (
                                <div
                                    key={cat.id}
                                    className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${cat.color === 'blue' ? 'border-blue-200 bg-blue-50/50 hover:border-blue-300' :
                                            cat.color === 'yellow' ? 'border-yellow-200 bg-yellow-50/50 hover:border-yellow-300' :
                                                cat.color === 'purple' ? 'border-purple-200 bg-purple-50/50 hover:border-purple-300' :
                                                    cat.color === 'green' ? 'border-green-200 bg-green-50/50 hover:border-green-300' :
                                                        cat.color === 'red' ? 'border-red-200 bg-red-50/50 hover:border-red-300' :
                                                            cat.color === 'indigo' ? 'border-indigo-200 bg-indigo-50/50 hover:border-indigo-300' :
                                                                cat.color === 'orange' ? 'border-orange-200 bg-orange-50/50 hover:border-orange-300' :
                                                                    cat.color === 'pink' ? 'border-pink-200 bg-pink-50/50 hover:border-pink-300' :
                                                                        'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{cat.icon}</span>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900">{cat.name}</p>
                                                <p className="text-xs text-gray-500">{cat.count} {cat.count === 1 ? 'despesa' : 'despesas'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-xs text-gray-500">Total Mensal</span>
                                            <span className="text-lg font-black text-gray-900">{formatCurrency(cat.total)}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${cat.color === 'blue' ? 'bg-blue-500' :
                                                        cat.color === 'yellow' ? 'bg-yellow-500' :
                                                            cat.color === 'purple' ? 'bg-purple-500' :
                                                                cat.color === 'green' ? 'bg-green-500' :
                                                                    cat.color === 'red' ? 'bg-red-500' :
                                                                        cat.color === 'indigo' ? 'bg-indigo-500' :
                                                                            cat.color === 'orange' ? 'bg-orange-500' :
                                                                                cat.color === 'pink' ? 'bg-pink-500' :
                                                                                    'bg-gray-500'
                                                    }`}
                                                style={{ width: `${cat.percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 text-right">{cat.percentage.toFixed(1)}% do total</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Fixed Costs List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-700">Lista de Contas Fixas</h3>
                    </div>

                    {/* Add Form - Melhorado */}
                    <form onSubmit={handleAddCost} className="p-4 border-b border-gray-100 bg-white space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Nome da despesa (ex: Internet)"
                                value={newCostName}
                                onChange={e => setNewCostName(e.target.value)}
                                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
                            />
                            <input
                                type="number"
                                placeholder="Valor (R$)"
                                value={newCostAmount}
                                onChange={e => setNewCostAmount(e.target.value)}
                                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white text-gray-900"
                            />
                        </div>

                        {/* Category Selector */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-2 ml-1">Categoria</label>
                            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => setNewCostCategory(cat.id)}
                                        className={`p-2 rounded-lg border-2 transition-all text-center ${newCostCategory === cat.id
                                                ? 'border-orange-500 bg-orange-50 shadow-md scale-105'
                                                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        title={cat.name}
                                    >
                                        <span className="block text-xl mb-0.5">{cat.icon}</span>
                                        <span className="text-[9px] font-bold text-gray-600 block truncate">{cat.name.split('/')[0]}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg hover:bg-black transition flex items-center justify-center gap-2 font-bold"
                        >
                            <Plus size={18} /> Adicionar Despesa
                        </button>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {fixedCosts.length === 0 ? (
                                    <tr><td className="p-6 text-center text-gray-400">Nenhuma despesa cadastrada.</td></tr>
                                ) : (
                                    fixedCosts.map(cost => (
                                        <tr key={cost.id} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium text-gray-900">{cost.name}</td>
                                            <td className="p-4 text-right font-medium text-red-600">{formatCurrency(cost.amount)}</td>
                                            <td className="p-4 text-right w-16">
                                                <button onClick={() => deleteFixedCost(cost.id)} className="text-gray-400 hover:text-red-600 transition">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: AI ADVISOR (Improved) */}
            <div className="w-full xl:w-[420px] flex flex-col gap-4">
                <div className="bg-gray-900 text-white rounded-xl shadow-lg p-6 flex flex-col h-full border border-gray-800">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-purple-600 rounded-lg">
                            <Brain size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Consultor Financeiro</h3>
                            <p className="text-xs text-gray-400">Auditoria inteligente com IA</p>
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-800 rounded-xl border border-gray-700 overflow-y-auto mb-4 custom-scrollbar">
                        {!analysisData ? (
                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-3 p-6">
                                <TrendingDown size={48} className="opacity-20" />
                                <p className="text-sm">
                                    Clique em analisar para gerar gráficos e um diagnóstico completo da sua saúde financeira.
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-6 animate-in fade-in slide-in-from-right-4">

                                {/* 1. Score Gauge Section */}
                                <div className="text-center">
                                    <div className="relative w-32 h-32 mx-auto flex items-center justify-center rounded-full border-4 border-gray-700">
                                        <div className="text-center">
                                            <span className={`text-4xl font-bold ${getScoreColor(analysisData.score)}`}>
                                                {analysisData.score}
                                            </span>
                                            <span className="block text-xs text-gray-400 uppercase">Score</span>
                                        </div>
                                        {/* Simple visual indicator using border color logic could be enhanced with SVG */}
                                    </div>
                                    <div className={`mt-2 text-sm font-bold px-3 py-1 rounded-full inline-block ${analysisData.status === 'Healthy' ? 'bg-green-500/20 text-green-400' :
                                        analysisData.status === 'Warning' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-red-500/20 text-red-400'
                                        }`}>
                                        {analysisData.statusLabel}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2 px-2">{analysisData.summary}</p>
                                </div>

                                {/* 2. Categorization Chart */}
                                <div className="h-48 w-full">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                                        <PieChart size={12} /> Distribuição de Custos
                                    </p>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={analysisData.costDistribution}
                                                innerRadius={40}
                                                outerRadius={60}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {analysisData.costDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                                                ))}
                                            </Pie>
                                            <ReTooltip
                                                formatter={(val: number) => formatCurrency(val)}
                                                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: '12px' }}
                                            />
                                            <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* 3. Action Items */}
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                        <ListChecks size={12} /> Plano de Ação
                                    </p>
                                    <div className="space-y-2">
                                        {analysisData.actionItems.map((item, idx) => (
                                            <div key={idx} className="flex gap-3 bg-gray-700/50 p-3 rounded-lg border border-gray-700">
                                                <CheckCircle2 size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-gray-200">{item}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleAnalyzeFinances}
                        disabled={isAiLoading || fixedCosts.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                        {isAiLoading ? <Loader size={20} className="animate-spin" /> : <Sparkles size={20} className="text-yellow-300" />}
                        {isAiLoading ? 'Gerando Relatório...' : 'Realizar Auditoria Completa'}
                    </button>
                    <p className="text-[10px] text-gray-500 text-center mt-3">
                        A IA classifica seus gastos e gera um score financeiro.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Expenses;
