import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import {
    BarChart3,
    TrendingUp,
    Package,
    DollarSign,
    Download,
    Calendar,
    FileText,
    PieChart,
    Users
} from 'lucide-react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart as RechartsPie,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Area,
    AreaChart
} from 'recharts';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type ReportTab = 'sales' | 'products' | 'stock' | 'financial';
type DateRange = 'today' | 'week' | 'month' | 'custom';

const Reports: React.FC = () => {
    const { orders, products, ingredients, fixedCosts } = useApp();

    const [activeTab, setActiveTab] = useState<ReportTab>('sales');
    const [dateRange, setDateRange] = useState<DateRange>('month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // Calcular período
    const getDateRange = () => {
        const now = new Date();
        let start: Date, end: Date;

        switch (dateRange) {
            case 'today':
                start = startOfDay(now);
                end = endOfDay(now);
                break;
            case 'week':
                start = startOfWeek(now, { locale: ptBR });
                end = endOfWeek(now, { locale: ptBR });
                break;
            case 'month':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'custom':
                start = customStartDate ? new Date(customStartDate) : startOfMonth(now);
                end = customEndDate ? new Date(customEndDate) : endOfMonth(now);
                break;
            default:
                start = startOfMonth(now);
                end = endOfMonth(now);
        }

        return { start, end };
    };

    const { start, end } = getDateRange();

    // Filtrar pedidos do período
    const periodOrders = useMemo(() => {
        return orders.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= start && orderDate <= end && order.status !== 'canceled';
        });
    }, [orders, start, end]);

    // MÉTRICAS GERAIS
    const metrics = useMemo(() => {
        const totalRevenue = periodOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        const totalOrders = periodOrders.length;
        const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // Calcular custos pela receita de ingredientes
        const totalCost = periodOrders.reduce((sum, order) => {
            const orderCost = (order.items || []).reduce((itemSum, item) => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return itemSum;

                // Calcular custo do produto pela receita
                const productCost = (product.recipe || []).reduce((recipeCost, recipeItem) => {
                    const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
                    if (!ingredient) return recipeCost;

                    // Custo unitário do ingrediente (preço de compra / quantidade comprada)
                    const unitCost = ingredient.purchasePrice / ingredient.purchaseQuantity;

                    // Ajustar pelo rendimento
                    const adjustedUnitCost = unitCost / (ingredient.yieldPercent / 100);

                    // Converter quantidade da receita para a mesma unidade de compra
                    let quantityInPurchaseUnit = recipeItem.quantityUsed;

                    // Conversões simples (pode ser melhorado)
                    if (ingredient.purchaseUnit === 'kg' && recipeItem.unitUsed === 'g') {
                        quantityInPurchaseUnit = recipeItem.quantityUsed / 1000;
                    } else if (ingredient.purchaseUnit === 'l' && recipeItem.unitUsed === 'ml') {
                        quantityInPurchaseUnit = recipeItem.quantityUsed / 1000;
                    }

                    return recipeCost + (adjustedUnitCost * quantityInPurchaseUnit);
                }, 0);

                return itemSum + (productCost * item.quantity);
            }, 0);
            return sum + orderCost;
        }, 0);

        const grossProfit = totalRevenue - totalCost;
        const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

        return {
            totalRevenue,
            totalOrders,
            avgTicket,
            totalCost,
            grossProfit,
            profitMargin
        };
    }, [periodOrders, products]);

    // DADOS PARA GRÁFICOS
    const salesByDay = useMemo(() => {
        const dayMap = new Map<string, number>();

        periodOrders.forEach(order => {
            const day = format(new Date(order.date), 'dd/MM');
            dayMap.set(day, (dayMap.get(day) || 0) + (order.totalAmount || 0));
        });

        return Array.from(dayMap.entries())
            .map(([day, revenue]) => ({ day, revenue }))
            .sort((a, b) => {
                const [dayA, monthA] = a.day.split('/').map(Number);
                const [dayB, monthB] = b.day.split('/').map(Number);
                return monthA === monthB ? dayA - dayB : monthA - monthB;
            });
    }, [periodOrders]);

    const topProducts = useMemo(() => {
        const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();

        periodOrders.forEach(order => {
            (order.items || []).forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    const existing = productMap.get(product.id) || { name: product.name, quantity: 0, revenue: 0 };
                    productMap.set(product.id, {
                        name: product.name,
                        quantity: existing.quantity + item.quantity,
                        revenue: existing.revenue + (item.unitPrice * item.quantity)
                    });
                }
            });
        });

        return Array.from(productMap.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);
    }, [periodOrders, products]);

    const productsByCategory = useMemo(() => {
        const categoryMap = new Map<string, number>();

        periodOrders.forEach(order => {
            (order.items || []).forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    const category = product.category || 'Sem Categoria';
                    categoryMap.set(category, (categoryMap.get(category) || 0) + (item.unitPrice * item.quantity));
                }
            });
        });

        return Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value }));
    }, [periodOrders, products]);

    const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

    // ANÁLISE DE ESTOQUE
    const stockAnalysis = useMemo(() => {
        // Ingredientes com estoque baixo
        const lowStock = ingredients.filter(ing =>
            ing.currentStock !== undefined &&
            ing.minStock !== undefined &&
            ing.currentStock < ing.minStock
        ).map(ing => ({
            name: ing.name,
            current: ing.currentStock || 0,
            min: ing.minStock || 0,
            unit: ing.stockUnit || ing.purchaseUnit
        }));

        // Valor total em estoque
        const totalStockValue = ingredients.reduce((sum, ing) => {
            const stockQty = ing.currentStock || 0;
            const unitCost = ing.purchasePrice / ing.purchaseQuantity;
            return sum + (stockQty * unitCost);
        }, 0);

        // Análise ABC - ingredientes mais usados no período
        const ingredientUsage = new Map<string, { name: string; quantity: number; value: number }>();

        periodOrders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    product.recipe?.forEach(recipeItem => {
                        const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
                        if (ingredient) {
                            const existing = ingredientUsage.get(ingredient.id) || {
                                name: ingredient.name,
                                quantity: 0,
                                value: 0
                            };

                            let qtyUsed = recipeItem.quantityUsed * item.quantity;
                            const unitCost = ingredient.purchasePrice / ingredient.purchaseQuantity;
                            let costUsed = 0;

                            // Converter para unidade padrão
                            if (ingredient.purchaseUnit === 'kg' && recipeItem.unitUsed === 'g') {
                                qtyUsed = qtyUsed / 1000;
                                costUsed = qtyUsed * unitCost;
                            } else if (ingredient.purchaseUnit === 'l' && recipeItem.unitUsed === 'ml') {
                                qtyUsed = qtyUsed / 1000;
                                costUsed = qtyUsed * unitCost;
                            } else {
                                costUsed = qtyUsed * unitCost;
                            }

                            ingredientUsage.set(ingredient.id, {
                                name: ingredient.name,
                                quantity: existing.quantity + qtyUsed,
                                value: existing.value + costUsed
                            });
                        }
                    });
                }
            });
        });

        const topIngredients = Array.from(ingredientUsage.values())
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        return {
            lowStock,
            totalStockValue,
            topIngredients
        };
    }, [ingredients, periodOrders, products]);

    // BREAKDOWN FINANCEIRO DETALHADO
    const financialBreakdown = useMemo(() => {
        // Já temos totalRevenue e totalCost (ingredientes) de metrics

        // Pegar custos fixos (despesas) e proporcionalizar pelo período
        const monthlyFixedCosts = fixedCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);

        // Proporcionalizar custos fixos baseado no período
        let proportionalFixedCosts = monthlyFixedCosts;
        if (dateRange === 'today') {
            proportionalFixedCosts = monthlyFixedCosts / 30; // Custo diário
        } else if (dateRange === 'week') {
            proportionalFixedCosts = monthlyFixedCosts / 4; // Custo semanal (aprox.)
        } else if (dateRange === 'custom' && customStartDate && customEndDate) {
            const days = Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24));
            proportionalFixedCosts = (monthlyFixedCosts / 30) * days;
        }
        // Para 'month', usa o valor completo

        // Custos totais = ingredientes + fixos proporcionais
        const totalCosts = metrics.totalCost + proportionalFixedCosts;
        const netProfit = metrics.totalRevenue - totalCosts;
        const netMargin = metrics.totalRevenue > 0 ? (netProfit / metrics.totalRevenue) * 100 : 0;

        return {
            revenue: metrics.totalRevenue,
            ingredientCosts: metrics.totalCost,
            fixedCosts: proportionalFixedCosts,
            totalCosts,
            netProfit,
            netMargin
        };
    }, [metrics, fixedCosts, dateRange, customStartDate, customEndDate]);

    // EXPORTAR PDF
    const handleExportPDF = async () => {
        try {
            const jsPDF = (await import('jspdf')).default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF() as any;

            // HEADER
            doc.setFontSize(20);
            doc.setTextColor(249, 115, 22); // Orange
            doc.text('Relatório de Vendas', 14, 20);

            doc.setFontSize(10);
            doc.setTextColor(100);
            const periodText = dateRange === 'today' ? 'Hoje' :
                dateRange === 'week' ? 'Esta Semana' :
                    dateRange === 'month' ? 'Este Mês' :
                        `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`;
            doc.text(`Período: ${periodText}`, 14, 27);
            doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 32);

            // MÉTRICAS
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text('Resumo Financeiro', 14, 45);

            autoTable(doc, {
                startY: 50,
                head: [['Métrica', 'Valor']],
                body: [
                    ['Faturamento Total', `R$ ${metrics.totalRevenue.toFixed(2)}`],
                    ['Total de Pedidos', metrics.totalOrders.toString()],
                    ['Ticket Médio', `R$ ${metrics.avgTicket.toFixed(2)}`],
                    ['Custo Total', `R$ ${metrics.totalCost.toFixed(2)}`],
                    ['Lucro Bruto', `R$ ${metrics.grossProfit.toFixed(2)}`],
                    ['Margem de Lucro', `${metrics.profitMargin.toFixed(1)}%`]
                ],
                theme: 'grid',
                headStyles: { fillColor: [249, 115, 22] }
            });

            // TOP PRODUTOS
            if (topProducts.length > 0) {
                const finalY = (doc as any).lastAutoTable?.finalY || 80;
                doc.text('Top 10 Produtos', 14, finalY + 15);

                autoTable(doc, {
                    startY: finalY + 20,
                    head: [['Produto', 'Quantidade', 'Receita']],
                    body: topProducts.map(p => [
                        p.name,
                        p.quantity.toString(),
                        `R$ ${p.revenue.toFixed(2)}`
                    ]),
                    theme: 'striped',
                    headStyles: { fillColor: [249, 115, 22] }
                });
            }

            // VENDAS POR DIA
            if (salesByDay.length > 0) {
                const finalY = (doc as any).lastAutoTable?.finalY || 120;
                doc.text('Vendas por Dia', 14, finalY + 15);

                autoTable(doc, {
                    startY: finalY + 20,
                    head: [['Data', 'Receita']],
                    body: salesByDay.map(s => [
                        s.day,
                        `R$ ${s.revenue.toFixed(2)}`
                    ]),
                    theme: 'grid',
                    headStyles: { fillColor: [249, 115, 22] }
                });
            }

            // SALVAR
            doc.save(`relatorio-vendas-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Tente novamente!');
        }
    };

    // EXPORTAR EXCEL
    const handleExportExcel = () => {
        // Criar CSV simples
        let csv = 'Data;Produto;Quantidade;Valor\n';

        periodOrders.forEach(order => {
            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                csv += `${format(new Date(order.date), 'dd/MM/yyyy')};${product?.name || 'N/A'};${item.quantity};${item.unitPrice}\n`;
            });
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio-vendas-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    };

    return (
        <div className="p-6">
            {/* HEADER */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
                    <p className="text-gray-600 mt-1">Análises e insights do seu negócio</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                        <FileText size={20} />
                        Exportar PDF
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                        <Download size={20} />
                        Exportar Excel
                    </button>
                </div>
            </div>

            {/* FILTROS DE DATA */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                <div className="flex items-center gap-4">
                    <Calendar className="text-gray-400" size={20} />
                    <div className="flex gap-2">
                        {(['today', 'week', 'month', 'custom'] as DateRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${dateRange === range
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {range === 'today' && 'Hoje'}
                                {range === 'week' && 'Semana'}
                                {range === 'month' && 'Mês'}
                                {range === 'custom' && 'Personalizado'}
                            </button>
                        ))}
                    </div>

                    {dateRange === 'custom' && (
                        <div className="flex gap-2 ml-4">
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="px-3 py-2 border rounded-lg"
                            />
                            <span className="self-center text-gray-500">até</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="px-3 py-2 border rounded-lg"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* CARDS DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign size={32} />
                        <span className="text-green-100 text-sm">Faturamento</span>
                    </div>
                    <div className="text-3xl font-bold">R$ {metrics.totalRevenue.toFixed(2)}</div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp size={32} />
                        <span className="text-blue-100 text-sm">Pedidos</span>
                    </div>
                    <div className="text-3xl font-bold">{metrics.totalOrders}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <BarChart3 size={32} />
                        <span className="text-purple-100 text-sm">Ticket Médio</span>
                    </div>
                    <div className="text-3xl font-bold">R$ {metrics.avgTicket.toFixed(2)}</div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <PieChart size={32} />
                        <span className="text-orange-100 text-sm">Margem</span>
                    </div>
                    <div className="text-3xl font-bold">{metrics.profitMargin.toFixed(1)}%</div>
                </div>
            </div>

            {/* TABS */}
            <div className="bg-white rounded-xl shadow-sm mb-6">
                <div className="border-b border-gray-200">
                    <div className="flex">
                        {[
                            { id: 'sales' as ReportTab, label: 'Vendas', icon: TrendingUp },
                            { id: 'products' as ReportTab, label: 'Produtos', icon: Package },
                            { id: 'stock' as ReportTab, label: 'Estoque', icon: BarChart3 },
                            { id: 'financial' as ReportTab, label: 'Financeiro', icon: DollarSign }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-orange-500 text-orange-600'
                                        : 'border-transparent text-gray-600 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6">
                    {/* TAB VENDAS */}
                    {activeTab === 'sales' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold mb-4">Vendas por Dia</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={salesByDay}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                        <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* TAB PRODUTOS */}
                    {activeTab === 'products' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-xl font-bold mb-4">Top 10 Produtos</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={topProducts} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={150} />
                                        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                        <Bar dataKey="revenue" fill="#f97316" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div>
                                <h3 className="text-xl font-bold mb-4">Vendas por Categoria</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <RechartsPie>
                                        <Pie
                                            data={productsByCategory}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {productsByCategory.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                    </RechartsPie>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* TAB ESTOQUE */}
                    {activeTab === 'stock' && (
                        <div className="space-y-6">
                            {/* Cards de Métricas de Estoque */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="text-sm text-blue-600 mb-1">Valor Total em Estoque</div>
                                    <div className="text-2xl font-bold text-blue-700">R$ {stockAnalysis.totalStockValue.toFixed(2)}</div>
                                </div>
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <div className="text-sm text-orange-600 mb-1">Ingredientes</div>
                                    <div className="text-2xl font-bold text-orange-700">{ingredients.length}</div>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="text-sm text-red-600 mb-1">Alertas de Ruptura</div>
                                    <div className="text-2xl font-bold text-red-700">{stockAnalysis.lowStock.length}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Top 10 Ingredientes Mais Usados (Análise ABC) */}
                                <div className="bg-white border rounded-lg p-4">
                                    <h4 className="font-bold text-lg mb-3">Top 10 Ingredientes Mais Usados</h4>
                                    {stockAnalysis.topIngredients.length > 0 ? (
                                        <div className="space-y-2">
                                            {stockAnalysis.topIngredients.map((ing, index) => (
                                                <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                                                    <span className="font-medium">{index + 1}. {ing.name}</span>
                                                    <span className="text-blue-600 font-semibold">R$ {ing.value.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">Nenhum dado disponível para o período</p>
                                    )}
                                </div>

                                {/* Alertas de Ruptura */}
                                <div className="bg-white border rounded-lg p-4">
                                    <h4 className="font-bold text-lg mb-3 text-red-600">⚠️ Alertas de Estoque Baixo</h4>
                                    {stockAnalysis.lowStock.length > 0 ? (
                                        <div className="space-y-2">
                                            {stockAnalysis.lowStock.map((item, index) => (
                                                <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-sm text-red-600">
                                                        Estoque: {item.current.toFixed(2)} {item.unit} |
                                                        Mínimo: {item.min.toFixed(2)} {item.unit}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-green-600">✓ Todos os ingredientes estão com estoque adequado!</p>
                                    )}
                                </div>
                            </div>

                            {/* Gráfico de Ingredientes por Valor */}
                            {stockAnalysis.topIngredients.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-lg mb-3">Custo por Ingrediente (Período)</h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={stockAnalysis.topIngredients}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                            <YAxis />
                                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                            <Bar dataKey="value" fill="#3b82f6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB FINANCEIRO */}
                    {activeTab === 'financial' && (
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold">Demonstrativo de Resultado (DRE)</h3>

                            {/* DRE Simplificado */}
                            <div className="bg-white border rounded-lg p-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b-2">
                                        <span className="font-bold text-lg">Receita Total</span>
                                        <span className="font-bold text-lg text-green-600">R$ {financialBreakdown.revenue.toFixed(2)}</span>
                                    </div>

                                    <div className="pl-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span>(-) Custo Ingredientes</span>
                                            <span className="text-red-600">R$ {financialBreakdown.ingredientCosts.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>(-) Custos Fixos</span>
                                            <span className="text-red-600">R$ {financialBreakdown.fixedCosts.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-t-2 border-b-2">
                                        <span className="font-bold">Custo Total</span>
                                        <span className="font-bold text-red-600">R$ {financialBreakdown.totalCosts.toFixed(2)}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded">
                                        <span className="font-bold text-xl">Lucro Líquido</span>
                                        <span className={`font-bold text-2xl ${financialBreakdown.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            R$ {financialBreakdown.netProfit.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-medium">Margem Líquida</span>
                                        <span className={`font-bold text-lg ${financialBreakdown.netMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {financialBreakdown.netMargin.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Breakdown Visual de Custos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Cards Resumo */}
                                <div className="space-y-3">
                                    <h4 className="font-bold text-lg">Breakdown de Custos</h4>
                                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                                        <div className="text-sm opacity-90">Receita</div>
                                        <div className="text-2xl font-bold">R$ {financialBreakdown.revenue.toFixed(2)}</div>
                                        <div className="text-xs opacity-75">100%</div>
                                    </div>

                                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                                        <div className="text-sm opacity-90">Custos Variáveis</div>
                                        <div className="text-2xl font-bold">R$ {financialBreakdown.ingredientCosts.toFixed(2)}</div>
                                        <div className="text-xs opacity-75">
                                            {financialBreakdown.revenue > 0
                                                ? ((financialBreakdown.ingredientCosts / financialBreakdown.revenue) * 100).toFixed(1)
                                                : 0}%
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                                        <div className="text-sm opacity-90">Custos Fixos</div>
                                        <div className="text-2xl font-bold">R$ {financialBreakdown.fixedCosts.toFixed(2)}</div>
                                        <div className="text-xs opacity-75">
                                            {financialBreakdown.revenue > 0
                                                ? ((financialBreakdown.fixedCosts / financialBreakdown.revenue) * 100).toFixed(1)
                                                : 0}%
                                        </div>
                                    </div>

                                    <div className={`bg-gradient-to-r ${financialBreakdown.netProfit >= 0 ? 'from-blue-500 to-blue-600' : 'from-red-500 to-red-600'} rounded-lg p-4 text-white`}>
                                        <div className="text-sm opacity-90">Lucro Líquido</div>
                                        <div className="text-2xl font-bold">R$ {financialBreakdown.netProfit.toFixed(2)}</div>
                                        <div className="text-xs opacity-75">{financialBreakdown.netMargin.toFixed(1)}%</div>
                                    </div>
                                </div>

                                {/* Gráfico de Pizza - Distribuição */}
                                <div>
                                    <h4 className="font-bold text-lg mb-3">Distribuição de Custos</h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <RechartsPie>
                                            <Pie
                                                data={[
                                                    { name: 'Ingredientes', value: financialBreakdown.ingredientCosts },
                                                    { name: 'Custos Fixos', value: financialBreakdown.fixedCosts },
                                                    { name: 'Lucro', value: Math.max(0, financialBreakdown.netProfit) }
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                <Cell fill="#f97316" />
                                                <Cell fill="#a855f7" />
                                                <Cell fill="#3b82f6" />
                                            </Pie>
                                            <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                                        </RechartsPie>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
