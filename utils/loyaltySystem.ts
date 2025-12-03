import { Customer, LoyaltyLevel, LoyaltySettings, Order } from '../types';

/**
 * Calcula quantos pontos um cliente ganha em uma compra
 */
export const calculatePointsEarned = (
    orderAmount: number,
    settings: LoyaltySettings
): number => {
    if (!settings.isEnabled) return 0;
    return Math.floor(orderAmount * settings.pointsPerReal);
};

/**
 * Determina o nível atual do cliente baseado em seus pontos
 */
export const determineCustomerLevel = (
    points: number,
    levels: LoyaltyLevel[]
): LoyaltyLevel | null => {
    if (levels.length === 0) return null;

    // Ordena níveis por pontos necessários (decrescente)
    const sortedLevels = [...levels].sort((a, b) => b.pointsRequired - a.pointsRequired);

    // Encontra o maior nível que o cliente alcançou
    for (const level of sortedLevels) {
        if (points >= level.pointsRequired) {
            return level;
        }
    }

    // Se não alcançou nenhum nível, retorna o primeiro (menor)
    return levels.sort((a, b) => a.pointsRequired - b.pointsRequired)[0];
};

/**
 * Verifica se o nível do cliente expirou
 */
export const isLevelExpired = (
    customer: Customer,
    settings: LoyaltySettings
): boolean => {
    if (!settings.levelExpirationEnabled) return false;
    if (!customer.lastOrderDate) return false;

    const lastOrderDate = new Date(customer.lastOrderDate);
    const today = new Date();
    const daysSinceLastOrder = Math.floor(
        (today.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceLastOrder > settings.levelExpirationDays;
};

/**
 * Calcula o desconto que o cliente tem direito baseado no nível
 */
export const calculateLevelDiscount = (
    orderAmount: number,
    customer: Customer,
    levels: LoyaltyLevel[],
    settings: LoyaltySettings
): number => {
    if (!settings.isEnabled) return 0;
    if (!customer.currentLevel) return 0;

    // Verifica se o nível expirou
    if (isLevelExpired(customer, settings)) return 0;

    const currentLevel = levels.find(l => l.id === customer.currentLevel);
    if (!currentLevel) return 0;

    return (orderAmount * currentLevel.discountPercent) / 100;
};

/**
 * Calcula quanto desconto o cliente pode resgatar com pontos
 */
export const calculatePointsRedemption = (
    pointsToRedeem: number,
    settings: LoyaltySettings
): number => {
    if (!settings.enablePointsRedemption) return 0;
    if (pointsToRedeem < settings.minPointsToRedeem) return 0;

    return pointsToRedeem / settings.pointsToRealRate;
};

/**
 * Verifica se o cliente pode resgatar pontos
 */
export const canRedeemPoints = (
    customer: Customer,
    pointsToRedeem: number,
    settings: LoyaltySettings
): { canRedeem: boolean; reason?: string } => {
    if (!settings.enablePointsRedemption) {
        return { canRedeem: false, reason: 'Resgate de pontos desabilitado' };
    }

    const customerPoints = customer.points || 0;

    if (customerPoints < settings.minPointsToRedeem) {
        return {
            canRedeem: false,
            reason: `Mínimo de ${settings.minPointsToRedeem} pontos necessários`
        };
    }

    if (pointsToRedeem > customerPoints) {
        return {
            canRedeem: false,
            reason: 'Pontos insuficientes'
        };
    }

    if (pointsToRedeem < settings.minPointsToRedeem) {
        return {
            canRedeem: false,
            reason: `Resgate mínimo de ${settings.minPointsToRedeem} pontos`
        };
    }

    return { canRedeem: true };
};

/**
 * Atualiza os pontos e nível do cliente após uma compra
 */
export const updateCustomerAfterPurchase = (
    customer: Customer,
    orderAmount: number,
    levels: LoyaltyLevel[],
    settings: LoyaltySettings
): {
    updatedCustomer: Customer;
    pointsEarned: number;
    levelChanged: boolean;
    newLevel?: LoyaltyLevel;
    oldLevel?: LoyaltyLevel;
} => {
    const pointsEarned = calculatePointsEarned(orderAmount, settings);
    const currentPoints = (customer.points || 0) + pointsEarned;

    const oldLevel = levels.find(l => l.id === customer.currentLevel);
    const newLevel = determineCustomerLevel(currentPoints, levels);

    const levelChanged = oldLevel?.id !== newLevel?.id;

    const updatedCustomer: Customer = {
        ...customer,
        points: currentPoints,
        currentLevel: newLevel?.id,
        lastLevelUpdate: levelChanged ? new Date().toISOString() : customer.lastLevelUpdate,
        levelExpiresAt: settings.levelExpirationEnabled
            ? new Date(Date.now() + settings.levelExpirationDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined
    };

    return {
        updatedCustomer,
        pointsEarned,
        levelChanged,
        newLevel: levelChanged ? newLevel : undefined,
        oldLevel: levelChanged ? oldLevel : undefined
    };
};

/**
 * Calcula pontos necessários para o próximo nível
 */
export const pointsToNextLevel = (
    customer: Customer,
    levels: LoyaltyLevel[]
): { nextLevel: LoyaltyLevel | null; pointsNeeded: number } => {
    const currentPoints = customer.points || 0;
    const currentLevel = levels.find(l => l.id === customer.currentLevel);

    // Ordena níveis por pontos necessários (crescente)
    const sortedLevels = [...levels].sort((a, b) => a.pointsRequired - b.pointsRequired);

    // Encontra o próximo nível
    const nextLevel = sortedLevels.find(l => l.pointsRequired > currentPoints);

    if (!nextLevel) {
        return { nextLevel: null, pointsNeeded: 0 }; // Já está no nível máximo
    }

    return {
        nextLevel,
        pointsNeeded: nextLevel.pointsRequired - currentPoints
    };
};

/**
 * Formata informações do nível para exibição
 */
export const formatLevelInfo = (
    customer: Customer,
    levels: LoyaltyLevel[],
    settings: LoyaltySettings
): {
    currentLevelName: string;
    currentLevelIcon: string;
    currentLevelColor: string;
    discountPercent: number;
    isExpired: boolean;
    daysUntilExpiration: number | null;
} => {
    const currentLevel = levels.find(l => l.id === customer.currentLevel);
    const isExpired = isLevelExpired(customer, settings);

    let daysUntilExpiration: number | null = null;
    if (settings.levelExpirationEnabled && customer.lastOrderDate) {
        const lastOrder = new Date(customer.lastOrderDate);
        const expirationDate = new Date(lastOrder.getTime() + settings.levelExpirationDays * 24 * 60 * 60 * 1000);
        const today = new Date();
        daysUntilExpiration = Math.floor((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
        currentLevelName: currentLevel?.name || 'Sem Nível',
        currentLevelIcon: currentLevel?.icon || '⭐',
        currentLevelColor: currentLevel?.color || '#999999',
        discountPercent: currentLevel?.discountPercent || 0,
        isExpired,
        daysUntilExpiration
    };
};

/**
 * Gera estatísticas do programa de fidelidade
 */
export const getLoyaltyStats = (
    customers: Customer[],
    levels: LoyaltyLevel[]
): {
    totalCustomersWithPoints: number;
    averagePoints: number;
    customersByLevel: { level: LoyaltyLevel; count: number }[];
    topCustomers: { customer: Customer; level: LoyaltyLevel | undefined }[];
} => {
    const customersWithPoints = customers.filter(c => (c.points || 0) > 0);
    const totalPoints = customersWithPoints.reduce((sum, c) => sum + (c.points || 0), 0);
    const averagePoints = customersWithPoints.length > 0 ? totalPoints / customersWithPoints.length : 0;

    const customersByLevel = levels.map(level => ({
        level,
        count: customers.filter(c => c.currentLevel === level.id).length
    }));

    const topCustomers = [...customers]
        .sort((a, b) => (b.points || 0) - (a.points || 0))
        .slice(0, 10)
        .map(customer => ({
            customer,
            level: levels.find(l => l.id === customer.currentLevel)
        }));

    return {
        totalCustomersWithPoints: customersWithPoints.length,
        averagePoints,
        customersByLevel,
        topCustomers
    };
};

/**
 * Valida configurações do programa de fidelidade
 */
export const validateLoyaltySettings = (
    settings: Partial<LoyaltySettings>,
    levels: LoyaltyLevel[]
): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (settings.pointsPerReal !== undefined && settings.pointsPerReal <= 0) {
        errors.push('Pontos por real deve ser maior que zero');
    }

    if (settings.levelExpirationEnabled && settings.levelExpirationDays !== undefined && settings.levelExpirationDays <= 0) {
        errors.push('Dias para expiração deve ser maior que zero');
    }

    if (settings.enablePointsRedemption) {
        if (settings.pointsToRealRate !== undefined && settings.pointsToRealRate <= 0) {
            errors.push('Taxa de conversão de pontos deve ser maior que zero');
        }
        if (settings.minPointsToRedeem !== undefined && settings.minPointsToRedeem <= 0) {
            errors.push('Mínimo de pontos para resgate deve ser maior que zero');
        }
    }

    if (levels.length === 0) {
        errors.push('Pelo menos um nível deve ser configurado');
    }

    // Verifica se há níveis duplicados em pontos
    const pointsSet = new Set(levels.map(l => l.pointsRequired));
    if (pointsSet.size !== levels.length) {
        errors.push('Não pode haver níveis com a mesma quantidade de pontos');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};
