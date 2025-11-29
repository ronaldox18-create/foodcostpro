import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabaseClient';
import { User, Lock, Mail, Phone, MapPin, ArrowRight, Star } from 'lucide-react';

const CustomerAuth: React.FC = () => {
    const navigate = useNavigate();
    const { storeId } = useParams();

    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Busca usuário pelo email e senha (hash simples para MVP)
            // Nota: Em produção, usar supabase.auth ou hash seguro no backend
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .eq('user_id', storeId) // Scoped to store
                .eq('email', formData.email)
                .eq('password', formData.password) // Plain text for MVP as requested
                .single();

            if (error || !data) {
                setError('Email ou senha inválidos.');
            } else {
                localStorage.setItem('customer_auth', JSON.stringify({
                    id: data.id, name: data.name, email: data.email, points: data.points, level: data.level
                }));
                navigate(`/menu/${storeId}`);
            }
        } catch (err) {
            setError('Erro ao conectar.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Check if exists
            const { data: existing } = await supabase.from('customers').select('id').eq('user_id', storeId).eq('email', formData.email).single();
            if (existing) {
                setError('Este email já está cadastrado nesta loja.');
                setLoading(false);
                return;
            }

            const newCustomer = {
                user_id: storeId, // Link to store owner
                name: formData.name,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                address: formData.address,
                total_spent: 0,
                points: 0,
                level: 'bronze',
                last_order_date: new Date().toISOString()
            };

            const { data, error } = await supabase.from('customers').insert([newCustomer]).select().single();

            if (error) throw error;

            localStorage.setItem('customer_auth', JSON.stringify({
                id: data.id, name: data.name, email: data.email, points: data.points, level: data.level
            }));
            navigate(`/menu/${storeId}`);

        } catch (err) {
            console.error(err);
            setError('Erro ao criar conta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-gray-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/food.png')]"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <Star className="text-yellow-400" size={32} fill="currentColor" />
                        </div>
                        <h1 className="text-2xl font-black text-white mb-2">Clube de Vantagens</h1>
                        <p className="text-gray-400 text-sm">Entre para ganhar pontos e descontos exclusivos!</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${isLogin ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${!isLogin ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Criar Conta
                    </button>
                </div>

                {/* Form */}
                <div className="p-8">
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg font-medium text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
                        {!isLogin && (
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    required
                                    type="text"
                                    placeholder="Seu Nome"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                                />
                            </div>
                        )}

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                required
                                type="email"
                                placeholder="Seu Email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                            />
                        </div>

                        {!isLogin && (
                            <>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        required
                                        type="tel"
                                        placeholder="Seu WhatsApp"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                                    />
                                </div>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Endereço (Opcional)"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                                    />
                                </div>
                            </>
                        )}

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                required
                                type="password"
                                placeholder="Sua Senha"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 outline-none transition-all"
                            />
                        </div>

                        <button type="submit" className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-300 flex items-center justify-center gap-2 group mt-4">
                            {isLogin ? 'Entrar' : 'Cadastrar e Ganhar Pontos'}
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default CustomerAuth;
