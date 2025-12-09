import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { BusinessHours } from '../types';
import { Save, Clock, ToggleLeft, ToggleRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getDayName, getShortDayName } from '../utils/businessHours';

const BusinessHoursPage: React.FC = () => {
    const { user } = useAuth();
    const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchBusinessHours();
    }, [user]);

    const fetchBusinessHours = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('business_hours')
                .select('*')
                .eq('user_id', user.id)
                .order('day_of_week');

            if (error) throw error;

            if (data && data.length > 0) {
                setBusinessHours(data);
            } else {
                // Criar horários padrão
                const defaultHours: Partial<BusinessHours>[] = [];
                for (let day = 0; day <= 6; day++) {
                    defaultHours.push({
                        user_id: user.id,
                        day_of_week: day,
                        is_open: day !== 0, // Fechado no domingo
                        open_time: day === 0 ? null : '11:00:00',
                        close_time: day === 0 ? null : (day >= 5 ? '23:00:00' : '22:00:00')
                    });
                }

                const { data: inserted, error: insertError } = await supabase
                    .from('business_hours')
                    .insert(defaultHours)
                    .select();

                if (insertError) throw insertError;
                if (inserted) setBusinessHours(inserted);
            }
        } catch (err: any) {
            console.error('Error fetching business hours:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDay = async (dayOfWeek: number) => {
        const dayHours = businessHours.find(h => h.day_of_week === dayOfWeek);
        if (!dayHours) return;

        const updated = {
            ...dayHours,
            is_open: !dayHours.is_open,
            open_time: !dayHours.is_open ? '11:00:00' : null,
            close_time: !dayHours.is_open ? '22:00:00' : null
        };

        setBusinessHours(prev =>
            prev.map(h => h.day_of_week === dayOfWeek ? updated : h)
        );
    };

    const handleTimeChange = (dayOfWeek: number, field: 'open_time' | 'close_time', value: string) => {
        // Converter de HH:MM para HH:MM:SS
        const timeValue = value ? `${value}:00` : null;

        setBusinessHours(prev =>
            prev.map(h =>
                h.day_of_week === dayOfWeek
                    ? { ...h, [field]: timeValue }
                    : h
            )
        );
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setError(null);

        try {
            // Validar horários
            for (const hours of businessHours) {
                if (hours.is_open && hours.open_time && hours.close_time) {
                    if (hours.open_time === hours.close_time) {
                        throw new Error(`${getDayName(hours.day_of_week)}: Horário de abertura não pode ser igual ao fechamento`);
                    }
                }
            }

            // Atualizar todos os horários
            const updates = businessHours.map(hours => ({
                id: hours.id,
                user_id: user.id,
                day_of_week: hours.day_of_week,
                is_open: hours.is_open,
                open_time: hours.open_time,
                close_time: hours.close_time
            }));

            for (const update of updates) {
                const { error } = await supabase
                    .from('business_hours')
                    .update(update)
                    .eq('id', update.id);

                if (error) throw error;
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            console.error('Error saving business hours:', err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const copyToAllDays = (sourceDay: number) => {
        const source = businessHours.find(h => h.day_of_week === sourceDay);
        if (!source) return;

        if (confirm(`Copiar horários de ${getDayName(sourceDay)} para todos os dias?`)) {
            setBusinessHours(prev =>
                prev.map(h => ({
                    ...h,
                    is_open: source.is_open,
                    open_time: source.open_time,
                    close_time: source.close_time
                }))
            );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="text-orange-500" size={28} />
                    Horários de Funcionamento
                </h2>
                <p className="text-gray-600 text-sm">
                    Configure os dias e horários que seu estabelecimento funciona.
                    Isso aparecerá no cardápio online e melhorará suas análises de negócio.
                </p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                    <div className="flex-1">
                        <h3 className="font-semibold text-red-900 mb-1">Erro</h3>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-100">
                    {businessHours.map((hours) => {
                        const dayName = getDayName(hours.day_of_week);
                        const shortName = getShortDayName(hours.day_of_week);

                        return (
                            <div key={hours.day_of_week} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    {/* Dia da semana */}
                                    <div className="w-32 flex-shrink-0">
                                        <div className="font-bold text-gray-900">{dayName}</div>
                                        <div className="text-xs text-gray-500">{shortName}</div>
                                    </div>

                                    {/* Toggle Aberto/Fechado */}
                                    <button
                                        onClick={() => handleToggleDay(hours.day_of_week)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${hours.is_open
                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {hours.is_open ? (
                                            <>
                                                <ToggleRight size={20} />
                                                Aberto
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft size={20} />
                                                Fechado
                                            </>
                                        )}
                                    </button>

                                    {/* Horários */}
                                    {hours.is_open && (
                                        <div className="flex-1 flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-medium text-gray-600">Abre:</label>
                                                <input
                                                    type="time"
                                                    value={hours.open_time ? hours.open_time.slice(0, 5) : ''}
                                                    onChange={(e) => handleTimeChange(hours.day_of_week, 'open_time', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 font-mono text-sm"
                                                />
                                            </div>

                                            <span className="text-gray-400">—</span>

                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-medium text-gray-600">Fecha:</label>
                                                <input
                                                    type="time"
                                                    value={hours.close_time ? hours.close_time.slice(0, 5) : ''}
                                                    onChange={(e) => handleTimeChange(hours.day_of_week, 'close_time', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 font-mono text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Botão copiar */}
                                    {hours.is_open && (
                                        <button
                                            onClick={() => copyToAllDays(hours.day_of_week)}
                                            className="text-xs text-orange-600 hover:text-orange-700 font-medium whitespace-nowrap"
                                        >
                                            Copiar para todos
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
                {saved && (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle2 size={18} />
                        Horários salvos com sucesso!
                    </div>
                )}
                {!saved && <div></div>}

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-black transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save size={18} />
                    {saving ? 'Salvando...' : 'Salvar Horários'}
                </button>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <AlertCircle size={18} />
                    Dica
                </h3>
                <p className="text-sm text-blue-700">
                    Os horários configurados aqui serão usados para:
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Mostrar status "Aberto/Fechado" no cardápio online</li>
                    <li>Calcular horários de pico de vendas com precisão</li>
                    <li>Filtrar análises apenas durante horário de funcionamento</li>
                    <li>Melhorar relatórios e previsões do negócio</li>
                </ul>
            </div>
        </div>
    );
};

export default BusinessHoursPage;
