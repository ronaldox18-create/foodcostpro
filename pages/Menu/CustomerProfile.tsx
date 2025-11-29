import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { Star, Award, Gift, ChevronRight, History, LogOut } from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

const CustomerProfile: React.FC = () => {
    const navigate = useNavigate();
    const { storeId } = useParams();
    const [customer, setCustomer] = useState<any>(null);

    useEffect(() => {
        const authData = localStorage.getItem('customer_auth');
        if (!authData) {
            navigate(`/menu/${storeId}/auth`);
            return;
        }

        const localCustomer = JSON.parse(authData);
        setCustomer(localCustomer);

        // Refresh data
        const fetchCustomer = async () => {
            const { data } = await supabase.from('customers').select('*').eq('id', localCustomer.id).single();
            if (data) {
                setCustomer(data);
                // Update local storage
                localStorage.setItem('customer_auth', JSON.stringify({
                    id: data.id, name: data.name, email: data.email, points: data.points, level: data.level
                }));
            }
        };
        fetchCustomer();
    }, [storeId, navigate]);

    if (!customer) return null;

    const points = customer.points || 0;
    const level = customer.level || 'bronze';

    const getLevelColor = () => {
        if (level === 'gold') return 'from-yellow-400 to-yellow-600';
        if (level === 'silver') return 'from-gray-300 to-gray-500';
        return 'from-orange-400 to-orange-600'; // Bronze
    };

    const getNextLevel = () => {
        if (level === 'bronze') return { name: 'Prata', target: 500 };
        if (level === 'silver') return { name: 'Ouro', target: 1000 };
        return null;
    };

    const nextLevel = getNextLevel();
    const progress = nextLevel ? (points / nextLevel.target) * 100 : 100;

    return (
        <div className="p-4 space-y-6 pb-24">

            {/* Loyalty Card */}
            <div className={`bg-gradient-to-br ${getLevelColor()} rounded-3xl p-6 text-white shadow-xl relative overflow-hidden h-56 flex flex-col justify-between`}>
                <div className="absolute right-0 top-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute left-0 bottom-0 w-32 h-32 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-white/80 text-sm font-medium mb-1">Seu Saldo</p>
                        <h2 className="text-4xl font-black">{points} <span className="text-lg font-bold opacity-80">pts</span></h2>
                    </div>
                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
                        <Award size={24} className="text-white" />
                    </div>
                </div>

                <div className="relative z-10">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-80">Nível Atual</p>
                            <p className="text-xl font-black capitalize">{level === 'gold' ? 'Ouro' : level === 'silver' ? 'Prata' : 'Bronze'}</p>
                        </div>
                        {nextLevel && (
                            <div className="text-right">
                                <p className="text-xs opacity-80">Próximo: {nextLevel.name}</p>
                                <p className="text-xs font-bold">{nextLevel.target - points} pts restantes</p>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Rewards */}
            <div>
                <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                    <Gift size={20} className="text-orange-500" />
                    Suas Recompensas
                </h3>

                <div className="space-y-3">
                    <div className={`p-4 rounded-2xl border ${level === 'gold' || level === 'silver' || level === 'bronze' ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50 opacity-50'} flex items-center gap-4`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${level === 'gold' || level === 'silver' || level === 'bronze' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                            <span className="font-black text-sm">3%</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900">Desconto Bronze</h4>
                            <p className="text-xs text-gray-500">Cashback em pontos em todas as compras.</p>
                        </div>
                        {(level === 'gold' || level === 'silver' || level === 'bronze') && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
                    </div>

                    <div className={`p-4 rounded-2xl border ${level === 'gold' || level === 'silver' ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50 opacity-50'} flex items-center gap-4`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${level === 'gold' || level === 'silver' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                            <span className="font-black text-sm">5%</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900">Desconto Prata</h4>
                            <p className="text-xs text-gray-500">Para quem atingiu 500 pontos.</p>
                        </div>
                        {(level === 'gold' || level === 'silver') && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
                    </div>

                    <div className={`p-4 rounded-2xl border ${level === 'gold' ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50 opacity-50'} flex items-center gap-4`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${level === 'gold' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                            <span className="font-black text-sm">10%</span>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-900">Desconto Ouro</h4>
                            <p className="text-xs text-gray-500">Para a elite! Acima de 1000 pontos.</p>
                        </div>
                        {level === 'gold' && <div className="w-3 h-3 bg-green-500 rounded-full"></div>}
                    </div>
                </div>
            </div>

            {/* History Link */}
            <button
                onClick={() => navigate(`/menu/${storeId}/orders`)}
                className="w-full bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:bg-gray-50 transition"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                        <History size={20} />
                    </div>
                    <span className="font-bold text-gray-900">Meus Pedidos</span>
                </div>
                <ChevronRight size={20} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </button>

        </div>
    );
};

export default CustomerProfile;
