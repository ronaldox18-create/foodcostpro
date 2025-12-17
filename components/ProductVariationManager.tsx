import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { ProductVariation } from '../types';
import { Plus, Edit, Trash2, Save, X, DollarSign, Package } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

const ProductVariationManager: React.FC = () => {
    const { user } = useAuth();
    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [loading, setLoading] = useState(true);
    const [newVariation, setNewVariation] = useState({
        name: '',
        price: 0,
        sku: '',
        stock_quantity: null as number | null,
        is_available: true
    });

    useEffect(() => {
        if (user?.id) fetchVariations();
    }, [user]);

    const fetchVariations = async () => {
        try {
            const { data, error } = await supabase
                .from('product_variations')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setVariations(data || []);
        } catch (error) {
            console.error('Error fetching variations:', error);
        } finally {
            setLoading(false);
        }
    };

    const createVariation = async () => {
        if (!newVariation.name.trim()) {
            alert('Nome da variação é obrigatório!');
            return;
        }

        if (newVariation.price <= 0) {
            alert('Preço deve ser maior que zero!');
            return;
        }

        try {
            const { error } = await supabase
                .from('product_variations')
                .insert([{
                    ...newVariation,
                    user_id: user?.id,
                    product_id: null, // Será associado depois ao produto
                    display_order: 0 // Campo obrigatório
                }]);

            if (error) throw error;

            setNewVariation({
                name: '',
                price: 0,
                sku: '',
                stock_quantity: null,
                is_available: true
            });
            fetchVariations();
        } catch (error) {
            console.error('Error creating variation:', error);
            alert('Erro ao criar variação!');
        }
    };

    const deleteVariation = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta variação?')) return;

        try {
            const { error } = await supabase
                .from('product_variations')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchVariations();
        } catch (error) {
            console.error('Error deleting variation:', error);
            alert('Erro ao excluir variação!');
        }
    };

    const toggleAvailability = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('product_variations')
                .update({ is_available: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            fetchVariations();
        } catch (error) {
            console.error('Error toggling availability:', error);
            alert('Erro ao alterar disponibilidade!');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-black text-gray-900">Variações de Produtos</h2>
                <p className="text-gray-500 mt-1">Crie variações como tamanhos, volumes, sabores (ex: 300ml, 500ml, 1L, 2L)</p>
            </div>

            {/* Create New Variation */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-blue-600" />
                    Criar Nova Variação
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome da Variação *</label>
                        <input
                            type="text"
                            value={newVariation.name}
                            onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
                            placeholder="Ex: 300ml, 500ml, 1L, P, M, G"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Preço *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={newVariation.price}
                                onChange={(e) => setNewVariation({ ...newVariation, price: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">SKU (Opcional)</label>
                        <input
                            type="text"
                            value={newVariation.sku}
                            onChange={(e) => setNewVariation({ ...newVariation, sku: e.target.value })}
                            placeholder="Código do produto"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Estoque (Opcional)</label>
                        <input
                            type="number"
                            min="0"
                            value={newVariation.stock_quantity || ''}
                            onChange={(e) => setNewVariation({ ...newVariation, stock_quantity: e.target.value ? parseInt(e.target.value) : null })}
                            placeholder="Quantidade disponível"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                <button
                    onClick={createVariation}
                    className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    Criar Variação
                </button>

                <p className="text-xs text-gray-500 mt-3 text-center">
                    💡 Dica: Após criar, você poderá vincular estas variações aos produtos
                </p>
            </div>

            {/* Variations List */}
            <div className="bg-white rounded-2xl border border-gray100 shadow-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Package size={20} className="text-blue-600" />
                        Variações Criadas ({variations.length})
                    </h3>
                </div>

                <div className="p-4">
                    {variations.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Nenhuma variação criada ainda.</p>
                            <p className="text-sm text-gray-400 mt-1">Crie uma variação acima para começar!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {variations.map((variation) => (
                                <div
                                    key={variation.id}
                                    className={`p-4 rounded-xl border-2 transition-all ${variation.is_available
                                        ? 'border-blue-200 bg-blue-50'
                                        : 'border-gray-200 bg-gray-50 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-900 text-lg">{variation.name}</h4>
                                            <p className="text-2xl font-black text-blue-600 mt-1">
                                                {formatCurrency(variation.price)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => deleteVariation(variation.id)}
                                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {variation.sku && (
                                        <p className="text-xs text-gray-600 mb-2">
                                            <span className="font-bold">SKU:</span> {variation.sku}
                                        </p>
                                    )}

                                    {variation.stock_quantity !== null && (
                                        <p className="text-xs text-gray-600 mb-3">
                                            <span className="font-bold">Estoque:</span> {variation.stock_quantity} unidades
                                        </p>
                                    )}

                                    <button
                                        onClick={() => toggleAvailability(variation.id, variation.is_available)}
                                        className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-all ${variation.is_available
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {variation.is_available ? '✓ Disponível' : '✗ Indisponível'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    💡 Como Usar Variações
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Crie variações para produtos com diferentes tamanhos ou volumes</li>
                    <li>• Exemplo: Refrigerante pode ter 300ml (R$5), 500ml (R$7), 1L (R$10)</li>
                    <li>• Cada variação tem seu próprio preço independente</li>
                    <li>• Você pode controlar estoque individualmente para cada variação</li>
                    <li>• Vincule variações aos produtos na aba "Produtos"</li>
                </ul>
            </div>
        </div>
    );
};

export default ProductVariationManager;
