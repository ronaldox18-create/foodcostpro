import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Minus, DollarSign, MessageSquare } from 'lucide-react';
import { Product, ProductVariation, ProductAddonGroup, ProductAddon } from '../types';
import { formatCurrency } from '../utils/calculations';
import { supabase } from '../utils/supabaseClient';

interface ProductCustomizationModalProps {
    product: Product;
    onClose: () => void;
    onAddToCart: (customization: ProductCustomization) => void;
}

export interface ProductCustomization {
    productId: string;
    quantity: number;
    variation?: ProductVariation;
    selectedAddons: Array<{
        addon_id: string;
        group_id: string;
        group_name: string;
        addon_name: string;
        price_adjustment: number;
    }>;
    notes: string;
    totalPrice: number;
}

const ProductCustomizationModal: React.FC<ProductCustomizationModalProps> = ({
    product,
    onClose,
    onAddToCart
}) => {
    const [quantity, setQuantity] = useState(1);
    const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<Record<string, string[]>>({});
    const [notes, setNotes] = useState('');
    const [variations, setVariations] = useState<ProductVariation[]>([]);
    const [addonGroups, setAddonGroups] = useState<ProductAddonGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomizationOptions();
    }, [product.id]);

    const fetchCustomizationOptions = async () => {
        try {
            // Fetch variations
            const { data: variationsData } = await supabase
                .from('product_variations')
                .select('*')
                .eq('product_id', product.id)
                .eq('is_available', true)
                .order('display_order', { ascending: true });

            setVariations(variationsData || []);
            if (variationsData && variationsData.length > 0) {
                setSelectedVariation(variationsData[0]);
            }

            // Fetch addon groups linked to this product
            const { data: linksData } = await supabase
                .from('product_addon_group_links')
                .select('group_id')
                .eq('product_id', product.id);

            if (linksData && linksData.length > 0) {
                const groupIds = linksData.map(link => link.group_id);

                const { data: groupsData } = await supabase
                    .from('product_addon_groups')
                    .select('*, product_addons(*)')
                    .in('id', groupIds)
                    .order('display_order', { ascending: true });

                setAddonGroups(groupsData || []);
            }
        } catch (error) {
            console.error('Error fetching customization options:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleAddon = (groupId: string, addonId: string) => {
        const group = addonGroups.find(g => g.id === groupId);
        if (!group) return;

        const currentGroupAddons = selectedAddons[groupId] || [];

        if (currentGroupAddons.includes(addonId)) {
            // Remove addon
            setSelectedAddons({
                ...selectedAddons,
                [groupId]: currentGroupAddons.filter(id => id !== addonId)
            });
        } else {
            // Add addon
            let newGroupAddons = [...currentGroupAddons, addonId];

            // Check max_selections limit
            if (newGroupAddons.length > group.max_selections) {
                alert(`Você pode selecionar no máximo ${group.max_selections} ${group.max_selections === 1 ? 'item' : 'itens'} neste grupo.`);
                return;
            }

            setSelectedAddons({
                ...selectedAddons,
                [groupId]: newGroupAddons
            });
        }
    };

    const calculateTotalPrice = useMemo(() => {
        let basePrice = selectedVariation ? selectedVariation.price : product.currentPrice;

        // Add addons price adjustments
        let addonsTotal = 0;
        Object.entries(selectedAddons).forEach(([groupId, addonIds]) => {
            const group = addonGroups.find(g => g.id === groupId);
            if (group && group.product_addons) {
                addonIds.forEach(addonId => {
                    const addon = group.product_addons!.find(a => a.id === addonId);
                    if (addon) {
                        addonsTotal += addon.price_adjustment;
                    }
                });
            }
        });

        return (basePrice + addonsTotal) * quantity;
    }, [selectedVariation, selectedAddons, quantity, product.currentPrice, addonGroups]);

    const validateAndAddToCart = async () => {
        // Validate stock for variation
        if (selectedVariation && selectedVariation.stock_quantity !== null) {
            if (selectedVariation.stock_quantity < quantity) {
                alert(`Estoque insuficiente para ${selectedVariation.name}!`);
                return;
            }
        }

        // Validate stock for addons (check ingredient stock)
        try {
            for (const [groupId, addonIds] of Object.entries(selectedAddons)) {
                const group = addonGroups.find(g => g.id === groupId);
                if (group && group.product_addons) {
                    for (const addonId of addonIds) {
                        const addon = group.product_addons.find(a => a.id === addonId);

                        // Se addon tem ingrediente vinculado, verificar estoque
                        if (addon && addon.ingredient_id) {
                            const { data: ingredient } = await supabase
                                .from('ingredients')
                                .select('stock_quantity, unit, name')
                                .eq('id', addon.ingredient_id)
                                .single();

                            // Se ingrediente tem controle de estoque
                            if (ingredient && ingredient.stock_quantity !== null && ingredient.stock_quantity !== undefined) {
                                const needed = addon.quantity_used || 0;
                                const available = ingredient.stock_quantity;

                                // Converter unidades se necessário
                                let neededInStockUnit = needed;
                                if (addon.unit_used && ingredient.unit && addon.unit_used !== ingredient.unit) {
                                    // Conversão simples
                                    if (addon.unit_used === 'kg' && ingredient.unit === 'g') neededInStockUnit = needed * 1000;
                                    else if (addon.unit_used === 'g' && ingredient.unit === 'kg') neededInStockUnit = needed / 1000;
                                    else if (addon.unit_used === 'l' && ingredient.unit === 'ml') neededInStockUnit = needed * 1000;
                                    else if (addon.unit_used === 'ml' && ingredient.unit === 'l') neededInStockUnit = needed / 1000;
                                }

                                // Verificar se  há estoque suficiente
                                if (available < neededInStockUnit) {
                                    alert(`❌ ${addon.name} está esgotado!\n(Falta ${ingredient.name} no estoque)`);
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error validating addon stock:', error);
            alert('Erro ao validar estoque. Tente novamente.');
            return;
        }

        // Validate required groups
        for (const group of addonGroups) {
            const selectedCount = (selectedAddons[group.id] || []).length;

            if (group.is_required && selectedCount < group.min_selections) {
                alert(`Por favor, selecione pelo menos ${group.min_selections} ${group.min_selections === 1 ? 'item' : 'itens'} em "${group.name}"`);
                return;
            }
        }

        // Build selected addons array
        const addonsArray: ProductCustomization['selectedAddons'] = [];
        Object.entries(selectedAddons).forEach(([groupId, addonIds]) => {
            const group = addonGroups.find(g => g.id === groupId);
            if (group && group.product_addons) {
                addonIds.forEach(addonId => {
                    const addon = group.product_addons!.find(a => a.id === addonId);
                    if (addon) {
                        addonsArray.push({
                            addon_id: addon.id,
                            group_id: group.id,
                            group_name: group.name,
                            addon_name: addon.name,
                            price_adjustment: addon.price_adjustment
                        });
                    }
                });
            }
        });

        const customization: ProductCustomization = {
            productId: product.id,
            quantity,
            variation: selectedVariation || undefined,
            selectedAddons: addonsArray,
            notes: notes.trim(),
            totalPrice: calculateTotalPrice
        };

        onAddToCart(customization);
        onClose();
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="bg-white rounded-t-3xl md:rounded-2xl w-full md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-start justify-between bg-gray-50">
                    <div className="flex-1">
                        <h2 className="text-xl font-black text-gray-900">{product.name}</h2>
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Variations */}
                    {variations.length > 0 && (
                        <div>
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <span className="text-red-500">*</span>
                                Escolha o tamanho
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {variations.map((variation) => {
                                    const isOutOfStock = variation.stock_quantity !== null && variation.stock_quantity === 0;
                                    return (
                                        <button
                                            key={variation.id}
                                            onClick={() => !isOutOfStock && setSelectedVariation(variation)}
                                            disabled={isOutOfStock}
                                            className={`p-4 rounded-xl border-2 transition-all ${isOutOfStock
                                                ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-100'
                                                : selectedVariation?.id === variation.id
                                                    ? 'border-orange-500 bg-orange-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <p className="font-bold text-gray-900">{variation.name}</p>
                                            <p className="text-lg font-black text-orange-600 mt-1">
                                                {formatCurrency(variation.price)}
                                            </p>
                                            {isOutOfStock && (
                                                <p className="text-xs text-red-600 font-bold mt-1">
                                                    ❌ Esgotado
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Addon Groups */}
                    {addonGroups.map((group) => (
                        <div key={group.id}>
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                {group.is_required && <span className="text-red-500">*</span>}
                                {group.name}
                                <span className="text-xs text-gray-500 font-normal">
                                    {group.is_required
                                        ? `(Obrigatório - ${group.min_selections} a ${group.max_selections})`
                                        : `(Opcional - até ${group.max_selections})`
                                    }
                                </span>
                            </h3>
                            <div className="space-y-2">
                                {group.product_addons && group.product_addons.map((addon) => {
                                    return (
                                        <button
                                            key={addon.id}
                                            onClick={() => toggleAddon(group.id, addon.id)}
                                            className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${(selectedAddons[group.id] || []).includes(addon.id)
                                                ? 'border-orange-500 bg-orange-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${(selectedAddons[group.id] || []).includes(addon.id)
                                                    ? 'border-orange-500 bg-orange-500'
                                                    : 'border-gray-300'
                                                    }`}>
                                                    {(selectedAddons[group.id] || []).includes(addon.id) && (
                                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="text-left">
                                                    <span className="font-medium text-gray-900">{addon.name}</span>
                                                </div>
                                            </div>
                                            <span className={`font-bold text-sm ${addon.price_adjustment > 0 ? 'text-green-600' :
                                                addon.price_adjustment < 0 ? 'text-red-600' :
                                                    'text-gray-500'
                                                }`}>
                                                {addon.price_adjustment === 0
                                                    ? 'Grátis'
                                                    : `${addon.price_adjustment > 0 ? '+' : ''}${formatCurrency(addon.price_adjustment)}`
                                                }
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Notes */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <MessageSquare size={18} />
                            Observações (Opcional)
                        </h3>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Sem cebola, por favor"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
                    {/* Quantity */}
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">Quantidade</span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                <Minus size={18} />
                            </button>
                            <span className="font-black text-xl w-12 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                        onClick={validateAndAddToCart}
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-4 rounded-xl font-bold text-lg hover:from-orange-700 hover:to-red-700 transition-all flex items-center justify-between px-6"
                    >
                        <span>Adicionar ao Carrinho</span>
                        <span className="text-2xl font-black">{formatCurrency(calculateTotalPrice)}</span>
                    </button>
                </div>
            </div>
        </div >
    );
};

export default ProductCustomizationModal;
