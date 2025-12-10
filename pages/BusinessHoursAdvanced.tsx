import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../utils/supabaseClient';
import { BusinessHours, SpecialHours, ServiceType, NotificationPreferences } from '../types';
import {
    Save, Clock, ToggleLeft, ToggleRight, AlertCircle, CheckCircle2,
    Calendar, Plus, Trash2, Bell, Coffee, Truck, Store, Globe, Lock
} from 'lucide-react';
import { getDayName, getServiceTypeLabel, formatTime } from '../utils/businessHours';

const BusinessHoursAdvanced: React.FC = () => {
    const { user, userPlan } = useAuth();
    const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
    const [specialHours, setSpecialHours] = useState<SpecialHours[]>([]);
    const [notifications, setNotifications] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'regular' | 'special' | 'notifications'>('regular');

    // Determine default service type based on plan
    const getDefaultServiceType = (): ServiceType => {
        if (userPlan === 'online') return 'delivery';
        return 'all';
    };

    const [selectedServiceType, setSelectedServiceType] = useState<ServiceType>(getDefaultServiceType());

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
        if (userPlan === 'online') {
            setSelectedServiceType('delivery');
        }
    }, [userPlan]);

    useEffect(() => {
        if (!user) return;
        // Se o plano for 'starter' (local apenas), talvez nem precisemos carregar,
        // mas vamos carregar para evitar erros se o componente for montado.
        // A UI vai bloquear a edição.
        fetchData();
    }, [user, selectedServiceType, userPlan]);

    const fetchData = async () => {
        if (!user) return;

        try {
            setLoading(true);
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
                    // Permitir virada de noite (open > close), apenas garantir que não sejam iguais
                    if (hours.open_time === hours.close_time) {
                        throw new Error(`${getDayName(hours.day_of_week)}: Horário de abertura não pode ser igual ao fechamento`);
                    }

                    // Validar pausa
                    if (hours.pause_start && hours.pause_end) {
                        // Se pausa inicial for MAIOR que final, significa que cruza meia noite.
                        // Isso só é permitido se o horário PRINCIPAL também cruzar meia noite (overnight)
                        // OU se for algo bizarro como pausa das 23:00 as 01:00.

                        const isOvernight = hours.open_time > hours.close_time;
                        const pauseCrossesMidnight = hours.pause_start > hours.pause_end;

                        if (pauseCrossesMidnight && !isOvernight) {
                            // Se o horário principal NÃO é overnight (ex: 08:00 as 20:00), pausa NÃO pode cruzar meia noite
                            throw new Error(`${getDayName(hours.day_of_week)}: Pausa inválida (cruza meia-noite mas horário não)`);
                        }

                        if (hours.pause_start === hours.pause_end) {
                            throw new Error(`${getDayName(hours.day_of_week)}: Pausa não pode ter duração zero`);
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

            // Usar UPSERT para garantir que salve mesmo que haja inconsistências
            const { error: upsertError } = await supabase
                .from('business_hours')
                .upsert(updates);

            if (upsertError) throw upsertError;

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

    if (userPlan === 'starter') {
        return (
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Store className="text-blue-500" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuração de Horários Simplificada</h2>
                    <p className="text-gray-600 max-w-lg mx-auto mb-6">
                        Seu plano atual é focado no atendimento local, onde a gestão rigorosa de horários online não é necessária.
                        Sua loja opera de acordo com sua disponibilidade física.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 py-2 px-4 rounded-full inline-flex">
                        <Lock size={14} />
                        Disponível nos planos Online e Pro
                    </div>
                </div>
            </div>
        );
    }

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
        <div className="max-w-5xl mx-auto py-6">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="text-orange-500" size={28} />
                    Horários de Funcionamento
                </h2>
                <p className="text-gray-600 text-sm">
                    {userPlan === 'online'
                        ? 'Configure quando seu delivery está disponível para receber pedidos.'
                        : 'Gerencie os horários de funcionamento do seu delivery e atendimento local.'}
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
                    className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'regular'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-md'
                        }`}
                >
                    <Clock size={16} />
                    Horários Regulares
                </button>
                <button
                    onClick={() => setActiveTab('special')}
                    className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'special'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-md'
                        }`}
                >
                    <Calendar size={16} />
                    Feriados/Eventos
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`px-4 py-3 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'notifications'
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-md'
                        }`}
                >
                    <Bell size={16} />
                    Notificações
                </button>
            </div>

            {/* Tab: Horários Regulares */}
            {activeTab === 'regular' && (
                <div className="space-y-6 animate-fadeIn">
                    {/* Seletor de Tipo de Serviço (Visível apenas para PRO e FREE) */}
                    {(userPlan === 'pro' || userPlan === 'free') && (
                        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                                <Globe size={16} className="text-gray-500" />
                                Aplicar para
                            </h4>
                            <div className="flex gap-2">
                                {(['all', 'delivery', 'pickup'] as ServiceType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedServiceType(type)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${selectedServiceType === type
                                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-white'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {type === 'all' && <Globe size={14} />}
                                            {type === 'delivery' && <Truck size={14} />}
                                            {type === 'pickup' && <Store size={14} />}
                                            {getServiceTypeLabel(type)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {userPlan === 'online' && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                <Truck size={20} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-blue-900 text-sm">Configurando Delivery</h4>
                                <p className="text-xs text-blue-700">Como você possui o plano Online, estas configurações aplicam-se exclusivamente ao seu delivery.</p>
                            </div>
                        </div>
                    )}

                    {/* Tabela de Horários */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="divide-y divide-gray-100">
                            {businessHours.map((hours) => {
                                const dayName = getDayName(hours.day_of_week);
                                const isClosed = !hours.is_open;

                                return (
                                    <div key={hours.day_of_week} className={`p-4 transition-colors ${isClosed ? 'bg-gray-50' : 'bg-white'}`}>
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            {/* Coluna 1: Toggle e Dia */}
                                            <div className="flex items-center justify-between md:w-48 flex-shrink-0">
                                                <div className="font-bold text-gray-700">{dayName}</div>
                                                <button
                                                    onClick={() => handleToggleDay(hours.day_of_week)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${hours.is_open ? 'bg-green-500' : 'bg-gray-300'}`}
                                                >
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hours.is_open ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>

                                            {/* Coluna 2: Horários */}
                                            {hours.is_open && (
                                                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                                                    {/* Horário de Funcionamento */}
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="time"
                                                            value={hours.open_time ? hours.open_time.slice(0, 5) : ''}
                                                            onChange={(e) => handleTimeChange(hours.day_of_week, 'open_time', e.target.value)}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 outline-none text-sm text-center"
                                                        />
                                                        <span className="text-gray-400">até</span>
                                                        <input
                                                            type="time"
                                                            value={hours.close_time ? hours.close_time.slice(0, 5) : ''}
                                                            onChange={(e) => handleTimeChange(hours.day_of_week, 'close_time', e.target.value)}
                                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 outline-none text-sm text-center"
                                                        />
                                                    </div>

                                                    {/* Pausa/Intervalo */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-xs font-semibold text-gray-500 uppercase w-12 text-right">Pausa?</div>
                                                        <input
                                                            type="time"
                                                            value={hours.pause_start ? hours.pause_start.slice(0, 5) : ''}
                                                            onChange={(e) => handleTimeChange(hours.day_of_week, 'pause_start', e.target.value)}
                                                            className="flex-1 px-2 py-2 border border-dashed border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 outline-none text-sm text-center bg-gray-50"
                                                            placeholder="--:--"
                                                        />
                                                        <span className="text-gray-300">-</span>
                                                        <input
                                                            type="time"
                                                            value={hours.pause_end ? hours.pause_end.slice(0, 5) : ''}
                                                            onChange={(e) => handleTimeChange(hours.day_of_week, 'pause_end', e.target.value)}
                                                            className="flex-1 px-2 py-2 border border-dashed border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 outline-none text-sm text-center bg-gray-50"
                                                            placeholder="--:--"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {isClosed && (
                                                <div className="flex-1 text-sm text-gray-400 italic">
                                                    Fechado
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center justify-end pt-4">
                        <div className="flex items-center gap-4">
                            {saved && (
                                <div className="flex items-center gap-2 text-green-600 font-medium animate-fadeIn">
                                    <CheckCircle2 size={18} />
                                    Horários atualizados!
                                </div>
                            )}
                            <button
                                onClick={handleSaveRegular}
                                disabled={saving}
                                className="flex items-center gap-2 bg-gray-900 text-white px-8 py-3 rounded-xl hover:bg-black transition-all font-medium disabled:opacity-70 shadow-lg shadow-gray-200"
                            >
                                <Save size={18} />
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Horários Especiais */}
            {activeTab === 'special' && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Form (1/3) */}
                        <div className="md:col-span-1">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-6">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <Plus size={16} className="text-orange-500" />
                                    Novo Evento
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">DATA</label>
                                        <input
                                            type="date"
                                            value={newSpecial.date}
                                            onChange={(e) => setNewSpecial({ ...newSpecial, date: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">NOME DO EVENTO</label>
                                        <input
                                            type="text"
                                            value={newSpecial.name}
                                            onChange={(e) => setNewSpecial({ ...newSpecial, name: e.target.value })}
                                            placeholder="Ex: Natal"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                                        <input
                                            type="checkbox"
                                            id="special-open"
                                            checked={newSpecial.is_open}
                                            onChange={(e) => setNewSpecial({ ...newSpecial, is_open: e.target.checked })}
                                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                        />
                                        <label htmlFor="special-open" className="text-sm font-medium text-gray-700 cursor-pointer">
                                            Abrir neste dia?
                                        </label>
                                    </div>

                                    {newSpecial.is_open && (
                                        <div className="animate-fadeIn">
                                            <label className="block text-xs font-semibold text-gray-500 mb-1">HORÁRIO</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="time"
                                                    value={newSpecial.open_time}
                                                    onChange={(e) => setNewSpecial({ ...newSpecial, open_time: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center"
                                                />
                                                <input
                                                    type="time"
                                                    value={newSpecial.close_time}
                                                    onChange={(e) => setNewSpecial({ ...newSpecial, close_time: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleAddSpecial}
                                        className="w-full bg-orange-500 text-white px-4 py-2.5 rounded-lg hover:bg-orange-600 transition font-medium text-sm shadow-sm"
                                    >
                                        Adicionar Evento
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* List (2/3) */}
                        <div className="md:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {specialHours.length === 0 ? (
                                    <div className="text-center py-12 px-4">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Calendar className="text-gray-300" size={32} />
                                        </div>
                                        <p className="text-gray-500 font-medium">Nenhum evento especial configurado</p>
                                        <p className="text-gray-400 text-sm mt-1">Adicione feriados ou datas importantes.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {specialHours.map(special => (
                                            <div key={special.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${special.is_open ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                        {special.is_open ? <Clock size={20} /> : <Lock size={20} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900">{special.name}</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {new Date(special.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                                                                weekday: 'long',
                                                                day: 'numeric',
                                                                month: 'long'
                                                            })}
                                                        </p>
                                                        {special.is_open && (
                                                            <p className="text-xs text-green-600 font-medium mt-0.5">
                                                                {formatTime(special.open_time || '')} às {formatTime(special.close_time || '')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteSpecial(special.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Remover"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Notificações */}
            {activeTab === 'notifications' && notifications && (
                <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Bell size={20} className="text-orange-500" />
                                Preferências de Alerta
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Controle como você deseja ser notificado sobre seus horários.</p>
                        </div>

                        <div className="divide-y divide-gray-100">
                            <div className="p-4 sm:p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                                <div className="mt-1">
                                    <input
                                        type="checkbox"
                                        id="notify-open"
                                        checked={notifications.notify_on_open}
                                        onChange={(e) => setNotifications({ ...notifications, notify_on_open: e.target.checked })}
                                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="notify-open" className="block font-medium text-gray-900 cursor-pointer">
                                        Alerta de Abertura
                                    </label>
                                    <p className="text-sm text-gray-500 mt-1">Receba uma notificação no sistema quando chegar a hora de abrir a loja.</p>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                                <div className="mt-1">
                                    <input
                                        type="checkbox"
                                        id="notify-close"
                                        checked={notifications.notify_on_close_soon}
                                        onChange={(e) => setNotifications({ ...notifications, notify_on_close_soon: e.target.checked })}
                                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="notify-close" className="block font-medium text-gray-900 cursor-pointer">
                                        Alerta de Fechamento (Prévia)
                                    </label>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Ser avisado {notifications.advance_notice_minutes} minutos antes do horário de fechar.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 flex items-start gap-4 hover:bg-gray-50 transition-colors opacity-50">
                                <div className="mt-1">
                                    <input
                                        type="checkbox"
                                        id="notify-customers"
                                        checked={notifications.notify_customers_on_open}
                                        onChange={(e) => setNotifications({ ...notifications, notify_customers_on_open: e.target.checked })}
                                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <label htmlFor="notify-customers" className="block font-medium text-gray-900 cursor-not-allowed">
                                            Notificar Clientes
                                        </label>
                                        <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-wide">Em Breve</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Envio automático de WhatsApp/Email para clientes VIP quando abrir.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={handleSaveNotifications}
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-lg hover:bg-black transition font-medium shadow-lg shadow-gray-200 flex items-center gap-2"
                        >
                            <Save size={18} />
                            Salvar Preferências
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessHoursAdvanced;
