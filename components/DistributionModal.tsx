import React, { useState } from 'react';
import { X, Save, Sparkles, Loader } from 'lucide-react';
import { askAI } from '../utils/aiHelper';

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
    const [isAiLoading, setIsAiLoading] = useState(false);

    if (!isOpen) return null;

    const total = Object.values(values).reduce((sum, val) => sum + val, 0);
    const isValid = total === 100;

    const handleAiSuggest = async () => {
        setIsAiLoading(true);

        const prompt = `Atue como consultor financeiro empresarial especializado em restaurantes.
        
TAREFA:
Sugira uma distribuição ideal de lucros líquidos considerando:
- Pró-labore dos sócios (remuneração mensal)
- Reserva de emergência (segurança financeira)
- Investimentos (crescimento e equipamentos)
- Melhorias (treinamento e inovação)
- Distribuição de lucros (bonificação)

Considere que:
- Reserva de emergência é crítica (recomendado 20-30%)
- Pró-labore deve ser justo mas não excessivo (35-50%)
- Investimentos garantem crescimento (10-20%)
- Melhorias mantêm competitividade (5-15%)
- Distribuição extra motiva sócios (5-10%)

RETORNE APENAS um JSON puro (sem markdown) no formato:
{
  "prolabore": número entre 0-100,
  "emergency": número entre 0-100,
  "investment": número entre 0-100,
  "improvement": número entre 0-100,
  "profit": número entre 0-100,
  "reasoning": "Explicação breve da lógica em 1 frase"
}

O total DEVE ser exatamente 100.`;

        try {
            const result = await askAI(prompt);
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const suggestion = JSON.parse(cleanJson);

            // Validar que soma 100
            const total = suggestion.prolabore + suggestion.emergency + suggestion.investment +
                suggestion.improvement + suggestion.profit;

            if (Math.abs(total - 100) < 1) { // Permitir margem de erro mínima
                setValues({
                    prolabore: Math.round(suggestion.prolabore),
                    emergency: Math.round(suggestion.emergency),
                    investment: Math.round(suggestion.investment),
                    improvement: Math.round(suggestion.improvement),
                    profit: Math.round(suggestion.profit)
                });

                if (suggestion.reasoning) {
                    alert(`💡 IA Sugeriu:\n\n${suggestion.reasoning}`);
                }
            } else {
                alert('A IA gerou valores inconsistentes. Tente novamente.');
            }
        } catch (e) {
            console.error('Erro ao processar sugestão da IA:', e);
            alert('Erro ao gerar sugestão. Tente novamente.');
        } finally {
            setIsAiLoading(false);
        }
    };

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

                    {/* Botão de IA */}
                    <button
                        onClick={handleAiSuggest}
                        disabled={isAiLoading}
                        className="w-full p-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                        {isAiLoading ? (
                            <>
                                <Loader size={20} className="animate-spin" />
                                Gerando Sugestão Inteligente...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} className="text-yellow-300" />
                                🤖 Sugerir Distribuição Ideal com IA
                            </>
                        )}
                    </button>

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
