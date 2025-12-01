import { BusinessHours, SpecialHours, StoreStatus, ServiceType } from '../types';

/**
 * Verifica se a loja está aberta no momento atual (VERSÃO AVANÇADA)
 * Considera: horários especiais, pausas, e tipo de serviço
 */
export function checkStoreStatus(
    businessHours: BusinessHours[],
    specialHours: SpecialHours[] = [],
    currentDate: Date = new Date(),
    serviceType: ServiceType = 'all'
): StoreStatus {
    const dayOfWeek = currentDate.getDay(); // 0 = Domingo, 6 = Sábado
    const currentTime = currentDate.toTimeString().slice(0, 8); // HH:MM:SS
    const currentDateStr = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD

    // 1. PRIORIDADE: Verificar horários especiais (feriados, eventos)
    const todaySpecial = specialHours.find(h => h.date === currentDateStr);

    if (todaySpecial) {
        // Está fechado por evento especial
        if (!todaySpecial.is_open || !todaySpecial.open_time || !todaySpecial.close_time) {
            const nextOpen = findNextOpenDay(businessHours, specialHours, dayOfWeek, currentDate);
            return {
                isOpen: false,
                message: `Fechado - ${todaySpecial.name}`,
                reason: 'special_closed',
                specialEvent: todaySpecial.name,
                nextOpenTime: nextOpen
            };
        }

        // Verificar se está dentro do horário especial
        if (currentTime >= todaySpecial.open_time && currentTime <= todaySpecial.close_time) {
            // Verificar pausa
            if (todaySpecial.pause_start && todaySpecial.pause_end) {
                if (currentTime >= todaySpecial.pause_start && currentTime < todaySpecial.pause_end) {
                    return {
                        isOpen: false,
                        message: `Em pausa até ${formatTime(todaySpecial.pause_end)}`,
                        reason: 'pause',
                        specialEvent: todaySpecial.name,
                        todayHours: {
                            open: formatTime(todaySpecial.open_time),
                            close: formatTime(todaySpecial.close_time),
                            pauseStart: formatTime(todaySpecial.pause_start),
                            pauseEnd: formatTime(todaySpecial.pause_end)
                        }
                    };
                }
            }

            return {
                isOpen: true,
                message: `${todaySpecial.name} - Aberto até ${formatTime(todaySpecial.close_time)}`,
                reason: 'special_open',
                specialEvent: todaySpecial.name,
                todayHours: {
                    open: formatTime(todaySpecial.open_time),
                    close: formatTime(todaySpecial.close_time),
                    pauseStart: todaySpecial.pause_start ? formatTime(todaySpecial.pause_start) : undefined,
                    pauseEnd: todaySpecial.pause_end ? formatTime(todaySpecial.pause_end) : undefined
                }
            };
        }
    }

    // 2. Verificar horários regulares
    const todayHours = businessHours.find(h =>
        h.day_of_week === dayOfWeek &&
        (h.service_type === serviceType || h.service_type === 'all' || serviceType === 'all')
    );

    // Se não há configuração para hoje, considera fechado
    if (!todayHours) {
        return {
            isOpen: false,
            message: 'Fechado hoje',
            reason: 'regular_closed'
        };
    }

    // Se está marcado como fechado
    if (!todayHours.is_open || !todayHours.open_time || !todayHours.close_time) {
        const nextOpen = findNextOpenDay(businessHours, specialHours, dayOfWeek, currentDate, serviceType);
        return {
            isOpen: false,
            message: 'Fechado hoje',
            reason: 'regular_closed',
            nextOpenTime: nextOpen,
            serviceType
        };
    }

    // Verificar se está dentro do horário
    const isWithinHours = currentTime >= todayHours.open_time && currentTime <= todayHours.close_time;

    if (isWithinHours) {
        // Verificar pausa
        if (todayHours.pause_start && todayHours.pause_end) {
            if (currentTime >= todayHours.pause_start && currentTime < todayHours.pause_end) {
                return {
                    isOpen: false,
                    message: `Em pausa até ${formatTime(todayHours.pause_end)}`,
                    reason: 'pause',
                    todayHours: {
                        open: formatTime(todayHours.open_time),
                        close: formatTime(todayHours.close_time),
                        pauseStart: formatTime(todayHours.pause_start),
                        pauseEnd: formatTime(todayHours.pause_end)
                    },
                    serviceType
                };
            }
        }

        return {
            isOpen: true,
            message: `Aberto até ${formatTime(todayHours.close_time)}`,
            reason: 'regular_open',
            todayHours: {
                open: formatTime(todayHours.open_time),
                close: formatTime(todayHours.close_time),
                pauseStart: todayHours.pause_start ? formatTime(todayHours.pause_start) : undefined,
                pauseEnd: todayHours.pause_end ? formatTime(todayHours.pause_end) : undefined
            },
            serviceType
        };
    }

    // Fechado mas abre hoje ainda
    if (currentTime < todayHours.open_time) {
        return {
            isOpen: false,
            message: `Abre hoje às ${formatTime(todayHours.open_time)}`,
            reason: 'outside_hours',
            todayHours: {
                open: formatTime(todayHours.open_time),
                close: formatTime(todayHours.close_time),
                pauseStart: todayHours.pause_start ? formatTime(todayHours.pause_start) : undefined,
                pauseEnd: todayHours.pause_end ? formatTime(todayHours.pause_end) : undefined
            },
            serviceType
        };
    }

    // Já passou do horário de hoje
    const nextOpen = findNextOpenDay(businessHours, specialHours, dayOfWeek, currentDate, serviceType);
    return {
        isOpen: false,
        message: nextOpen ? `Fechado - ${nextOpen}` : 'Fechado',
        reason: 'outside_hours',
        nextOpenTime: nextOpen,
        serviceType
    };
}

/**
 * Encontra o próximo dia que a loja abrirá
 */
function findNextOpenDay(
    businessHours: BusinessHours[],
    specialHours: SpecialHours[] = [],
    currentDay: number,
    currentDate: Date = new Date(),
    serviceType: ServiceType = 'all'
): string | undefined {
    const daysOfWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    // Procurar nos próximos 14 dias (incluindo especiais)
    for (let i = 1; i <= 14; i++) {
        const nextDate = new Date(currentDate);
        nextDate.setDate(nextDate.getDate() + i);
        const nextDay = nextDate.getDay();
        const nextDateStr = nextDate.toISOString().split('T')[0];

        // Verificar horário especial primeiro
        const special = specialHours.find(h => h.date === nextDateStr);
        if (special?.is_open && special.open_time) {
            const dayName = i === 1 ? 'Amanhã' : `${daysOfWeek[nextDay]} (${nextDate.getDate()}/${nextDate.getMonth() + 1})`;
            return `Abre ${dayName} às ${formatTime(special.open_time)} - ${special.name}`;
        }

        // Verificar horário regular
        const nextDayHours = businessHours.find(h =>
            h.day_of_week === nextDay &&
            (h.service_type === serviceType || h.service_type === 'all' || serviceType === 'all')
        );

        if (nextDayHours?.is_open && nextDayHours.open_time) {
            const dayName = i === 1 ? 'Amanhã' : daysOfWeek[nextDay];
            return `Abre ${dayName} às ${formatTime(nextDayHours.open_time)}`;
        }
    }

    return undefined;
}

/**
 * Formata hora de HH:MM:SS para HH:MM
 */
export function formatTime(time: string): string {
    return time.slice(0, 5); // HH:MM
}

/**
 * Obtém nome do dia da semana
 */
export function getDayName(dayOfWeek: number): string {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    return days[dayOfWeek];
}

/**
 * Obtém nome curto do dia
 */
export function getShortDayName(dayOfWeek: number): string {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[dayOfWeek];
}

/**
 * Verifica se está próximo do fechamento (últimos 30 minutos)
 */
export function isNearClosing(
    businessHours: BusinessHours[],
    specialHours: SpecialHours[] = [],
    currentDate: Date = new Date(),
    serviceType: ServiceType = 'all'
): boolean {
    const status = checkStoreStatus(businessHours, specialHours, currentDate, serviceType);

    if (!status.isOpen || !status.todayHours?.close) {
        return false;
    }

    const currentTime = currentDate.toTimeString().slice(0, 8);
    const closeTime = status.todayHours.close + ':00'; // Adiciona segundos

    // Calcular 30 minutos antes do fechamento
    const [hours, minutes] = closeTime.split(':').map(Number);
    let nearClosingMinutes = minutes - 30;
    let nearClosingHours = hours;

    if (nearClosingMinutes < 0) {
        nearClosingMinutes += 60;
        nearClosingHours -= 1;
    }

    const nearClosingTime = `${String(nearClosingHours).padStart(2, '0')}:${String(nearClosingMinutes).padStart(2, '0')}:00`;

    return currentTime >= nearClosingTime && currentTime <= closeTime;
}

/**
 * Filtra pedidos apenas durante horário de funcionamento
 */
export function filterOrdersByBusinessHours(
    orders: any[],
    businessHours: BusinessHours[],
    specialHours: SpecialHours[] = []
): any[] {
    return orders.filter(order => {
        const orderDate = new Date(order.date);
        const status = checkStoreStatus(businessHours, specialHours, orderDate);
        return status.isOpen;
    });
}

/**
 * Agrupa vendas por hora do dia (considerando apenas horários de funcionamento)
 */
export function getSalesByHour(
    orders: any[],
    businessHours: BusinessHours[],
    specialHours: SpecialHours[] = []
): { hour: string; total: number; count: number }[] {
    const filteredOrders = filterOrdersByBusinessHours(orders, businessHours, specialHours);

    const salesByHour: { [key: string]: { total: number; count: number } } = {};

    filteredOrders.forEach(order => {
        const orderDate = new Date(order.date);
        const hour = orderDate.getHours();
        const hourKey = `${String(hour).padStart(2, '0')}:00`;

        if (!salesByHour[hourKey]) {
            salesByHour[hourKey] = { total: 0, count: 0 };
        }

        salesByHour[hourKey].total += order.total_amount || 0;
        salesByHour[hourKey].count += 1;
    });

    return Object.entries(salesByHour)
        .map(([hour, data]) => ({
            hour,
            total: data.total,
            count: data.count
        }))
        .sort((a, b) => a.hour.localeCompare(b.hour));
}

/**
 * Obtém horário de pico de vendas
 */
export function getPeakHours(
    orders: any[],
    businessHours: BusinessHours[],
    specialHours: SpecialHours[] = []
): { hour: string; total: number; count: number }[] {
    const salesByHour = getSalesByHour(orders, businessHours, specialHours);

    return salesByHour
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);
}

/**
 * Obtém label do tipo de serviço
 */
export function getServiceTypeLabel(serviceType: ServiceType): string {
    const labels: Record<ServiceType, string> = {
        all: 'Delivery e Balcão',
        delivery: 'Apenas Delivery',
        pickup: 'Apenas Balcão'
    };
    return labels[serviceType] || serviceType;
}

/**
 * Verifica se uma data é feriado especial
 */
export function isSpecialDay(date: Date, specialHours: SpecialHours[]): SpecialHours | undefined {
    const dateStr = date.toISOString().split('T')[0];
    return specialHours.find(h => h.date === dateStr);
}

/**
 * Obtém próximos feriados/eventos especiais
 */
export function getUpcomingSpecialDays(
    specialHours: SpecialHours[],
    limit: number = 5
): SpecialHours[] {
    const now = new Date();
    const nowStr = now.toISOString().split('T')[0];

    return specialHours
        .filter(h => h.date >= nowStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, limit);
}
