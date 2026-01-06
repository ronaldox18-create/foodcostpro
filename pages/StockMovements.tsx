import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { TrendingDown, TrendingUp, Activity, Filter, Calendar, Package } from 'lucide-react';

interface StockMovement {
    id: string;
    ingredient_id: string;
    ingredient_name: string;
    type: 'sale' | 'entry' | 'adjustment' | 'loss';
    quantity: number;
    unit: string;
    reason: string;
    created_at: string;
}

const StockMovements: React.FC = () => {
    const { user } = useAuth();
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<string>('all');
    const [selectedIngredient, setSelectedIngredient] = useState<string>('all');
    const [ingredients, setIngredients] = useState<any[]>([]);

    useEffect(() => {
        loadIngredients();
    }, []);

    useEffect(() => {
        loadMovements();
    }, [selectedType, selectedIngredient]);

    const loadIngredients = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('ingredients')
                .select('id, name')
                .eq('user_id', user.id)
                .order('name');

            if (data) setIngredients(data);
        } catch (error) {
            console.error('Error loading ingredients:', error);
        }
    };

    const loadMovements = async () => {
        if (!user) return;

        setLoading(true);
        try {
            let query = supabase
                .from('stock_movements')
                .select(`
                    *,
                    ingredients(name)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(100);

            if (selectedType !== 'all') {
                query = query.eq('type', selectedType);
            }

            if (selectedIngredient !== 'all') {
                query = query.eq('ingredient_id', selectedIngredient);
            }

            const { data, error } = await query;

            if (error) throw error;

            setMovements(data?.map(m => ({
                ...m,
                ingredient_name: m.ingredients?.name || 'Ingrediente'
            })) || []);
        } catch (error) {
            console.error('Error loading movements:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'sale': return <TrendingDown className="text-red-600" size={18} />;
            case 'entry': return <TrendingUp className="text-green-600" size={18} />;
            case 'adjustment': return <Activity className="text-blue-600" size={18} />;
            case 'loss': return <Calendar className="text-yellow-600" size={18} />;
            default: return <Activity className="text-blue-600" size={18} />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'sale': return 'Venda';
            case 'entry': return 'Entrada';
            case 'adjustment': return 'Ajuste';
            case 'loss': return 'Perda';
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'sale': return 'bg-red-50 text-red-700 border-red-200';
            case 'entry': return 'bg-green-50 text-green-700 border-green-200';
            case 'adjustment': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'loss': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    // Calcular resumo
    const summary = {
        totalSales: movements.filter(m => m.type === 'sale').length,
        totalEntries: movements.filter(m => m.type === 'entry').length,
        totalAdjustments: movements.filter(m => m.type === 'adjustment').length,
        totalLosses: movements.filter(m => m.type === 'loss').length,
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Package size={24} className="text-white" />
                    </div>
                    Histórico de Movimentação
                </h1>
                <p className="text-gray-600 mt-1 ml-15">
                    Rastreamento completo de entradas e saídas de estoque
                </p>
            </div>

            {/* Resumo Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <TrendingDown className="text-red-600" size={24} />
                        <div>
                            <p className="text-sm font-medium text-red-600">Vendas</p>
                            <p className="text-2xl font-bold text-red-700">{summary.totalSales}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="text-green-600" size={24} />
                        <div>
                            <p className="text-sm font-medium text-green-600">Entradas</p>
                            <p className="text-2xl font-bold text-green-700">{summary.totalEntries}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Activity className="text-blue-600" size={24} />
                        <div>
                            <p className="text-sm font-medium text-blue-600">Ajustes</p>
                            <p className="text-2xl font-bold text-blue-700">{summary.totalAdjustments}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <Calendar className="text-yellow-600" size={24} />
                        <div>
                            <p className="text-sm font-medium text-yellow-600">Perdas</p>
                            <p className="text-2xl font-bold text-yellow-700">{summary.totalLosses}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-6 shadow-sm">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
                    </div>

                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    >
                        <option value="all">Todos os tipos</option>
                        <option value="sale">🔻 Vendas</option>
                        <option value="entry">🔺 Entradas</option>
                        <option value="adjustment">⚙️ Ajustes</option>
                        <option value="loss">⚠️ Perdas</option>
                    </select>

                    <select
                        value={selectedIngredient}
                        onChange={(e) => setSelectedIngredient(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    >
                        <option value="all">Todos os ingredientes</option>
                        {ingredients.map(ing => (
                            <option key={ing.id} value={ing.id}>{ing.name}</option>
                        ))}
                    </select>

                    {(selectedType !== 'all' || selectedIngredient !== 'all') && (
                        <button
                            onClick={() => {
                                setSelectedType('all');
                                setSelectedIngredient('all');
                            }}
                            className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                            Limpar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Lista de Movimentações */}
            <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Data/Hora
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Ingrediente
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Quantidade
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                    Motivo
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {movements.map((movement) => (
                                <tr key={movement.id} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                                        {new Date(movement.created_at).toLocaleString('pt-BR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            {getTypeIcon(movement.type)}
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(movement.type)}`}>
                                                {getTypeLabel(movement.type)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {movement.ingredient_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right">
                                        <span className={`font-bold ${movement.quantity < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            {movement.quantity > 0 ? '+' : ''}{movement.quantity.toFixed(2)} {movement.unit}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {movement.reason || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {movements.length === 0 && !loading && (
                    <div className="text-center py-16">
                        <Activity size={64} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Nenhuma movimentação encontrada</p>
                        <p className="text-gray-400 text-sm mt-1">
                            {selectedType !== 'all' || selectedIngredient !== 'all'
                                ? 'Tente ajustar os filtros acima'
                                : 'Faça vendas para ver o histórico aparecer aqui'}
                        </p>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                        <p className="text-gray-500">Carregando movimentações...</p>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            {movements.length > 0 && !loading && (
                <div className="mt-4 text-center text-sm text-gray-500">
                    Mostrando {movements.length} {movements.length === 1 ? 'movimentação' : 'movimentações'}
                    {selectedType !== 'all' && ` do tipo "${getTypeLabel(selectedType)}"`}
                    {selectedIngredient !== 'all' && ` do ingrediente selecionado`}
                </div>
            )}
        </div>
    );
};

export default StockMovements;
