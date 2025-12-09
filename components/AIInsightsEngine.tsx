import React, { useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import {
    TrendingUp,
    TrendingDown,
    Lightbulb,
    Brain,
    Sparkles,
    AlertTriangle,
    Award,
    Megaphone,
    Target,
    Zap,
    DollarSign,
    Package,
    Users,
    ChevronRight,
    Clock,
    TrendingDown as Minimize,
    Calendar,
    ShoppingCart
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { generateForecast } from '../utils/forecast';
import { Link } from 'react-router-dom';

interface AIInsight {
    id: string;
    type: 'critical' | 'warning' | 'opportunity' | 'success';
    category: 'pricing' | 'inventory' | 'sales' | 'products' | 'customers' | 'trend';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    actionLabel?: string;
    actionLink?: string;
    metrics?: {
        current?: string | number;
        suggested?: string | number;
        potential?: string;
    };
}

export const AIInsightsEngine: React.FC = () => {
    const { orders, products, ingredients, customers, settings } = useApp();

    // ========================================================================
    // MOTOR DE INTELIGÊNCIA ARTIFICIAL - ANÁLISE AVANÇADA
    // ========================================================================

    const aiInsights = useMemo(() => {
        const insights: AIInsight[] = [];
        const now = new Date();
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);

        // Período de análise: últimos 30 dias
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const recentOrders = orders.filter(o =>
            new Date(o.date) >= thirtyDaysAgo && o.status !== 'canceled'
        );

        // === 1. ANÁLISE DE TENDÊNCIA DE VENDAS (Preditiva) ===
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

        if (last30Days.length >= 14) {
            const { trend, slope } = generateForecast(last30Days, 7);

            // Tendência de queda detectada
            if (trend === 'down' && slope < -50) {
                insights.push({
                    id: 'trend-down-critical',
                    type: 'critical',
                    category: 'trend',
                    title: '📉 Queda nas Vendas Detectada',
                    description: `A IA identificou uma tendência de queda de ${Math.abs(slope).toFixed(0)}% nas suas vendas. Recomendamos ações imediatas de marketing e promoções para reverter essa tendência.`,
                    impact: 'high',
                    actionable: true,
                    actionLabel: 'Ver Produtos em Queda',
                    actionLink: '/products',
                    metrics: {
                        current: `${slope.toFixed(1)}%`,
                        suggested: 'Criar promoções'
                    }
                });
            } else if (trend === 'up' && slope > 50) {
                insights.push({
                    id: 'trend-up-success',
                    type: 'success',
                    category: 'trend',
                    title: '📈 Crescimento Acelerado!',
                    description: `Excelente! Suas vendas estão crescendo ${slope.toFixed(0)}% ao dia. Garanta que o estoque está preparado para atender a demanda crescente.`,
                    impact: 'high',
                    actionable: true,
                    actionLabel: 'Verificar Estoque',
                    actionLink: '/inventory'
                });
            }
        }

        // === 2. PRODUTOS COM MARGEM BAIXA (Análise de Precificação) ===
        const productMargins = products.map(product => {
            const recipeCost = product.recipe.reduce((acc, comp) => {
                const ing = ingredients.find(i => i.id === comp.ingredientId);
                if (!ing) return acc;
                let q = comp.quantityUsed;
                if (ing.purchaseUnit === 'kg' && comp.unitUsed === 'g') q /= 1000;
                if (ing.purchaseUnit === 'l' && comp.unitUsed === 'ml') q /= 1000;
                return acc + (ing.purchasePrice / ing.purchaseQuantity) * q;
            }, 0);

            const margin = product.currentPrice > 0
                ? ((product.currentPrice - recipeCost) / product.currentPrice) * 100
                : 0;

            return { ...product, cost: recipeCost, margin };
        });

        const lowMarginProducts = productMargins.filter(p => p.margin > 0 && p.margin < 50);
        if (lowMarginProducts.length > 0) {
            const worst = lowMarginProducts.sort((a, b) => a.margin - b.margin)[0];
            const suggestedPrice = worst.cost * 2.5; // Margem de 60%

            insights.push({
                id: 'low-margin-warning',
                type: 'warning',
                category: 'pricing',
                title: '⚠️ Produtos com Margem Abaixo do Ideal',
                description: `"${worst.name}" tem apenas ${worst.margin.toFixed(1)}% de margem. Com o preço atual de ${formatCurrency(worst.currentPrice)}, você está deixando de lucrar.`,
                impact: 'high',
                actionable: true,
                actionLabel: 'Ajustar Preços',
                actionLink: '/products',
                metrics: {
                    current: `${worst.margin.toFixed(1)}%`,
                    suggested: formatCurrency(suggestedPrice),
                    potential: `+${formatCurrency((suggestedPrice - worst.currentPrice) * 30)} /mês`
                }
            });
        }

        // === 3. PRODUTOS PARADOS (Não venderam nos últimos 7 dias) ===
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const recentProductSales = new Set(
            orders
                .filter(o => new Date(o.date) >= sevenDaysAgo && o.status !== 'canceled')
                .flatMap(o => o.items.map(i => i.productId))
        );

        const unsoldProducts = products.filter(p => !recentProductSales.has(p.id));

        if (unsoldProducts.length >= 3) {
            insights.push({
                id: 'unsold-products-opportunity',
                type: 'opportunity',
                category: 'products',
                title: '💡 Produtos sem Vendas Recentes',
                description: `${unsoldProducts.length} produtos não tiveram vendas nos últimos 7 dias. Considere criar combos, promoções ou removê-los do cardápio temporariamente.`,
                impact: 'medium',
                actionable: true,
                actionLabel: 'Ver Lista Completa',
                actionLink: '/products',
                metrics: {
                    current: unsoldProducts.length,
                    suggested: 'Criar promoções'
                }
            });
        }

        // === 4. ANÁLISE DE HORÁRIOS DE PICO (Otimização Operacional) ===
        const hourlyRevenue = Array(24).fill(0);
        const hourlyCounts = Array(24).fill(0);

        recentOrders.forEach(order => {
            const hour = new Date(order.date).getHours();
            hourlyRevenue[hour] += order.totalAmount;
            hourlyCounts[hour]++;
        });

        const peakHour = hourlyRevenue.indexOf(Math.max(...hourlyRevenue));
        const peakRevenue = hourlyRevenue[peakHour];
        const totalRevenue = hourlyRevenue.reduce((a, b) => a + b, 0);

        if (peakRevenue > 0 && (peakRevenue / totalRevenue) > 0.25) {
            insights.push({
                id: 'peak-hour-insight',
                type: 'opportunity',
                category: 'sales',
                title: `⏰ Horário de Ouro: ${peakHour}h`,
                description: `${((peakRevenue / totalRevenue) * 100).toFixed(0)}% das suas vendas acontecem às ${peakHour}h. Garanta equipe e estoque reforçados nesse período para maximizar resultados.`,
                impact: 'medium',
                actionable: false
            });
        }

        // === 5. ESTOQUE CRÍTICO (Prevenção) ===
        const criticalStock = ingredients.filter(ing =>
            ing.currentStock !== undefined &&
            ing.minStock !== undefined &&
            ing.currentStock < ing.minStock
        );

        if (criticalStock.length > 0) {
            // Calcular impacto em produtos
            const affectedProducts = products.filter(p =>
                p.recipe.some(r => criticalStock.some(ing => ing.id === r.ingredientId))
            );

            insights.push({
                id: 'critical-stock-alert',
                type: 'critical',
                category: 'inventory',
                title: '🚨 Estoque Crítico Detectado',
                description: `${criticalStock.length} ingredientes estão abaixo do mínimo, afetando ${affectedProducts.length} produtos. Risco de ruptura e perda de vendas.`,
                impact: 'high',
                actionable: true,
                actionLabel: 'Repor Agora',
                actionLink: '/inventory',
                metrics: {
                    current: `${criticalStock.length} itens`,
                    suggested: 'Reposição urgente'
                }
            });
        }

        // === 6. PRODUTOS ESTRELA (Engenharia de Cardápio) ===
        const productSales = new Map<string, { name: string; qty: number; revenue: number; cost: number }>();

        recentOrders.forEach(order => {
            order.items.forEach(item => {
                if (!productSales.has(item.productId)) {
                    const productDef = products.find(p => p.id === item.productId);
                    const cost = productDef ? productDef.recipe.reduce((acc, comp) => {
                        const ing = ingredients.find(i => i.id === comp.ingredientId);
                        if (!ing) return acc;
                        let q = comp.quantityUsed;
                        if (ing.purchaseUnit === 'kg' && comp.unitUsed === 'g') q /= 1000;
                        if (ing.purchaseUnit === 'l' && comp.unitUsed === 'ml') q /= 1000;
                        return acc + (ing.purchasePrice / ing.purchaseQuantity) * q;
                    }, 0) : 0;

                    productSales.set(item.productId, {
                        name: item.productName,
                        qty: 0,
                        revenue: 0,
                        cost: cost
                    });
                }
                const p = productSales.get(item.productId)!;
                p.qty += item.quantity;
                p.revenue += item.total;
            });
        });

        const items = Array.from(productSales.values());
        if (items.length >= 2) {
            const avgQty = items.reduce((sum, i) => sum + i.qty, 0) / items.length;
            const avgProfit = items.reduce((sum, i) => sum + (i.revenue - (i.cost * i.qty)), 0) / items.length;

            const stars = items.filter(i =>
                i.qty >= avgQty &&
                (i.revenue - (i.cost * i.qty)) >= avgProfit
            );

            if (stars.length > 0) {
                const topStar = stars.sort((a, b) =>
                    (b.revenue - (b.cost * b.qty)) - (a.revenue - (a.cost * a.qty))
                )[0];

                insights.push({
                    id: 'star-product-success',
                    type: 'success',
                    category: 'products',
                    title: `⭐ "${topStar.name}" é sua Estrela!`,
                    description: `Este produto vende muito e tem margem excelente. Garanta estoque sempre disponível, mantenha a qualidade e considere criar variações.`,
                    impact: 'medium',
                    actionable: true,
                    actionLabel: 'Ver Desempenho',
                    actionLink: '/products',
                    metrics: {
                        current: `${topStar.qty} vendidos`,
                        potential: formatCurrency(topStar.revenue - (topStar.cost * topStar.qty))
                    }
                });
            }
        }

        // === 7. ANÁLISE DE CLIENTES (Retenção) ===
        const activeCustomers = customers.filter(c => {
            if (!c.lastOrderDate) return false;
            const daysSince = Math.floor(
                (now.getTime() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysSince <= 30;
        });

        const retentionRate = customers.length > 0
            ? (activeCustomers.length / customers.length) * 100
            : 0;

        if (retentionRate < 40 && customers.length > 10) {
            insights.push({
                id: 'low-retention-warning',
                type: 'warning',
                category: 'customers',
                title: '👥 Baixa Retenção de Clientes',
                description: `Apenas ${retentionRate.toFixed(0)}% dos clientes compraram nos últimos 30 dias. Implemente programa de fidelidade ou campanhas de reativação.`,
                impact: 'high',
                actionable: true,
                actionLabel: 'Ver Clientes Inativos',
                actionLink: '/customers',
                metrics: {
                    current: `${retentionRate.toFixed(0)}%`,
                    suggested: '70%+ recomendado'
                }
            });
        }

        // === 8. META DO DIA (Performance) ===
        const todayOrders = orders.filter(o => {
            const orderDate = new Date(o.date);
            return orderDate >= today && o.status !== 'canceled';
        });

        const todayRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const monthlyGoal = settings.estimatedMonthlyBilling || 50000;
        const dailyGoal = monthlyGoal / 26;
        const progress = (todayRevenue / dailyGoal) * 100;

        if (progress >= 100) {
            insights.push({
                id: 'daily-goal-achieved',
                type: 'success',
                category: 'sales',
                title: '🎯 Meta do Dia Atingida!',
                description: `Parabéns! Você já bateu ${progress.toFixed(0)}% da meta diária com ${formatCurrency(todayRevenue)} em vendas. Continue assim!`,
                impact: 'low',
                actionable: false
            });
        } else if (progress < 50) {
            const now = new Date();
            const currentHour = now.getHours();

            if (currentHour >= 14) { // Após 14h, alerta se abaixo de 50%
                insights.push({
                    id: 'daily-goal-warning',
                    type: 'warning',
                    category: 'sales',
                    title: '⏰ Atenção: Meta do Dia em Risco',
                    description: `Você está em ${progress.toFixed(0)}% da meta. Faltam ${formatCurrency(dailyGoal - todayRevenue)}. Considere criar uma promoção relâmpago.`,
                    impact: 'medium',
                    actionable: true,
                    actionLabel: 'Impulsar Vendas',
                    actionLink: '/pos'
                });
            }
        }

        // Ordenar por impacto (high > medium > low) e tipo (critical > warning > opportunity > success)
        const priorityOrder = {
            critical: 4, warning: 3, opportunity: 2, success: 1
        };
        const impactOrder = {
            high: 3, medium: 2, low: 1
        };

        return insights.sort((a, b) => {
            if (priorityOrder[a.type] !== priorityOrder[b.type]) {
                return priorityOrder[b.type] - priorityOrder[a.type];
            }
            return impactOrder[b.impact] - impactOrder[a.impact];
        });

    }, [orders, products, ingredients, customers, settings]);

    // Pegar os top 3 insights mais importantes
    const topInsights = aiInsights.slice(0, 3);

    const getInsightIcon = (category: string) => {
        switch (category) {
            case 'pricing': return DollarSign;
            case 'inventory': return Package;
            case 'sales': return ShoppingCart;
            case 'products': return Award;
            case 'customers': return Users;
            case 'trend': return TrendingUp;
            default: return Lightbulb;
        }
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'critical':
                return 'bg-red-50 border-red-200 hover:bg-red-100';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
            case 'opportunity':
                return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
            case 'success':
                return 'bg-green-50 border-green-200 hover:bg-green-100';
            default:
                return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
        }
    };

    const getIconColor = (type: string) => {
        switch (type) {
            case 'critical': return 'text-red-600';
            case 'warning': return 'text-yellow-600';
            case 'opportunity': return 'text-blue-600';
            case 'success': return 'text-green-600';
            default: return 'text-gray-600';
        }
    };

    if (topInsights.length === 0) {
        return (
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-8 border border-violet-100">
                <div className="text-center">
                    <Brain className="mx-auto h-12 w-12 text-violet-400 mb-3" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                        IA Analisando seus Dados
                    </h3>
                    <p className="text-sm text-gray-600">
                        A inteligência artificial está coletando informações suficientes para gerar insights personalizados.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-300 rounded-full blur-3xl"></div>
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30">
                            <Brain className="text-white" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white flex items-center gap-2">
                                FoodCost AI Advisor
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500 text-white animate-pulse">
                                    LIVE
                                </span>
                            </h2>
                            <p className="text-sm text-purple-100 font-medium">
                                Insights em tempo real para impulsionar seus resultados
                            </p>
                        </div>
                    </div>
                    <Sparkles className="text-yellow-300 animate-pulse" size={24} />
                </div>

                {/* Insights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topInsights.map((insight) => {
                        const Icon = getInsightIcon(insight.category);
                        return (
                            <div
                                key={insight.id}
                                className={`${getTypeStyles(insight.type)} rounded-xl p-5 border-2 transition-all duration-300 group`}
                            >
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`p-2 rounded-lg ${getIconColor(insight.type)} bg-white/80`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-gray-900 mb-1 leading-tight">
                                            {insight.title}
                                        </h4>
                                        <p className="text-xs text-gray-700 leading-relaxed">
                                            {insight.description}
                                        </p>
                                    </div>
                                </div>

                                {/* Metrics */}
                                {insight.metrics && (
                                    <div className="text-xs space-y-1 mb-3 bg-white/50 rounded-lg p-2">
                                        {insight.metrics.current && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 font-medium">Atual:</span>
                                                <span className="font-bold text-gray-900">{insight.metrics.current}</span>
                                            </div>
                                        )}
                                        {insight.metrics.suggested && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 font-medium">Sugerido:</span>
                                                <span className="font-bold text-gray-900">{insight.metrics.suggested}</span>
                                            </div>
                                        )}
                                        {insight.metrics.potential && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-600 font-medium">Potencial:</span>
                                                <span className="font-bold text-green-700">{insight.metrics.potential}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Button */}
                                {insight.actionable && insight.actionLink && (
                                    <Link
                                        to={insight.actionLink}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-gray-800 hover:text-gray-900 group-hover:gap-2 transition-all"
                                    >
                                        {insight.actionLabel} <ChevronRight size={14} />
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Stats */}
                <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-purple-100">
                        <Zap size={14} />
                        <span className="font-medium">{aiInsights.length} insights identificados</span>
                    </div>
                    <div className="text-purple-200 font-medium">
                        Última análise: agora
                    </div>
                </div>
            </div>
        </div>
    );
};
