import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Search, Edit, Eye, EyeOff, Copy, Share2, Smartphone, ExternalLink } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

const MenuManager: React.FC = () => {
    const { products, updateProduct } = useApp();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: '', currentPrice: 0, description: '' });

    const menuLink = user ? `${window.location.origin}/#/menu/${user.id}` : '';

    const filteredProducts = useMemo(() => {
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

    const handleEdit = (product: any) => {
        setEditingId(product.id);
        setEditForm({
            name: product.name,
            currentPrice: product.currentPrice,
            description: product.description || ''
        });
    };

    const handleSave = async () => {
        if (!editingId) return;
        const product = products.find(p => p.id === editingId);
        if (product) {
            await updateProduct({ ...product, ...editForm });
        }
        setEditingId(null);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Link copiado para a área de transferência!');
    };

    const shareWhatsApp = () => {
        const message = encodeURIComponent(`Confira nosso cardápio digital: ${menuLink}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Cardápio Virtual</h1>
                    <p className="text-gray-500 mt-1">Gerencie e compartilhe seu cardápio com clientes</p>
                </div>
                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-black transition-colors"
                >
                    <Smartphone size={20} />
                    {showPreview ? 'Modo Edição' : 'Prévia Mobile'}
                </button>
            </div>

            {/* Share Section */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <Share2 size={24} />
                    <h2 className="text-xl font-black">Compartilhe seu Cardápio</h2>
                </div>
                <p className="text-white/90 text-sm mb-4">Envie este link para seus clientes via WhatsApp ou redes sociais</p>

                <div className="flex gap-3">
                    <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl p-3 font-mono text-sm">
                        {menuLink}
                    </div>
                    <button
                        onClick={() => copyToClipboard(menuLink)}
                        className="bg-white text-gray-900 px-4 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                        <Copy size={20} />
                        Copiar
                    </button>
                    <button
                        onClick={shareWhatsApp}
                        className="bg-green-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-green-600 transition-colors flex items-center gap-2"
                    >
                        <Share2 size={20} />
                        WhatsApp
                    </button>
                </div>

                <a
                    href={menuLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-4 text-white/90 hover:text-white text-sm font-bold"
                >
                    <ExternalLink size={16} />
                    Abrir em nova aba
                </a>
            </div>

            {showPreview ? (
                /* Mobile Preview */
                <div className="bg-gray-100 rounded-2xl p-6">
                    <div className="max-w-md mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden" style={{ minHeight: '600px' }}>

                        {/* Preview Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
                            <h2 className="font-black text-2xl mb-1">Ofertas do Dia</h2>
                            <p className="text-white/90 text-sm">Aproveite descontos exclusivos!</p>
                        </div>

                        {/* Preview Search */}
                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Buscar produtos..."
                                    className="w-full pl-12 p-3 bg-gray-50 border border-gray-100 rounded-xl"
                                    disabled
                                />
                            </div>
                        </div>

                        {/* Preview Products */}
                        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                            {filteredProducts.slice(0, 5).map(product => (
                                <div key={product.id} className="bg-white border border-gray-100 rounded-xl p-3 flex gap-3">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0"></div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-sm text-gray-900">{product.name}</h3>
                                        <p className="text-xs text-gray-500 line-clamp-1">{product.description || 'Sem descrição'}</p>
                                        <p className="font-black text-sm text-gray-900 mt-1">{formatCurrency(product.currentPrice)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            ) : (
                /* Edit Mode */
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">

                    {/* Search */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar produtos..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-12 p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left p-4 font-bold text-gray-700 text-sm">Produto</th>
                                    <th className="text-left p-4 font-bold text-gray-700 text-sm">Descrição</th>
                                    <th className="text-left p-4 font-bold text-gray-700 text-sm">Preço</th>
                                    <th className="text-right p-4 font-bold text-gray-700 text-sm">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(product => (
                                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        {editingId === product.id ? (
                                            <>
                                                <td className="p-4">
                                                    <input
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="text"
                                                        value={editForm.description}
                                                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                                    />
                                                </td>
                                                <td className="p-4">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editForm.currentPrice}
                                                        onChange={e => setEditForm({ ...editForm, currentPrice: parseFloat(e.target.value) })}
                                                        className="w-full p-2 border border-gray-200 rounded-lg"
                                                    />
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={handleSave}
                                                        className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-bold hover:bg-green-600 mr-2"
                                                    >
                                                        Salvar
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-bold hover:bg-gray-300"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-4 font-bold text-gray-900">{product.name}</td>
                                                <td className="p-4 text-gray-600 text-sm">{product.description || '—'}</td>
                                                <td className="p-4 font-bold text-gray-900">{formatCurrency(product.currentPrice)}</td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-bold hover:bg-gray-200 inline-flex items-center gap-2"
                                                    >
                                                        <Edit size={16} />
                                                        Editar
                                                    </button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            )}

        </div>
    );
};

export default MenuManager;
