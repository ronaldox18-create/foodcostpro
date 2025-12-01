import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { BusinessHours, SpecialHours, ServiceType, NotificationPreferences } from '../types';
import {
    Save, Clock, ToggleLeft, ToggleRight, AlertCircle, CheckCircle2,
    Calendar, Plus, Trash2, Bell, Coffee, Truck, Store, Globe
} from 'lucide-react';
import { getDayName, getServiceTypeLabel, formatTime } from '../utils/businessHours';

const BusinessHoursAdvanced: React.FC = () => {
    const { user } = useAuth();
    const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
    const [specialHours, setSpecialHours] = useState<SpecialHours[]>([]);
    const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'regular' | 'special' | 'notifications'>('regular');
    const [selectedServiceType, setSelectedServiceType] = useState<ServiceType>('all');

    // Form para novo horário especial
    const [newSpecial, setNewSpecial] = useState({
        date: '',
        name: '',
        is_open: false,
        open_time: '11:00',
        close_time: '22:00',
        service_type: 'all' as ServiceType
    });

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user, selectedServiceType]);

    const fetchData = async () => {
        if (!user) return;

        try {
            // Buscar horários regulares
            const { data: hoursData, error: hoursError } = await supabase
                .from('business_hours')
                .select('*')
                .eq('user_id', user.id)
                .eq('service_type', selectedServiceType)
                .order('day_of_week');

            if (hoursError) throw hoursError;

            if (hoursData && hoursData.length > 0) {
                setBusinessHours(hoursData);
            } else {
                // Criar horários padrão
                await createDefaultHours();
            }

            // Buscar horários especiais
            const { data: specialData, error: specialError } = await supabase
                .from('special_hours')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', new Date().toISOString().split('T')[0])
                .order('date');

            if (!specialError && specialData) {
                setSpecialHours(specialData);
            }

            // Buscar preferências de notificação
            const { data: notifData, error: notifError } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (!notifError && notifData) {
                setNotifications(notifData);
            } else {
                // Criar preferências padrão
                const { data: newNotif } = await supabase
                    .from('notification_preferences')
                    .insert([{ user_id: user.id }])
                    .select()
                    .single();

                if (newNotif) setNotifications(newNotif);
            }
        } catch (err: any) {
            console.error('Error fetching data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createDefaultHours = async () => {
        if (!user) return;

        const defaultHours: Partial<BusinessHours>[] = [];
        for (let day = 0; day <= 6; day++) {
            defaultHours.push({
                user_id: user.id,
                day_of_week: day,
                is_open: day !== 0, // Fechado no domingo
                open_time: day === 0 ? null : '11:00:00',
                close_time: day === 0 ? null : (day >= 5 ? '23:00:00' : '22:00:00'),
                pause_start: null,
                pause_end: null,
                service_type: selectedServiceType
            });
        }

        const { data, error } = await supabase
            .from('business_hours')
            .insert(defaultHours)
            .select();

        if (error) throw error;
        if (data) setBusinessHours(data);
    };

    const handleToggleDay = (dayOfWeek: number) => {
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

    const handleTimeChange = (
        dayOfWeek: number,
        field: 'open_time' | 'close_time' | 'pause_start' | 'pause_end',
        value: string
    ) => {
        const timeValue = value ? `${value}:00` : null;

        setBusinessHours(prev =>
            prev.map(h =>
                h.day_of_week === dayOfWeek
                    ? { ...h, [field]: timeValue }
                    : h
            )
        );
    };

    const handleSaveRegular = async () => {
        if (!user) return;
        setSaving(true);
        setError(null);

        try {
            // Validar horários
            for (const hours of businessHours) {
                if (hours.is_open && hours.open_time && hours.close_time) {
                    if (hours.open_time >= hours.close_time) {
                        throw new Error(`${getDayName(hours.day_of_week)}: Horário de abertura deve ser antes do fechamento`);
                    }

                    // Validar pausa
                    if (hours.pause_start && hours.pause_end) {
                        if (hours.pause_start >= hours.pause_end) {
                            throw new Error(`${getDayName(hours.day_of_week)}: Início da pausa deve ser antes do fim`);
                        }
                        if (hours.pause_start < hours.open_time || hours.pause_end > hours.close_time) {
                            throw new Error(`${getDayName(hours.day_of_week)}: Pausa deve estar dentro do horário de funcionamento`);
                        }
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
                close_time: hours.close_time,
                pause_start: hours.pause_start,
                pause_end: hours.pause_end,
                service_type: hours.service_type
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

    const handleAddSpecial = async () => {
        if (!user || !newSpecial.date || !newSpecial.name) {
            setError('Preencha a data e o nome do evento');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('special_hours')
                .insert([{
                    user_id: user.id,
                    date: newSpecial.date,
                    name: newSpecial.name,
                    is_open: newSpecial.is_open,
                    open_time: newSpecial.is_open ? `${newSpecial.open_time}:00` : null,
                    close_time: newSpecial.is_open ? `${newSpecial.close_time}:00` : null,
                    service_type: newSpecial.service_type
                }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setSpecialHours(prev => [...prev, data]);
                setNewSpecial({
                    date: '',
                    name: '',
                    is_open: false,
                    open_time: '11:00',
                    close_time: '22:00',
                    service_type: 'all'
                });
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteSpecial = async (id: string) => {
        if (!confirm('Remover este horário especial?')) return;

        try {
            const { error } = await supabase
                .from('special_hours')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSpecialHours(prev => prev.filter(h => h.id !== id));
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleSaveNotifications = async () => {
        if (!user || !notifications) return;

        try {
            const { error } = await supabase
                .from('notification_preferences')
                .update({
                    notify_on_open: notifications.notify_on_open,
                    notify_on_close_soon: notifications.notify_on_close_soon,
                    notify_customers_on_open: notifications.notify_customers_on_open,
                    advance_notice_minutes: notifications.advance_notice_minutes,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (error) throw error;
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            setError(err.message);
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
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="text-orange-500" size={28} />
                    Horários de Funcionamento Avançado
                </h2>
                <p className="text-gray-600 text-sm">
                    Configure horários regulares, pausas, feriados e notificações.
                </p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
                    <div className="flex-1">
                        <h3 className="font-semibold text-red-900 mb-1">Erro</h3>
                        <p className="text-sm text-red-700">{error}</p>
                        <button
                            onClick={() => setError(null)}
                            className="text-xs text-red-600 underline mt-2"
                        >
                            Dispensar
                        </button>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('regular')}
                    className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'regular'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Clock size={16} className="inline mr-2" />
                    Horários Regulares
                </button>
                <button
                    onClick={() => setActiveTab('special')}
                    className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'special'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Calendar size={16} className="inline mr-2" />
                    Feriados/Eventos
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'notifications'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Bell size={16} className="inline mr-2" />
                    Notificações
                </button>
            </div>

            {/* Tab: Horários Regulares */}
            {activeTab === 'regular' && (
                <div className="space-y-6">
                    {/* Seletor de Tipo de Serviço */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <Globe size={18} />
                            Tipo de Serviço
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                            {(['all', 'delivery', 'pickup'] as ServiceType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedServiceType(type)}
                                    className={`p-3 rounded-lg border-2 transition-all ${selectedServiceType === type
                                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        {type === 'all' && <Globe size={20} />}
                                        {type === 'delivery' && <Truck size={20} />}
                                        {type === 'pickup' && <Store size={20} />}
                                    </div>
                                    <p className="text-xs font-semibold">{getServiceTypeLabel(type)}</p>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-blue-700 mt-3">
                            Configure horários diferentes para delivery e balcão, ou use "Delivery e Balcão" para ambos.
                        </p>
                    </div>

                    {/* Tabela de Horários */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {businessHours.map((hours) => {
                                const dayName = getDayName(hours.day_of_week);

                                return (
                                    <div key={hours.day_of_week} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col gap-4">
                                            {/* Linha 1: Dia + Toggle */}
                                            <div className="flex items-center gap-4">
                                                <div className="w-32">
                                                    <div className="font-bold text-gray-900">{dayName}</div>
                                                </div>

                                                <button
                                                    onClick={() => handleToggleDay(hours.day_of_week)}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm ${hours.is_open
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {hours.is_open ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                    {hours.is_open ? 'Aberto' : 'Fechado'}
                                                </button>
                                            </div>

                                            {/* Linha 2: Horários */}
                                            {hours.is_open && (
                                                <div className="grid grid-cols-2 gap-4 pl-36">
                                                    {/* Horário de Funcionamento */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-gray-600 uppercase">Funcionamento</label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="time"
                                                                value={hours.open_time ? hours.open_time.slice(0, 5) : ''}
                                                                onChange={(e) => handleTimeChange(hours.day_of_week, 'open_time', e.target.value)}
                                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 font-mono text-sm"
                                                            />
                                                            <span className="text-gray-400">—</span>
                                                            <input
                                                                type="time"
                                                                value={hours.close_time ? hours.close_time.slice(0, 5) : ''}
                                                                onChange={(e) => handleTimeChange(hours.day_of_week, 'close_time', e.target.value)}
                                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 font-mono text-sm"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Pausa/Intervalo */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-gray-600 uppercase flex items-center gap-1">
                                                            <Coffee size={12} />
                                                            Pausa (Opcional)
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="time"
                                                                value={hours.pause_start ? hours.pause_start.slice(0, 5) : ''}
                                                                onChange={(e) => handleTimeChange(hours.day_of_week, 'pause_start', e.target.value)}
                                                                placeholder="--:--"
                                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 font-mono text-sm"
                                                            />
                                                            <span className="text-gray-400">—</span>
                                                            <input
                                                                type="time"
                                                                value={hours.pause_end ? hours.pause_end.slice(0, 5) : ''}
                                                                onChange={(e) => handleTimeChange(hours.day_of_week, 'pause_end', e.target.value)}
                                                                placeholder="--:--"
                                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 font-mono text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        {saved && (
                            <div className="flex items-center gap-2 text-green-600 font-medium">
                                <CheckCircle2 size={18} />
                                Horários salvos com sucesso!
                            </div>
                        )}
                        {!saved && <div></div>}

                        <button
                            onClick={handleSaveRegular}
                            disabled={saving}
                            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-black transition font-medium disabled:opacity-50"
                        >
                            <Save size={18} />
                            {saving ? 'Salvando...' : 'Salvar Horários'}
                        </button>
                    </div>
                </div>
            )}

            {/* Tab: Horários Especiais */}
            {activeTab === 'special' && (
                <div className="space-y-6">
                    {/* Form para adicionar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Plus size={20} className="text-orange-500" />
                            Adicionar Feriado/Evento
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                                <input
                                    type="date"
                                    value={newSpecial.date}
                                    onChange={(e) => setNewSpecial({ ...newSpecial, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Evento</label>
                                <input
                                    type="text"
                                    value={newSpecial.name}
                                    onChange={(e) => setNewSpecial({ ...newSpecial, name: e.target.value })}
                                    placeholder="Ex: Natal, Ano Novo..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="special-open"
                                    checked={newSpecial.is_open}
                                    onChange={(e) => setNewSpecial({ ...newSpecial, is_open: e.target.checked })}
                                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                />
                                <label htmlFor="special-open" className="text-sm font-medium text-gray-700">
                                    Loja estará aberta neste dia
                                </label>
                            </div>

                            {newSpecial.is_open && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Horário</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                value={newSpecial.open_time}
                                                onChange={(e) => setNewSpecial({ ...newSpecial, open_time: e.target.value })}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                                            />
                                            <span>—</span>
                                            <input
                                                type="time"
                                                value={newSpecial.close_time}
                                                onChange={(e) => setNewSpecial({ ...newSpecial, close_time: e.target.value })}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleAddSpecial}
                            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition font-medium"
                        >
                            <Plus size={18} />
                            Adicionar
                        </button>
                    </div>

                    {/* Lista de horários especiais */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Próximos Feriados/Eventos</h3>

                        {specialHours.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center py-8">
                                Nenhum horário especial configurado
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {specialHours.map(special => (
                                    <div key={special.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="font-bold text-gray-900">{special.name}</span>
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${special.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {special.is_open ? 'Aberto' : 'Fechado'}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                {new Date(special.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                                {special.is_open && special.open_time && ` • ${formatTime(special.open_time)} - ${formatTime(special.close_time || '')}`}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteSpecial(special.id)}
                                            className="text-red-600 hover:text-red-700 p-2"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab: Notificações */}
            {activeTab === 'notifications' && notifications && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Bell size={20} className="text-orange-500" />
                            Preferências de Notificação
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="notify-open"
                                    checked={notifications.notify_on_open}
                                    onChange={(e) => setNotifications({ ...notifications, notify_on_open: e.target.checked })}
                                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5"
                                />
                                <div>
                                    <label htmlFor="notify-open" className="font-medium text-gray-900 cursor-pointer">
                                        Notificar quando a loja abrir
                                    </label>
                                    <p className="text-sm text-gray-600">Receba um alerta quando for hora de abrir a loja</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="notify-close"
                                    checked={notifications.notify_on_close_soon}
                                    onChange={(e) => setNotifications({ ...notifications, notify_on_close_soon: e.target.checked })}
                                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5"
                                />
                                <div>
                                    <label htmlFor="notify-close" className="font-medium text-gray-900 cursor-pointer">
                                        Notificar antes de fechar
                                    </label>
                                    <p className="text-sm text-gray-600">Receba um alerta {notifications.advance_notice_minutes} minutos antes do fechamento</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="notify-customers"
                                    checked={notifications.notify_customers_on_open}
                                    onChange={(e) => setNotifications({ ...notifications, notify_customers_on_open: e.target.checked })}
                                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 mt-0.5"
                                />
                                <div>
                                    <label htmlFor="notify-customers" className="font-medium text-gray-900 cursor-pointer">
                                        Notificar clientes quando abrir
                                    </label>
                                    <p className="text-sm text-gray-600">Envie notificação para clientes quando a loja abrir (futuro)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        {saved && (
                            <div className="flex items-center gap-2 text-green-600 font-medium">
                                <CheckCircle2 size={18} />
                                Preferências salvas!
                            </div>
                        )}
                        {!saved && <div></div>}

                        <button
                            onClick={handleSaveNotifications}
                            className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-black transition font-medium"
                        >
                            <Save size={18} />
                            Salvar Preferências
                        </button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700">
                            <strong>Nota:</strong> As notificações para clientes serão implementadas em breve via WhatsApp/Email.
                            Por enquanto, apenas notificações internas estão disponíveis.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessHoursAdvanced;
