import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

interface DistributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    distribution: {
        prolabore: number;
        emergency: number;
        investment: number;
        improvement: number;
        profit: number;
    };
    onSave: (newDistribution: any) => void;
}

const DistributionModal: React.FC<DistributionModalProps> = ({ isOpen, onClose, distribution, onSave }) => {
    const [values, setValues] = useState(distribution);

    if (!isOpen) return null;

    const total = Object.values(values).reduce((sum, val) => sum + val, 0);
    const isValid = total === 100;

    const handleSave = () => {
        if (isValid) {
            onSave(values);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">⚙️ Configurar Distribuição</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <p className="text-sm text-gray-600">
                        Configure como o lucro líquido será distribuído automaticamente entre as contas.
                    </p>

                    {/* Sliders */}
                    <div className="space-y-5">
                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="font-bold text-sm text-gray-700">👔 Pró-labore</label>
                                <span className="font-black text-blue-600">{values.prolabore}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={values.prolabore}
                                onChange={(e) => setValues({ ...values, prolabore: Number(e.target.value) })}
                                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="font-bold text-sm text-gray-700">🏦 Reserva de Emergência</label>
                                <span className="font-black text-green-600">{values.emergency}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={values.emergency}
                                onChange={(e) => setValues({ ...values, emergency: Number(e.target.value) })}
                                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="font-bold text-sm text-gray-700">📈 Investimentos</label>
                                <span className="font-black text-purple-600">{values.investment}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={values.investment}
                                onChange={(e) => setValues({ ...values, investment: Number(e.target.value) })}
                                className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="font-bold text-sm text-gray-700">💡 Melhorias</label>
                                <span className="font-black text-orange-600">{values.improvement}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={values.improvement}
                                onChange={(e) => setValues({ ...values, improvement: Number(e.target.value) })}
                                className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label className="font-bold text-sm text-gray-700">💰 Distribuição de Lucros</label>
                                <span className="font-black text-yellow-600">{values.profit}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={values.profit}
                                onChange={(e) => setValues({ ...values, profit: Number(e.target.value) })}
                                className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-600"
                            />
                        </div>
                    </div>

                    {/* Total */}
                    <div className={`p-4 rounded-xl border-2 ${isValid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-gray-700">Total:</span>
                            <span className={`text-2xl font-black ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                                {total}%
                            </span>
                        </div>
                        {!isValid && (
                            <p className="text-xs text-red-600 mt-2">
                                O total deve ser exatamente 100%
                            </p>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!isValid}
                        className={`flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${isValid
                                ? 'bg-gray-900 text-white hover:bg-black'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        <Save size={20} />
                        Salvar Configuração
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DistributionModal;
