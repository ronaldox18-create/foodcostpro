import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import {
    Search,
    Plus,
    AlertTriangle,
    Package,
    DollarSign,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    Trash2,
    ArrowRight,
    ArrowUpDown,
    TrendingUp,
    XCircle,
    ShoppingBag,
    CheckCircle2,
    Activity,
    Printer
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { Ingredient, UnitType } from '../types';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';

const Inventory: React.FC = () => {
    const { ingredients, addIngredient, updateIngredient, deleteIngredient, orders, products } = useApp();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'ok'>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Estado para ajuste rápido de estoque
    const [adjustment, setAdjustment] = useState<{ id: string, type: 'in' | 'out', amount: number } | null>(null);

    const [formData, setFormData] = useState<Omit<Ingredient, 'id'>>({
        name: '',
        purchaseUnit: 'kg',
        purchaseQuantity: 1,
        purchasePrice: 0,
        yieldPercent: 100,
        currentStock: 0,
        minStock: 0
    });

    // --- ANALYTICS ---
    const stockMetrics = useMemo(() => {
        let totalValue = 0;
        let lowStockCount = 0;
        let itemsCount = ingredients.length;

        ingredients.forEach(ing => {
            // Preço por unidade de estoque (assumindo que estoque está na mesma unidade de compra)
            const pricePerUnit = ing.purchasePrice / ing.purchaseQuantity;
            const currentVal = (ing.currentStock || 0) * pricePerUnit;
            totalValue += currentVal;

            if ((ing.currentStock || 0) <= (ing.minStock || 0)) {
                lowStockCount++;
            }
        });

        return { totalValue, lowStockCount, itemsCount };
    }, [ingredients]);

    // --- CHARTS DATA ---
    const chartData = useMemo(() => {
        // Top 5 itens por valor total em estoque
        const valueData = ingredients.map(ing => {
            const pricePerUnit = ing.purchasePrice / ing.purchaseQuantity;
            const totalVal = (ing.currentStock || 0) * pricePerUnit;
            return { name: ing.name, value: totalVal };
        })
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Status Distribution
        const statusData = [
            { name: 'Normal', value: stockMetrics.itemsCount - stockMetrics.lowStockCount },
            { name: 'Crítico', value: stockMetrics.lowStockCount }
        ];

        return { valueData, statusData };
    }, [ingredients, stockMetrics]);

    // Análise de Consumo (últimos 7 dias)
    const consumptionAnalysis = useMemo(() => {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const ingredientConsumption = new Map<string, { name: string; consumed: number; unit: string }>();

        // Calcular consumo baseado em pedidos dos últimos 7 dias
        orders.forEach(order => {
            if (new Date(order.date) < sevenDaysAgo || order.status === 'canceled') return;

            order.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (!product || !product.recipe) return;

                product.recipe.forEach(recipeItem => {
                    const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId);
                    if (!ingredient) return;

                    let consumedQty = recipeItem.quantityUsed * item.quantity;

                    // Converter unidades se necessário
                    if (ingredient.purchaseUnit === 'kg' && recipeItem.unitUsed === 'g') {
                        consumedQty /= 1000;
                    } else if (ingredient.purchaseUnit === 'l' && recipeItem.unitUsed === 'ml') {
                        consumedQty /= 1000;
                    }

                    const existing = ingredientConsumption.get(ingredient.id) || {
                        name: ingredient.name,
                        consumed: 0,
                        unit: ingredient.purchaseUnit
                    };
                    existing.consumed += consumedQty;
                    ingredientConsumption.set(ingredient.id, existing);
                });
            });
        });

        return Array.from(ingredientConsumption.values())
            .sort((a, b) => b.consumed - a.consumed)
            .slice(0, 10);
    }, [orders, products, ingredients]);

    // Lista de Compras Automática
    const shoppingList = useMemo(() => {
        const needsToBuy = [];

        ingredients.forEach(ing => {
            const current = ing.currentStock || 0;
            const min = ing.minStock || 0;

            if (current <= min) {
                // Calcular consumo médio diário dos últimos 7 dias
                const consumption = consumptionAnalysis.find(c => c.name === ing.name);
                const avgDailyConsumption = consumption ? consumption.consumed / 7 : 0;

                // Sugerir quantidade para 15 dias
                const suggestedQty = Math.max(
                    (min - current) + (avgDailyConsumption * 15),
                    ing.purchaseQuantity // Pelo menos uma unidade de compra
                );

                const pricePerUnit = ing.purchasePrice / ing.purchaseQuantity;
                const estimatedCost = Math.ceil(suggestedQty / ing.purchaseQuantity) * ing.purchasePrice;

                needsToBuy.push({
                    id: ing.id,
                    name: ing.name,
                    currentStock: current,
                    minStock: min,
                    suggestedQty: Math.ceil(suggestedQty * 1000) / 1000,
                    unit: ing.purchaseUnit,
                    estimatedCost,
                    avgDailyConsumption,
                    priority: current <= 0 ? 'urgent' : current <= min * 0.5 ? 'high' : 'medium'
                });
            }
        });

        return needsToBuy.sort((a, b) => {
            const priorityOrder = { urgent: 0, high: 1, medium: 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }, [ingredients, consumptionAnalysis]);

    const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#6366F1'];

    // --- FILTROS E SORTING ---
    const filteredIngredients = useMemo(() => {
        let data = ingredients.filter(ing => {
            const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase());
            let matchesStatus = true;
            if (filterStatus === 'low') matchesStatus = (ing.currentStock || 0) <= (ing.minStock || 0);
            if (filterStatus === 'ok') matchesStatus = (ing.currentStock || 0) > (ing.minStock || 0);
            return matchesSearch && matchesStatus;
        });

        if (sortConfig) {
            data.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof Ingredient];
                let bValue: any = b[sortConfig.key as keyof Ingredient];

                // Custom sorting for calculated fields
                if (sortConfig.key === 'totalValue') {
                    const getVal = (ing: Ingredient) => {
                        const pricePerUnit = ing.purchasePrice / ing.purchaseQuantity;
                        return (ing.currentStock || 0) * pricePerUnit;
                    };
                    aValue = getVal(a);
                    bValue = getVal(b);
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        } else {
            // Default sort: Critical items first
            data.sort((a, b) => {
                const aCrit = (a.currentStock || 0) <= (a.minStock || 0) ? 1 : 0;
                const bCrit = (b.currentStock || 0) <= (b.minStock || 0) ? 1 : 0;
                return bCrit - aCrit;
            });
        }

        return data;
    }, [ingredients, searchTerm, filterStatus, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // --- HELPERS ---
    const formatStockDisplay = (val: number) => {
        return parseFloat((val || 0).toFixed(3));
    };

    const formatUnitLabel = (unit: UnitType) => {
        if (unit === 'kg') return 'kg';
        if (unit === 'l') return 'L';
        if (unit === 'ml') return 'ml';
        if (unit === 'g') return 'g';
        return 'un';
    };

    // --- HANDLERS ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Mantém exatamente o valor digitado, sem conversões "escondidas"
        const dataToSave = {
            ...formData,
            currentStock: formData.currentStock || 0,
            minStock: formData.minStock || 0
        };

        if (editingId) {
            updateIngredient({ ...dataToSave, id: editingId });
        } else {
            addIngredient({ ...dataToSave, id: crypto.randomUUID() });
        }
        setIsModalOpen(false);
        resetForm();
    };

    const handleAdjustStock = (e: React.FormEvent) => {
        e.preventDefault();
        if (!adjustment) return;

        const ingredient = ingredients.find(i => i.id === adjustment.id);
        if (!ingredient) return;

        const currentStock = ingredient.currentStock || 0;
        const adjustmentAmount = adjustment.amount;

        let newStock = currentStock;
        if (adjustment.type === 'in') {
            newStock += adjustmentAmount;
        } else {
            newStock = Math.max(0, currentStock - adjustmentAmount);
        }

        updateIngredient({ ...ingredient, currentStock: newStock });
        setAdjustment(null);
    };

    const resetForm = () => {
        setFormData({ name: '', purchaseUnit: 'kg', purchaseQuantity: 1, purchasePrice: 0, yieldPercent: 100, currentStock: 0, minStock: 0 });
        setEditingId(null);
    };

    const handleEdit = (ing: Ingredient) => {
        setFormData({
            ...ing,
            currentStock: ing.currentStock || 0,
            minStock: ing.minStock || 0
        });
        setEditingId(ing.id);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja excluir este ingrediente?')) {
            deleteIngredient(id);
        }
    };

    // Função para imprimir lista de compras
    const handlePrintShoppingList = () => {
        if (shoppingList.length === 0) {
            alert('Nenhum item na lista de compras no momento.');
            return;
        }

        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) return;

        const totalCost = shoppingList.reduce((sum, item) => sum + item.estimatedCost, 0);
        const currentDate = new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Lista de Compras - FoodCost Pro</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Arial', sans-serif;
                        padding: 40px;
                        background: white;
                        color: #1f2937;
                    }
                    .header {
                        border-bottom: 4px solid #f97316;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        font-size: 28px;
                        font-weight: bold;
                        color: #f97316;
                        margin-bottom: 5px;
                    }
                    .header .subtitle {
                        color: #6b7280;
                        font-size: 14px;
                    }
                    .date {
                        text-align: right;
                        color: #6b7280;
                        font-size: 12px;
                        margin-top: -30px;
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    thead {
                        background: #f3f4f6;
                    }
                    th {
                        padding: 12px;
                        text-align: left;
                        font-size: 11px;
                        text-transform: uppercase;
                        font-weight: bold;
                        color: #374151;
                        border-bottom: 2px solid #d1d5db;
                    }
                    td {
                        padding: 12px;
                        border-bottom: 1px solid #e5e7eb;
                        font-size: 13px;
                    }
                    .priority-urgent {
                        background: #fef2f2;
                        border-left: 4px solid #ef4444;
                    }
                    .priority-high {
                        background: #fff7ed;
                        border-left: 4px solid #f97316;
                    }
                    .priority-medium {
                        background: #fffbeb;
                        border-left: 4px solid #f59e0b;
                    }
                    .priority-badge {
                        display: inline-block;
                        padding: 3px 8px;
                        border-radius: 12px;
                        font-size: 10px;
                        font-weight: bold;
                    }
                    .urgent { background: #fee2e2; color: #991b1b; }
                    .high { background: #fed7aa; color: #9a3412; }
                    .medium { background: #fef3c7; color: #92400e; }
                    .item-name {
                        font-weight: bold;
                        color: #111827;
                    }
                    .stock-info {
                        color: #6b7280;
                        font-size: 11px;
                        margin-top: 2px;
                    }
                    .number {
                        font-family: 'Courier New', monospace;
                        font-weight: bold;
                    }
                    .total-section {
                        margin-top: 20px;
                        padding: 20px;
                        background: #f9fafb;
                        border: 2px solid #e5e7eb;
                        border-radius: 8px;
                    }
                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        font-size: 14px;
                    }
                    .total-final {
                        border-top: 2px solid #d1d5db;
                        margin-top: 10px;
                        padding-top: 10px;
                        font-size: 18px;
                        font-weight: bold;
                    }
                    .footer {
                        margin-top: 40px;
                        padding-top: 20px;
                        border-top: 1px solid #e5e7eb;
                        text-align: center;
                        color: #9ca3af;
                        font-size: 11px;
                    }
                    .checkbox {
                        width: 20px;
                        height: 20px;
                        border: 2px solid #d1d5db;
                        display: inline-block;
                        vertical-align: middle;
                    }
                    @media print {
                        body { padding: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📋 Lista de Compras</h1>
                    <div class="subtitle">FoodCost Pro - Gestão Inteligente de Estoque</div>
                </div>

                <div class="date">
                    <strong>Data de Geração:</strong> ${currentDate}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 5%;">✓</th>
                            <th style="width: 30%;">Item</th>
                            <th style="width: 12%;">Estoque Atual</th>
                            <th style="width: 12%;">Qtd. Sugerida</th>
                            <th style="width: 13%;">Último Preço</th>
                            <th style="width: 13%;">Custo Estimado</th>
                            <th style="width: 15%;">Prioridade</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${shoppingList.map(item => {
            const ing = ingredients.find(i => i.id === item.id);
            const pricePerUnit = ing ? ing.purchasePrice / ing.purchaseQuantity : 0;

            return `
                                <tr class="priority-${item.priority}">
                                    <td><span class="checkbox"></span></td>
                                    <td>
                                        <div class="item-name">${item.name}</div>
                                        <div class="stock-info">
                                            Mínimo: ${item.minStock.toFixed(3)} ${formatUnitLabel(item.unit)}
                                            ${item.avgDailyConsumption > 0 ?
                    `<br>Consumo médio: ${item.avgDailyConsumption.toFixed(3)} ${formatUnitLabel(item.unit)}/dia`
                    : ''}
                                        </div>
                                    </td>
                                    <td class="number">${item.currentStock.toFixed(3)} ${formatUnitLabel(item.unit)}</td>
                                    <td class="number" style="color: #2563eb; font-weight: bold;">
                                        ${item.suggestedQty.toFixed(3)} ${formatUnitLabel(item.unit)}
                                    </td>
                                    <td class="number">${formatCurrency(pricePerUnit)}/${formatUnitLabel(item.unit)}</td>
                                    <td class="number" style="font-weight: bold;">${formatCurrency(item.estimatedCost)}</td>
                                    <td>
                                        <span class="priority-badge ${item.priority}">
                                            ${item.priority === 'urgent' ? '🔴 URGENTE' :
                    item.priority === 'high' ? '🟠 ALTA' : '🟡 MÉDIA'}
                                        </span>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-row">
                        <span>Total de Itens:</span>
                        <span class="number">${shoppingList.length} ${shoppingList.length === 1 ? 'item' : 'itens'}</span>
                    </div>
                    <div class="total-row">
                        <span>Itens Urgentes:</span>
                        <span class="number" style="color: #dc2626;">
                            ${shoppingList.filter(i => i.priority === 'urgent').length}
                        </span>
                    </div>
                    <div class="total-row total-final">
                        <span>CUSTO TOTAL ESTIMADO:</span>
                        <span style="color: #f97316;">${formatCurrency(totalCost)}</span>
                    </div>
                </div>

                <div class="footer">
                    <p><strong>FoodCost Pro</strong> - Sistema de Gestão para Restaurantes</p>
                    <p>Lista gerada automaticamente com base no estoque atual e consumo histórico</p>
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    // --- MODAL SIMPLIFIED VARS ---
    const adjustmentIngredient = adjustment ? ingredients.find(i => i.id === adjustment.id) : null;
    const currentStockDisplay = adjustmentIngredient ? (adjustmentIngredient.currentStock || 0) : 0;

    const predictedStockDisplay = adjustmentIngredient && adjustment
        ? (adjustment.type === 'in'
            ? currentStockDisplay + adjustment.amount
            : Math.max(0, currentStockDisplay - adjustment.amount))
        : 0;

    return (
        <div className="space-y-8 animate-fade-in pb-10">

            {/* HEADER & KPI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Valor em Estoque</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-2">{formatCurrency(stockMetrics.totalValue)}</h3>
                        <div className="flex items-center gap-2 mt-4 text-green-600 text-sm font-bold">
                            <DollarSign size={16} />
                            <span>Patrimônio Ativo</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Itens Críticos</p>
                        <h3 className={`text-3xl font-black mt-2 ${stockMetrics.lowStockCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {stockMetrics.lowStockCount}
                        </h3>
                        <div className={`flex items-center gap-2 mt-4 text-sm font-bold ${stockMetrics.lowStockCount > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            <AlertTriangle size={16} />
                            <span>Requer Atenção</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <p className="text-gray-500 text-xs uppercase font-bold tracking-wider">Total Itens</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-2">{stockMetrics.itemsCount}</h3>
                        <div className="flex items-center gap-2 mt-4 text-blue-600 text-sm font-bold">
                            <Package size={16} />
                            <span>Cadastrados</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="bg-gray-900 text-white p-6 rounded-2xl shadow-lg shadow-gray-300 flex flex-col items-center justify-center gap-3 hover:bg-black transition-all group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold text-lg">Novo Ingrediente</span>
                    </div>
                </button>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
                    <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-gray-400" />
                        Top 5 Itens por Valor em Estoque
                    </h4>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData.valueData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                                <RechartsTooltip
                                    formatter={(value: number) => formatCurrency(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20}>
                                    {chartData.valueData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Package size={20} className="text-gray-400" />
                        Status do Estoque
                    </h4>
                    <div className="h-64 w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === 'Normal' ? '#10B981' : '#EF4444'} />
                                    ))}
                                </Pie>
                                <RechartsTooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none pb-8">
                            <span className="text-3xl font-black text-gray-900">{stockMetrics.itemsCount}</span>
                            <p className="text-xs text-gray-400 font-bold uppercase">Itens</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* LISTA DE COMPRAS AUTOMÁTICA + CONSUMO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Lista de Compras */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                            <ShoppingBag size={20} className="text-orange-500" />
                            Lista de Compras Automática
                        </h4>
                        <div className="flex items-center gap-3">
                            {shoppingList.length > 0 && (
                                <>
                                    <button
                                        onClick={handlePrintShoppingList}
                                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 text-sm"
                                    >
                                        <Printer size={16} />
                                        Imprimir Lista
                                    </button>
                                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                                        {shoppingList.length} {shoppingList.length === 1 ? 'item' : 'itens'}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {shoppingList.length > 0 ? (
                            <>
                                {shoppingList.map(item => (
                                    <div
                                        key={item.id}
                                        className={`p-4 rounded-xl border-l-4 ${item.priority === 'urgent'
                                            ? 'bg-red-50 border-red-500'
                                            : item.priority === 'high'
                                                ? 'bg-orange-50 border-orange-500'
                                                : 'bg-yellow-50 border-yellow-500'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                                                    {item.priority === 'urgent' && (
                                                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                                            <AlertTriangle size={10} /> URGENTE
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-600 space-y-0.5">
                                                    <p>Estoque: <span className="font-mono font-bold">{item.currentStock.toFixed(3)} {formatUnitLabel(item.unit)}</span></p>
                                                    <p>Sugerido: <span className="font-mono font-bold text-blue-600">{item.suggestedQty.toFixed(3)} {formatUnitLabel(item.unit)}</span></p>
                                                    {item.avgDailyConsumption > 0 && (
                                                        <p className="text-[11px] text-gray-500">
                                                            📊 Consumo médio: {item.avgDailyConsumption.toFixed(3)} {formatUnitLabel(item.unit)}/dia
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xs text-gray-500 mb-1">Custo estimado</p>
                                                <p className="font-black text-gray-900">{formatCurrency(item.estimatedCost)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-700">Total Estimado:</span>
                                        <span className="text-lg font-black text-gray-900">
                                            {formatCurrency(shoppingList.reduce((sum, item) => sum + item.estimatedCost, 0))}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <CheckCircle2 className="text-green-600" size={32} />
                                </div>
                                <p className="text-gray-600 font-medium">Estoque em dia!</p>
                                <p className="text-xs text-gray-400 mt-1">Nenhum item precisa ser reposto no momento.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Consumo Últimos 7 Dias */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-blue-500" />
                        Top 10 Consumo (Últimos 7 Dias)
                    </h4>

                    <div className="space-y-2">
                        {consumptionAnalysis.length > 0 ? (
                            consumptionAnalysis.map((item, index) => {
                                const maxValue = consumptionAnalysis[0].consumed;
                                const percentage = (item.consumed / maxValue) * 100;

                                return (
                                    <div key={index} className="group">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="font-semibold text-gray-700 flex items-center gap-2">
                                                <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    index === 1 ? 'bg-gray-100 text-gray-600' :
                                                        index === 2 ? 'bg-orange-50 text-orange-600' :
                                                            'bg-gray-50 text-gray-500'
                                                    }`}>
                                                    {index + 1}
                                                </span>
                                                {item.name}
                                            </span>
                                            <span className="font-mono font-bold text-gray-900">
                                                {item.consumed.toFixed(3)} {formatUnitLabel(item.unit as UnitType)}
                                            </span>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-12">
                                <Package className="mx-auto text-gray-300 mb-3" size={48} />
                                <p className="text-gray-400 text-sm">Nenhum consumo registrado nos últimos 7 dias</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* CONTROLS */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all bg-gray-50 focus:bg-white"
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${filterStatus === 'all' ? 'bg-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterStatus('low')}
                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${filterStatus === 'low' ? 'bg-red-100 text-red-700 shadow-lg shadow-red-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        {stockMetrics.lowStockCount > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                        Críticos
                    </button>
                </div>
            </div>

            {/* LISTA */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Ingrediente <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('currentStock')}>
                                    <div className="flex items-center gap-1">Estoque Atual <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('totalValue')}>
                                    <div className="flex items-center gap-1">Valor Total <ArrowUpDown size={12} /></div>
                                </th>
                                <th className="px-6 py-4 text-center">Ações Rápidas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredIngredients.map(ing => {
                                const isLow = (ing.currentStock || 0) <= (ing.minStock || 0);
                                const unitLabel = formatUnitLabel(ing.purchaseUnit);

                                // Calc Total Value
                                const pricePerUnit = ing.purchasePrice / ing.purchaseQuantity;
                                const totalValue = (ing.currentStock || 0) * pricePerUnit;

                                return (
                                    <tr key={ing.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-10 rounded-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`}></div>
                                                <div>
                                                    <p className="font-bold text-gray-900 text-base">{ing.name}</p>
                                                    <p className="text-xs text-gray-400">Min: {formatStockDisplay(ing.minStock || 0)} {unitLabel}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-lg font-mono font-bold ${isLow ? 'text-red-600' : 'text-gray-700'}`}>
                                                {formatStockDisplay(ing.currentStock || 0)} {unitLabel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isLow ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                    <AlertTriangle size={12} /> Repor
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                    Normal
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">
                                                {formatCurrency(totalValue)}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {formatCurrency(pricePerUnit)} /{unitLabel}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => setAdjustment({ id: ing.id, type: 'in', amount: 0 })}
                                                    className="p-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 hover:scale-110 transition-all shadow-sm"
                                                    title="Entrada"
                                                >
                                                    <ArrowDownLeft size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setAdjustment({ id: ing.id, type: 'out', amount: 0 })}
                                                    className="p-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 hover:scale-110 transition-all shadow-sm"
                                                    title="Saída / Perda"
                                                >
                                                    <ArrowUpRight size={18} />
                                                </button>
                                                <div className="w-px h-8 bg-gray-200 mx-1"></div>
                                                <button
                                                    onClick={() => handleEdit(ing)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Filter size={18} className="rotate-90" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ing.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredIngredients.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-16 text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <Package size={48} className="text-gray-200" />
                                            <p>Nenhum ingrediente encontrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CADASTRO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900">{editingId ? 'Editar Ingrediente' : 'Novo Ingrediente'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><XCircle size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Ex: Farinha de Trigo" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade Compra</label>
                                    <select value={formData.purchaseUnit} onChange={e => setFormData({ ...formData, purchaseUnit: e.target.value as UnitType })} className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 outline-none transition-all">
                                        <option value="kg">Quilo (kg)</option>
                                        <option value="l">Litro (l)</option>
                                        <option value="un">Unidade (un)</option>
                                        <option value="g">Grama (g)</option>
                                        <option value="ml">Mililitro (ml)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Qtd. Embalagem</label>
                                    <input required type="number" step="0.01" value={formData.purchaseQuantity} onChange={e => setFormData({ ...formData, purchaseQuantity: parseFloat(e.target.value) })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Ex: 1" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Compra (R$)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input required type="number" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) })} className="w-full pl-10 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="0.00" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Inicial ({formData.purchaseUnit})</label>
                                    <div className="relative">
                                        <input required type="number" step="0.001" value={formData.currentStock} onChange={e => setFormData({ ...formData, currentStock: parseFloat(e.target.value) })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                                    </div>
                                    {/* Alerta inteligente para valores altos em KG/L */}
                                    {((formData.purchaseUnit === 'kg' || formData.purchaseUnit === 'l') && (formData.currentStock || 0) > 100) && (
                                        <p className="text-xs text-orange-600 mt-1 flex items-start gap-1">
                                            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                                            <span>Atenção: Você digitou {formData.currentStock} {formData.purchaseUnit}. Se quis dizer {formData.currentStock} gramas/ml, use {formData.currentStock / 1000} {formData.purchaseUnit}.</span>
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo ({formData.purchaseUnit})</label>
                                    <input required type="number" step="0.001" value={formData.minStock} onChange={e => setFormData({ ...formData, minStock: parseFloat(e.target.value) })} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all mt-4 shadow-lg shadow-gray-200">
                                {editingId ? 'Salvar Alterações' : 'Cadastrar Ingrediente'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL AJUSTE RÁPIDO */}
            {adjustment && adjustmentIngredient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in border border-white/20">

                        {/* Header Colorido */}
                        <div className={`p-6 text-white text-center relative overflow-hidden ${adjustment.type === 'in' ? 'bg-green-600' : 'bg-red-600'}`}>
                            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')]"></div>

                            <button onClick={() => setAdjustment(null)} className="absolute top-4 right-4 p-1 rounded-full bg-black/20 hover:bg-black/30 transition text-white">
                                <XCircle size={20} />
                            </button>

                            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-inner">
                                {adjustment.type === 'in' ? <ArrowDownLeft size={32} /> : <ArrowUpRight size={32} />}
                            </div>
                            <h3 className="font-black text-2xl tracking-tight">
                                {adjustment.type === 'in' ? 'Entrada' : 'Saída'}
                            </h3>
                            <p className="text-white/80 text-sm mt-1 font-medium">{adjustmentIngredient.name}</p>
                        </div>

                        <form onSubmit={handleAdjustStock} className="p-6">

                            <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 flex items-center justify-between">
                                <div className="text-center flex-1">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Atual</span>
                                    <div className="text-lg font-bold text-gray-700">{parseFloat(currentStockDisplay.toFixed(3))} <span className="text-xs">{formatUnitLabel(adjustmentIngredient.purchaseUnit)}</span></div>
                                </div>
                                <ArrowRight className="text-gray-300" size={20} />
                                <div className="text-center flex-1">
                                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Previsto</span>
                                    <div className={`text-lg font-bold ${adjustment.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                        {parseFloat(predictedStockDisplay.toFixed(3))} <span className="text-xs">{formatUnitLabel(adjustmentIngredient.purchaseUnit)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">
                                    Quantidade ({formatUnitLabel(adjustmentIngredient.purchaseUnit)})
                                </label>
                                <div className="relative">
                                    <input
                                        autoFocus
                                        required
                                        type="number"
                                        step="0.001"
                                        value={adjustment.amount || ''}
                                        onChange={e => setAdjustment({ ...adjustment, amount: parseFloat(e.target.value) })}
                                        className="w-full px-4 py-4 text-3xl font-black text-gray-900 bg-white border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:ring-0 outline-none text-center transition-all placeholder:text-gray-200"
                                        placeholder="0"
                                    />
                                </div>
                                {/* Alerta inteligente para valores altos em KG/L no ajuste rápido */}
                                {((adjustmentIngredient.purchaseUnit === 'kg' || adjustmentIngredient.purchaseUnit === 'l') && (adjustment.amount || 0) > 100) && (
                                    <p className="text-xs text-orange-600 mt-2 text-center">
                                        ⚠️ Atenção: {adjustment.amount} {adjustmentIngredient.purchaseUnit} é muita coisa!
                                        <br />Se quis dizer gramas/ml, use {adjustment.amount / 1000}.
                                    </p>
                                )}
                            </div>

                            <button type="submit" className={`w-full py-4 font-black rounded-xl text-white text-lg shadow-lg transform active:scale-95 transition-all ${adjustment.type === 'in' ? 'bg-green-600 hover:bg-green-700 shadow-green-200' : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}>
                                Confirmar
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Inventory;
