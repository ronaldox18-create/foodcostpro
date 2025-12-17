import React from 'react';
import { Award, TrendingUp, Sparkles, Crown } from 'lucide-react';

interface CustomerLoyaltyBadgeProps {
    points: number;
    currentLevel: {
        id: string;
        name: string;
        icon: string;
        color: string;
        discountPercent: number;
        pointsRequired: number;
    } | null;
    nextLevel: {
        name: string;
        icon: string;
        pointsRequired: number;
    } | null;
    compact?: boolean;
    variant?: 'light' | 'dark'; // light = fundo claro, dark = fundo escuro
}

const CustomerLoyaltyBadge: React.FC<CustomerLoyaltyBadgeProps> = ({
    points,
    currentLevel,
    nextLevel,
    compact = false,
    variant = 'dark'
}) => {
    if (!currentLevel) return null;

    const progress = nextLevel
        ? ((points - currentLevel.pointsRequired) / (nextLevel.pointsRequired - currentLevel.pointsRequired)) * 100
        : 100;

    const pointsToNext = nextLevel ? nextLevel.pointsRequired - points : 0;

    if (compact) {
        if (variant === 'light') {
            // Fundo claro - usar cores escuras
            return (
                <div
                    className="flex items-center gap-2 rounded-xl px-3 py-2 border-2 shadow-sm"
                    style={{
                        backgroundColor: `${currentLevel.color}15`,
                        borderColor: `${currentLevel.color}40`
                    }}
                >
                    <span className="text-xl">{currentLevel.icon}</span>
                    <div>
                        <p className="text-xs font-bold leading-none" style={{ color: currentLevel.color }}>
                            {currentLevel.name}
                        </p>
                        <p className="text-[10px] text-gray-600">{points} pontos</p>
                    </div>
                </div>
            );
        } else {
            // Fundo escuro - usar cores claras
            return (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <span className="text-lg">{currentLevel.icon}</span>
                    <div className="text-white">
                        <p className="text-xs font-bold leading-none">{currentLevel.name}</p>
                        <p className="text-[10px] opacity-80">{points} pontos</p>
                    </div>
                </div>
            );
        }
    }

    return (
        <div
            className="rounded-2xl p-5 text-white shadow-xl relative overflow-hidden"
            style={{
                background: `linear-gradient(135deg, ${currentLevel.color}, ${currentLevel.color}dd)`
            }}
        >
            {/* Background Effects */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <div className="absolute left-0 bottom-0 w-24 h-24 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

            <div className="relative z-10 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-3xl">{currentLevel.icon}</span>
                            <div>
                                <p className="text-xs font-semibold opacity-80 uppercase tracking-wider">Nível Atual</p>
                                <p className="text-xl font-black">{currentLevel.name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5">
                        <p className="text-xs font-bold">{currentLevel.discountPercent}% OFF</p>
                    </div>
                </div>

                {/* Points */}
                <div>
                    <p className="text-white/80 text-xs font-medium mb-1">Seus Pontos</p>
                    <p className="text-3xl font-black">
                        {points.toLocaleString('pt-BR')}
                        <span className="text-sm font-semibold opacity-80 ml-1">pts</span>
                    </p>
                </div>

                {/* Progress to Next Level */}
                {nextLevel ? (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                                <TrendingUp size={14} className="opacity-80" />
                                <p className="text-xs font-semibold opacity-90">
                                    Próximo: {nextLevel.icon} {nextLevel.name}
                                </p>
                            </div>
                            <p className="text-xs font-bold">
                                {pointsToNext.toLocaleString('pt-BR')} pts
                            </p>
                        </div>
                        <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-500 rounded-full"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                        </div>
                        <p className="text-[10px] opacity-70 mt-1 text-center">
                            {Math.round(progress)}% completo
                        </p>
                    </div>
                ) : (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <Crown size={16} className="text-yellow-300" />
                            <p className="text-sm font-bold">Nível Máximo!</p>
                        </div>
                        <p className="text-xs opacity-80">Você é um cliente VIP premium! 🎉</p>
                    </div>
                )}

                {/* Benefits */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-yellow-300" />
                        <p className="text-xs font-bold">Seus Benefícios</p>
                    </div>
                    <ul className="space-y-1 text-xs opacity-90">
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-white rounded-full"></span>
                            {currentLevel.discountPercent}% de desconto em todos os pedidos
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-white rounded-full"></span>
                            Acumule pontos a cada compra
                        </li>
                        {currentLevel.discountPercent >= 15 && (
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-white rounded-full"></span>
                                Prioridade no atendimento
                            </li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default CustomerLoyaltyBadge;
