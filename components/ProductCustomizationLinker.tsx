import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { ProductVariation, ProductAddonGroup } from '../types';
import { Package, Plus, Check } from 'lucide-react';

interface ProductCustomizationLinkerProps {
    productId: string;
    productName: string;
    onClose: () => void;
}

const ProductCustomizationLinker: React.FC<ProductCustomizationLinkerProps> = ({
    productId,
    productName,
    onClose
}) => {
    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [addonGroups, setAddonGroups] = useState<ProductAddonGroup[]>([]);
    const [selectedVariations, setSelectedVariations] = useState<string[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [productId]);

    const fetchData = async () => {
        try {
            // Fetch all variations
            const { data: variationsData } = await supabase
                .from('product_variations')
                .select('*')
                .is('product_id', null)
                .eq('is_available', true)
                .order('name');

            // Fetch variations already linked
            const { data: linkedVariations } = await supabase
                .from('product_variations')
                .select('id')
                .eq('product_id', productId);

            // Fetch all addon groups
            const { data: groupsData } = await supabase
                .from('product_addon_groups')
                .select('*, product_addons(count)')
                .order('name');

            // Fetch groups already linked
            const { data: linkedGroups } = await supabase
                .from('product_addon_group_links')
                .select('group_id')
                .eq('product_id', productId);

            setVariations(variationsData || []);
            setAddonGroups(groupsData || []);
            setSelectedVariations(linkedVariations?.map(v => v.id) || []);
            setSelectedGroups(linkedGroups?.map(g => g.group_id) || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleVariation = (variationId: string) => {
        setSelectedVariations(prev =>
            prev.includes(variationId)
                ? prev.filter(id => id !== variationId)
                : [...prev, variationId]
        );
    };

    const toggleGroup = (groupId: string) => {
        setSelectedGroups(prev =>
            prev.includes(groupId)
                ? prev.filter(id => id !== groupId)
                : [...prev, groupId]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Update variations
            // 1. Unlink all current variations
            await supabase
                .from('product_variations')
                .update({ product_id: null })
                .eq('product_id', productId);

            // 2. Link selected variations
            if (selectedVariations.length > 0) {
                await supabase
                    .from('product_variations')
                    .update({ product_id: productId })
                    .in('id', selectedVariations);
            }

            // Update addon groups
            // 1. Delete all current links
            await supabase
                .from('product_addon_group_links')
                .delete()
                .eq('product_id', productId);

            // 2. Create new links
            if (selectedGroups.length > 0) {
                const { data: userData } = await supabase.auth.getUser();
                const links = selectedGroups.map(groupId => ({
                    product_id: productId,
                    group_id: groupId,
                    user_id: userData.user?.id
                }));

                await supabase
                    .from('product_addon_group_links')
                    .insert(links);
            }

            alert('Customizações vinculadas com sucesso!');
            onClose();
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar customizações!');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-4xl my-8">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-2xl font-black text-gray-900">Customizar Produto</h2>
                    <p className="text-gray-500 mt-1">
                        Vincule variações e complementos para: <span className="font-bold text-orange-600">{productName}</span>
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Variations Section */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Package size={20} className="text-blue-600" />
                            Variações Disponíveis
                        </h3>
                        {variations.length === 0 ? (
                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                <p className="text-gray-500 text-sm">Nenhuma variação disponível</p>
                                <p className="text-gray-400 text-xs mt-1">Crie variações na aba "Variações" primeiro</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {variations.map((variation) => (
                                    <button
                                        key={variation.id}
                                        onClick={() => toggleVariation(variation.id)}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${selectedVariations.includes(variation.id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="font-bold text-gray-900">{variation.name}</span>
                                            {selectedVariations.includes(variation.id) && (
                                                <Check size={18} className="text-blue-600" />
                                            )}
                                        </div>
                                        <span className="text-sm font-bold text-blue-600">
                                            R$ {variation.price.toFixed(2)}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Addon Groups Section */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Plus size={20} className="text-orange-600" />
                            Grupos de Complementos
                        </h3>
                        {addonGroups.length === 0 ? (
                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                <p className="text-gray-500 text-sm">Nenhum grupo de complementos disponível</p>
                                <p className="text-gray-400 text-xs mt-1">Crie grupos na aba "Complementos" primeiro</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {addonGroups.map((group) => (
                                    <button
                                        key={group.id}
                                        onClick={() => toggleGroup(group.id)}
                                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedGroups.includes(group.id)
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {selectedGroups.includes(group.id) && (
                                                    <Check size={18} className="text-orange-600" />
                                                )}
                                                <div>
                                                    <span className="font-bold text-gray-900">{group.name}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-xs px-2 py-0.5 rounded ${group.is_required
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                            }`}>
                                                            {group.is_required ? 'Obrigatório' : 'Opcional'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {group.min_selections} - {group.max_selections} seleções
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Check size={20} />
                                Salvar Customizações
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCustomizationLinker;
