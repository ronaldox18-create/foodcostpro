import React, { useState } from 'react';
import { X, Save, Rocket, DollarSign } from 'lucide-react';

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

    if (!isOpen) return null;

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

        // Reset form
        setFormData({
            name: '',
            category: 'equipment',
            amount: 0,
            expectedROI: 0,
            status: 'planned',
            startDate: '',
            completionDate: '',
            notes: ''
        });
    };

    const categories = [
        { value: 'equipment', label: 'Equipamentos', icon: '🔧', color: 'orange' },
        { value: 'renovation', label: 'Reforma', icon: '🏗️', color: 'purple' },
        { value: 'marketing', label: 'Marketing', icon: '📣', color: 'pink' },
        { value: 'technology', label: 'Tecnologia', icon: '💻', color: 'blue' },
        { value: 'expansion', label: 'Expansão', icon: '🚀', color: 'green' },
        { value: 'other', label: 'Outros', icon: '📦', color: 'gray' }
    ];

    const statuses = [
        { value: 'planned', label: 'Planejado', color: 'gray' },
        { value: 'approved', label: 'Aprovado', color: 'blue' },
        { value: 'in_progress', label: 'Em Andamento', color: 'yellow' },
        { value: 'completed', label: 'Concluído', color: 'green' },
        { value: 'cancelled', label: 'Cancelado', color: 'red' }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl animate-scale-in max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Rocket className="text-purple-600" size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {editingInvestment ? 'Editar Investimento' : '🚀 Novo Investimento'}
                            </h3>
                            <p className="text-xs text-gray-500">Planeje e acompanhe seus investimentos</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Nome do Projeto */}
                    <div>
                        <label className="block font-bold text-sm text-gray-700 mb-2">Nome do Projeto</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition"
                            placeholder="Ex: Compra de novo forno industrial"
                        />
                    </div>

                    {/* Categoria */}
                    <div>
                        <label className="block font-bold text-sm text-gray-700 mb-3">Categoria</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {categories.map(cat => (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, category: cat.value as any })}
                                    className={`p-4 rounded-xl border-2 transition-all text-center ${formData.category === cat.value
                                            ? 'border-purple-500 bg-purple-50 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="text-3xl mb-1">{cat.icon}</div>
                                    <div className="font-bold text-xs text-gray-700">{cat.label}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Valor e ROI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-bold text-sm text-gray-700 mb-2">
                                Valor do Investimento (R$)
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                    className="w-full pl-10 p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-bold text-sm text-gray-700 mb-2">
                                ROI Esperado (%)
                            </label>
                            <input
                                type="number"
                                required
                                step="0.1"
                                value={formData.expectedROI}
                                onChange={(e) => setFormData({ ...formData, expectedROI: parseFloat(e.target.value) })}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition"
                                placeholder="0.0"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Retorno esperado sobre o investimento
                            </p>
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block font-bold text-sm text-gray-700 mb-3">Status</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {statuses.map(status => (
                                <button
                                    key={status.value}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: status.value as any })}
                                    className={`p-3 rounded-lg border-2 transition-all text-center text-xs font-bold ${formData.status === status.value
                                            ? `border-${status.color}-500 bg-${status.color}-50`
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {status.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Datas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-bold text-sm text-gray-700 mb-2">
                                Data de Início
                            </label>
                            <input
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition"
                            />
                        </div>

                        <div>
                            <label className="block font-bold text-sm text-gray-700 mb-2">
                                Conclusão Prevista
                            </label>
                            <input
                                type="date"
                                value={formData.completionDate}
                                onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* ROI Atual (se em andamento ou concluído) */}
                    {(formData.status === 'in_progress' || formData.status === 'completed') && (
                        <div>
                            <label className="block font-bold text-sm text-gray-700 mb-2">
                                ROI Atual (%)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                value={formData.actualROI || ''}
                                onChange={(e) => setFormData({ ...formData, actualROI: parseFloat(e.target.value) || undefined })}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition"
                                placeholder="0.0"
                            />
                        </div>
                    )}

                    {/* Observações */}
                    <div>
                        <label className="block font-bold text-sm text-gray-700 mb-2">
                            Observações
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none transition resize-none"
                            rows={3}
                            placeholder="Detalhes sobre o investimento..."
                        />
                    </div>

                    {/* Preview do ROI */}
                    {formData.amount > 0 && formData.expectedROI > 0 && (
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Retorno Esperado</p>
                                    <p className="text-2xl font-black text-purple-600">
                                        R$ {((formData.amount * formData.expectedROI) / 100).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 mb-1">Total Final</p>
                                    <p className="text-2xl font-black text-green-600">
                                        R$ {(formData.amount + (formData.amount * formData.expectedROI) / 100).toFixed(2)}
                                    </p>
                                </div>
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
                            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition flex items-center justify-center gap-2"
                        >
                            <Save size={20} />
                            {editingInvestment ? 'Atualizar' : 'Criar Investimento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InvestmentModal;
