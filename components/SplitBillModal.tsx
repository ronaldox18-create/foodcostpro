import React, { useState, useMemo } from 'react';
import { X, Users, DollarSign, Percent, Check } from 'lucide-react';
import { OrderItem } from '../types';

interface SplitBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    items: OrderItem[];
}

const SplitBillModal: React.FC<SplitBillModalProps> = ({ isOpen, onClose, total, items }) => {
    const [splitType, setSplitType] = useState<'equal' | 'items' | 'percentage'>('equal');
    const [numberOfPeople, setNumberOfPeople] = useState(2);
    const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>({});

    // Cálculo de divisão igual
    const equalSplit = useMemo(() => {
        return total / numberOfPeople;
    }, [total, numberOfPeople]);

    // Cálculo de divisão por itens
    const itemSplit = useMemo(() => {
        const result: { [key: string]: number } = {};
        Object.keys(selectedItems).forEach(productId => {
            const item = items.find(i => i.productId === productId);
            if (item) {
                result[productId] = item.total / selectedItems[productId];
            }
        });
        return result;
    }, [selectedItems, items]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 bg-gradient-to-r from-orange-600 to-red-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DollarSign className="w-8 h-8" />
                            <div>
                                <h2 className="text-2xl font-bold">Dividir Conta</h2>
                                <p className="text-white/80 text-sm">Total: R$ {total.toFixed(2)}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    {/* Tipo de Divisão */}
                    <div className="mb-6">
                        <h3 className="font-bold text-gray-900 mb-3">Como dividir?</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setSplitType('equal')}
                                className={`p-4 rounded-xl border-2 transition-all ${splitType === 'equal'
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Users className={`w-6 h-6 mx-auto mb-2 ${splitType === 'equal' ? 'text-orange-600' : 'text-gray-400'}`} />
                                <p className={`text-sm font-bold ${splitType === 'equal' ? 'text-orange-600' : 'text-gray-600'}`}>
                                    Igual
                                </p>
                            </button>

                            <button
                                onClick={() => setSplitType('items')}
                                className={`p-4 rounded-xl border-2 transition-all ${splitType === 'items'
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Check className={`w-6 h-6 mx-auto mb-2 ${splitType === 'items' ? 'text-orange-600' : 'text-gray-400'}`} />
                                <p className={`text-sm font-bold ${splitType === 'items' ? 'text-orange-600' : 'text-gray-600'}`}>
                                    Por Item
                                </p>
                            </button>

                            <button
                                onClick={() => setSplitType('percentage')}
                                className={`p-4 rounded-xl border-2 transition-all ${splitType === 'percentage'
                                        ? 'border-orange-500 bg-orange-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <Percent className={`w-6 h-6 mx-auto mb-2 ${splitType === 'percentage' ? 'text-orange-600' : 'text-gray-400'}`} />
                                <p className={`text-sm font-bold ${splitType === 'percentage' ? 'text-orange-600' : 'text-gray-600'}`}>
                                    %
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Divisão Igual */}
                    {splitType === 'equal' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Número de Pessoas
                                </label>
                                <input
                                    type="number"
                                    min="2"
                                    max="20"
                                    value={numberOfPeople}
                                    onChange={(e) => setNumberOfPeople(Math.max(2, parseInt(e.target.value) || 2))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-lg font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border-2 border-green-200">
                                <p className="text-sm font-bold text-gray-600 mb-2">Valor por pessoa:</p>
                                <p className="text-4xl font-black text-green-600">
                                    R$ {equalSplit.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    {numberOfPeople} pessoa{numberOfPeople > 1 ? 's' : ''} × R$ {equalSplit.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Divisão por Itens */}
                    {splitType === 'items' && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Selecione os itens e quantas pessoas vão dividir cada um:
                            </p>

                            <div className="space-y-3">
                                {items.map((item) => (
                                    <div key={item.productId} className="bg-gray-50 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="font-bold text-gray-900">{item.productName}</p>
                                                <p className="text-sm text-gray-500">
                                                    {item.quantity}x R$ {item.unitPrice.toFixed(2)} = R$ {item.total.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-bold text-gray-600">
                                                Dividir entre:
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                placeholder="Nº pessoas"
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value);
                                                    if (val > 0) {
                                                        setSelectedItems({ ...selectedItems, [item.productId]: val });
                                                    }
                                                }}
                                                className="w-24 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            />
                                            {selectedItems[item.productId] && (
                                                <span className="text-sm font-bold text-green-600">
                                                    = R$ {(item.total / selectedItems[item.productId]).toFixed(2)} /pessoa
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Divisão por Porcentagem */}
                    {splitType === 'percentage' && (
                        <div className="bg-gray-50 rounded-xl p-6 text-center">
                            <p className="text-gray-500">
                                🚧 Funcionalidade em desenvolvimento
                            </p>
                            <p className="text-sm text-gray-400 mt-2">
                                Em breve você poderá dividir com porcentagens personalizadas!
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors"
                    >
                        Fechar
                    </button>
                    <button
                        onClick={() => {
                            // Aqui você pode adicionar lógica para processar a divisão
                            alert('Divisão salva! (Funcionalidade completa em desenvolvimento)');
                            onClose();
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                    >
                        Confirmar Divisão
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SplitBillModal;
