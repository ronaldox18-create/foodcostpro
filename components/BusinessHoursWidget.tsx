import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { BusinessHours, SpecialHours } from '../types';
import { Clock, TrendingUp, Calendar, Coffee, AlertCircle } from 'lucide-react';
import { getPeakHours, getDayName, formatTime, checkStoreStatus } from '../utils/businessHours';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../utils/calculations';

const BusinessHoursWidget: React.FC = () => {
    const { user } = useAuth();
    const { orders } = useApp();
    const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
    const [specialHours, setSpecialHours] = useState<SpecialHours[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!user) return;

        try {
            const { data: hoursData, error: hoursError } = await supabase
                .from('business_hours')
                .select('*')
                .eq('user_id', user.id)
                .order('day_of_week');

            if (hoursError) throw hoursError;
            if (hoursData) setBusinessHours(hoursData);

            const { data: specialData, error: specialError } = await supabase
                .from('special_hours')
                .select('*')
                .eq('user_id', user.id)
                .gte('date', new Date().toISOString().split('T')[0])
                .order('date');

            if (!specialError && specialData) setSpecialHours(specialData);

        } catch (err) {
            console.error('Error fetching business hours:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || businessHours.length === 0) {
        return null;
    }

    const peakHours = getPeakHours(orders, businessHours, specialHours);
    const status = checkStoreStatus(businessHours, specialHours);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Clock size={20} className="text-orange-600" />
                        Horários de Funcionamento
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Estado atual e horários de pico</p>
                </div>
            </div>

            {/* Status de Hoje */}
            <div className={`mb-6 p-4 rounded-xl border ${status.isOpen
                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-100'
                : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100'
                }`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar size={14} />
                        {status.specialEvent ? (
                            <span className="text-orange-600 font-bold">{status.specialEvent}</span>
                        ) : (
                            getDayName(new Date().getDay())
                        )}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${status.isOpen
                        ? 'bg-green-500 text-white'
                        : status.reason === 'pause'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}>
                        {status.isOpen ? 'Aberto' : status.reason === 'pause' ? 'Em Pausa' : 'Fechado'}
                    </span>
                </div>

                <p className="text-sm text-gray-600 font-medium">
                    {status.message}
                </p>

                {status.todayHours?.pauseStart && (
                    <div className="mt-2 pt-2 border-t border-gray-200/50 flex items-center gap-2 text-xs text-gray-500">
                        <Coffee size={12} className="text-orange-500" />
                        Pausa: {status.todayHours.pauseStart} - {status.todayHours.pauseEnd}
                    </div>
                )}
            </div>

            {/* Horários de Pico */}
            {peakHours.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <TrendingUp size={16} className="text-orange-600" />
                        Horários de Pico de Vendas
                    </h4>
                    <div className="space-y-2">
                        {peakHours.map((peak, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-orange-500 text-white' :
                                        idx === 1 ? 'bg-orange-400 text-white' :
                                            'bg-orange-300 text-white'
                                        }`}>
                                        {idx + 1}º
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{peak.hour}</p>
                                        <p className="text-xs text-gray-500">{peak.count} pedidos</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-orange-600">{formatCurrency(peak.total)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Semana em Resumo */}
            <div className="mt-6 pt-4 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Horários da Semana</h4>
                <div className="space-y-1.5">
                    {businessHours.map((hours) => {
                        const isToday = hours.day_of_week === new Date().getDay();
                        return (
                            <div key={hours.day_of_week} className="flex items-center justify-between text-xs">
                                <span className={`font-medium w-24 ${isToday ? 'text-orange-600 font-bold' : 'text-gray-600'}`}>
                                    {getDayName(hours.day_of_week).slice(0, 3)}
                                </span>
                                <div className="text-right">
                                    {hours.is_open && hours.open_time && hours.close_time ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-gray-500 font-mono">
                                                {formatTime(hours.open_time)} - {formatTime(hours.close_time)}
                                            </span>
                                            {hours.pause_start && (
                                                <span className="text-[10px] text-orange-400 flex items-center gap-1">
                                                    <Coffee size={8} />
                                                    {formatTime(hours.pause_start)}-{formatTime(hours.pause_end || '')}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">Fechado</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BusinessHoursWidget;
