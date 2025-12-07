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
    BellRing
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/calculations';
import { exportOrdersToCSV, generatePDFReport } from '../utils/export';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import BusinessHoursWidget from '../components/BusinessHoursWidget';
import { generateForecast } from '../utils/forecast';

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
                // Adicionar fuso horário se necessário, mas input date geralmente é local
                // Ajustar para garantir que pegamos o dia correto independente do fuso do navegador
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
        // Calcular duração do período atual
        const durationMs = currentEnd.getTime() - currentStart.getTime();

        // Período anterior termina 1ms antes do atual começar
        const previousEnd = new Date(currentStart.getTime() - 1);
        // Período anterior começa 'duração' antes do seu fim
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

    // Meta mensal
    const monthlyGoalProgress = useMemo(() => {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthOrders = orders.filter(o => {
            const orderDate = new Date(o.date);
            return orderDate >= monthStart && orderDate <= now && o.status !== 'canceled';
        });

        const currentRevenue = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        const monthlyGoal = settings.estimatedMonthlyBilling || 50000;
        const progress = Math.min((currentRevenue / monthlyGoal) * 100, 100);

        return {
            current: currentRevenue,
            goal: monthlyGoal,
            progress,
            remaining: Math.max(0, monthlyGoal - currentRevenue)
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

    // Top clientes
    const topCustomers = useMemo(() => {
        return [...customers]
            .filter(c => c.totalSpent > 0)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 5);
    }, [customers]);

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

    // Previsão de Vendas (IA) e Tendências
    const salesForecast = useMemo(() => {
        // Pegar últimos 30 dias para basear a tendência
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

        // Gerar previsão para próximos 7 dias
        const { forecast, trend, slope } = generateForecast(last30Days, 7);

        // Formatar dados para o gráfico (combinar histórico recente + forecast)
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

        // Conectar visualmente o último ponto real ao primeiro previsto
        if (chartHistory.length > 0 && chartForecast.length > 0) {
            const lastReal = chartHistory[chartHistory.length - 1];
            chartForecast.unshift({
                day: lastReal.day,
                revenue: null,
                forecast: lastReal.revenue
            });
        }

        return {
            data: [...chartHistory, ...chartForecast],
            trend,
            slope
        };
    }, [orders]);

    // IA: Análise de Engenharia de Cardápio (Menu Engineering)
    const menuInsights = useMemo(() => {
        if (periodStats.orders.length === 0) return [];

        // 1. Calcular dados por produto (Vendas e Custos)
        const productData = new Map();

        // Precisamos iterar sobre periodStats.orders para pegar o volume do período
        periodStats.orders.forEach(o => {
            o.items.forEach(item => {
                if (!productData.has(item.productId)) {
                    productData.set(item.productId, {
                        name: item.productName,
                        qty: 0,
                        revenue: 0,
                        cost: 0
                    });
                }
                const p = productData.get(item.productId);
                p.qty += item.quantity;
                p.revenue += item.total;

                // Calcular custo estimado dessa venda
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
        if (items.length < 2) return []; // Precisa de pelo menos 2 itens para comparar

        // 2. Calcular médias (Thresholds da Matriz)
        const avgQty = items.reduce((sum, i) => sum + i.qty, 0) / items.length;
        // Margem de Contribuição Unitária Média ponderada? Não, média simples dos itens para classificar o mix.
        // Ou média ponderada pelo volume? Normalmente usa-se a média aritmética simples dos itens no cardápio para classificar High/Low.
        // Vamos usar Margem de Contribuição Total do item vs Média.
        const avgContribution = items.reduce((sum, i) => sum + (i.revenue - i.cost), 0) / items.length;

        // 3. Gerar Insights de IA
        const insights = [];

        // STARS (Estrelas): Alta Venda, Alta Margem Total
        const stars = items.filter(i => i.qty >= avgQty && (i.revenue - i.cost) >= avgContribution);
        if (stars.length > 0) {
            const topStar = stars.sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost))[0];
            insights.push({
                type: 'success',
                icon: 'Star', // Usar component mapping depois ou string
                title: 'Estrela do Cardápio',
                description: `O "${topStar.name}" é seu campeão! Vende muito e lucra muito. Garanta que nunca falte estoque e mantenha a qualidade.`
            });
        }

        // PLOWHORSES (Burros de Carga): Alta Venda, Baixa Margem Total
        const plowhorses = items.filter(i => i.qty >= avgQty && (i.revenue - i.cost) < avgContribution);
        if (plowhorses.length > 0) {
            const topPlow = plowhorses.sort((a, b) => b.qty - a.qty)[0];
            insights.push({
                type: 'warning',
                icon: 'TrendingUp',
                title: 'Potencial de Lucro',
                description: `"${topPlow.name}" tem alta saída mas deixa pouco lucro. Sugestão: Aumente levemente o preço ou reduza custos da receita.`
            });
        }

        // PUZZLES (Quebra-Cabeças): Baixa Venda, Alta Margem Total
        const puzzles = items.filter(i => i.qty < avgQty && (i.revenue - i.cost) >= avgContribution);
        if (puzzles.length > 0) {
            const topPuzzle = puzzles.sort((a, b) => (b.revenue - b.cost) - (a.revenue - a.cost))[0];
            insights.push({
                type: 'info',
                icon: 'Megaphone',
                title: 'Precisa de Marketing',
                description: `"${topPuzzle.name}" é muito rentável mas vende pouco. Crie uma promoção, tire fotos melhores ou destaque-o no cardápio!`
            });
        }

        // DOGS (Cães): Baixa Venda, Baixa Margem
        // ... (Opcional, para não ser negativo demais)

        return insights;
    }, [periodStats.orders, products, ingredients]);

    // Análise de horários de pico
    const healthIndicators = useMemo(() => {
        const indicators = [];

        // 1. Margem de Lucro
        if (periodStats.profitMargin < 50) {
            indicators.push({
                type: 'warning',
                title: 'Margem de Lucro Baixa',
                description: `Sua margem está em ${periodStats.profitMargin.toFixed(1)}%. Recomendado: acima de 60%.`,
                action: 'Revisar Preços',
                link: '/products'
            });
        } else if (periodStats.profitMargin >= 70) {
            indicators.push({
                type: 'success',
                title: 'Margem Excelente',
                description: `Sua margem de ${periodStats.profitMargin.toFixed(1)}% está ótima!`,
                action: null,
                link: null
            });
        }

        // 2. Estoque Baixo
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

        // 3. Clientes Ativos
        const activeCustomers = customers.filter(c => {
            if (!c.lastOrderDate) return false;
            const daysSinceOrder = Math.floor(
                (new Date().getTime() - new Date(c.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysSinceOrder <= 30;
        });

        const customerRetention = customers.length > 0
            ? (activeCustomers.length / customers.length) * 100
            : 0;

        if (customerRetention < 30) {
            indicators.push({
                type: 'warning',
                title: 'Baixa Retenção de Clientes',
                description: `Apenas ${customerRetention.toFixed(0)}% dos clientes compraram nos últimos 30 dias.`,
                action: 'Ver Clientes',
                link: '/customers'
            });
        }

        return indicators;
    }, [periodStats, ingredients, customers]);

    const maxWeeklyRevenue = Math.max(...weeklyChartData.map(d => d.revenue), 10);

    // --- HANDLERS DE EXPORTAÇÃO ---
    const handleExportPDF = () => {
        // Agrupar vendas por dia para o relatório
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

    // Monitorar Alertas Críticos para Notificar
    React.useEffect(() => {
        if (notificationPermission !== 'granted') return;

        // 1. Estoque Baixo (Health Indicators type 'alert')
        const criticalAlerts = healthIndicators.filter(i => i.type === 'alert');
        criticalAlerts.forEach(alert => {
            const storageKey = `notified-${alert.title}-${new Date().toDateString()}`;
            if (!localStorage.getItem(storageKey)) {
                new Notification(alert.title, {
                    body: alert.description,
                    tag: 'alert'
                });
                localStorage.setItem(storageKey, 'true');
            }
        });

        // 2. IA Insights Críticos (ex: Queda de Vendas)
        if (salesForecast.trend === 'down' && !localStorage.getItem(`notified-trend-down-${new Date().toDateString()}`)) {
            new Notification('Alerta de Tendência 📉', {
                body: 'Detectamos uma queda nas vendas. Veja sugestões no Dashboard.',
                tag: 'trend'
            });
            localStorage.setItem(`notified-trend-down-${new Date().toDateString()}`, 'true');
        }

    }, [healthIndicators, salesForecast, notificationPermission]);

    return (
        <div className="space-y-6 animate-fade-in pb-20">

            {/* ========================================================================
                HEADER COM FILTROS
                ======================================================================== */}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                            <BarChart3 size={22} className="text-white" />
                        </div>
                        Dashboard Gerencial
                    </h1>
                    <p className="text-gray-500 mt-1 ml-[52px]">
                        Acompanhe o desempenho de <span className="font-semibold text-gray-700">{settings.businessName || 'seu negócio'}</span> em tempo real
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Botões de Exportação */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-orange-600 hover:border-orange-200 transition-all text-sm font-medium shadow-sm"
                            title="Exportar Relatório em PDF"
                        >
                            <FileText size={16} />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:text-green-600 hover:border-green-200 transition-all text-sm font-medium shadow-sm"
                            title="Exportar Dados em Excel/CSV"
                        >
                            <FileSpreadsheet size={16} />
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                        <button
                            onClick={requestNotificationPermission}
                            className={`flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium shadow-sm ${notificationPermission === 'granted' ? 'text-violet-600 border-violet-200' : 'hover:text-violet-600 hover:border-violet-200'}`}
                            title={notificationPermission === 'granted' ? 'Notificações Ativas' : 'Ativar Notificações'}
                        >
                            {notificationPermission === 'granted' ? <BellRing size={16} /> : <Bell size={16} />}
                            <span className="hidden sm:inline">{notificationPermission === 'granted' ? 'Alertas On' : 'Ativar Alertas'}</span>
                        </button>
                    </div>

                    {/* Filtros de Período */}
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                            {(['today', 'week', 'month', 'custom'] as const).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${timeRange === range
                                        ? 'bg-white text-orange-600 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    {range === 'today' ? 'Hoje' : range === 'week' ? '7 Dias' : range === 'month' ? '30 Dias' : 'Personalizado'}
                                </button>
                            ))}
                        </div>

                        {timeRange === 'custom' && (
                            <div className="flex items-center gap-2 bg-white border border-orange-200 rounded-lg p-1 animate-fade-in shadow-sm">
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="text-xs border-none outline-none text-gray-700 font-medium bg-transparent px-2"
                                />
                                <span className="text-gray-400 text-xs">até</span>
                                <input
                                    type="date"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="text-xs border-none outline-none text-gray-700 font-medium bg-transparent px-2"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ========================================================================
                INDICADORES DE SAÚDE DO NEGÓCIO
                ======================================================================== */}

            {
                healthIndicators.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {healthIndicators.map((indicator, idx) => (
                            <div
                                key={idx}
                                className={`p-4 rounded-xl border-l-4 flex items-start gap-3 ${indicator.type === 'success'
                                    ? 'bg-green-50 border-green-500'
                                    : indicator.type === 'warning'
                                        ? 'bg-yellow-50 border-yellow-500'
                                        : 'bg-red-50 border-red-500'
                                    }`}
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {indicator.type === 'success' && <CheckCircle2 size={20} className="text-green-600" />}
                                    {indicator.type === 'warning' && <Info size={20} className="text-yellow-600" />}
                                    {indicator.type === 'alert' && <AlertTriangle size={20} className="text-red-600" />}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold text-sm ${indicator.type === 'success' ? 'text-green-900' :
                                        indicator.type === 'warning' ? 'text-yellow-900' :
                                            'text-red-900'
                                        }`}>
                                        {indicator.title}
                                    </h4>
                                    <p className={`text-xs mt-1 ${indicator.type === 'success' ? 'text-green-700' :
                                        indicator.type === 'warning' ? 'text-yellow-700' :
                                            'text-red-700'
                                        }`}>
                                        {indicator.description}
                                    </p>
                                    {indicator.action && indicator.link && (
                                        <Link
                                            to={indicator.link}
                                            className={`text-xs font-semibold mt-2 inline-flex items-center gap-1 hover:underline ${indicator.type === 'success' ? 'text-green-700' :
                                                indicator.type === 'warning' ? 'text-yellow-700' :
                                                    'text-red-700'
                                                }`}
                                        >
                                            {indicator.action} <ArrowRight size={12} />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            }

            {/* ========================================================================
                KPI CARDS PRINCIPAIS
                ======================================================================== */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Faturamento */}
                <Card className="border-l-4 border-l-green-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
                                    <DollarSign size={16} />
                                    Faturamento
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                    {formatCurrency(periodStats.revenue)}
                                </h2>
                                <div className="flex items-center gap-2">
                                    {comparison.growth.revenue >= 0 ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                            <TrendingUp size={12} />
                                            {comparison.growth.revenue.toFixed(1)}%
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                            <TrendingDown size={12} />
                                            {Math.abs(comparison.growth.revenue).toFixed(1)}%
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500">vs período anterior</span>
                                    {timeRange === 'custom' && (
                                        <div className="absolute top-full mt-1 bg-gray-800 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                                            Comparando com: {comparison.previousPeriodLabel}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <DollarSign size={24} className="text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pedidos */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
                                    <ShoppingBag size={16} />
                                    Total de Pedidos
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                    {periodStats.ordersCount}
                                </h2>
                                <div className="flex items-center gap-2">
                                    {comparison.growth.orders >= 0 ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                            <TrendingUp size={12} />
                                            {comparison.growth.orders.toFixed(1)}%
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                                            <TrendingDown size={12} />
                                            {Math.abs(comparison.growth.orders).toFixed(1)}%
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500">vs período anterior</span>
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <ShoppingBag size={24} className="text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Ticket Médio */}
                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
                                    <Activity size={16} />
                                    Ticket Médio
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                    {formatCurrency(periodStats.avgTicket)}
                                </h2>
                                <p className="text-xs text-gray-500">
                                    Média por pedido no período
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Activity size={24} className="text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Margem de Lucro */}
                <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-2">
                                    <Percent size={16} />
                                    Margem de Lucro
                                </div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                    {periodStats.profitMargin.toFixed(1)}%
                                </h2>
                                <div className={`text-xs font-semibold ${periodStats.profitMargin >= 70 ? 'text-green-600' :
                                    periodStats.profitMargin >= 50 ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>
                                    {periodStats.profitMargin >= 70 ? '✓ Excelente' :
                                        periodStats.profitMargin >= 50 ? '⚠ Aceitável' :
                                            '⚠ Atenção necessária'}
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Percent size={24} className="text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ========================================================================
                GRID PRINCIPAL: DESEMPENHO + ANÁLISES
                ======================================================================== */}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Coluna Esquerda (2/3) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Central de Inteligência IA */}
                    <Card className="bg-gradient-to-r from-violet-50 via-fuchsia-50 to-indigo-50 border-violet-100 overflow-hidden relative shadow-md">
                        {/* Background Effects */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-200/30 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-200/30 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none"></div>

                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-violet-900 relative z-10 text-xl">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <Brain size={24} className="text-violet-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold">FoodCost AI Advisor</h3>
                                    <p className="text-xs font-normal text-violet-700 opacity-80">Inteligência Estratégica para seu Negócio</p>
                                </div>
                                <span className="ml-auto text-[10px] font-bold px-3 py-1 bg-violet-600 text-white rounded-full tracking-wide uppercase shadow-sm animate-pulse">
                                    LIVE
                                </span>
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="relative z-10 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Coluna 1: Previsão de Vendas (Visual) */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                            <TrendingUp size={16} className="text-violet-600" />
                                            Previsão de Faturamento
                                        </h4>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${salesForecast.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            Tendência: {salesForecast.trend === 'up' ? 'Alta 📈' : salesForecast.trend === 'down' ? 'Queda 📉' : 'Estável'}
                                        </span>
                                    </div>

                                    <div className="h-[200px] w-full bg-white/50 rounded-xl border border-violet-100 p-2 shadow-sm">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ComposedChart data={salesForecast.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={5} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `k${Math.round(v / 1000)}`} />
                                                <RechartsTooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                                    labelStyle={{ fontWeight: 'bold', color: '#4B5563' }}
                                                    formatter={(val) => formatCurrency(val as number)}
                                                />
                                                <Bar dataKey="revenue" fill="#8B5CF6" barSize={16} radius={[4, 4, 0, 0]} fillOpacity={0.6} />
                                                <Line type="monotone" dataKey="forecast" stroke="#EC4899" strokeWidth={3} dot={false} strokeDasharray="4 4" />
                                            </ComposedChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="bg-white/60 p-3 rounded-lg border border-violet-100 text-xs text-gray-600">
                                        <span className="font-bold text-violet-700">Previsão (7 dias):</span> {formatCurrency(salesForecast.data.filter(d => d.forecast).reduce((sum, d) => sum + (d.forecast || 0), 0) / (salesForecast.data.filter(d => d.forecast).length || 1) * 7)}
                                        <span className="block mt-1 opacity-80">Baseado no histórico dos últimos 30 dias.</span>
                                    </div>
                                </div>

                                {/* Coluna 2: Insights Estratégicos (Ação) */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <Lightbulb size={16} className="text-amber-500" />
                                        Insights de Otimização
                                    </h4>

                                    <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                        {menuInsights.length > 0 ? (
                                            menuInsights.map((insight, idx) => (
                                                <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                                                    <div className="flex items-start gap-3">
                                                        <div className={`p-2 rounded-lg flex-shrink-0 ${insight.type === 'success' ? 'bg-green-100 text-green-600' :
                                                            insight.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                                                insight.type === 'info' ? 'bg-blue-100 text-blue-600' :
                                                                    'bg-gray-100'
                                                            }`}>
                                                            {insight.icon === 'Star' ? <Award size={18} /> :
                                                                insight.icon === 'TrendingUp' ? <TrendingUp size={18} /> :
                                                                    <Megaphone size={18} />}
                                                        </div>
                                                        <div>
                                                            <h5 className="font-bold text-gray-800 text-sm group-hover:text-violet-700 transition-colors">{insight.title}</h5>
                                                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                                                                {insight.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 text-sm bg-white/40 rounded-xl border border-dashed border-gray-200">
                                                <Sparkles className="mx-auto mb-2 opacity-50" />
                                                Coletando dados para gerar insights...
                                            </div>
                                        )}

                                        {/* Insight Padrão de Anomalia (Simulado se não tiver warning real) */}
                                        {salesForecast.trend === 'down' && (
                                            <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-lg bg-red-100 text-red-600 flex-shrink-0">
                                                        <AlertTriangle size={18} />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-red-800 text-sm">Alerta de Tendência</h5>
                                                        <p className="text-xs text-red-700 mt-1">
                                                            Detectamos uma queda nas vendas recentes. Considere lançar uma <strong>Oferta Relâmpago</strong> para reativar clientes inativos.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                    {/* Performance de Hoje */}
                    <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border-0 overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 to-purple-500/10 rounded-full -mr-48 -mt-48 blur-3xl pointer-events-none"></div>

                        <CardContent className="p-8 relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <CalendarCheck size={20} className="text-orange-400" />
                                        <h3 className="text-lg font-bold">Performance de Hoje</h3>
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">Meta Diária</p>
                                    <p className="text-xl font-bold">{formatCurrency(todayPerformance.dailyGoal)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                {/* Faturamento de Hoje */}
                                <div>
                                    <p className="text-sm text-gray-400 mb-2">Faturamento Hoje</p>
                                    <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                                        {formatCurrency(todayPerformance.revenue)}
                                    </h2>
                                    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${todayPerformance.progress >= 100
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                                : 'bg-gradient-to-r from-orange-500 to-orange-600'
                                                }`}
                                            style={{ width: `${todayPerformance.progress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {todayPerformance.progress.toFixed(0)}% da meta
                                        {todayPerformance.remaining > 0 ? (
                                            <> • Faltam {formatCurrency(todayPerformance.remaining)}</>
                                        ) : (
                                            <> • <span className="text-green-400 font-semibold">Meta atingida!</span></>
                                        )}
                                    </p>
                                </div>

                                {/* Pedidos de Hoje */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <ShoppingBag size={16} className="text-blue-400" />
                                            <p className="text-xs text-gray-400">Pedidos</p>
                                        </div>
                                        <p className="text-2xl font-bold">{todayPerformance.ordersCount}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calculator size={16} className="text-purple-400" />
                                            <p className="text-xs text-gray-400">Ticket Médio</p>
                                        </div>
                                        <p className="text-2xl font-bold">
                                            {formatCurrency(todayPerformance.ordersCount > 0 ? todayPerformance.revenue / todayPerformance.ordersCount : 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Status da Meta */}
                            {todayPerformance.progress >= 100 ? (
                                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                                    <Award size={24} className="text-green-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-green-100 text-sm">🎉 Meta do Dia Atingida!</p>
                                        <p className="text-xs text-green-300 mt-1">
                                            Parabéns! Você superou a meta em {formatCurrency(todayPerformance.revenue - todayPerformance.dailyGoal)}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 flex items-center gap-3">
                                    <Target size={24} className="text-orange-400 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-orange-100 text-sm">Continue vendendo!</p>
                                        <p className="text-xs text-orange-300 mt-1">
                                            Ainda faltam {formatCurrency(todayPerformance.remaining)} para atingir a meta de hoje
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Gráfico Semanal */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp size={20} className="text-orange-600" />
                                Vendas dos Últimos 7 Dias
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6B7280', fontSize: 11 }}
                                            tickFormatter={(value) => `R$${value}`}
                                        />
                                        <RechartsTooltip
                                            cursor={{ fill: '#F3F4F6' }}
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white p-3 border border-gray-100 rounded-xl shadow-xl">
                                                            <p className="font-bold text-gray-900 mb-1">{label}</p>
                                                            <p className="text-sm font-bold text-orange-600">
                                                                {formatCurrency(payload[0].value as number)}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {payload[0].payload.ordersCount} pedidos
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            fill="#F97316"
                                            radius={[6, 6, 0, 0]}
                                            barSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Análise Financeira Detalhada */}
                    <Card className="border-l-4 border-l-indigo-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-900">
                                <PieChart size={20} className="text-indigo-600" />
                                Análise Financeira Detalhada
                            </CardTitle>
                            <p className="text-sm text-gray-500 mt-2">
                                Compreenda para onde vai cada real do seu faturamento
                            </p>
                        </CardHeader>
                        <CardContent>
                            {/* Resumo Visual */}
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 mb-6 border border-indigo-100">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Total Vendido no Período</p>
                                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(periodStats.revenue)}</h3>
                                    </div>
                                </div>

                                {/* Barra Dividida */}
                                <div className="relative h-16 rounded-xl overflow-hidden flex shadow-md mb-4">
                                    {/* Custo */}
                                    <div
                                        style={{ width: `${100 - periodStats.profitMargin}%` }}
                                        className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center relative group cursor-pointer"
                                    >
                                        <span className="text-white font-bold text-sm drop-shadow-md">
                                            {formatCurrency(periodStats.totalCost)}
                                        </span>
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl pointer-events-none">
                                            Custo dos Ingredientes
                                        </div>
                                    </div>

                                    {/* Lucro */}
                                    <div
                                        style={{ width: `${periodStats.profitMargin}%` }}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center relative group cursor-pointer"
                                    >
                                        <span className="text-white font-bold text-sm drop-shadow-md">
                                            {formatCurrency(periodStats.profit)}
                                        </span>
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1.5 px-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl pointer-events-none">
                                            Margem Bruta (Lucro)
                                        </div>
                                    </div>
                                </div>

                                {/* Detalhamento */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-lg p-4 border border-red-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <span className="text-xs font-semibold text-red-700 uppercase">Custos (CMV)</span>
                                        </div>
                                        <p className="text-2xl font-bold text-red-600 mb-1">
                                            {formatCurrency(periodStats.totalCost)}
                                        </p>
                                        <p className="text-xs text-gray-600 font-semibold">
                                            {(100 - periodStats.profitMargin).toFixed(1)}% do faturamento
                                        </p>
                                    </div>

                                    <div className="bg-white rounded-lg p-4 border border-green-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-xs font-semibold text-green-700 uppercase">Lucro Bruto</span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-600 mb-1">
                                            {formatCurrency(periodStats.profit)}
                                        </p>
                                        <p className="text-xs text-gray-600 font-semibold">
                                            {periodStats.profitMargin.toFixed(1)}% do faturamento
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Seção de Lucro Líquido Estimado */}
                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <Calculator className="w-4 h-4 text-blue-600" />
                                    Estimativa de Resultado Líquido
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                                Impostos e Taxas ({periodStats.taxPercent}%)
                                            </span>
                                            <span className="text-red-600 font-medium">- {formatCurrency(periodStats.calculatedTaxes)}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                            <span className="text-gray-600 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                                                Custos Fixos (Estimado)
                                            </span>
                                            <span className="text-red-600 font-medium">- {formatCurrency(periodStats.calculatedFixedCosts)}</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 italic px-2">
                                            *Custos fixos calculados proporcionalmente ao período ({periodStats.daysInPeriod} {periodStats.daysInPeriod === 1 ? 'dia' : 'dias'}).
                                        </p>
                                    </div>

                                    <div className={`rounded-xl p-4 flex flex-col justify-center items-center text-center border-2 ${periodStats.netProfit >= 0
                                        ? 'bg-blue-50 border-blue-100'
                                        : 'bg-red-50 border-red-100'
                                        }`}>
                                        <span className={`text-xs font-bold uppercase tracking-wide mb-1 ${periodStats.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
                                            }`}>
                                            Lucro Líquido Estimado
                                        </span>
                                        <span className={`text-2xl font-black ${periodStats.netProfit >= 0 ? 'text-blue-700' : 'text-red-600'
                                            }`}>
                                            {formatCurrency(periodStats.netProfit)}
                                        </span>
                                        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold ${periodStats.netProfit >= 0 ? 'bg-blue-200 text-blue-800' : 'bg-red-200 text-red-800'
                                            }`}>
                                            {periodStats.netMargin.toFixed(1)}% margem líquida
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dica Inteligente */}
                            <div className={`p-4 rounded-xl border-l-4 ${periodStats.profitMargin >= 70
                                ? 'bg-green-50 border-green-500'
                                : periodStats.profitMargin >= 50
                                    ? 'bg-yellow-50 border-yellow-500'
                                    : 'bg-red-50 border-red-500'
                                }`}>
                                <div className="flex gap-3">
                                    <Info size={18} className={`flex-shrink-0 mt-0.5 ${periodStats.profitMargin >= 70 ? 'text-green-600' :
                                        periodStats.profitMargin >= 50 ? 'text-yellow-600' :
                                            'text-red-600'
                                        }`} />
                                    <div>
                                        <p className={`font-bold text-sm ${periodStats.profitMargin >= 70 ? 'text-green-900' :
                                            periodStats.profitMargin >= 50 ? 'text-yellow-900' :
                                                'text-red-900'
                                            }`}>
                                            {periodStats.profitMargin >= 70
                                                ? '✅ Excelente Margem de Lucro!'
                                                : periodStats.profitMargin >= 50
                                                    ? '⚠️ Margem Aceitável'
                                                    : '❌ Margem Baixa - Ação Necessária'}
                                        </p>
                                        <p className={`text-xs mt-1 leading-relaxed ${periodStats.profitMargin >= 70 ? 'text-green-700' :
                                            periodStats.profitMargin >= 50 ? 'text-yellow-700' :
                                                'text-red-700'
                                            }`}>
                                            {periodStats.profitMargin >= 70
                                                ? 'Sua margem está excelente! Continue monitorando os custos e mantenha essa performance.'
                                                : periodStats.profitMargin >= 50
                                                    ? 'Sua margem está razoável, mas há espaço para melhoria. Considere revisar preços ou otimizar receitas.'
                                                    : 'Sua margem está muito baixa. É urgente revisar preços, reduzir porções ou negociar com fornecedores.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Coluna Direita (1/3) */}
                <div className="space-y-6">

                    {/* Meta Mensal */}
                    <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Target size={20} />
                                <h3 className="font-bold">Meta Mensal</h3>
                            </div>

                            <div className="mb-4">
                                <p className="text-3xl font-bold mb-1">{formatCurrency(monthlyGoalProgress.current)}</p>
                                <p className="text-sm text-orange-100">de {formatCurrency(monthlyGoalProgress.goal)}</p>
                            </div>

                            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden mb-2">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-1000"
                                    style={{ width: `${monthlyGoalProgress.progress}%` }}
                                />
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold">{monthlyGoalProgress.progress.toFixed(0)}% concluído</span>
                                {monthlyGoalProgress.remaining > 0 && (
                                    <span className="text-orange-100">Faltam {formatCurrency(monthlyGoalProgress.remaining)}</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Produtos */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award size={18} className="text-yellow-600" />
                                Top Produtos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topProducts.length > 0 ? (
                                <div className="space-y-3">
                                    {topProducts.map((product, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    idx === 1 ? 'bg-gray-200 text-gray-700' :
                                                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {idx + 1}º
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-gray-900">{product.name}</p>
                                                    <p className="text-xs text-gray-500">{product.quantity} vendidos</p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-sm text-gray-900">{formatCurrency(product.revenue)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-400 text-sm py-6">Nenhuma venda no período</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Clientes */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Crown size={18} className="text-purple-600" />
                                Top Clientes VIP
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topCustomers.length > 0 ? (
                                <div className="space-y-3">
                                    {topCustomers.map((customer, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === 0 ? 'bg-purple-100 text-purple-700' :
                                                    'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {idx + 1}º
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-semibold text-sm text-gray-900 truncate">{customer.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {customer.lastOrderDate
                                                            ? `Última compra: ${new Date(customer.lastOrderDate).toLocaleDateString('pt-BR')}`
                                                            : 'Sem pedidos'}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-sm text-gray-900 ml-2 flex-shrink-0">{formatCurrency(customer.totalSpent)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-400 text-sm py-6">Nenhum cliente cadastrado</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Horários de Pico */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock size={18} className="text-blue-600" />
                                Horários de Pico
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-24 w-full mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={peakHoursAnalysis}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <RechartsTooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white p-2 border border-blue-100 rounded-lg shadow-lg text-xs">
                                                            <p className="font-bold text-gray-900">{payload[0].payload.hour}h</p>
                                                            <p className="text-blue-600 font-semibold">{formatCurrency(payload[0].value as number)}</p>
                                                            <p className="text-gray-500">{payload[0].payload.ordersCount} pedidos</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                Intensidade de vendas por hora (0h - 23h)
                            </p>

                            {/* Horário de maior movimento */}
                            {(() => {
                                const peakHour = peakHoursAnalysis.reduce((max, h) => h.revenue > max.revenue ? h : max, peakHoursAnalysis[0]);
                                if (peakHour.revenue > 0) {
                                    return (
                                        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
                                            <p className="text-xs text-orange-800 font-semibold">
                                                🔥 Pico de vendas: <span className="font-bold">{peakHour.hour}h</span> ({formatCurrency(peakHour.revenue)} em {peakHour.ordersCount} pedidos)
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </CardContent>
                    </Card>

                    {/* Widget de Horários */}
                    <BusinessHoursWidget />

                </div>
            </div>

            {/* ========================================================================
                AÇÕES RÁPIDAS
                ======================================================================== */}

            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
                <CardContent className="p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap size={20} className="text-indigo-600" />
                        Ações Rápidas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Link to="/orders" className="p-4 bg-white rounded-lg border border-indigo-100 hover:shadow-md transition-all flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ShoppingBag size={20} className="text-green-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-gray-900">Novo Pedido</p>
                                <p className="text-xs text-gray-500">Criar venda rápida</p>
                            </div>
                        </Link>

                        <Link to="/products" className="p-4 bg-white rounded-lg border border-indigo-100 hover:shadow-md transition-all flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Package size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-gray-900">Produtos</p>
                                <p className="text-xs text-gray-500">Gerenciar cardápio</p>
                            </div>
                        </Link>

                        <Link to="/advisor" className="p-4 bg-white rounded-lg border border-indigo-100 hover:shadow-md transition-all flex items-center gap-3 group">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Zap size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-gray-900">Consultar IA</p>
                                <p className="text-xs text-gray-500">Obter insights</p>
                            </div>
                        </Link>
                    </div>
                </CardContent>
            </Card>

        </div >
    );
};

export default Dashboard;
