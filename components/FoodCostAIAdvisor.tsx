
import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import {
    TrendingUp,
    Lightbulb,
    Brain,
    Sparkles,
    AlertTriangle,
    Award,
    Megaphone
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip as RechartsTooltip, Bar, Line } from 'recharts';
import { generateForecast } from '../utils/forecast';
import { formatCurrency } from '../utils/calculations';

export const FoodCostAIAdvisor: React.FC = () => {
    const { orders, products, ingredients } = useApp();

    // ========================================================================
    // LÓGICA DE INTELIGÊNCIA ARTIFICIAL
    // ========================================================================

    // 1. Previsão de Vendas (Forecast)
    // ------------------------------------------------------------------------
    const salesForecast = useMemo(() => {
        // Analisar histórico dos últimos 30 dias para projetar os próximos 7
        const today = new Date();
        const last30Days = [];

        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);

            const daysOrders = orders.filter(o => {
                const od = new Date(o.date);
                return od >= d && od < new Date(d.getTime() + 86400000) && o.status !== 'canceled';
            });

            last30Days.push({
                date: d,
                value: daysOrders.reduce((sum, o) => sum + o.totalAmount, 0)
            });
        }

        const { forecast, trend } = generateForecast(last30Days, 7);

        // Preparar dados para o gráfico
        // Mostramos os últimos 14 dias de histórico + 7 dias de previsão
        const chartHistory = last30Days.slice(-14).map(d => ({
            day: d.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            revenue: d.value,
            forecast: null
        }));

        const chartForecast = forecast.map(d => ({
            day: d.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            revenue: null,
            forecast: d.value
        }));

        // Conectar o último ponto real ao primeiro previsto
        if (chartHistory.length > 0 && chartForecast.length > 0) {
            const lastReal = chartHistory[chartHistory.length - 1];
            chartForecast.unshift({
                day: lastReal.day,
                revenue: null,
                forecast: lastReal.revenue
            });
        }

        const totalForecast = forecast.reduce((sum, d) => sum + d.value, 0);

        return {
            data: [...chartHistory, ...chartForecast],
            trend,
            totalForecast
        };
    }, [orders]);

    // 2. Análise de Engenharia de Cardápio (Insights)
    // ------------------------------------------------------------------------
    const menuInsights = useMemo(() => {
        // Considerar vendas dos últimos 30 dias para os insights
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const relevantOrders = orders.filter(o => {
            return new Date(o.date) >= thirtyDaysAgo && o.status !== 'canceled';
        });

        if (relevantOrders.length === 0) return [];

        const productData = new Map();

        relevantOrders.forEach(o => {
            o.items.forEach(item => {
                if (!productData.has(item.productId)) {
                    productData.set(item.productId, {
                        id: item.productId,
                        name: item.productName,
                        qty: 0,
                        revenue: 0,
                        cost: 0
                    });
                }
                const p = productData.get(item.productId);
                p.qty += item.quantity;
                p.revenue += item.total;

                // Estimar custo
                const productDef = products.find(prod => prod.id === item.productId);
                if (productDef) {
                    const unitCost = productDef.recipe.reduce((acc, comp) => {
                        const ing = ingredients.find(i => i.id === comp.ingredientId);
                        if (!ing) return acc;
                        let q = comp.quantityUsed;
                        if (ing.purchaseUnit === 'kg' && comp.unitUsed === 'g') q /= 1000;
                        if (ing.purchaseUnit === 'l' && comp.unitUsed === 'ml') q /= 1000;
                        return acc + (ing.purchasePrice / ing.purchaseQuantity) * q;
                    }, 0);
                    p.cost += unitCost * item.quantity;
                }
            });
        });

        const items = Array.from(productData.values());
        if (items.length < 2) return [];

        const avgQty = items.reduce((sum, i) => sum + i.qty, 0) / items.length;
        const avgContribution = items.reduce((sum, i) => sum + (i.revenue - i.cost), 0) / items.length;

        const insights = [];

        // START: Estrela do Cardápio (Alto Volume, Alta Margem)
        const stars = items.filter(i => i.qty >= avgQty && (i.revenue - i.cost) >= avgContribution);
        if (stars.length > 0) {
            const topStar = stars.sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost))[0];
            insights.push({
                type: 'star',
                title: 'Estrela do Cardápio',
                productName: topStar.name,
                description: `O "${topStar.name}" é seu campeão! Vende muito e lucra muito. Garanta que nunca falte estoque e mantenha a qualidade.`
            });
        }

        // PLOWHORSE: Potencial de Lucro (Alto Volume, Baixa Margem)
        const plowhorses = items.filter(i => i.qty >= avgQty && (i.revenue - i.cost) < avgContribution);
        if (plowhorses.length > 0) {
            const topPlow = plowhorses.sort((a, b) => b.qty - a.qty)[0];
            const productRef = products.find(p => p.id === topPlow.id);
            const isPossibleResale = productRef && (productRef.recipe.length <= 1);

            const suggestion = isPossibleResale
                ? "Como é um produto de revenda, tente negociar melhor com fornecedores ou criar combos."
                : "Revise a ficha técnica para reduzir custos ou aumente levemente o preço.";

            insights.push({
                type: 'potential',
                title: 'Potencial de Lucro',
                productName: topPlow.name,
                description: `"${topPlow.name}" vende bem mas tem margem baixa. ${suggestion}`
            });
        }

        // PUZZLE: Precisa de Marketing (Baixo Volume, Alta Margem)
        // Só mostra se não tiver Potencial de Lucro, para não poluir demais (o design pede 2 cards)
        if (insights.length < 2) {
            const puzzles = items.filter(i => i.qty < avgQty && (i.revenue - i.cost) >= avgContribution);
            if (puzzles.length > 0) {
                const topPuzzle = puzzles.sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost))[0];
                insights.push({
                    type: 'marketing',
                    title: 'Precisa de Marketing',
                    productName: topPuzzle.name,
                    description: `"${topPuzzle.name}" é muito rentável mas vende pouco. Crie uma promoção ou destaque-o no cardápio!`
                });
            }
        }

        return insights.slice(0, 2); // Limitar a 2 insights principais
    }, [orders, products, ingredients]);


    // ========================================================================
    // RENDERIZAÇÃO
    // ========================================================================

    return (
        <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-100 overflow-hidden relative shadow-lg">
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-200/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-200/20 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none"></div>

            <CardHeader className="pb-4 relative z-10 border-b border-violet-100/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-violet-100">
                            <Brain size={28} className="text-violet-600" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-gray-900">
                                FoodCost AI Advisor
                            </CardTitle>
                            <p className="text-sm font-medium text-violet-600">
                                Inteligência Estratégica para seu Negócio
                            </p>
                        </div>
                    </div>
                    <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-violet-600 text-white shadow-sm animate-pulse tracking-wide">
                        LIVE
                    </span>
                </div>
            </CardHeader>

            <CardContent className="pt-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* COLUNA DA ESQUERDA: Gráfico de Previsão */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <TrendingUp size={18} className="text-violet-600" />
                                Previsão de Faturamento
                            </h3>
                            <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm 
                                ${salesForecast.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                <span>Tendência:</span>
                                <span>{salesForecast.trend === 'up' ? 'Alta' : 'Estável/Queda'}</span>
                                {salesForecast.trend === 'up' ? <TrendingUp size={14} /> : <AlertTriangle size={14} />}
                            </div>
                        </div>

                        {/* Gráfico */}
                        <div className="h-[220px] bg-white/60 backdrop-blur-sm rounded-2xl border border-white/50 p-4 shadow-sm">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={salesForecast.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#6B7280' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#6B7280' }}
                                        tickFormatter={(v) => `k${Math.round(v / 1000)}`}
                                    />
                                    <RechartsTooltip
                                        cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        formatter={(val) => [formatCurrency(val as number), 'Faturamento']}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        fill="#A78BFA"
                                        barSize={12}
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Line
                                        type="natural"
                                        dataKey="forecast"
                                        stroke="#EC4899"
                                        strokeWidth={3}
                                        dot={false}
                                        strokeDasharray="4 4"
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Resumo da Previsão */}
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-violet-100 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-violet-700">
                                    Previsão (7 dias): <span className="text-xl ml-1 text-gray-900">{formatCurrency(salesForecast.totalForecast)}</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Baseado no histórico dos últimos 30 dias.</p>
                            </div>
                        </div>
                    </div>

                    {/* COLUNA DA DIREITA: Insights Cards */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Lightbulb size={18} className="text-amber-500" />
                            Insights de Otimização
                        </h3>

                        <div className="space-y-4">
                            {menuInsights.length > 0 ? (
                                menuInsights.map((insight, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
                                    >
                                        <div className="flex items-start gap-4">
                                            <div className={`p-3 rounded-xl flex-shrink-0 ${insight.type === 'star' ? 'bg-green-100 text-green-600' :
                                                    insight.type === 'potential' ? 'bg-amber-100 text-amber-600' :
                                                        'bg-blue-100 text-blue-600'
                                                }`}>
                                                {insight.type === 'star' ? <Award size={24} /> :
                                                    insight.type === 'potential' ? <TrendingUp size={24} /> :
                                                        <Megaphone size={24} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-base mb-1">
                                                    {insight.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 leading-relaxed">
                                                    {insight.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-gray-300">
                                    <Sparkles className="mx-auto h-8 w-8 text-violet-300 mb-2" />
                                    <p className="text-sm text-gray-500">Coletando dados suficientes para gerar insights...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
