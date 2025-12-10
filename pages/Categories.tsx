import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Plus, Edit, Trash2, Tag, Package, RefreshCw, Loader2 } from 'lucide-react';

const Categories: React.FC = () => {
    const { categories, products, addCategory, updateCategory, deleteCategory, syncCategoryWithIfood } = useApp();
    const [newCategory, setNewCategory] = useState('');
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [syncingCategory, setSyncingCategory] = useState<string | null>(null);

    const categoryStats = useMemo(() => {
        return categories.map(cat => ({
            name: cat,
            productCount: products.filter(p => p.category === cat).length
        }));
    }, [categories, products]);

    const handleAdd = async () => {
        if (!newCategory.trim()) return;
        if (categories.includes(newCategory.trim())) {
            alert('Esta categoria já existe!');
            return;
        }
        await addCategory(newCategory.trim());
        setNewCategory('');
    };

    const handleEdit = (category: string) => {
        setEditingCategory(category);
        setEditName(category);
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) return;
        if (categories.includes(editName.trim()) && editName !== editingCategory) {
            alert('Esta categoria já existe!');
            return;
        }
        if (editingCategory) {
            await updateCategory(editingCategory, editName.trim());
        }
        setEditingCategory(null);
    };

    const handleDelete = async (category: string) => {
        const stat = categoryStats.find(c => c.name === category);
        if (stat && stat.productCount > 0) {
            if (!confirm(`Esta categoria tem ${stat.productCount} produto(s). Tem certeza que deseja excluir?`)) {
                return;
            }
        }
        await deleteCategory(category);
    };

    const handleSyncCategory = async (category: string) => {
        setSyncingCategory(category);
        const result = await syncCategoryWithIfood(category);
        setSyncingCategory(null);

        if (result.success) {
            alert('Categoria sincronizada com sucesso!');
        } else {
            alert('Erro ao sincronizar categoria: ' + result.message);
        }
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-gray-900">Categorias</h1>
                <p className="text-gray-500 mt-1">Organize seus produtos em categorias</p>
            </div>

            {/* Add Category */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Plus size={20} className="text-orange-500" />
                    Nova Categoria
                </h2>
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Nome da categoria (ex: Pizza, Bebidas)"
                        value={newCategory}
                        onChange={e => setNewCategory(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleAdd()}
                        className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                    <button
                        onClick={handleAdd}
                        className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Adicionar
                    </button>
                </div>
            </div>

            {/* Categories List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <Tag size={20} className="text-gray-600" />
                        Categorias Cadastradas ({categories.length})
                    </h2>
                </div>

                {categories.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Tag size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">Nenhuma categoria cadastrada</p>
                        <p className="text-sm mt-1">Adicione sua primeira categoria acima</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {categoryStats.map(({ name, productCount }) => (
                            <div key={name} className="p-4 hover:bg-gray-50 transition-colors">
                                {editingCategory === name ? (
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && handleSaveEdit()}
                                            className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleSaveEdit}
                                            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-600"
                                        >
                                            Salvar
                                        </button>
                                        <button
                                            onClick={() => setEditingCategory(null)}
                                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-300"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                                <Tag size={20} className="text-orange-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Package size={14} />
                                                        {productCount} produto{productCount !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSyncCategory(name)}
                                                disabled={syncingCategory === name}
                                                className={`p-2 rounded-lg transition-colors ${syncingCategory === name
                                                        ? 'text-gray-400 bg-gray-50'
                                                        : 'text-blue-600 hover:bg-blue-50'
                                                    }`}
                                                title="Sincronizar com iFood"
                                            >
                                                {syncingCategory === name ? (
                                                    <Loader2 size={18} className="animate-spin" />
                                                ) : (
                                                    <RefreshCw size={18} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(name)}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Editar categoria"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(name)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir categoria"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div >
    );
};

export default Categories;
