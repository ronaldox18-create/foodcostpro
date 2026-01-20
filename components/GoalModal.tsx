import React, { useState } from 'react';
import { X, Save, Target, Sparkles, Loader } from 'lucide-react';
import { askAI } from '../utils/aiHelper';

interface Goal {
    id: string;
    name: string;
    type: 'revenue' | 'profit' | 'margin' | 'ticket' | 'customers';
    targetValue: number;
    currentValue: number;
    period: 'monthly' | 'quarterly' | 'yearly';
    deadline?: string;
}

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Goal) => void;
    editingGoal?: Goal | null;
}

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSave, editingGoal }) => {
    const [formData, setFormData] = useState<Partial<Goal>>(
        editingGoal || {
            name: '',
            type: 'revenue',
            targetValue: 0,
            currentValue: 0,
            period: 'monthly',
            deadline: ''
        }
    );
    const [isAiLoading, setIsAiLoading] = useState(false);

    if (!isOpen) return null;

    const handleAiSuggest = async () => {
        if (!formData.type) {
            alert('Selecione o tipo de meta primeiro!');
            return;
        }

        setIsAiLoading(true);

        const typeLabels: any = {
            revenue: 'Faturamento',
            profit: 'Lucro',
            margin: 'Margem',
            ticket: 'Ticket Médio',
            customers: 'Novos Clientes'
        };

        const prompt = `Atue como consultor de negócios especializado em restaurantes.

CONTEXTO:
O usuário quer definir uma meta de ${typeLabels[formData.type]} ${formData.period === 'monthly' ? 'mensal' : formData.period === 'quarterly' ? 'trimestral' : 'anual'}.

TAREFA:
Sugira uma meta REALISTA e DESAFIADORA considerando:
- Tipo: ${typeLabels[formData.type]}
- Período: ${formData.period}
- Setor: Restaurante/Food Service
- Boas práticas do mercado

Para ${formData.type}:
${formData.type === 'revenue' ? '- Crescimento saudável: 10-30% ao mês para novos negócios, 5-15% para estabelecidos' : ''}
${formData.type === 'profit' ? '- Margem líquida ideal: 8-15% do faturamento' : ''}
${formData.type === 'margin' ? '- Margem bruta saudável: 60-70%' : ''}
${formData.type === 'ticket' ? '- Ticket médio brasileiro: R$ 35-80 dependendo do tipo' : ''}
${formData.type === 'customers' ? '- Crescimento sustentável: 50-200 novos clientes/mês' : ''}

RETORNE APENAS JSON puro (sem markdown):
{
  "suggestedName": "Nome sugerido para a meta (max 50 chars)",
  "targetValue": número realista,
  "currentValue": 0,
  "deadline": "data sugerida no formato YYYY-MM-DD (${formData.period === 'monthly' ? '30 dias' : formData.period === 'quarterly' ? '90 dias' : '365 dias'})",
  "reasoning": "Explicação breve em 1-2 frases"
}`;

        try {
            const result = await askAI(prompt);
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const suggestion = JSON.parse(cleanJson);

            setFormData({
                ...formData,
                name: suggestion.suggestedName || formData.name,
                targetValue: suggestion.targetValue || 0,
                currentValue: suggestion.currentValue || 0,
                deadline: suggestion.deadline || formData.deadline
            });

            if (suggestion.reasoning) {
                alert(`💡 Sugestão da IA:\n\n${suggestion.reasoning}`);
            }
        } catch (e) {
            console.error('Erro ao processar sugestão da IA:', e);
            alert('Erro ao gerar sugestão. Tente novamente.');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const goal: Goal = {
            id: editingGoal?.id || crypto.randomUUID(),
            name: formData.name || '',
            type: formData.type || 'revenue',
            targetValue: formData.targetValue || 0,
            currentValue: formData.currentValue || 0,
            period: formData.period || 'monthly',
            deadline: formData.deadline || ''
        };

        onSave(goal);
        onClose();

        // Reset form
        setFormData({
            name: '',
            type: 'revenue',
            targetValue: 0,
            currentValue: 0,
            period: 'monthly',
            deadline: ''
        });
    };

    const goalTypes = [
        { value: 'revenue', label: 'Faturamento', icon: '💰', unit: 'R$' },
        { value: 'profit', label: 'Lucro', icon: '📈', unit: 'R$' },
        { value: 'margin', label: 'Margem', icon: '📊', unit: '%' },
        { value: 'ticket', label: 'Ticket Médio', icon: '🎫', unit: 'R$' },
        { value: 'customers', label: 'Novos Clientes', icon: '👥', unit: 'un' }
    ];

    const selectedType = goalTypes.find(t => t.value === formData.type);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Target className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {editingGoal ? 'Editar Meta' : '🎯 Nova Meta'}
                            </h3>
                            <p className="text-xs text-gray-500">Defina objetivos para acompanhar crescimento</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Nome da Meta */}
                    <div>
                        <label className="block font-bold text-sm text-gray-700 mb-2">Nome da Meta</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                            placeholder="Ex: Aumentar faturamento 20%"
                        />
                    </div>

                    {/* Tipo de Meta */}
                    <div>
                        <label className="block font-bold text-sm text-gray-700 mb-3">Tipo de Meta</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {goalTypes.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: type.value as any })}
                                    className={`p-4 rounded-xl border-2 transition-all text-center ${formData.type === type.value
                                        ? 'border-blue-500 bg-blue-50 shadow-md'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-3xl mb-1">{type.icon}</div>
                                    <div className="font-bold text-xs text-gray-700">{type.label}</div>
                                    <div className="text-[10px] text-gray-400">{type.unit}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Botão de IA */}
                    <button
                        type="button"
                        onClick={handleAiSuggest}
                        disabled={isAiLoading || !formData.type}
                        className="w-full p-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                        {isAiLoading ? (
                            <>
                                <Loader size={20} className="animate-spin" />
                                Gerando Meta Inteligente...
                            </>
                        ) : (
                            <>
                                <Sparkles size={20} className="text-yellow-300" />
                                🤖 Sugerir Meta Ideal com IA
                            </>
                        )}
                    </button>

                    {/* Valor Alvo e Período */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-bold text-sm text-gray-700 mb-2">
                                Valor Alvo {selectedType && `(${selectedType.unit})`}
                            </label>
                            <input
                                type="number"
                                required
                                step="0.01"
                                value={formData.targetValue}
                                onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) })}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-sm text-gray-700 mb-2">Período</label>
                            <select
                                value={formData.period}
                                onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition bg-white"
                            >
                                <option value="monthly">Mensal</option>
                                <option value="quarterly">Trimestral</option>
                                <option value="yearly">Anual</option>
                            </select>
                        </div>
                    </div>

                    {/* Valor Atual */}
                    <div>
                        <label className="block font-bold text-sm text-gray-700 mb-2">
                            Valor Atual {selectedType && `(${selectedType.unit})`}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.currentValue}
                            onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) })}
                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                            placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Deixe em 0 para atualização automática (quando disponível)
                        </p>
                    </div>

                    {/* Deadline (Opcional) */}
                    <div>
                        <label className="block font-bold text-sm text-gray-700 mb-2">
                            Prazo (Opcional)
                        </label>
                        <input
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none transition"
                        />
                    </div>

                    {/* Preview */}
                    {formData.targetValue > 0 && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-gray-700">Preview</span>
                                <span className="text-xs text-gray-500">
                                    {((formData.currentValue || 0) / formData.targetValue * 100).toFixed(0)}% atingido
                                </span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-3">
                                <div
                                    className="h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                                    style={{ width: `${Math.min(((formData.currentValue || 0) / formData.targetValue * 100), 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Botões */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            {editingGoal ? 'Atualizar' : 'Criar Meta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoalModal;
