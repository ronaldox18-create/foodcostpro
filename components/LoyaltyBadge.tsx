import React from 'react';
import { Award, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { Customer, LoyaltyLevel, LoyaltySettings } from '../types';
import { formatLevelInfo, pointsToNextLevel } from '../utils/loyaltySystem';

interface LoyaltyBadgeProps {
    customer: Customer;
    levels: LoyaltyLevel[];
    settings: LoyaltySettings;
    size?: 'small' | 'medium' | 'large';
    showProgress?: boolean;
    showExpiration?: boolean;
}

const LoyaltyBadge: React.FC<LoyaltyBadgeProps> = ({
    customer,
    levels,
    settings,
    size = 'medium',
    showProgress = true,
    showExpiration = true
}) => {
    if (!settings.isEnabled) return null;

    const levelInfo = formatLevelInfo(customer, levels, settings);
    const { nextLevel, pointsNeeded } = pointsToNextLevel(customer, levels);
    const currentPoints = customer.points || 0;

    // Tamanhos
    const sizes = {
        small: {
            badge: 'w-8 h-8 text-lg',
            container: 'text-xs',
            icon: 16
        },
        medium: {
            badge: 'w-12 h-12 text-2xl',
            container: 'text-sm',
            icon: 20
        },
        large: {
            badge: 'w-16 h-16 text-3xl',
            container: 'text-base',
            icon: 24
        }
    };

    const currentSize = sizes[size];

    // Calcular progresso para o próximo nível
    const progressPercent = nextLevel
        ? ((currentPoints - (levels.find(l => l.id === customer.currentLevel)?.pointsRequired || 0)) /
            (nextLevel.pointsRequired - (levels.find(l => l.id === customer.currentLevel)?.pointsRequired || 0))) * 100
        : 100;

    return (
        <div className="space-y-2">
            {/* Badge Principal */}
            <div className="flex items-center gap-3">
                <div
                    className={`${currentSize.badge} rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110`}
                    style={{
                        backgroundColor: levelInfo.currentLevelColor,
                        boxShadow: `0 4px 14px ${levelInfo.currentLevelColor}40`
                    }}
                >
                    <span>{levelInfo.currentLevelIcon}</span>
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`font-bold text-gray-900 ${currentSize.container}`}>
                            {levelInfo.currentLevelName}
                        </span>
                        {levelInfo.discountPercent > 0 && (
                            <span
                                className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                                style={{ backgroundColor: levelInfo.currentLevelColor }}
                            >
                                {levelInfo.discountPercent}% OFF
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-gray-600">
                        <Award size={currentSize.icon - 4} />
                        <span className={`${currentSize.container}`}>
                            {currentPoints.toLocaleString('pt-BR')} pontos
                        </span>
                    </div>
                </div>
            </div>

            {/* Alerta de Expiração */}
            {showExpiration && levelInfo.daysUntilExpiration !== null && levelInfo.daysUntilExpiration <= 30 && (
                <div
                    className={`flex items-start gap-2 p-2 rounded-lg ${levelInfo.daysUntilExpiration <= 7
                            ? 'bg-red-50 border border-red-200'
                            : 'bg-yellow-50 border border-yellow-200'
                        }`}
                >
                    <AlertCircle
                        size={16}
                        className={levelInfo.daysUntilExpiration <= 7 ? 'text-red-600' : 'text-yellow-600'}
                    />
                    <div className="flex-1">
                        <p
                            className={`text-xs font-semibold ${levelInfo.daysUntilExpiration <= 7 ? 'text-red-900' : 'text-yellow-900'
                                }`}
                        >
                            {levelInfo.daysUntilExpiration <= 7 ? '⚠️ Nível expirando!' : '⏰ Atenção'}
                        </p>
                        <p
                            className={`text-xs ${levelInfo.daysUntilExpiration <= 7 ? 'text-red-700' : 'text-yellow-700'
                                }`}
                        >
                            Faltam {levelInfo.daysUntilExpiration} dias para perder este nível
                        </p>
                    </div>
                </div>
            )}

            {/* Barra de Progresso */}
            {showProgress && nextLevel && (
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                            <TrendingUp size={12} />
                            Próximo: {nextLevel.name}
                        </span>
                        <span className="font-semibold">
                            {pointsNeeded.toLocaleString('pt-BR')} pts
                        </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${Math.min(progressPercent, 100)}%`,
                                background: `linear-gradient(90deg, ${levelInfo.currentLevelColor}, ${nextLevel.color})`
                            }}
                        />
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        {Math.round(progressPercent)}% completo
                    </p>
                </div>
            )}

            {/* Máximo Nível Alcançado */}
            {showProgress && !nextLevel && (
                <div className="bg-gradient-to-r from-purple-50 to-orange-50 border border-purple-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-bold text-purple-900 flex items-center justify-center gap-2">
                        <Award size={16} className="text-purple-600" />
                        Nível Máximo Alcançado! 🎉
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                        Você é um cliente VIP premium!
                    </p>
                </div>
            )}
        </div>
    );
};

export default LoyaltyBadge;
