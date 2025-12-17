import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { ProductAddonGroup, ProductAddon } from '../types';
import { Plus, Edit, Trash2, Save, X, DollarSign, Check } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

const ProductAddonManager: React.FC = () => {
    const { user } = useAuth();
    const [groups, setGroups] = useState<ProductAddonGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [newGroup, setNewGroup] = useState({ name: '', is_required: false, min_selections: 0, max_selections: 1 });
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

    // Addon state
    const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
    const [newAddon, setNewAddon] = useState({ name: '', price_adjustment: 0, group_id: '' });

    useEffect(() => {
        if (user?.id) fetchGroups();
    }, [user]);

    const fetchGroups = async () => {
        try {
            const { data: groupsData, error: groupsError } = await supabase
                .from('product_addon_groups')
                .select('*, product_addons(*)')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (groupsError) throw groupsError;
            setGroups(groupsData || []);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const createGroup = async () => {
        if (!newGroup.name.trim()) {
            alert('Nome do grupo é obrigatório!');
            return;
        }

        try {
            const { error } = await supabase
                .from('product_addon_groups')
                .insert([{
                    ...newGroup,
                    user_id: user?.id,
                    display_order: 0 // Campo obrigatório
                }]);

            if (error) throw error;

            setNewGroup({ name: '', is_required: false, min_selections: 0, max_selections: 1 });
            fetchGroups();
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Erro ao criar grupo!');
        }
    };

    const deleteGroup = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este grupo e todos os complementos?')) return;

        try {
            const { error } = await supabase
                .from('product_addon_groups')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchGroups();
        } catch (error) {
            console.error('Error deleting group:', error);
            alert('Erro ao excluir grupo!');
        }
    };

    const createAddon = async (groupId: string) => {
        if (!newAddon.name.trim()) {
            alert('Nome do complemento é obrigatório!');
            return;
        }

        try {
            const { error } = await supabase
                .from('product_addons')
                .insert([{
                    name: newAddon.name,
                    price_adjustment: newAddon.price_adjustment,
                    group_id: groupId,
                    user_id: user?.id,
                    is_available: true, // Campo obrigatório
                    display_order: 0 // Campo obrigatório
                }]);

            if (error) throw error;

            setNewAddon({ name: '', price_adjustment: 0, group_id: '' });
            fetchGroups();
        } catch (error) {
            console.error('Error creating addon:', error);
            alert('Erro ao criar complemento!');
        }
    };

    const deleteAddon = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este complemento?')) return;

        try {
            const { error } = await supabase
                .from('product_addons')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchGroups();
        } catch (error) {
            console.error('Error deleting addon:', error);
            alert('Erro ao excluir complemento!');
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
                <h2 className="text-2xl font-black text-gray-900">Complementos e Adicionais</h2>
                <p className="text-gray-500 mt-1">Crie grupos de complementos para seus produtos (ex: Adicionais, Remover, Molhos)</p>
            </div>

            {/* Create New Group */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-orange-600" />
                    Criar Novo Grupo de Complementos
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome do Grupo</label>
                        <input
                            type="text"
                            value={newGroup.name}
                            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                            placeholder="Ex: Adicionais, Remover, Molhos"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Tipo</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setNewGroup({ ...newGroup, is_required: false })}
                                className={`flex-1 px-4 py-3 rounded-xl border-2 font-bold transition-all ${!newGroup.is_required
                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                    : 'border-gray-200 bg-white text-gray-600'
                                    }`}
                            >
                                Opcional
                            </button>
                            <button
                                onClick={() => setNewGroup({ ...newGroup, is_required: true })}
                                className={`flex-1 px-4 py-3 rounded-xl border-2 font-bold transition-all ${newGroup.is_required
                                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                                    : 'border-gray-200 bg-white text-gray-600'
                                    }`}
                            >
                                Obrigatório
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mínimo de Seleções</label>
                        <input
                            type="number"
                            min="0"
                            value={newGroup.min_selections}
                            onChange={(e) => setNewGroup({ ...newGroup, min_selections: parseInt(e.target.value) || 0 })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Máximo de Seleções</label>
                        <input
                            type="number"
                            min="1"
                            value={newGroup.max_selections}
                            onChange={(e) => setNewGroup({ ...newGroup, max_selections: parseInt(e.target.value) || 1 })}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>
                </div>

                <button
                    onClick={createGroup}
                    className="mt-4 w-full bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={20} />
                    Criar Grupo
                </button>
            </div>

            {/* Groups List */}
            <div className="space-y-4">
                {groups.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-12 text-center">
                        <p className="text-gray-500">Nenhum grupo de complementos criado ainda.</p>
                        <p className="text-sm text-gray-400 mt-1">Crie um grupo acima para começar!</p>
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Group Header */}
                            <div
                                className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                                onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-3 py-1 rounded-lg text-xs font-bold ${group.is_required
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {group.is_required ? 'Obrigatório' : 'Opcional'}
                                        </div>
                                        <h3 className="font-bold text-gray-900">{group.name}</h3>
                                        <span className="text-xs text-gray-500">
                                            ({group.product_addons?.length || 0} complementos)
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteGroup(group.id);
                                            }}
                                            className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Group Content */}
                            {expandedGroupId === group.id && (
                                <div className="p-4 space-y-4">
                                    {/* Add New Addon */}
                                    <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                                        <h4 className="font-bold text-gray-900 mb-3 text-sm">Adicionar Complemento</h4>
                                        <div className="flex gap-3">
                                            <input
                                                type="text"
                                                placeholder="Nome (ex: Bacon Extra)"
                                                value={newAddon.group_id === group.id ? newAddon.name : ''}
                                                onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value, group_id: group.id })}
                                                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                            />
                                            <div className="relative">
                                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={newAddon.group_id === group.id ? newAddon.price_adjustment : 0}
                                                    onChange={(e) => setNewAddon({ ...newAddon, price_adjustment: parseFloat(e.target.value) || 0, group_id: group.id })}
                                                    className="w-32 pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                                                />
                                            </div>
                                            <button
                                                onClick={() => createAddon(group.id)}
                                                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm"
                                            >
                                                <Plus size={16} />
                                                Adicionar
                                            </button>
                                        </div>
                                    </div>

                                    {/* Addons List */}
                                    <div className="space-y-2">
                                        {group.product_addons && group.product_addons.length > 0 ? (
                                            group.product_addons.map((addon) => (
                                                <div key={addon.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <Check size={16} className="text-green-600" />
                                                        <span className="font-medium text-gray-900">{addon.name}</span>
                                                        <span className={`text-sm font-bold ${addon.price_adjustment > 0 ? 'text-green-600' :
                                                            addon.price_adjustment < 0 ? 'text-red-600' :
                                                                'text-gray-500'
                                                            }`}>
                                                            {addon.price_adjustment === 0
                                                                ? 'Grátis'
                                                                : `${addon.price_adjustment > 0 ? '+' : ''}${formatCurrency(addon.price_adjustment)}`
                                                            }
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteAddon(addon.id)}
                                                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center text-gray-400 text-sm py-4">Nenhum complemento adicionado ainda</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ProductAddonManager;
