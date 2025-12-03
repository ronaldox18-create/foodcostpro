import React, { useState } from 'react';
import {
    Award,
    Settings,
    TrendingUp,
    Gift,
    Clock,
    Percent,
    Star,
    Plus,
    Trash2,
    Edit2,
    Save,
    AlertCircle,
    HelpCircle,
    Sparkles,
    Crown,
    Zap
} from 'lucide-react';
import { LoyaltyLevel, LoyaltySettings as LoyaltySettingsType } from '../types';

const LoyaltySettings: React.FC = () => {
    // Estado das configurações gerais
    const [settings, setSettings] = useState<Omit<LoyaltySettingsType, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
        isEnabled: true,
        pointsPerReal: 1,
        levelExpirationEnabled: true,
        levelExpirationDays: 90,
        enablePointsRedemption: false,
        pointsToRealRate: 100,
        minPointsToRedeem: 500,
    });

    // Estado dos níveis
    const [levels, setLevels] = useState<Omit<LoyaltyLevel, 'id' | 'user_id' | 'created_at'>[]>([
        { name: 'Bronze', pointsRequired: 0, discountPercent: 5, color: '#CD7F32', icon: '🥉', order: 1, benefits: 'Desconto básico em todos os pedidos' },
        { name: 'Prata', pointsRequired: 500, discountPercent: 10, color: '#C0C0C0', icon: '🥈', order: 2, benefits: 'Desconto intermediário + prioridade no atendimento' },
        { name: 'Ouro', pointsRequired: 1500, discountPercent: 15, color: '#FFD700', icon: '🥇', order: 3, benefits: 'Desconto premium + brindes exclusivos' },
        { name: 'Diamante', pointsRequired: 3000, discountPercent: 20, color: '#B9F2FF', icon: '💎', order: 4, benefits: 'Máximo desconto + experiências VIP' },
    ]);

    const [editingLevel, setEditingLevel] = useState<number | null>(null);
    const [showAddLevel, setShowAddLevel] = useState(false);
    const [newLevel, setNewLevel] = useState<Omit<LoyaltyLevel, 'id' | 'user_id' | 'created_at' | 'order'>>({
        name: '',
        pointsRequired: 0,
        discountPercent: 0,
        color: '#FF6B6B',
        icon: '⭐',
        benefits: ''
    });

    const handleSaveSettings = () => {
        // Aqui você salvaria no backend/contexto
        console.log('Salvando configurações:', settings);
        alert('✅ Configurações salvas com sucesso!');
    };

    const handleAddLevel = () => {
        const newLevelWithOrder = {
            ...newLevel,
            order: levels.length + 1
        };
        setLevels([...levels, newLevelWithOrder]);
        setShowAddLevel(false);
        setNewLevel({
            name: '',
            pointsRequired: 0,
            discountPercent: 0,
            color: '#FF6B6B',
            icon: '⭐',
            benefits: ''
        });
    };

    const handleDeleteLevel = (index: number) => {
        if (window.confirm('Tem certeza que deseja excluir este nível?')) {
            const newLevels = levels.filter((_, i) => i !== index);
            // Reordenar
            newLevels.forEach((level, i) => {
                level.order = i + 1;
            });
            setLevels(newLevels);
        }
    };

    const handleUpdateLevel = (index: number, field: string, value: any) => {
        const newLevels = [...levels];
        newLevels[index] = { ...newLevels[index], [field]: value };
        setLevels(newLevels);
    };

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 via-white to-orange-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <Crown className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    Programa de Fidelidade
                                </h2>
                                <p className="text-sm text-gray-500">Configure pontos, níveis e recompensas para seus clientes</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSaveSettings}
                            className="bg-gradient-to-r from-purple-600 to-orange-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition flex items-center gap-2 font-semibold"
                        >
                            <Save size={20} />
                            Salvar Configurações
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-6xl mx-auto space-y-6">

                    {/* Ativar/Desativar Sistema */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-600 to-orange-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Zap size={28} />
                                    <div>
                                        <h3 className="text-xl font-bold">Status do Programa</h3>
                                        <p className="text-purple-100 text-sm">Ative ou desative o sistema de pontos</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.isEnabled}
                                        onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-16 h-8 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-8 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>
                        </div>

                        {!settings.isEnabled && (
                            <div className="p-6 bg-yellow-50 border-t border-yellow-100">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <p className="text-sm font-semibold text-yellow-900">Sistema Desativado</p>
                                        <p className="text-xs text-yellow-700 mt-1">
                                            Os clientes não acumularão pontos nem terão descontos aplicados.
                                            Ative o sistema para começar a recompensar seus clientes fiéis!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Configurações de Pontos */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Star className="text-blue-600" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Acúmulo de Pontos</h3>
                                <p className="text-sm text-gray-500">Defina quantos pontos o cliente ganha por real gasto</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Sparkles size={16} className="text-purple-600" />
                                        Pontos por Real (R$)
                                        <div className="group relative">
                                            <HelpCircle size={14} className="text-gray-400 cursor-help" />
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                                <p className="font-semibold mb-1">Como funciona?</p>
                                                <p>Se você definir <strong>1 ponto por R$ 1,00</strong>, um cliente que gastar R$ 50,00 ganhará 50 pontos.</p>
                                                <p className="mt-2">Se definir <strong>10 pontos por R$ 1,00</strong>, o mesmo cliente ganhará 500 pontos!</p>
                                            </div>
                                        </div>
                                    </label>
                                    <input
                                        type="number"
                                        min="0.1"
                                        step="0.1"
                                        value={settings.pointsPerReal}
                                        onChange={(e) => setSettings({ ...settings, pointsPerReal: parseFloat(e.target.value) })}
                                        className="w-full p-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white text-gray-900 font-semibold"
                                    />
                                    <p className="text-xs text-gray-600 mt-2">
                                        💡 <strong>Exemplo:</strong> Com {settings.pointsPerReal} ponto(s) por R$,
                                        uma compra de R$ 100,00 = <strong className="text-purple-600">{settings.pointsPerReal * 100} pontos</strong>
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg p-4 border-2 border-dashed border-purple-200">
                                    <p className="text-xs font-bold text-purple-600 uppercase mb-2">Simulação Rápida</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Compra de R$ 50,00:</span>
                                            <span className="font-bold text-gray-900">{settings.pointsPerReal * 50} pts</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Compra de R$ 100,00:</span>
                                            <span className="font-bold text-gray-900">{settings.pointsPerReal * 100} pts</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Compra de R$ 200,00:</span>
                                            <span className="font-bold text-purple-600">{settings.pointsPerReal * 200} pts</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configurações de Expiração */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Clock className="text-orange-600" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Expiração de Nível</h3>
                                <p className="text-sm text-gray-500">Clientes perdem o nível se ficarem inativos</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-700">Ativar Expiração de Nível</span>
                                    <div className="group relative">
                                        <HelpCircle size={14} className="text-gray-400 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                            <p className="font-semibold mb-1">O que é isso?</p>
                                            <p>Se ativado, clientes que ficarem sem comprar pelo período definido <strong>cairão de nível</strong>.</p>
                                            <p className="mt-2">Exemplo: Cliente Ouro fica 90 dias sem comprar → volta para Prata ou Bronze.</p>
                                            <p className="mt-2 text-yellow-300">⚠️ Isso incentiva compras recorrentes!</p>
                                        </div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.levelExpirationEnabled}
                                        onChange={(e) => setSettings({ ...settings, levelExpirationEnabled: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-500"></div>
                                </label>
                            </div>

                            {settings.levelExpirationEnabled && (
                                <div className="animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Dias sem compra para cair de nível
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={settings.levelExpirationDays}
                                        onChange={(e) => setSettings({ ...settings, levelExpirationDays: parseInt(e.target.value) })}
                                        className="w-full p-3 border-2 border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 font-semibold"
                                    />
                                    <p className="text-xs text-gray-600 mt-2">
                                        ⏰ Clientes que ficarem <strong>{settings.levelExpirationDays} dias</strong> sem comprar
                                        voltarão para o nível anterior ou perderão benefícios.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Configurações de Resgate (Opcional) */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <Gift className="text-green-600" size={20} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Resgate de Pontos (Avançado)</h3>
                                <p className="text-sm text-gray-500">Permitir que clientes troquem pontos por desconto</p>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-700">Permitir Resgate de Pontos</span>
                                    <div className="group relative">
                                        <HelpCircle size={14} className="text-gray-400 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                                            <p className="font-semibold mb-1">Resgate de Pontos</p>
                                            <p>Permite que clientes <strong>troquem pontos acumulados por desconto em dinheiro</strong> nas compras.</p>
                                            <p className="mt-2">Exemplo: 100 pontos = R$ 1,00 de desconto.</p>
                                            <p className="mt-2 text-yellow-300">💡 Isso é diferente do desconto automático por nível!</p>
                                        </div>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.enablePointsRedemption}
                                        onChange={(e) => setSettings({ ...settings, enablePointsRedemption: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-7 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                            </div>

                            {settings.enablePointsRedemption && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Taxa de Conversão (Pontos → Reais)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={settings.pointsToRealRate}
                                            onChange={(e) => setSettings({ ...settings, pointsToRealRate: parseInt(e.target.value) })}
                                            className="w-full p-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-gray-900 font-semibold"
                                        />
                                        <p className="text-xs text-gray-600 mt-2">
                                            💰 <strong>{settings.pointsToRealRate} pontos</strong> = R$ 1,00 de desconto
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Mínimo de Pontos para Resgatar
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={settings.minPointsToRedeem}
                                            onChange={(e) => setSettings({ ...settings, minPointsToRedeem: parseInt(e.target.value) })}
                                            className="w-full p-3 border-2 border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white text-gray-900 font-semibold"
                                        />
                                        <p className="text-xs text-gray-600 mt-2">
                                            🎯 Cliente precisa ter pelo menos <strong>{settings.minPointsToRedeem} pontos</strong> para resgatar
                                            (equivalente a <strong className="text-green-600">R$ {(settings.minPointsToRedeem / settings.pointsToRealRate).toFixed(2)}</strong>)
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Níveis de Fidelidade */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Award className="text-purple-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">Níveis de Fidelidade</h3>
                                    <p className="text-sm text-gray-500">Configure os níveis e seus benefícios</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddLevel(true)}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 font-medium"
                            >
                                <Plus size={18} />
                                Adicionar Nível
                            </button>
                        </div>

                        <div className="space-y-3">
                            {levels.sort((a, b) => a.order - b.order).map((level, index) => (
                                <div
                                    key={index}
                                    className="border-2 rounded-xl p-5 hover:shadow-md transition"
                                    style={{ borderColor: level.color + '40', backgroundColor: level.color + '08' }}
                                >
                                    {editingLevel === index ? (
                                        // Modo Edição
                                        <div className="space-y-4">
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do Nível</label>
                                                    <input
                                                        type="text"
                                                        value={level.name}
                                                        onChange={(e) => handleUpdateLevel(index, 'name', e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Pontos Necessários</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={level.pointsRequired}
                                                        onChange={(e) => handleUpdateLevel(index, 'pointsRequired', parseInt(e.target.value))}
                                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Desconto (%)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={level.discountPercent}
                                                        onChange={(e) => handleUpdateLevel(index, 'discountPercent', parseFloat(e.target.value))}
                                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Cor (Hex)</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="color"
                                                            value={level.color}
                                                            onChange={(e) => handleUpdateLevel(index, 'color', e.target.value)}
                                                            className="w-12 h-10 rounded cursor-pointer"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={level.color}
                                                            onChange={(e) => handleUpdateLevel(index, 'color', e.target.value)}
                                                            className="flex-1 p-2 border border-gray-300 rounded-lg text-sm font-mono"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Ícone (Emoji)</label>
                                                    <input
                                                        type="text"
                                                        value={level.icon}
                                                        onChange={(e) => handleUpdateLevel(index, 'icon', e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                                        placeholder="🥇"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-600 mb-1">Benefícios</label>
                                                <textarea
                                                    value={level.benefits}
                                                    onChange={(e) => handleUpdateLevel(index, 'benefits', e.target.value)}
                                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm resize-none"
                                                    rows={2}
                                                />
                                            </div>
                                            <div className="flex gap-2 justify-end">
                                                <button
                                                    onClick={() => setEditingLevel(null)}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={() => setEditingLevel(null)}
                                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
                                                >
                                                    <Save size={16} />
                                                    Salvar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        // Modo Visualização
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div
                                                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-md"
                                                    style={{ backgroundColor: level.color + '20' }}
                                                >
                                                    {level.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h4 className="text-lg font-bold text-gray-900">{level.name}</h4>
                                                        <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                                            {level.discountPercent}% OFF
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        <strong>{level.pointsRequired} pontos</strong> necessários
                                                    </p>
                                                    {level.benefits && (
                                                        <p className="text-xs text-gray-500 italic">💎 {level.benefits}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setEditingLevel(index)}
                                                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                {levels.length > 1 && (
                                                    <button
                                                        onClick={() => handleDeleteLevel(index)}
                                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Visualização da Progressão */}
                        <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-orange-50 rounded-xl border-2 border-dashed border-purple-200">
                            <p className="text-sm font-bold text-purple-900 mb-4 flex items-center gap-2">
                                <TrendingUp size={16} />
                                Progressão de Níveis (Visualização)
                            </p>
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                {levels.sort((a, b) => a.order - b.order).map((level, index) => (
                                    <React.Fragment key={index}>
                                        <div className="flex flex-col items-center min-w-[120px]">
                                            <div
                                                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg mb-2"
                                                style={{ backgroundColor: level.color }}
                                            >
                                                {level.icon}
                                            </div>
                                            <p className="text-xs font-bold text-gray-900">{level.name}</p>
                                            <p className="text-[10px] text-gray-500">{level.pointsRequired} pts</p>
                                            <p className="text-xs font-semibold text-purple-600 mt-1">{level.discountPercent}%</p>
                                        </div>
                                        {index < levels.length - 1 && (
                                            <div className="text-gray-400 text-2xl mb-8">→</div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Modal Adicionar Nível */}
                    {showAddLevel && (
                        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6">
                                <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                                    <Plus size={24} className="text-purple-600" />
                                    Adicionar Novo Nível
                                </h3>
                                <div className="space-y-4">
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Nível</label>
                                            <input
                                                type="text"
                                                value={newLevel.name}
                                                onChange={(e) => setNewLevel({ ...newLevel, name: e.target.value })}
                                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                placeholder="Ex: Platina"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Pontos Necessários</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={newLevel.pointsRequired}
                                                onChange={(e) => setNewLevel({ ...newLevel, pointsRequired: parseInt(e.target.value) })}
                                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Desconto (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={newLevel.discountPercent}
                                                onChange={(e) => setNewLevel({ ...newLevel, discountPercent: parseFloat(e.target.value) })}
                                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Cor (Hex)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="color"
                                                    value={newLevel.color}
                                                    onChange={(e) => setNewLevel({ ...newLevel, color: e.target.value })}
                                                    className="w-14 h-12 rounded cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={newLevel.color}
                                                    onChange={(e) => setNewLevel({ ...newLevel, color: e.target.value })}
                                                    className="flex-1 p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ícone (Emoji)</label>
                                            <input
                                                type="text"
                                                value={newLevel.icon}
                                                onChange={(e) => setNewLevel({ ...newLevel, icon: e.target.value })}
                                                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                placeholder="🏆"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Benefícios</label>
                                        <textarea
                                            value={newLevel.benefits}
                                            onChange={(e) => setNewLevel({ ...newLevel, benefits: e.target.value })}
                                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                            rows={3}
                                            placeholder="Descreva os benefícios deste nível..."
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setShowAddLevel(false)}
                                        className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleAddLevel}
                                        disabled={!newLevel.name || newLevel.pointsRequired < 0}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-600 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Adicionar Nível
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default LoyaltySettings;
