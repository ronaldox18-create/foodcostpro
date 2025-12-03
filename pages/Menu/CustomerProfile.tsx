import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { User, MapPin, Phone, Mail, Calendar, Edit2, Save, X, History, LogOut, Award, TrendingUp, Info } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';
import CustomerLoyaltyBadge from '../../components/CustomerLoyaltyBadge';

interface LoyaltyLevel {
    id: string;
    name: string;
    points_required: number;
    discount_percent: number;
    color: string;
    icon: string;
    benefits: string;
    order: number;
}

interface LoyaltySettings {
    is_enabled: boolean;
    points_per_real: number;
    level_expiration_enabled: boolean;
    level_expiration_days: number;
}

const CustomerProfile: React.FC = () => {
    const navigate = useNavigate();
    const { storeId } = useParams();
    const [customer, setCustomer] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Loyalty System
    const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
    const [loyaltyLevels, setLoyaltyLevels] = useState<LoyaltyLevel[]>([]);
    const [currentLevel, setCurrentLevel] = useState<LoyaltyLevel | null>(null);
    const [nextLevel, setNextLevel] = useState<LoyaltyLevel | null>(null);

    // Form data
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        birth_date: ''
    });

    useEffect(() => {
        const authData = localStorage.getItem('customer_auth');
        if (!authData) {
            navigate(`/menu/${storeId}/auth`);
            return;
        }

        const fetchData = async () => {
            try {
                const localCustomer = JSON.parse(authData);

                // Fetch customer data
                const { data: customerData } = await supabase
                    .from('customers')
                    .select('*')
                    .eq('id', localCustomer.id)
                    .single();

                if (customerData) {
                    setCustomer(customerData);
                    setFormData({
                        name: customerData.name || '',
                        phone: customerData.phone || '',
                        email: customerData.email || '',
                        address: customerData.address || '',
                        birth_date: customerData.birth_date || ''
                    });

                    // Update local storage
                    localStorage.setItem('customer_auth', JSON.stringify({
                        id: customerData.id,
                        name: customerData.name,
                        email: customerData.email,
                        points: customerData.points,
                        currentLevel: customerData.current_level
                    }));
                }

                // Fetch loyalty settings
                const { data: settingsData } = await supabase
                    .from('loyalty_settings')
                    .select('*')
                    .eq('user_id', storeId)
                    .single();

                if (settingsData) {
                    setLoyaltySettings(settingsData);
                }

                // Fetch loyalty levels
                const { data: levelsData } = await supabase
                    .from('loyalty_levels')
                    .select('*')
                    .eq('user_id', storeId)
                    .order('order', { ascending: true });

                if (levelsData && levelsData.length > 0) {
                    setLoyaltyLevels(levelsData);

                    // Determine current level
                    const points = customerData?.points || 0;
                    const sortedLevels = [...levelsData].sort((a, b) => b.points_required - a.points_required);
                    const current = sortedLevels.find(l => points >= l.points_required) || levelsData[0];
                    setCurrentLevel(current);

                    // Determine next level
                    const next = levelsData
                        .sort((a, b) => a.points_required - b.points_required)
                        .find(l => l.points_required > points);
                    setNextLevel(next || null);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [storeId, navigate]);

    const handleSave = async () => {
        if (!customer) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('customers')
                .update({
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    birth_date: formData.birth_date || null
                })
                .eq('id', customer.id);

            if (error) throw error;

            // Update local state
            setCustomer({ ...customer, ...formData });
            setIsEditing(false);

            // Update local storage
            localStorage.setItem('customer_auth', JSON.stringify({
                id: customer.id,
                name: formData.name,
                email: formData.email,
                points: customer.points,
                currentLevel: customer.current_level
            }));
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar dados. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('customer_auth');
        navigate(`/menu/${storeId}/auth`);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm font-medium">Carregando...</p>
                </div>
            </div>
        );
    }

    if (!customer) return null;

    const points = customer.points || 0;
    const showLoyalty = loyaltySettings?.is_enabled && loyaltyLevels.length > 0;

    return (
        <div className="bg-gray-50 min-h-screen animate-fade-in">
            {/* Header com gradiente - padding-top maior para não sobrepor com MenuLayout header */}
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white px-4 pt-6 pb-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-white/80 text-xs font-medium mb-1">Meu Perfil</p>
                            <h1 className="text-2xl font-black">Olá, {customer.name?.split(' ')[0]}! 👋</h1>
                        </div>
                        {!isEditing && (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl hover:bg-white/30 transition"
                            >
                                <Edit2 size={18} />
                            </button>
                        )}
                    </div>

                    {/* Badge Compacto removido para evitar duplicidade */}
                </div>
            </div>

            {/* Content com padding adequado */}
            <div className="px-4 pb-24 space-y-4 -mt-4">
                {/* Loyalty Card Full */}
                {showLoyalty && currentLevel && (
                    <div className="relative z-10">
                        <CustomerLoyaltyBadge
                            points={points}
                            currentLevel={{
                                id: currentLevel.id,
                                name: currentLevel.name,
                                icon: currentLevel.icon,
                                color: currentLevel.color,
                                discountPercent: currentLevel.discount_percent,
                                pointsRequired: currentLevel.points_required
                            }}
                            nextLevel={nextLevel ? {
                                name: nextLevel.name,
                                icon: nextLevel.icon,
                                pointsRequired: nextLevel.points_required
                            } : null}
                        />

                        {/* How Points Work */}
                        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                            <div className="flex items-start gap-2">
                                <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-blue-900 mb-1">Como funciona?</p>
                                    <p className="text-xs text-blue-700">
                                        A cada <strong>R$ 1,00</strong> gasto, você ganha{' '}
                                        <strong>{loyaltySettings?.points_per_real || 1} ponto(s)</strong>.
                                        Acumule pontos e suba de nível para ganhar descontos maiores!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* All Levels */}
                        <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                                <TrendingUp size={16} className="text-purple-600" />
                                Todos os Níveis
                            </h3>
                            <div className="space-y-2">
                                {loyaltyLevels.map((level, index) => {
                                    const isUnlocked = points >= level.points_required;
                                    const isCurrent = currentLevel?.id === level.id;

                                    return (
                                        <div
                                            key={level.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition ${isCurrent
                                                ? 'border-purple-500 bg-purple-50'
                                                : isUnlocked
                                                    ? 'border-green-200 bg-green-50'
                                                    : 'border-gray-200 bg-gray-50 opacity-60'
                                                }`}
                                        >
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0"
                                                style={{
                                                    backgroundColor: isUnlocked ? level.color + '20' : '#f3f4f6'
                                                }}
                                            >
                                                {level.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="font-bold text-sm text-gray-900">{level.name}</p>
                                                    {isCurrent && (
                                                        <span className="bg-purple-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                            ATUAL
                                                        </span>
                                                    )}
                                                    {isUnlocked && !isCurrent && (
                                                        <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                            ✓
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-600">
                                                    {level.points_required} pts • {level.discount_percent}% desconto
                                                </p>
                                            </div>
                                            {!isUnlocked && (
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-gray-500">
                                                        {level.points_required - points} pts
                                                    </p>
                                                    <p className="text-[10px] text-gray-400">faltam</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Personal Info */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <User size={18} className="text-orange-600" />
                            Dados Pessoais
                        </h3>
                        {isEditing && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            name: customer.name || '',
                                            phone: customer.phone || '',
                                            email: customer.email || '',
                                            address: customer.address || '',
                                            birth_date: customer.birth_date || ''
                                        });
                                    }}
                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <X size={18} />
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                >
                                    {saving ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <Save size={18} />
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Nome Completo</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    placeholder="Seu nome completo"
                                />
                            ) : (
                                <p className="text-sm font-medium text-gray-900">{customer.name || '—'}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                <Phone size={12} />
                                Telefone
                            </label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    placeholder="(00) 00000-0000"
                                />
                            ) : (
                                <p className="text-sm font-medium text-gray-900">{customer.phone || '—'}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                <Mail size={12} />
                                E-mail
                            </label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                    placeholder="seu@email.com"
                                />
                            ) : (
                                <p className="text-sm font-medium text-gray-900">{customer.email || '—'}</p>
                            )}
                        </div>

                        {/* Address */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                <MapPin size={12} />
                                Endereço
                            </label>
                            {isEditing ? (
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm resize-none"
                                    rows={2}
                                    placeholder="Rua, número, bairro, cidade"
                                />
                            ) : (
                                <p className="text-sm font-medium text-gray-900">{customer.address || '—'}</p>
                            )}
                        </div>

                        {/* Birth Date */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                                <Calendar size={12} />
                                Data de Nascimento
                            </label>
                            {isEditing ? (
                                <input
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                />
                            ) : (
                                <p className="text-sm font-medium text-gray-900">
                                    {customer.birth_date
                                        ? new Date(customer.birth_date + 'T00:00:00').toLocaleDateString('pt-BR')
                                        : '—'}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                    <button
                        onClick={() => navigate(`/menu/${storeId}/orders`)}
                        className="w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:bg-gray-50 transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                <History size={20} />
                            </div>
                            <span className="font-bold text-gray-900">Meus Pedidos</span>
                        </div>
                        <div className="text-gray-400 group-hover:translate-x-1 transition-transform">→</div>
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full bg-white p-4 rounded-xl border border-red-100 shadow-sm flex items-center justify-between group hover:bg-red-50 transition"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                                <LogOut size={20} />
                            </div>
                            <span className="font-bold text-red-600">Sair da Conta</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerProfile;
