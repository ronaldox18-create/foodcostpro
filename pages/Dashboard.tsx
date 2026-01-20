import React, { useMemo, useState } from 'react';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart, Line, Legend } from 'recharts';
import { useApp } from '../contexts/AppContext';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Activity,
    PieChart,
    Zap,
    Award,
    Clock,
    Users,
    ArrowUpRight,
    Target,
    Crown,
    CalendarCheck,
    Package,
    AlertTriangle,
    CheckCircle2,
    Info,
    ArrowRight,
    TrendingDown as Minimize,
    RefreshCw,
    BarChart3,
    Percent,
    Calculator,
    FileText,
    FileSpreadsheet,
    Download,
    Megaphone,
    Lightbulb,
    Brain,
    Sparkles,
    Bell,
    BellRing,
    Lock,
    Settings,
    Plus,
    Eye,
    Boxes,
    Rocket,
    ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/calculations';
import { exportOrdersToCSV, generatePDFReport } from '../utils/export';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import BusinessHoursWidget from '../components/BusinessHoursWidget';
import { generateForecast } from '../utils/forecast';
import { FoodCostAIAdvisor } from '../components/FoodCostAIAdvisor';
import { AIInsightsEngine } from '../components/AIInsightsEngine';
import PlanGuard from '../components/PlanGuard';

const Dashboard: React.FC = () => {
    const { orders, ingredients, products, customers, settings, fixedCosts } = useApp();
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'custom'>('today');
    const [customStart, setCustomStart] = useState<string>(new Date().toISOString().split('T')[0]);
    const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);

    // ========================================================================
    // UTILITÁRIOS E HELPERS
    // ========================================================================

    const getDateRange = (range: 'today' | 'week' | 'month' | 'custom') => {
        const now = new Date();
        const start = new Date(now);
        const end = new Date(now);

        switch (range) {
            case 'today':
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'week':
                start.setDate(now.getDate() - 7);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'month':
                start.setDate(now.getDate() - 30);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                const s = new Date(customStart);
                s.setHours(0, 0, 0, 0);
                const sLocal = new Date(s.valueOf() + s.getTimezoneOffset() * 60000);
                sLocal.setHours(0, 0, 0, 0);

                const e = new Date(customEnd);
                e.setHours(23, 59, 59, 999);
                const eLocal = new Date(e.valueOf() + e.getTimezoneOffset() * 60000);
                eLocal.setHours(23, 59, 59, 999);

                return { start: sLocal, end: eLocal };
        }

        return { start, end };
    };

    const compareWithPreviousPeriod = (currentStart: Date, currentEnd: Date) => {
        const durationMs = currentEnd.getTime() - currentStart.getTime();
        const previousEnd = new Date(currentStart.getTime() - 1);
        const previousStart = new Date(previousEnd.getTime() - durationMs);

        let currentRevenue = 0;
        let currentOrdersCount = 0;
        let previousRevenue = 0;
        let previousOrdersCount = 0;

        orders.forEach(order => {
            if (order.status === 'canceled') return;
            const orderDate = new Date(order.date);

            if (orderDate >= currentStart && orderDate <= currentEnd) {
                currentRevenue += order.totalAmount;
                currentOrdersCount++;
            } else if (orderDate >= previousStart && orderDate <= previousEnd) {
                previousRevenue += order.totalAmount;
                previousOrdersCount++;
            }
        });

        const revenueGrowth = previousRevenue > 0
            ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
            : 0;

        const ordersGrowth = previousOrdersCount > 0
            ? ((currentOrdersCount - previousOrdersCount) / previousOrdersCount) * 100
            : 0;

        return {
            current: { revenue: currentRevenue, orders: currentOrdersCount },
            previous: { revenue: previousRevenue, orders: previousOrdersCount },
            growth: { revenue: revenueGrowth, orders: ordersGrowth },
            previousPeriodLabel: `${previousStart.toLocaleDateString('pt-BR')} - ${previousEnd.toLocaleDateString('pt-BR')}`
        };
    };

    // ========================================================================
    // DADOS CALCULADOS PRINCIPAIS
    // ========================================================================

    // Estatísticas do período selecionado
    const periodStats = useMemo(() => {
        const { start, end } = getDateRange(timeRange);

        const periodOrders = orders.filter(o => {
            if (o.status === 'canceled') return false;
            const orderDate = new Date(o.date);
            return orderDate >= start && orderDate <= end;
        });

        const revenue = periodOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const ordersCount = periodOrders.length;
        const avgTicket = ordersCount > 0 ? revenue / ordersCount : 0;

        // Calcular custo dos pedidos do período
        let totalCost = 0;
        periodOrders.forEach(order => {
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
                    totalCost += itemCost * item.quantity;
                }
            });
        });

        const profit = revenue - totalCost;
        const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

        // --- Cálculos de Lucro Líquido Estimado ---
        const taxPercent = settings?.taxAndLossPercent || 0;
        const calculatedTaxes = revenue * (taxPercent / 100);

        // Calcular custo fixo proporcional ao período
        const totalFixedMonthly = fixedCosts.reduce((sum, cost) => sum + cost.amount, 0);
        const durationMs = end.getTime() - start.getTime();
        const daysInPeriod = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));

        // Custo fixo do período = (Total Mensal / 30) * Dias
        const calculatedFixedCosts = (totalFixedMonthly / 30) * daysInPeriod;

        const netProfit = profit - calculatedTaxes - calculatedFixedCosts;
        const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return {
            revenue,
            ordersCount,
            avgTicket,
            totalCost,
            profit,
            profitMargin,
            orders: periodOrders,
            calculatedTaxes,
            calculatedFixedCosts,
            netProfit,
            netMargin,
            taxPercent,
            daysInPeriod
        };
    }, [orders, products, ingredients, timeRange, fixedCosts, settings, customStart, customEnd]);

    // Comparação com período anterior
    const comparison = useMemo(() => {
        const { start, end } = getDateRange(timeRange);
        return compareWithPreviousPeriod(start, end);
    }, [orders, timeRange, customStart, customEnd]);

    // Performance de hoje (sempre calculado)
    const todayPerformance = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayOrders = orders.filter(o => {
            const orderDate = new Date(o.date);
            return orderDate >= today && o.status !== 'canceled';
        });

        const revenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const monthlyGoal = settings.estimatedMonthlyBilling || 50000;
        const dailyGoal = monthlyGoal / 26; // 26 dias úteis
        const progress = Math.min((revenue / dailyGoal) * 100, 100);

        return {
            revenue,
            ordersCount: todayOrders.length,
            dailyGoal,
            progress,
            remaining: Math.max(0, dailyGoal - revenue)
        };
    }, [orders, settings]);

    // Dados semanais para gráfico
    const weeklyChartData = useMemo(() => {
        const today = new Date();
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });

        return last7Days.map(date => {
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);

            const dayOrders = orders.filter(o => {
                const orderDate = new Date(o.date);
                return orderDate >= date && orderDate < nextDay && o.status !== 'canceled';
            });

            const revenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

            return {
                day: date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3),
                date: date,
                revenue,
                ordersCount: dayOrders.length
            };
        });
    }, [orders]);

    // Top produtos mais vendidos
    const topProducts = useMemo(() => {
        const productSales = new Map<string, { name: string; quantity: number; revenue: number }>();

        periodStats.orders.forEach(order => {
            order.items.forEach(item => {
                const existing = productSales.get(item.productId);
                if (existing) {
                    existing.quantity += item.quantity;
                    existing.revenue += item.total;
                } else {
                    productSales.set(item.productId, {
                        name: item.productName,
                        quantity: item.quantity,
                        revenue: item.total
                    });
                }
            });
        });

        return Array.from(productSales.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
    }, [periodStats.orders]);

    // Análise de horários de pico
    const peakHoursAnalysis = useMemo(() => {
        const hourlyData = Array(24).fill(0).map((_, hour) => ({
            hour,
            revenue: 0,
            ordersCount: 0
        }));

        periodStats.orders.forEach(order => {
            const hour = new Date(order.date).getHours();
            hourlyData[hour].revenue += order.totalAmount;
            hourlyData[hour].ordersCount++;
        });

        const maxRevenue = Math.max(...hourlyData.map(h => h.revenue), 1);

        return hourlyData.map(h => ({
            ...h,
            intensity: h.revenue / maxRevenue
        }));
    }, [periodStats.orders]);

    // Análise do melhor dia da semana
    const bestDayAnalysis = useMemo(() => {
        const dayStats = new Map<string, { revenue: number; orders: number }>();
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        periodStats.orders.forEach(order => {
            const dayOfWeek = new Date(order.date).getDay();
            const dayName = dayNames[dayOfWeek];

            const existing = dayStats.get(dayName) || { revenue: 0, orders: 0 };
            existing.revenue += order.totalAmount;
            existing.orders++;
            dayStats.set(dayName, existing);
        });

        const dayArray = Array.from(dayStats.entries()).map(([day, stats]) => ({
            day,
            ...stats,
            avgTicket: stats.orders > 0 ? stats.revenue / stats.orders : 0
        }));

        const bestDay = dayArray.reduce((max, current) =>
            current.revenue > max.revenue ? current : max,
            { day: '-', revenue: 0, orders: 0, avgTicket: 0 }
        );

        return { bestDay, allDays: dayArray };
    }, [periodStats.orders]);

    // Sugestões inteligentes baseadas nos dados
    const smartSuggestions = useMemo(() => {
        const suggestions = [];

        // Sugestão baseada em ticket médio
        if (periodStats.avgTicket > 0 && periodStats.avgTicket < 30) {
            suggestions.push({
                icon: '💡',
                title: 'Aumente o Ticket Médio',
                suggestion: 'Crie combos ou sugira acompanhamentos para aumentar o valor médio por pedido.',
                priority: 'high'
            });
        }

        // Sugestão baseada em horários de pico
        const peakHour = peakHoursAnalysis.reduce((max, h) => h.revenue > max.revenue ? h : max, peakHoursAnalysis[0]);
        if (peakHour && peakHour.hour) {
            suggestions.push({
                icon: '⏰',
                title: `Pico às ${peakHour.hour}h`,
                suggestion: `Garanta estoque extra e equipe disponível neste horário.`,
                priority: 'medium'
            });
        }

        // Sugestão baseada no melhor dia
        if (bestDayAnalysis.bestDay.day !== '-') {
            suggestions.push({
                icon: '📅',
                title: `${bestDayAnalysis.bestDay.day} é seu melhor dia`,
                suggestion: `Crie promoções para os dias menos movimentados.`,
                priority: 'medium'
            });
        }

        // Sugestão de margem
        if (periodStats.profitMargin < 50) {
            suggestions.push({
                icon: '📊',
                title: 'Revise seus Preços',
                suggestion: `Sua margem de ${periodStats.profitMargin.toFixed(1)}% está abaixo do ideal (60%+).`,
                priority: 'high'
            });
        }

        return suggestions;
    }, [periodStats, peakHoursAnalysis, bestDayAnalysis]);

    // Análise de saúde do negócio
    const healthIndicators = useMemo(() => {
        const indicators = [];

        // Margem de Lucro
        if (periodStats.profitMargin < 50) {
            indicators.push({
                type: 'warning',
                title: 'Margem de Lucro Baixa',
                description: `Sua margem está em ${periodStats.profitMargin.toFixed(1)}%. Recomendado: acima de 60%.`,
                action: 'Revisar Preços',
                link: '/products'
            });
        }

        // Estoque Baixo
        const lowStock = ingredients.filter(ing =>
            ing.currentStock !== undefined &&
            ing.minStock !== undefined &&
            ing.currentStock < ing.minStock
        );

        if (lowStock.length > 0) {
            indicators.push({
                type: 'alert',
                title: `${lowStock.length} ${lowStock.length === 1 ? 'Item' : 'Itens'} com Estoque Baixo`,
                description: 'Alguns ingredientes precisam de reposição urgente.',
                action: 'Ver Estoque',
                link: '/inventory'
            });
        }

        return indicators;
    }, [periodStats, ingredients]);

    // --- HANDLERS DE EXPORTAÇÃO ---
    const handleExportPDF = () => {
        const salesByDate = new Map<string, { date: string, revenue: number, ordersCount: number }>();

        periodStats.orders.forEach(order => {
            const dateObj = new Date(order.date);
            const dateKey = dateObj.toLocaleDateString();

            if (!salesByDate.has(dateKey)) {
                salesByDate.set(dateKey, {
                    date: order.date,
                    revenue: 0,
                    ordersCount: 0
                });
            }

            const data = salesByDate.get(dateKey)!;
            data.revenue += order.totalAmount;
            data.ordersCount++;
        });

        const dailySales = Array.from(salesByDate.values())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(d => ({
                date: d.date,
                day: new Date(d.date).toLocaleDateString('pt-BR', { weekday: 'short' }),
                revenue: d.revenue,
                ordersCount: d.ordersCount
            }));

        generatePDFReport({
            period: timeRange === 'today' ? 'Hoje' : timeRange === 'week' ? 'Últimos 7 Dias' : 'Últimos 30 Dias',
            generatedAt: new Date().toLocaleString('pt-BR'),
            businessName: settings.businessName || 'Meu Negócio',
            summary: {
                revenue: periodStats.revenue,
                orders: periodStats.ordersCount,
                averageTicket: periodStats.avgTicket,
                cost: periodStats.totalCost,
                profit: periodStats.profit,
                margin: periodStats.profitMargin
            },
            topProducts: topProducts,
            dailySales: dailySales
        });
    };

    const handleExportCSV = () => {
        exportOrdersToCSV(periodStats.orders, products, `vendas_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    // --- NOTIFICAÇÕES SYSTEM ---
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
        Notification.permission
    );

    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            alert('Este navegador não suporta notificações de sistema.');
            return;
        }
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === 'granted') {
            new Notification('Notificações Ativadas', {
                body: 'Você receberá alertas importantes do FoodCost Pro.',
            });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">

            {/* HEADER & CONTROLS */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                            Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">
                            Bem-vindo ao <span className="text-orange-600 font-bold">{settings.businessName || 'seu negócio'}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Period Selector */}
                        <div className="bg-gray-100 p-1 rounded-xl flex">
                            {(['today', 'week', 'month'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeRange === range
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900'
                                        }`}
                                >
                                    {range === 'today' ? 'Hoje' : range === 'week' ? '7 Dias' : '30 Dias'}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <PlanGuard feature="financialReports" showLock={false} fallback={null}>
                                <button onClick={handleExportPDF} className="p-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-orange-200 hover:text-orange-600 transition-colors" title="Exportar PDF">
                                    <FileText size={18} />
                                </button>
                                <button onClick={handleExportCSV} className="p-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-green-200 hover:text-green-600 transition-colors" title="Exportar Excel">
                                    <FileSpreadsheet size={18} />
                                </button>
                            </PlanGuard>
                            <button
                                onClick={requestNotificationPermission}
                                className={`p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors ${notificationPermission === 'granted' ? 'text-violet-600 border-violet-100' : 'text-gray-700'}`}
                                title="Notificações"
                            >
                                {notificationPermission === 'granted' ? <BellRing size={18} /> : <Bell size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* HERO SECTION - META DO DIA */}
            <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIwLjUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>

                <div className="relative z-10">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2 text-orange-100 text-xs font-bold uppercase tracking-wider">
                                <Target size={16} />
                                Meta de Hoje
                            </div>
                            <div>
                                <h2 className="text-5xl font-black mb-2">{formatCurrency(todayPerformance.revenue)}</h2>
                                <p className="text-orange-100 font-medium text-sm">
                                    {todayPerformance.ordersCount} {todayPerformance.ordersCount === 1 ? 'pedido realizado' : 'pedidos realizados'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                                    <div
                                        className="h-full bg-white rounded-full transition-all duration-1000 ease-out shadow-lg"
                                        style={{ width: `${Math.min(todayPerformance.progress, 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-orange-100 font-medium">
                                    {todayPerformance.remaining > 0
                                        ? `Faltam ${formatCurrency(todayPerformance.remaining)} para atingir ${formatCurrency(todayPerformance.dailyGoal)}`
                                        : '🎉 Meta do dia atingida! Continue assim!'}
                                </p>
                            </div>
                        </div>

                        <div className="relative w-32 h-32 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/20" />
                                <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray={352}
                                    strokeDashoffset={352 - (352 * Math.min(todayPerformance.progress, 100)) / 100}
                                    className="text-white transition-all duration-1000"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-black">{Math.round(todayPerformance.progress)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* IA ADVISOR - DESTAQUE */}
            <PlanGuard feature="aiConsultant" showLock={true} fallback={
                <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-8 border-2 border-dashed border-violet-200 text-center">
                    <Lock className="mx-auto text-violet-300 mb-3" size={32} />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">🤖 IA Advisor disponível no Plano PRO</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Desbloqueie insights inteligentes em tempo real e recomendações personalizadas para maximizar seus lucros.
                    </p>
                    <Link to="/account" className="inline-flex items-center gap-2 bg-violet-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-violet-700 transition-colors">
                        Fazer Upgrade <ChevronRight size={16} />
                    </Link>
                </div>
            }>
                <AIInsightsEngine />
            </PlanGuard>

            {/* KPI METRICS - 4 CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                            <DollarSign className="text-emerald-600" size={24} />
                        </div>
                        {comparison.growth.revenue >= 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                <TrendingUp size={12} /> +{comparison.growth.revenue.toFixed(1)}%
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                                <TrendingDown size={12} /> {comparison.growth.revenue.toFixed(1)}%
                            </span>
                        )}
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Faturamento</p>
                    <h3 className="text-2xl font-black text-gray-900">{formatCurrency(periodStats.revenue)}</h3>
                </div>

                {/* Orders */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                            <ShoppingBag className="text-blue-600" size={24} />
                        </div>
                        {comparison.growth.orders >= 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                <TrendingUp size={12} /> +{comparison.growth.orders.toFixed(1)}%
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                                <TrendingDown size={12} /> {comparison.growth.orders.toFixed(1)}%
                            </span>
                        )}
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Pedidos</p>
                    <h3 className="text-2xl font-black text-gray-900">{periodStats.ordersCount}</h3>
                </div>

                {/* Average Ticket */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl group-hover:bg-purple-100 transition-colors">
                            <Calculator className="text-purple-600" size={24} />
                        </div>
                    </div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Ticket Médio</p>
                    <h3 className="text-2xl font-black text-gray-900">{formatCurrency(periodStats.avgTicket)}</h3>
                </div>

                {/* Margin */}
                <PlanGuard feature="financialReports" showLock={true} fallback={
                    <div className="bg-gray-50 rounded-2xl p-6 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
                        <Lock className="text-gray-300 mb-2" size={24} />
                        <p className="text-xs font-bold text-gray-400">Margem (PRO)</p>
                    </div>
                }>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl transition-colors ${periodStats.profitMargin >= 60 ? 'bg-green-50 group-hover:bg-green-100' : 'bg-orange-50 group-hover:bg-orange-100'}`}>
                                <Percent className={periodStats.profitMargin >= 60 ? 'text-green-600' : 'text-orange-600'} size={24} />
                            </div>
                            <span className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded-lg ${periodStats.profitMargin >= 60 ? 'text-green-600 bg-green-50' : 'text-orange-600 bg-orange-50'}`}>
                                {periodStats.profitMargin >= 60 ? 'Saudável' : 'Atenção'}
                            </span>
                        </div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Margem de Lucro</p>
                        <h3 className="text-2xl font-black text-gray-900">{periodStats.profitMargin.toFixed(1)}%</h3>
                    </div>
                </PlanGuard>
            </div>

            {/* MAIN CONTENT - 2 COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN (2/3) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* DRE - DEMONSTRATIVO DE RESULTADOS */}
                    <PlanGuard feature="financialReports" showLock={true} fallback={
                        <div className="bg-gray-50 rounded-2xl p-8 border-2 border-dashed border-gray-200 text-center">
                            <Lock className="text-gray-300 mx-auto mb-3" size={32} />
                            <p className="text-sm font-bold text-gray-400">Demonstrativo Financeiro disponível no PRO</p>
                        </div>
                    }>
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
                                <BarChart3 className="text-blue-500" size={20} />
                                Demonstrativo de Resultados
                            </h3>

                            <div className="space-y-3">
                                {/* Receita Bruta */}
                                <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                        <span className="font-bold text-sm text-gray-700">Receita Bruta</span>
                                    </div>
                                    <span className="font-black text-emerald-700">{formatCurrency(periodStats.revenue)}</span>
                                </div>

                                {/* Custo (CMV) */}
                                <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span className="font-bold text-sm text-gray-700">(-) Custo dos Produtos (CMV)</span>
                                    </div>
                                    <span className="font-black text-red-700">-{formatCurrency(periodStats.totalCost)}</span>
                                </div>

                                {/* Lucro Bruto */}
                                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="font-bold text-sm text-gray-900">(=) Lucro Bruto</span>
                                    </div>
                                    <span className="font-black text-blue-700">{formatCurrency(periodStats.profit)}</span>
                                </div>

                                {/* Impostos e Taxas */}
                                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                        <span className="font-bold text-sm text-gray-700">(-) Impostos ({periodStats.taxPercent}%)</span>
                                    </div>
                                    <span className="font-black text-orange-700">-{formatCurrency(periodStats.calculatedTaxes)}</span>
                                </div>

                                {/* Custos Fixos */}
                                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <span className="font-bold text-sm text-gray-700">(-) Custos Fixos (prop.)</span>
                                    </div>
                                    <span className="font-black text-purple-700">-{formatCurrency(periodStats.calculatedFixedCosts)}</span>
                                </div>

                                {/* Lucro Líquido */}
                                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl border-2 border-gray-700 mt-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                        <span className="font-black text-sm text-white">(=) Lucro Líquido Estimado</span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-black text-lg ${periodStats.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {formatCurrency(periodStats.netProfit)}
                                        </span>
                                        <p className="text-xs text-gray-400 mt-1">{periodStats.netMargin.toFixed(1)}% da receita</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-400 mt-4 text-center italic">
                                * Custos fixos proporcionais a {periodStats.daysInPeriod} {periodStats.daysInPeriod === 1 ? 'dia' : 'dias'}
                            </p>
                        </div>
                    </PlanGuard>

                    {/* GRÁFICO DE DESEMPENHO SEMANAL */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <Activity className="text-orange-500" size={20} />
                                Desempenho Últimos 7 Dias
                            </h3>
                            <Link to="/all-orders" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                                Ver Todos <ChevronRight size={14} />
                            </Link>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#F97316" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                        tickFormatter={(value) => `R$${value}`}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        cursor={{ stroke: '#F97316', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#F97316"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                </div>

                {/* RIGHT COLUMN (1/3) - SIDEBAR */}
                <div className="space-y-6">

                    {/* ALERTAS CRÍTICOS */}
                    {healthIndicators.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Alertas</h3>
                            {healthIndicators.slice(0, 2).map((indicator, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-xl border-l-4 ${indicator.type === 'alert' ? 'bg-red-50 border-red-500' :
                                        indicator.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                                            'bg-green-50 border-green-500'
                                        }`}
                                >
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 pt-0.5">
                                            {indicator.type === 'alert' ? <AlertTriangle size={16} className="text-red-600" /> :
                                                indicator.type === 'warning' ? <Info size={16} className="text-yellow-600" /> :
                                                    <CheckCircle2 size={16} className="text-green-600" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm text-gray-900 mb-1">{indicator.title}</h4>
                                            <p className="text-xs text-gray-600">{indicator.description}</p>
                                            {indicator.link && (
                                                <Link
                                                    to={indicator.link}
                                                    className="text-xs font-bold mt-2 inline-flex items-center gap-1 text-gray-700 hover:text-gray-900"
                                                >
                                                    {indicator.action} <ChevronRight size={12} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* TOP PRODUTOS */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                <Award className="text-yellow-500" size={18} />
                                Top Produtos
                            </h3>
                        </div>
                        <div className="space-y-2">
                            {topProducts.slice(0, 5).map((p, i) => (
                                <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            i === 1 ? 'bg-gray-100 text-gray-600' :
                                                i === 2 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400'
                                            }`}>
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-bold text-xs text-gray-800 truncate">{p.name}</p>
                                            <p className="text-[10px] text-gray-400">{p.quantity} vendidos</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-xs text-gray-900 flex-shrink-0">{formatCurrency(p.revenue)}</span>
                                </div>
                            ))}
                            {topProducts.length === 0 && (
                                <p className="text-center text-gray-400 text-xs py-4">Sem vendas no período</p>
                            )}
                        </div>
                    </div>

                    {/* HORÁRIOS DE PICO */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2 mb-4">
                            <Clock className="text-blue-500" size={18} />
                            Horários de Pico
                        </h3>
                        <div className="h-24 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={peakHoursAnalysis}>
                                    <defs>
                                        <linearGradient id="miniChartPeak" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#miniChartPeak)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                        {(() => {
                            const peak = peakHoursAnalysis.reduce((max, h) => h.revenue > max.revenue ? h : max, peakHoursAnalysis[0]);
                            return peak.revenue > 0 ? (
                                <p className="text-center text-xs font-medium text-gray-600 mt-2">
                                    Pico às <span className="text-blue-600 font-bold">{peak.hour}h</span> com {formatCurrency(peak.revenue)}
                                </p>
                            ) : (
                                <p className="text-center text-xs text-gray-400 mt-2">Sem dados no período</p>
                            );
                        })()}
                    </div>

                    {/* MELHOR DIA DA SEMANA */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <CalendarCheck size={18} />
                            <h3 className="font-bold text-sm">Melhor Dia da Semana</h3>
                        </div>

                        {bestDayAnalysis.bestDay.revenue > 0 ? (
                            <div className="space-y-2">
                                <div className="text-center py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                                    <p className="text-3xl font-black mb-1">{bestDayAnalysis.bestDay.day}</p>
                                    <p className="text-xs text-indigo-100">
                                        {formatCurrency(bestDayAnalysis.bestDay.revenue)} em vendas
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-white/10 rounded-lg p-2 text-center">
                                        <p className="text-xs text-indigo-100">Pedidos</p>
                                        <p className="font-bold">{bestDayAnalysis.bestDay.orders}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-lg p-2 text-center">
                                        <p className="text-xs text-indigo-100">Ticket Médio</p>
                                        <p className="font-bold">{formatCurrency(bestDayAnalysis.bestDay.avgTicket)}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-indigo-100 text-xs py-4">Sem dados suficientes</p>
                        )}
                    </div>

                    {/* SUGESTÕES INTELIGENTES */}
                    {smartSuggestions.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <Lightbulb className="text-yellow-500" size={18} />
                                <h3 className="font-bold text-sm text-gray-900">Sugestões Inteligentes</h3>
                            </div>

                            <div className="space-y-3">
                                {smartSuggestions.map((sug, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-xl border-l-4 ${sug.priority === 'high'
                                                ? 'bg-orange-50 border-orange-500'
                                                : sug.priority === 'medium'
                                                    ? 'bg-blue-50 border-blue-500'
                                                    : 'bg-gray-50 border-gray-300'
                                            }`}
                                    >
                                        <div className="flex gap-2">
                                            <span className="text-lg flex-shrink-0">{sug.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-xs text-gray-900 mb-1">{sug.title}</p>
                                                <p className="text-[11px] text-gray-600 leading-relaxed">{sug.suggestion}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* QUICK ACTIONS */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-sm text-gray-900 mb-4">Ações Rápidas</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <Link
                                to="/pos"
                                className="p-3 bg-orange-50 border border-orange-100 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-orange-100 transition-all group"
                            >
                                <Plus size={20} className="text-orange-600 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-orange-700">Nova Venda</span>
                            </Link>
                            <Link
                                to="/products"
                                className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-blue-100 transition-all group"
                            >
                                <Package size={20} className="text-blue-600 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-blue-700">Produtos</span>
                            </Link>
                            <Link
                                to="/inventory"
                                className="p-3 bg-purple-50 border border-purple-100 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-purple-100 transition-all group"
                            >
                                <Boxes size={20} className="text-purple-600 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-purple-700">Estoque</span>
                            </Link>
                            <Link
                                to="/all-orders"
                                className="p-3 bg-green-50 border border-green-100 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-green-100 transition-all group"
                            >
                                <Eye size={20} className="text-green-600 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-green-700">Ver Pedidos</span>
                            </Link>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default Dashboard;
