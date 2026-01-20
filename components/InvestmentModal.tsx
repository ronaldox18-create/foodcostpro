import React, { useState } from 'react';
import { X, Save, Rocket, DollarSign, Sparkles, Loader } from 'lucide-react';
import { askAI } from '../utils/aiHelper';

interface Investment {
    id: string;
    name: string;
    category: 'equipment' | 'renovation' | 'marketing' | 'technology' | 'expansion' | 'other';
    amount: number;
    expectedROI: number;
    actualROI?: number;
    status: 'planned' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
    startDate?: string;
    completionDate?: string;
    notes?: string;
}

interface InvestmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (investment: Investment) => void;
    editingInvestment?: Investment | null;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ isOpen, onClose, onSave, editingInvestment }) => {
    const [formData, setFormData] = useState<Partial<Investment>>(
        editingInvestment || {
            name: '',
            category: 'equipment',
            amount: 0,
            expectedROI: 0,
            status: 'planned',
            startDate: '',
            completionDate: '',
            notes: ''
        }
    );
    const [isAiLoading, setIsAiLoading] = useState(false);

    if (!isOpen) return null;

    const handleAiSuggest = async () => {
        if (!formData.category) {
            alert('Selecione a categoria primeiro!');
            return;
        }

        setIsAiLoading(true);

        const categoryLabels: any = {
            equipment: 'Equipamentos',
            renovation: 'Reforma',
            marketing: 'Marketing',
            technology: 'Tecnologia',
            expansion: 'Expansão',
            other: 'Outros'
        };

        const prompt = `Atue como consultor de investimentos especializado em restaurantes.

CONTEXTO:
Investimento em: ${categoryLabels[formData.category]}

TAREFA:
Sugira um investimento viável com ROI realista.

RETORNE JSON puro:
{
  "suggestedName": "nome",
  "amount": valor,
  "expectedROI": roi,
  "completionDate": "YYYY-MM-DD",
  "notes": "justificativa",
  "reasoning": "explicação"
}`;

        try {
            const result = await askAI(prompt);
            const cleanJson = result.replace(/```json/g, '').replace(/```/g, '').trim();
            const suggestion = JSON.parse(cleanJson);

            setFormData({
                ...formData,
                name: suggestion.suggestedName || formData.name,
                amount: suggestion.amount || 0,
                expectedROI: suggestion.expectedROI || 0,
                completionDate: suggestion.completionDate || formData.completionDate,
                notes: suggestion.notes || formData.notes
            });

            if (suggestion.reasoning) {
                alert(`💡 IA: ${suggestion.reasoning}`);
            }
        } catch (e) {
            alert('Erro. Tente novamente.');
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const investment: Investment = {
            id: editingInvestment?.id || crypto.randomUUID(),
            name: formData.name || '',
            category: formData.category || 'equipment',
            amount: formData.amount || 0,
            expectedROI: formData.expectedROI || 0,
            actualROI: formData.actualROI,
            status: formData.status || 'planned',
            startDate: formData.startDate,
            completionDate: formData.completionDate,
            notes: formData.notes
        };

        onSave(investment);
        onClose();
    };

    const categories = [
        { value: 'equipment', label: 'Equipamentos', icon: '🔧' },
        { value: 'renovation', label: 'Reforma', icon: '🏗️' },
        { value: 'marketing', label: 'Marketing', icon: '📣' },
        { value: 'technology', label: 'Tecnologia', icon: '💻' },
        { value: 'expansion', label: 'Expansão', icon: '🚀' },
        { value: 'other', label: 'Outros', icon: '📦' }
    ];

    const statuses = [
        { value: 'planned', label: 'Planejado' },
        { value: 'approved', label: 'Aprovado' },
        { value: 'in_progress', label: 'Em Andamento' },
        { value: 'completed', label: 'Concluído' },
        { value: 'cancelled', label: 'Cancelado' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                    <h3 className="text-2xl font-bold">🚀 {editingInvestment ? 'Editar' : 'Novo'} Investimento</h3>
                    <button onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block font-bold text-sm mb-2">Nome</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 border-2 rounded-xl focus:border-purple-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block font-bold text-sm mb-3">Categoria</label>
                        <div className="grid grid-cols-3 gap-3">
                            {categories.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.value as any })}
                                    className={`p-4 rounded-xl border-2 ${formData.category === cat.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                                        }`}
                                >
                                    <div className="text-3xl mb-1">{cat.icon}</div>
                                    <div className="font-bold text-xs">{cat.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleAiSuggest}
                        disabled={isAiLoading}
                        className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isAiLoading ? <Loader size={20} className="animate-spin" /> : <Sparkles size={20} />}
                        🤖 {isAiLoading ? 'Analisando...' : 'Analisar com IA'}
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-bold text-sm mb-2">Valor (R$)</label>
                            <input
                                type="number"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                className="w-full p-3 border-2 rounded-xl outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-sm mb-2">ROI (%)</label>
                            <input
                                type="number"
                                required
                                value={formData.expectedROI}
                                onChange={(e) => setFormData({ ...formData, expectedROI: parseFloat(e.target.value) })}
                                className="w-full p-3 border-2 rounded-xl outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-bold text-sm mb-3">Status</label>
                        <div className="grid grid-cols-5 gap-2">
                            {statuses.map(s => (
                                <button
                                    key={s.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: s.value as any })}
                                    className={`p-2 rounded border text-xs font-bold ${formData.status === s.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-bold text-sm mb-2">Início</label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full p-3 border-2 rounded-xl outline-none"
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-sm mb-2">Conclusão</label>
                            <input
                                type="date"
                                value={formData.completionDate}
                                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                                className="w-full p-3 border-2 rounded-xl outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-bold text-sm mb-2">Observações</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full p-3 border-2 rounded-xl outline-none"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="flex-1 p-3 border-2 rounded-xl font-bold">
                            Cancelar
                        </button>
                        <button type="submit" className="flex-1 p-3 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                            <Save size={20} />
                            {editingInvestment ? 'Atualizar' : 'Criar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvestmentModal;
