import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp, Info, AlertCircle, Save, Calculator } from 'lucide-react';
import { Product, ProductVariation, ProductAddonGroup, ProductAddon, Ingredient } from '../types';
import { supabase } from '../utils/supabaseClient';
import { formatCurrency } from '../utils/calculations';

interface ProductEditModalProps {
    product?: Product | null;
    onClose: () => void;
    onSave: () => void;
}

interface VariationForm extends Omit<ProductVariation, 'id' | 'product_id' | 'created_at' | 'updated_at'> {
    id?: string;
    _isNew?: boolean;
    _toDelete?: boolean;
}

interface AddonForm extends Omit<ProductAddon, 'id' | 'group_id' | 'created_at'> {
    id?: string;
    _isNew?: boolean;
    _toDelete?: boolean;
}

interface AddonGroupForm extends Omit<ProductAddonGroup, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
    id?: string;
    _isNew?: boolean;
    _toDelete?: boolean;
    addons: AddonForm[];
    _isExpanded?: boolean;
}

const ProductEditModal: React.FC<ProductEditModalProps> = ({ product, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Dados Básicos do Produto
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [basePrice, setBasePrice] = useState(0);
    const [hasVariations, setHasVariations] = useState(false);
    const [baseStock, setBaseStock] = useState<number | null>(null);

    // Variações
    const [variations, setVariations] = useState<VariationForm[]>([]);

    // Grupos de Complementos
    const [addonGroups, setAddonGroups] = useState<AddonGroupForm[]>([]);

    // Receita (ingredientes do produto)
    const [recipe, setRecipe] = useState<Array<{
        id?: string;
        ingredient_id: string;
        ingredient_name?: string;
        quantity_needed: number;
        unit: string;
        _toDelete?: boolean;
    }>>([]);

    // Estados auxiliares para adicionar ingrediente à receita
    const [newRecipeIngredientId, setNewRecipeIngredientId] = useState('');
    const [newRecipeQuantity, setNewRecipeQuantity] = useState<number | null>(null);
    const [newRecipeUnit, setNewRecipeUnit] = useState<'g' | 'kg' | 'ml' | 'l' | 'un'>('g');

    // Lista de ingredientes disponíveis
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);

    useEffect(() => {
        loadIngredients();
        if (product) {
            loadProductData();
        }
    }, [product]);

    const loadIngredients = async () => {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) return;

            const { data } = await supabase
                .from('ingredients')
                .select('*')
                .eq('user_id', user.id)
                .order('name');

            if (data) {
                setIngredients(data);
            }
        } catch (error) {
            console.error('Error loading ingredients:', error);
        }
    };

    const loadProductData = async () => {
        if (!product) return;
        setLoading(true);

        try {
            // Carregar dados básicos
            setName(product.name);
            setDescription(product.description || '');
            setCategory(product.category || '');
            setBasePrice(product.currentPrice);

            // Carregar variações
            const { data: variationsData } = await supabase
                .from('product_variations')
                .select('*')
                .eq('product_id', product.id)
                .order('display_order');

            if (variationsData && variationsData.length > 0) {
                setHasVariations(true);
                setVariations(variationsData.map(v => ({
                    name: v.name,
                    price: v.price,
                    is_default: v.is_default,
                    is_available: v.is_available,
                    stock_quantity: v.stock_quantity,
                    display_order: v.display_order,
                    id: v.id
                })));
            }

            // Carregar grupos de complementos vinculados
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
                    .order('display_order');

                if (groupsData) {
                    setAddonGroups(groupsData.map(g => ({
                        id: g.id,
                        name: g.name,
                        description: g.description,
                        is_required: g.is_required,
                        min_selections: g.min_selections,
                        max_selections: g.max_selections,
                        display_order: g.display_order,
                        _isExpanded: false,
                        addons: (g.product_addons || []).map((a: any) => ({
                            id: a.id,
                            name: a.name,
                            price_adjustment: a.price_adjustment,
                            is_available: a.is_available,
                            ingredient_id: a.ingredient_id,
                            quantity_used: a.quantity_used,
                            unit_used: a.unit_used,
                            display_order: a.display_order
                        }))
                    })));
                }
            }

            // Carregar receita do produto
            const { data: recipeData } = await supabase
                .from('product_recipes')
                .select('id, ingredient_id, quantity_needed, unit, ingredients(name)')
                .eq('product_id', product.id);

            if (recipeData) {
                setRecipe(recipeData.map((r: any) => ({
                    id: r.id,
                    ingredient_id: r.ingredient_id,
                    ingredient_name: r.ingredients?.name || 'Ingrediente',
                    quantity_needed: r.quantity_needed,
                    unit: r.unit
                })));
            }
        } catch (error) {
            console.error('Error loading product data:', error);
            alert('Erro ao carregar dados do produto');
        } finally {
            setLoading(false);
        }
    };

    // ========== VARIAÇÕES ==========

    const addVariation = () => {
        setVariations([
            ...variations,
            {
                name: '',
                price: basePrice,
                is_default: variations.length === 0,
                is_available: true,
                stock_quantity: null,
                display_order: variations.length,
                _isNew: true
            }
        ]);
    };

    const updateVariation = (index: number, field: keyof VariationForm, value: any) => {
        const updated = [...variations];
        updated[index] = { ...updated[index], [field]: value };
        setVariations(updated);
    };

    const removeVariation = (index: number) => {
        const updated = [...variations];
        if (updated[index].id) {
            updated[index]._toDelete = true;
        } else {
            updated.splice(index, 1);
        }
        setVariations(updated);
    };

    // ========== RECEITA ==========

    const addIngredientToRecipe = () => {
        if (!newRecipeIngredientId || !newRecipeQuantity) return;

        const ingredient = ingredients.find(i => i.id === newRecipeIngredientId);
        if (!ingredient) return;

        setRecipe([
            ...recipe,
            {
                ingredient_id: newRecipeIngredientId,
                ingredient_name: ingredient.name,
                quantity_needed: newRecipeQuantity,
                unit: newRecipeUnit
            }
        ]);

        // Limpar campos
        setNewRecipeIngredientId('');
        setNewRecipeQuantity(null);
        setNewRecipeUnit('g');
    };

    const removeIngredientFromRecipe = (index: number) => {
        const updated = [...recipe];
        if (updated[index].id) {
            updated[index]._toDelete = true;
        } else {
            updated.splice(index, 1);
        }
        setRecipe(updated);
    };

    // ========== GRUPOS E COMPLEMENTOS ==========

    const addAddonGroup = () => {
        setAddonGroups([
            ...addonGroups,
            {
                name: '',
                description: '',
                is_required: false,
                min_selections: 0,
                max_selections: 1,
                display_order: addonGroups.length,
                _isNew: true,
                _isExpanded: true,
                addons: []
            }
        ]);
    };

    const updateAddonGroup = (index: number, field: keyof AddonGroupForm, value: any) => {
        const updated = [...addonGroups];
        updated[index] = { ...updated[index], [field]: value };
        setAddonGroups(updated);
    };

    const toggleGroupExpanded = (index: number) => {
        const updated = [...addonGroups];
        updated[index]._isExpanded = !updated[index]._isExpanded;
        setAddonGroups(updated);
    };

    const removeAddonGroup = (index: number) => {
        const updated = [...addonGroups];
        if (updated[index].id) {
            updated[index]._toDelete = true;
        } else {
            updated.splice(index, 1);
        }
        setAddonGroups(updated);
    };

    const addAddonToGroup = (groupIndex: number) => {
        const updated = [...addonGroups];
        updated[groupIndex].addons.push({
            name: '',
            price_adjustment: 0,
            is_available: true,
            ingredient_id: null,
            quantity_used: null,
            unit_used: null,
            display_order: updated[groupIndex].addons.length,
            _isNew: true
        });
        setAddonGroups(updated);
    };

    const updateAddon = (groupIndex: number, addonIndex: number, field: keyof AddonForm, value: any) => {
        const updated = [...addonGroups];
        updated[groupIndex].addons[addonIndex] = {
            ...updated[groupIndex].addons[addonIndex],
            [field]: value
        };
        setAddonGroups(updated);
    };

    const removeAddon = (groupIndex: number, addonIndex: number) => {
        const updated = [...addonGroups];
        const addon = updated[groupIndex].addons[addonIndex];
        if (addon.id) {
            addon._toDelete = true;
        } else {
            updated[groupIndex].addons.splice(addonIndex, 1);
        }
        setAddonGroups(updated);
    };

    // ========== HELPER: STATUS DO ESTOQUE ==========

    const getStockStatus = (stockQuantity: number | null | undefined): {
        label: string;
        color: string;
        bgColor: string;
        borderColor: string;
    } => {
        if (stockQuantity === null || stockQuantity === undefined) {
            return {
                label: 'Ilimitado',
                color: 'text-gray-600',
                bgColor: 'bg-gray-100',
                borderColor: 'border-gray-300'
            };
        }

        if (stockQuantity === 0) {
            return {
                label: '❌ ESGOTADO',
                color: 'text-red-700',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-300'
            };
        }

        if (stockQuantity <= 5) {
            return {
                label: '⚠️ BAIXO',
                color: 'text-yellow-700',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-300'
            };
        }

        return {
            label: '✅ OK',
            color: 'text-green-700',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-300'
        };
    };

    // ========== SALVAR ==========

    const handleSave = async () => {
        // Validações
        if (!name.trim()) {
            alert('Nome do produto é obrigatório');
            return;
        }

        if (hasVariations && variations.filter(v => !v._toDelete).length === 0) {
            alert('Adicione pelo menos uma variação ou desmarque "Este produto tem tamanhos"');
            return;
        }

        setSaving(true);

        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('Usuário não autenticado');

            let productId = product?.id;

            // 1. Criar/Atualizar produto
            if (productId) {
                // Atualizar produto existente
                await supabase
                    .from('products')
                    .update({
                        name,
                        description,
                        category,
                        currentPrice: basePrice,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', productId);
            } else {
                // Criar novo produto (futuro - não implementado nesta versão)
                alert('Criação de novo produto ainda não implementada');
                return;
            }

            // 2. Salvar variações
            if (hasVariations) {
                // Deletar variações marcadas
                const toDelete = variations.filter(v => v._toDelete && v.id);
                if (toDelete.length > 0) {
                    await supabase
                        .from('product_variations')
                        .delete()
                        .in('id', toDelete.map(v => v.id!));
                }

                // Inserir novas e atualizar existentes
                for (const variation of variations.filter(v => !v._toDelete)) {
                    const varData = {
                        product_id: productId,
                        name: variation.name,
                        price: variation.price,
                        is_default: variation.is_default,
                        is_available: variation.is_available,
                        stock_quantity: variation.stock_quantity,
                        display_order: variation.display_order
                    };

                    if (variation._isNew) {
                        await supabase.from('product_variations').insert(varData);
                    } else if (variation.id) {
                        await supabase
                            .from('product_variations')
                            .update(varData)
                            .eq('id', variation.id);
                    }
                }
            } else {
                // Se não tem variações, deletar todas
                await supabase
                    .from('product_variations')
                    .delete()
                    .eq('product_id', productId);
            }

            // 3. Salvar grupos de complementos
            // Deletar grupos marcados
            const groupsToDelete = addonGroups.filter(g => g._toDelete && g.id);
            if (groupsToDelete.length > 0) {
                for (const group of groupsToDelete) {
                    // Primeiro deletar addons do grupo
                    await supabase.from('product_addons').delete().eq('group_id', group.id!);
                    // Depois deletar o grupo
                    await supabase.from('product_addon_groups').delete().eq('id', group.id!);
                    // E o link
                    await supabase
                        .from('product_addon_group_links')
                        .delete()
                        .eq('group_id', group.id!)
                        .eq('product_id', productId);
                }
            }

            // Inserir/atualizar grupos
            for (const group of addonGroups.filter(g => !g._toDelete)) {
                let groupId = group.id;

                const groupData = {
                    user_id: user.id,
                    name: group.name,
                    description: group.description,
                    is_required: group.is_required,
                    min_selections: group.min_selections,
                    max_selections: group.max_selections,
                    display_order: group.display_order
                };

                if (group._isNew) {
                    console.log('Creating new group:', groupData);
                    const { data: newGroup, error: groupError } = await supabase
                        .from('product_addon_groups')
                        .insert(groupData)
                        .select()
                        .single();

                    if (groupError) {
                        console.error('Error creating group:', groupError);
                        throw new Error(`Erro ao criar grupo: ${groupError.message}`);
                    }

                    if (!newGroup) {
                        throw new Error('Grupo criado mas não retornou dados');
                    }

                    groupId = newGroup.id;
                    console.log('Group created with ID:', groupId);

                    // Criar link
                    const { error: linkError } = await supabase.from('product_addon_group_links').insert({
                        product_id: productId,
                        group_id: groupId
                    });

                    if (linkError) {
                        console.error('Error creating link:', linkError);
                        throw new Error(`Erro ao vincular grupo ao produto: ${linkError.message}`);
                    }
                } else if (groupId) {
                    const { error: updateError } = await supabase
                        .from('product_addon_groups')
                        .update(groupData)
                        .eq('id', groupId);

                    if (updateError) {
                        console.error('Error updating group:', updateError);
                        throw new Error(`Erro ao atualizar grupo: ${updateError.message}`);
                    }
                }

                // Salvar addons do grupo
                // Deletar addons marcados
                const addonsToDelete = group.addons.filter(a => a._toDelete && a.id);
                if (addonsToDelete.length > 0) {
                    const { error: deleteError } = await supabase
                        .from('product_addons')
                        .delete()
                        .in('id', addonsToDelete.map(a => a.id!));

                    if (deleteError) {
                        console.error('Error deleting addons:', deleteError);
                    }
                }

                // Inserir/atualizar addons
                for (const addon of group.addons.filter(a => !a._toDelete)) {
                    if (!groupId) {
                        console.error('GroupID is null, skipping addon:', addon);
                        continue;
                    }

                    const addonData = {
                        group_id: groupId,
                        name: addon.name,
                        price_adjustment: addon.price_adjustment,
                        is_available: addon.is_available,
                        ingredient_id: addon.ingredient_id || null,
                        quantity_used: addon.quantity_used || null,
                        unit_used: addon.unit_used || null,
                        display_order: addon.display_order
                    };

                    console.log('Saving addon:', addonData);

                    if (addon._isNew) {
                        const { error: insertError } = await supabase.from('product_addons').insert(addonData);
                        if (insertError) {
                            console.error('Error inserting addon:', insertError);
                            throw new Error(`Erro ao criar complemento: ${insertError.message}`);
                        }
                    } else if (addon.id) {
                        const { error: updateError } = await supabase
                            .from('product_addons')
                            .update(addonData)
                            .eq('id', addon.id);

                        if (updateError) {
                            console.error('Error updating addon:', updateError);
                            throw new Error(`Erro ao atualizar complemento: ${updateError.message}`);
                        }
                    }
                }
            }

            // 4. Salvar receita do produto
            // Deletar ingredientes marcados
            const ingredientsToDelete = recipe.filter(r => r._toDelete && r.id);
            if (ingredientsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('product_recipes')
                    .delete()
                    .in('id', ingredientsToDelete.map(r => r.id!));

                if (deleteError) {
                    console.error('Error deleting recipe items:', deleteError);
                }
            }

            // Inserir/atualizar ingredientes da receita
            for (const recipeItem of recipe.filter(r => !r._toDelete)) {
                const recipeData = {
                    product_id: productId,
                    ingredient_id: recipeItem.ingredient_id,
                    quantity_needed: recipeItem.quantity_needed,
                    unit: recipeItem.unit
                };

                if (!recipeItem.id) {
                    // Novo ingrediente
                    const { error: insertError } = await supabase
                        .from('product_recipes')
                        .insert(recipeData);

                    if (insertError) {
                        console.error('Error inserting recipe item:', insertError);
                        throw new Error(`Erro ao adicionar ingrediente à receita: ${insertError.message}`);
                    }
                } else {
                    // Atualizar existente
                    const { error: updateError } = await supabase
                        .from('product_recipes')
                        .update(recipeData)
                        .eq('id', recipeItem.id);

                    if (updateError) {
                        console.error('Error updating recipe item:', updateError);
                        throw new Error(`Erro ao atualizar ingrediente da receita: ${updateError.message}`);
                    }
                }
            }

            alert('✅ Produto salvo com sucesso!');
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('❌ Erro ao salvar produto');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600 text-sm">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl w-full max-w-5xl my-8 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-orange-50 to-red-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {product ? '✏️ Editar Produto' : '✨ Novo Produto'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Configure variações e complementos inline com controle de estoque
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* ===== SEÇÃO 1: DADOS BÁSICOS ===== */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Info size={18} className="text-blue-600" />
                            </div>
                            Dados Básicos
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome do Produto *
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: X-Bacon Classic"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Categoria
                                </label>
                                <input
                                    type="text"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Ex: Lanches"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Descrição
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Descrição vendedora do produto..."
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                                />
                            </div>

                            {!hasVariations && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Preço (R$) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={basePrice}
                                        onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none font-bold"
                                    />
                                </div>
                            )}

                            {!hasVariations && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Estoque
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={baseStock ?? ''}
                                        onChange={(e) => setBaseStock(e.target.value ? parseInt(e.target.value) : null)}
                                        placeholder="Deixe vazio para ilimitado"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ===== SEÇÃO 2: RECEITA (INGREDIENTES) ===== */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Calculator size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Receita (Ingredientes)</h3>
                                <p className="text-sm text-gray-500">Ingredientes que compõem este produto</p>
                            </div>
                        </div>

                        {/* Adicionar Ingrediente */}
                        <div className="grid grid-cols-12 gap-3 mb-4 p-4 bg-white rounded-xl border-2 border-blue-200 shadow-sm">
                            <select
                                value={newRecipeIngredientId}
                                onChange={(e) => {
                                    setNewRecipeIngredientId(e.target.value);
                                    const ing = ingredients.find(i => i.id === e.target.value);
                                    if (ing) {
                                        setNewRecipeUnit(ing.purchaseUnit === 'l' ? 'ml' : (ing.purchaseUnit === 'kg' ? 'g' : 'un'));
                                    }
                                }}
                                className="col-span-6 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option value="">Selecione um ingrediente...</option>
                                {ingredients.map(i => (
                                    <option key={i.id} value={i.id}>{i.name}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Quantidade"
                                value={newRecipeQuantity || ''}
                                onChange={(e) => setNewRecipeQuantity(parseFloat(e.target.value))}
                                className="col-span-3 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            />
                            <select
                                value={newRecipeUnit}
                                onChange={(e) => setNewRecipeUnit(e.target.value as any)}
                                className="col-span-2 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            >
                                <option value="g">g</option>
                                <option value="kg">kg</option>
                                <option value="ml">ml</option>
                                <option value="l">l</option>
                                <option value="un">un</option>
                            </select>
                            <button
                                type="button"
                                onClick={addIngredientToRecipe}
                                disabled={!newRecipeIngredientId || !newRecipeQuantity}
                                className="col-span-1 bg-blue-600 text-white p-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition shadow-md flex items-center justify-center"
                            >
                                <Plus size={18} />
                            </button>
                        </div>

                        {/* Lista de Ingredientes da Receita */}
                        {recipe.filter(r => !r._toDelete).length > 0 ? (
                            <div className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden shadow-sm">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-blue-100 to-indigo-100">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Ingrediente
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Quantidade
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                                                Ações
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recipe.filter(r => !r._toDelete).map((item, index) => (
                                            <tr key={index} className="border-t border-blue-100 hover:bg-blue-50 transition">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                    {item.ingredient_name}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right text-gray-700 font-semibold">
                                                    {item.quantity_needed} <span className="text-gray-500">{item.unit}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeIngredientFromRecipe(index)}
                                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition"
                                                        title="Remover ingrediente"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-blue-200">
                                <div className="text-blue-300 mb-2">
                                    <Calculator size={32} className="mx-auto" />
                                </div>
                                <p className="text-gray-400 text-sm font-medium">Nenhum ingrediente adicionado ainda</p>
                                <p className="text-gray-300 text-xs mt-1">Use o formulário acima para adicionar ingredientes à receita</p>
                            </div>
                        )}
                    </div>

                    {/* ===== SEÇÃO 3: VARIAÇÕES ===== */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <AlertCircle size={18} className="text-purple-600" />
                                </div>
                                Variações (Tamanhos)
                            </h3>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={hasVariations}
                                    onChange={(e) => setHasVariations(e.target.checked)}
                                    className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Este produto tem tamanhos</span>
                            </label>
                        </div>

                        {/* Alerta de estoque */}
                        {hasVariations && variations.filter(v => !v._toDelete).length > 0 && (() => {
                            const outOfStock = variations.filter(v => !v._toDelete && v.stock_quantity === 0);
                            const lowStock = variations.filter(v => !v._toDelete && v.stock_quantity !== null && v.stock_quantity > 0 && v.stock_quantity <= 5);

                            if (outOfStock.length > 0 || lowStock.length > 0) {
                                return (
                                    <div className="mb-4 p-4 rounded-xl border-2 bg-gradient-to-r from-yellow-50 to-red-50 border-yellow-300">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-bold text-gray-900 text-sm mb-2">⚠️ Alertas de Estoque:</p>
                                                {outOfStock.length > 0 && (
                                                    <p className="text-sm text-red-700 mb-1">
                                                        <span className="font-bold">Esgotados:</span> {outOfStock.map(v => v.name || 'Sem nome').join(', ')}
                                                    </p>
                                                )}
                                                {lowStock.length > 0 && (
                                                    <p className="text-sm text-yellow-700">
                                                        <span className="font-bold">Estoque baixo:</span> {lowStock.map(v => `${v.name || 'Sem nome'} (${v.stock_quantity})`).join(', ')}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {hasVariations && (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Nome</th>
                                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Preço (R$)</th>
                                                <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Estoque</th>
                                                <th className="px-3 py-2 text-center text-xs font-bold text-gray-700">Disponível</th>
                                                <th className="px-3 py-2 text-center text-xs font-bold text-gray-700">Padrão</th>
                                                <th className="px-3 py-2 text-center text-xs font-bold text-gray-700">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {variations.filter(v => !v._toDelete).map((variation, index) => (
                                                <tr key={index} className="border-b border-gray-100">
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={variation.name}
                                                            onChange={(e) => updateVariation(index, 'name', e.target.value)}
                                                            placeholder="Ex: 300ml"
                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={variation.price}
                                                            onChange={(e) => updateVariation(index, 'price', parseFloat(e.target.value) || 0)}
                                                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-orange-500 outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={variation.stock_quantity ?? ''}
                                                                onChange={(e) => updateVariation(index, 'stock_quantity', e.target.value ? parseInt(e.target.value) : null)}
                                                                placeholder="Ilimitado"
                                                                className={`w-24 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-orange-500 outline-none ${getStockStatus(variation.stock_quantity).borderColor
                                                                    }`}
                                                            />
                                                            <span className={`px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap ${getStockStatus(variation.stock_quantity).bgColor
                                                                } ${getStockStatus(variation.stock_quantity).color
                                                                } border ${getStockStatus(variation.stock_quantity).borderColor
                                                                }`}>
                                                                {getStockStatus(variation.stock_quantity).label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={variation.is_available}
                                                            onChange={(e) => updateVariation(index, 'is_available', e.target.checked)}
                                                            className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={variation.is_default}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    // Desmarcar todos os outros
                                                                    const updated = variations.map((v, i) => ({
                                                                        ...v,
                                                                        is_default: i === index
                                                                    }));
                                                                    setVariations(updated);
                                                                }
                                                            }}
                                                            className="w-4 h-4 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-center">
                                                        <button
                                                            onClick={() => removeVariation(index)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <button
                                    onClick={addVariation}
                                    className="mt-3 flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition font-medium text-sm"
                                >
                                    <Plus size={16} />
                                    Adicionar Variação
                                </button>
                            </>
                        )}
                    </div>

                    {/* ===== SEÇÃO 3: COMPLEMENTOS ===== */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Plus size={18} className="text-green-600" />
                                </div>
                                Grupos de Complementos
                            </h3>
                            <button
                                onClick={addAddonGroup}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
                            >
                                <Plus size={16} />
                                Novo Grupo
                            </button>
                        </div>

                        <div className="space-y-3">
                            {addonGroups.filter(g => !g._toDelete).map((group, groupIndex) => (
                                <div key={groupIndex} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                                    {/* Cabeçalho do Grupo */}
                                    <div className="bg-gray-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    value={group.name}
                                                    onChange={(e) => updateAddonGroup(groupIndex, 'name', e.target.value)}
                                                    placeholder="Nome do grupo (ex: Adicionais)"
                                                    className="px-3 py-2 border border-gray-300 rounded-lg font-medium focus:ring-2 focus:ring-green-500 outline-none"
                                                />
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2 text-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={group.is_required}
                                                            onChange={(e) => updateAddonGroup(groupIndex, 'is_required', e.target.checked)}
                                                            className="w-4 h-4 text-green-600 rounded"
                                                        />
                                                        Obrigatório
                                                    </label>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-gray-600">Min:</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={group.min_selections}
                                                            onChange={(e) => updateAddonGroup(groupIndex, 'min_selections', parseInt(e.target.value) || 0)}
                                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 outline-none"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="text-gray-600">Max:</span>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={group.max_selections || 1}
                                                            onChange={(e) => updateAddonGroup(groupIndex, 'max_selections', parseInt(e.target.value) || 1)}
                                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <button
                                                    onClick={() => toggleGroupExpanded(groupIndex)}
                                                    className="p-2 hover:bg-gray-200 rounded transition"
                                                >
                                                    {group._isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                                <button
                                                    onClick={() => removeAddonGroup(groupIndex)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items do Grupo */}
                                    {group._isExpanded && (
                                        <div className="p-4 bg-white">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Nome</th>
                                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Preço (R$)</th>
                                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Ingrediente</th>
                                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Qtd</th>
                                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700">Un</th>
                                                        <th className="px-3 py-2 text-center text-xs font-bold text-gray-700">Disponível</th>
                                                        <th className="px-3 py-2 text-center text-xs font-bold text-gray-700">Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {group.addons.filter(a => !a._toDelete).map((addon, addonIndex) => (
                                                        <tr key={addonIndex} className="border-b border-gray-100">
                                                            {/* Nome */}
                                                            <td className="px-3 py-2">
                                                                <input
                                                                    type="text"
                                                                    value={addon.name}
                                                                    onChange={(e) => updateAddon(groupIndex, addonIndex, 'name', e.target.value)}
                                                                    placeholder="Ex: Bacon Extra"
                                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 outline-none"
                                                                />
                                                            </td>
                                                            {/* Preço */}
                                                            <td className="px-3 py-2">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={addon.price_adjustment}
                                                                    onChange={(e) => updateAddon(groupIndex, addonIndex, 'price_adjustment', parseFloat(e.target.value) || 0)}
                                                                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 outline-none"
                                                                />
                                                            </td>
                                                            {/* Ingrediente */}
                                                            <td className="px-3 py-2">
                                                                <select
                                                                    value={addon.ingredient_id || ''}
                                                                    onChange={(e) => updateAddon(groupIndex, addonIndex, 'ingredient_id', e.target.value || null)}
                                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 outline-none"
                                                                >
                                                                    <option value="">Sem ingrediente</option>
                                                                    {ingredients.map(ing => (
                                                                        <option key={ing.id} value={ing.id}>
                                                                            {ing.name}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                            {/* Quantidade */}
                                                            <td className="px-3 py-2">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={addon.quantity_used ?? ''}
                                                                    onChange={(e) => updateAddon(groupIndex, addonIndex, 'quantity_used', e.target.value ? parseFloat(e.target.value) : null)}
                                                                    placeholder="-"
                                                                    disabled={!addon.ingredient_id}
                                                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 outline-none disabled:bg-gray-100"
                                                                />
                                                            </td>
                                                            {/* Unidade */}
                                                            <td className="px-3 py-2">
                                                                <select
                                                                    value={addon.unit_used || ''}
                                                                    onChange={(e) => updateAddon(groupIndex, addonIndex, 'unit_used', e.target.value || null)}
                                                                    disabled={!addon.ingredient_id}
                                                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 outline-none disabled:bg-gray-100"
                                                                >
                                                                    <option value="">-</option>
                                                                    <option value="g">g</option>
                                                                    <option value="kg">kg</option>
                                                                    <option value="ml">ml</option>
                                                                    <option value="l">l</option>
                                                                    <option value="un">un</option>
                                                                </select>
                                                            </td>
                                                            {/* Disponível */}
                                                            <td className="px-3 py-2 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={addon.is_available}
                                                                    onChange={(e) => updateAddon(groupIndex, addonIndex, 'is_available', e.target.checked)}
                                                                    className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                                                />
                                                            </td>
                                                            {/* Ações */}
                                                            <td className="px-3 py-2 text-center">
                                                                <button
                                                                    onClick={() => removeAddon(groupIndex, addonIndex)}
                                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            <button
                                                onClick={() => addAddonToGroup(groupIndex)}
                                                className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium"
                                            >
                                                <Plus size={14} />
                                                Adicionar Item
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {addonGroups.filter(g => !g._toDelete).length === 0 && (
                                <div className="text-center py-8 text-gray-400">
                                    <p className="text-sm">Nenhum grupo de complementos adicionado</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-100 font-bold text-gray-700 transition disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save size={20} />
                                Salvar Produto
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductEditModal;
