import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../utils/supabaseClient';
import {
  User, Mail, Store, CreditCard, Shield, Download, CheckCircle, AlertTriangle,
  Save, Loader2, Lock, Bell, Activity, BarChart3, Camera, Moon, Sun,
  Trash2, Settings as SettingsIcon, TrendingUp, Package, Users, ShoppingBag,
  Calendar, DollarSign, FileText, LogOut, Eye, EyeOff, Upload, Phone, MapPin,
  ArrowUpCircle, Brain, ChefHat, MessageCircle, Star
} from 'lucide-react';

import { PLANS, PlanFeatures } from '../constants/plans';
import { PlanType } from '../types';

type TabType = 'profile' | 'security' | 'plan' | 'preferences' | 'data';

const Account: React.FC = () => {
  const { user, signOut, userPlan, refreshUserPlan } = useAuth();
  const { settings, updateSettings, products, ingredients, customers, fixedCosts, orders } = useApp();
  const [searchParams] = useSearchParams();

  const isTrial = React.useMemo(() => {
    if (!user || userPlan !== 'pro') return false;
    // Se for PRO mas pagou (tem assinatura no settings), não é trial.
    // Mas como não temos settings aqui fácil, vamos assumir:
    // Se userPlan == 'pro' e created_at < 7 dias, é trial.
    const createdAt = new Date(user.created_at || new Date());
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  }, [user, userPlan]);

  const trialDaysLeft = React.useMemo(() => {
    if (!user) return 0;
    const createdAt = new Date(user.created_at || new Date());
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - diffDays);
  }, [user]);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tab = searchParams.get('tab');
    return (tab as TabType) || 'profile';
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Plan State
  const [isComparingPlans, setIsComparingPlans] = useState(false);

  // Profile states
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [stateRegistration, setStateRegistration] = useState('');
  const [municipalRegistration, setMunicipalRegistration] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // Password states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Preferences states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load initial data
  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata;
      setName(metadata?.name || '');
      setPhone(metadata?.phone || '');
      setAddress(metadata?.address || '');
      setCnpj(metadata?.cnpj || '');
      setStateRegistration(metadata?.state_registration || '');
      setMunicipalRegistration(metadata?.municipal_registration || '');
      setProfilePhoto(metadata?.profile_photo || null);
    }
    if (settings) {
      setBusinessName(settings.businessName || '');
    }
  }, [user, settings]);

  // Handle payment success return
  useEffect(() => {
    if (searchParams.get('payment') === 'success') {
      setMsg({ type: 'success', text: 'Pagamento confirmado! Seu plano foi atualizado.' });
      refreshUserPlan();
      // Limpar URL
      window.history.replaceState({}, '', window.location.pathname + '?tab=plan');
    }
  }, [searchParams]);

  // Handle plan update
  const handleUpdatePlan = async (newPlan: PlanType) => {
    if (!user) return;

    // Se for plano pago, iniciar checkout do Stripe
    if (newPlan !== 'free') {
      setLoading(true);
      setMsg(null);
      try {
        const { initiateCheckout } = await import('../utils/stripe');
        await initiateCheckout(newPlan as 'starter' | 'online' | 'pro');
        // O redirecionamento acontece dentro da função, não precisamos fazer mais nada aqui
      } catch (e: any) {
        console.error('Erro no checkout:', e);
        setMsg({ type: 'error', text: 'Erro ao iniciar pagamento: ' + (e.message || 'Tente novamente') });
        setLoading(false);
      }
      return;
    }

    // Lógica para plano GRATUITO (Downgrade direto)
    if (!confirm('Tem certeza que deseja mudar para o plano Gratuito? Você perderá acesso a recursos exclusivos.')) {
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      // 1. Tentar atualizar o registro existente
      const { data, error } = await supabase
        .from('user_settings')
        .update({ plan: newPlan, subscription_status: 'active' }) // Resetar status ao voltar pro free
        .eq('user_id', user.id)
        .select();

      if (error) throw error;

      // 2. Se nenhum registro foi retornado/atualizado, cria um novo
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            plan: newPlan,
            business_name: businessName || 'Meu Negócio'
          });

        if (insertError) {
          if (insertError.code === '23505' || insertError.message?.includes('Conflict')) {
            await supabase.from('user_settings').update({ plan: newPlan }).eq('user_id', user.id);
          } else {
            throw insertError;
          }
        }
      }

      await refreshUserPlan();
      setMsg({ type: 'success', text: `Plano alterado para ${PLANS[newPlan].name} com sucesso!` });
      setIsComparingPlans(false);
    } catch (e: any) {
      console.error('Erro ao atualizar plano:', e);
      setMsg({ type: 'error', text: 'Erro ao alterar plano: ' + (e.message || 'Desconhecido') });
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    totalProducts: products.length,
    totalIngredients: ingredients.length,
    totalCustomers: customers.length,
    totalOrders: orders?.length || 0,
    totalRevenue: orders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0,
    lowStockItems: ingredients.filter(ing =>
      ing.currentStock && ing.minStock && ing.currentStock <= ing.minStock
    ).length
  };

  const getInitials = (name: string, email: string | undefined) => {
    if (name && name.trim()) {
      const names = name.trim().split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0].substring(0, 2).toUpperCase();
    }
    return email ? email.substring(0, 2).toUpperCase() : 'US';
  };

  // Format CNPJ: XX.XXX.XXX/XXXX-XX
  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return value;
  };

  // Handle CNPJ input with formatting
  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setCnpj(formatted);
  };

  // Simple CNPJ validation (just checks if it has 14 digits)
  const isValidCNPJ = (cnpj: string) => {
    const numbers = cnpj.replace(/\D/g, '');
    return numbers.length === 0 || numbers.length === 14;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMsg({ type: 'error', text: 'A foto deve ter no máximo 2MB' });
      return;
    }

    try {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setProfilePhoto(base64);

        // Update user metadata
        await supabase.auth.updateUser({
          data: { profile_photo: base64 }
        });

        setMsg({ type: 'success', text: 'Foto atualizada com sucesso!' });
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      setMsg({ type: 'error', text: 'Erro ao fazer upload da foto' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    // Validate CNPJ before saving
    if (cnpj && !isValidCNPJ(cnpj)) {
      setMsg({ type: 'error', text: 'CNPJ inválido. Deve conter 14 dígitos.' });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      // Update user metadata
      await supabase.auth.updateUser({
        data: {
          name,
          phone,
          address,
          cnpj,
          state_registration: stateRegistration,
          municipal_registration: municipalRegistration
        }
      });

      // Update business settings
      await updateSettings({
        ...settings,
        businessName
      });

      setMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (error: any) {
      setMsg({ type: 'error', text: 'Erro ao atualizar: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }
    if (newPassword.length < 6) {
      setMsg({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setLoading(true);
    setMsg(null);
    try {
      await supabase.auth.updateUser({ password: newPassword });
      setMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (error: any) {
      setMsg({ type: 'error', text: 'Erro ao alterar senha: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        name,
        businessName
      },
      data: {
        products,
        ingredients,
        customers,
        fixedCosts,
        settings
      }
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_foodcost_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setMsg({ type: 'success', text: 'Backup baixado com sucesso!' });
  };

  const handleLogout = async () => {
    if (confirm('Deseja realmente sair da sua conta?')) {
      await signOut();
    }
  };

  const currentPlan = PLANS[userPlan];

  const tabs = [
    { id: 'profile' as TabType, label: 'Perfil', icon: User },
    { id: 'security' as TabType, label: 'Segurança', icon: Shield },
    { id: 'plan' as TabType, label: 'Plano', icon: CreditCard },
    { id: 'preferences' as TabType, label: 'Preferências', icon: SettingsIcon },
    { id: 'data' as TabType, label: 'Dados', icon: Download }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header with Profile Card */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-3xl shadow-2xl overflow-hidden mb-8">
          <div className="p-8 text-white relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Profile Photo */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl font-bold shadow-2xl ring-4 ring-white/30 overflow-hidden">
                  {profilePhoto ? (
                    <img src={profilePhoto} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{getInitials(name, user?.email)}</span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5 text-orange-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-2">{name || 'Bem-vindo'}</h1>
                <p className="text-white/80 mb-1 flex items-center gap-2 justify-center md:justify-start">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
                {businessName && (
                  <p className="text-white/80 flex items-center gap-2 justify-center md:justify-start">
                    <Store className="w-4 h-4" />
                    {businessName}
                  </p>
                )}
                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold">Plano {currentPlan.name} Ativo</span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Package className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <div className="text-xs text-white/70">Produtos</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Users className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalCustomers}</div>
                  <div className="text-xs text-white/70">Clientes</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <ShoppingBag className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <div className="text-xs text-white/70">Pedidos</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {msg && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-5 ${msg.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
            }`}>
            {msg.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
            <span className="font-medium">{msg.text}</span>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-lg mb-6 overflow-x-auto">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[140px] px-6 py-4 flex items-center justify-center gap-2 font-semibold transition-all ${activeTab === tab.id
                    ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Informações do Perfil</h2>
                <p className="text-gray-600">Gerencie suas informações pessoais e do negócio</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Store className="w-4 h-4 text-gray-400" />
                    Nome do Negócio
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Nome do seu negócio"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    E-mail (não editável)
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600">
                    {user?.email}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Endereço completo do negócio"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                {/* Divider for Fiscal Data */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                      <FileText className="w-4 h-4 text-orange-600" />
                      Dados Fiscais
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    CNPJ
                  </label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={handleCNPJChange}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all ${cnpj && !isValidCNPJ(cnpj)
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                      }`}
                  />
                  {cnpj && !isValidCNPJ(cnpj) && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      CNPJ deve ter 14 dígitos
                    </p>
                  )}
                  {cnpj && isValidCNPJ(cnpj) && cnpj.replace(/\D/g, '').length === 14 && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      CNPJ válido
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Inscrição Estadual
                    <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={stateRegistration}
                    onChange={(e) => setStateRegistration(e.target.value)}
                    placeholder="000.000.000.000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Inscrição Municipal
                    <span className="text-xs text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={municipalRegistration}
                    onChange={(e) => setMunicipalRegistration(e.target.value)}
                    placeholder="Inscrição Municipal"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Salvar Alterações
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Segurança da Conta</h2>
                <p className="text-gray-600">Mantenha sua conta segura e protegida</p>
              </div>

              {/* Change Password Section */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 rounded-xl">
                      <Lock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Alterar Senha</h3>
                      <p className="text-sm text-gray-600">Mantenha sua senha segura e forte</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className="text-orange-600 hover:text-orange-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    {isChangingPassword ? 'Cancelar' : 'Alterar Senha'}
                  </button>
                </div>

                {isChangingPassword && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-3">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Nova Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Digite a nova senha"
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Confirmar Nova Senha</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirme a nova senha"
                          className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleUpdatePassword}
                      disabled={loading || !newPassword || !confirmPassword}
                      className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                      {loading ? 'Atualizando...' : 'Salvar Nova Senha'}
                    </button>

                    {newPassword && (
                      <div className="mt-3">
                        <div className="text-sm text-gray-600 mb-2">Força da senha:</div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${newPassword.length < 6
                              ? 'w-1/3 bg-red-500'
                              : newPassword.length < 8
                                ? 'w-2/3 bg-yellow-500'
                                : 'w-full bg-green-500'
                              }`}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {newPassword.length < 6
                            ? 'Fraca - Use pelo menos 6 caracteres'
                            : newPassword.length < 8
                              ? 'Média - Use pelo menos 8 caracteres'
                              : 'Forte - Sua senha está segura!'}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <Shield className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Autenticação em Dois Fatores (2FA)</h3>
                      <p className="text-sm text-gray-600">Adicione uma camada extra de segurança</p>
                    </div>
                  </div>
                  <div className="text-sm bg-gray-200 text-gray-600 px-3 py-1 rounded-full font-medium">
                    Em breve
                  </div>
                </div>
              </div>

              {/* Sessions */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Sessões Ativas</h3>
                    <p className="text-sm text-gray-600">Gerencie dispositivos conectados</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900">Dispositivo Atual</p>
                      <p className="text-sm text-gray-500">Último acesso: Agora</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-600 font-medium">Ativo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 px-6 py-3 rounded-xl hover:bg-red-50 transition-all font-semibold"
                >
                  <LogOut size={20} />
                  Sair da Conta
                </button>
              </div>
            </div>
          )}



          {/* PLAN TAB */}
          {activeTab === 'plan' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Plano e Assinatura</h2>
                <p className="text-gray-600">Gerencie sua assinatura e forma de pagamento</p>
              </div>

              {!isComparingPlans ? (
                <>
                  {/* Current Plan Card */}
                  {/* Current Plan Card - Redesigned */}
                  <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-gray-700/50 group hover:border-gray-600 transition-all duration-500">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] group-hover:bg-orange-500/20 transition-all duration-700"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/20 transition-all duration-700"></div>

                    <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center justify-between">
                      {/* Plan Info */}
                      <div className="flex-1 space-y-6 text-center lg:text-left w-full">
                        <div className="space-y-4">
                          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs font-bold tracking-wider uppercase text-orange-300 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse box-shadow-lg shadow-orange-500" />
                            Plano Ativo
                          </div>

                          <div>
                            <h3 className="text-4xl lg:text-5xl font-black tracking-tight text-white mb-2 drop-shadow-lg">
                              {currentPlan.name}
                            </h3>
                            <p className="text-xl text-gray-400 font-medium flex items-baseline justify-center lg:justify-start gap-2">
                              {Number(currentPlan.price) > 0
                                ? <>R$ <span className="text-white text-3xl font-bold">{currentPlan.price.toFixed(2)}</span> /mês</>
                                : isTrial
                                  ? <span className="text-orange-400 font-bold">Teste Gratuito ({trialDaysLeft} dias restantes)</span>
                                  : 'Período de teste expirado'
                              }
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                          <button
                            onClick={() => setIsComparingPlans(true)}
                            className="px-8 py-4 bg-white text-gray-900 rounded-2xl font-bold hover:bg-orange-50 transition-all shadow-xl shadow-orange-900/10 flex items-center justify-center gap-3 group-hover:scale-105 active:scale-95 duration-300"
                          >
                            <ArrowUpCircle size={20} className="text-orange-600" />
                            Fazer Upgrade
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const { manageSubscription } = await import('../utils/stripe');
                                await manageSubscription();
                              } catch (e) {
                                console.error('Erro ao abrir portal:', e);
                                alert('Erro ao abrir o portal de gerenciamento');
                              }
                            }}
                            className="px-8 py-4 bg-white/5 text-white rounded-2xl font-semibold hover:bg-white/10 transition-all backdrop-blur-sm border border-white/10 flex items-center justify-center gap-3 hover:border-white/20"
                          >
                            <CreditCard size={20} />
                            Gerenciar
                          </button>
                        </div>
                      </div>

                      {/* Feature Status / Limits Panel */}
                      <div className="w-full lg:w-5/12 bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-inner">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Recursos do Plano</h4>
                          <SettingsIcon size={16} className="text-gray-500" />
                        </div>

                        <div className="space-y-6">
                          {/* Recipes Limit Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-300 flex items-center gap-2">
                                <ChefHat size={16} className="text-orange-400" />
                                Receitas Cadastradas
                              </span>
                              <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded text-xs">
                                {products.length} / {currentPlan.features.maxRecipes === 'unlimited' ? '∞' : currentPlan.features.maxRecipes}
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-1000 ease-out relative"
                                style={{
                                  width: currentPlan.features.maxRecipes === 'unlimited'
                                    ? '100%' // Full bar for unlimited
                                    : `${Math.min((products.length / (currentPlan.features.maxRecipes as number)) * 100, 100)}%`
                                }}
                              >
                                {currentPlan.features.maxRecipes === 'unlimited' && (
                                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Features Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: 'Consultor IA', active: currentPlan.features.aiConsultant, icon: Brain },
                              { label: 'Relatórios', active: currentPlan.features.financialReports, icon: TrendingUp },
                              { label: 'Fidelidade', active: currentPlan.features.loyaltySystem, icon: Star },
                              { label: 'WhatsApp', active: currentPlan.features.whatsappIntegration, icon: MessageCircle },
                            ].map((feature, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-xl border flex items-center gap-3 transition-all duration-300 ${feature.active
                                  ? 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10'
                                  : 'border-gray-800 bg-gray-800/20 opacity-40 grayscale'
                                  }`}
                              >
                                <div className={`p-1.5 rounded-lg ${feature.active ? 'bg-green-500/20 text-green-400' : 'bg-gray-700 text-gray-500'}`}>
                                  <feature.icon size={14} />
                                </div>
                                <span className={`text-xs font-bold leading-tight ${feature.active ? 'text-gray-200' : 'text-gray-500'}`}>
                                  {feature.label}
                                </span>
                                {feature.active && <CheckCircle size={12} className="ml-auto text-green-500" />}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Usage Statistics */}
                  <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <BarChart3 className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Uso do Sistema</h3>
                        <p className="text-sm text-gray-600">Estatísticas do mês atual</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Receitas</p>
                        <p className="text-xl font-bold text-gray-900">{products.length} <span className="text-xs font-normal text-gray-400">/ {currentPlan.features.maxRecipes === 'unlimited' ? '∞' : currentPlan.features.maxRecipes}</span></p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Clientes</p>
                        <p className="text-xl font-bold text-gray-900">{customers.length}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <p className="text-xs text-gray-500 font-bold uppercase mb-1">Pedidos (Mês)</p>
                        <p className="text-xl font-bold text-gray-900">{orders.length}</p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Escolha o plano ideal para você</h3>
                    <button
                      onClick={() => setIsComparingPlans(false)}
                      className="text-gray-500 hover:text-gray-900 text-sm font-medium underline"
                    >
                      Voltar para meu plano
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {(Object.entries(PLANS) as [PlanType, PlanFeatures][])
                      .filter(([key]) => key !== 'free') // Oculta o plano free da seleção
                      .map(([key, plan]) => {
                        const isCurrent = userPlan === key;
                        return (
                          <div key={key} className={`relative rounded-2xl border-2 p-6 flex flex-col ${isCurrent ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'} hover:shadow-xl transition-all duration-300`}>
                            {isCurrent && (
                              <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-lg">
                                ATUAL
                              </div>
                            )}
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                            <div className="mb-4">
                              <span className="text-3xl font-black text-gray-900">
                                {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toFixed(2)}`}
                              </span>
                              {plan.price > 0 && <span className="text-gray-500 text-sm">/mês</span>}
                            </div>

                            <div className="space-y-3 mb-8 flex-1">
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-500 shrink-0" />
                                <span className="text-gray-600">Receitas: <strong>{plan.features.maxRecipes === 'unlimited' ? 'Ilimitadas' : plan.features.maxRecipes}</strong></span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle size={16} className={plan.features.financialReports ? "text-green-500" : "text-gray-300"} />
                                <span className={plan.features.financialReports ? "text-gray-600" : "text-gray-400"}>Relatórios Financeiros</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle size={16} className={plan.features.aiConsultant ? "text-green-500" : "text-gray-300"} />
                                <span className={plan.features.aiConsultant ? "text-gray-600" : "text-gray-400"}>Consultor IA</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <CheckCircle size={16} className={plan.features.loyaltySystem ? "text-green-500" : "text-gray-300"} />
                                <span className={plan.features.loyaltySystem ? "text-gray-600" : "text-gray-400"}>Sistema Fidelidade</span>
                              </div>
                            </div>

                            <button
                              onClick={() => !isCurrent && handleUpdatePlan(key)}
                              disabled={isCurrent || loading}
                              className={`w-full py-3 rounded-xl font-bold transition-all ${isCurrent
                                ? 'bg-gray-200 text-gray-500 cursor-default'
                                : 'bg-gray-900 text-white hover:bg-black shadow-lg hover:shadow-xl'
                                }`}
                            >
                              {loading && !isCurrent ? <Loader2 className="animate-spin mx-auto" /> : isCurrent ? 'Plano Atual' : 'Escolher Plano'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}


          {/* PREFERENCES TAB */}
          {
            activeTab === 'preferences' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Preferências do Sistema</h2>
                  <p className="text-gray-600">Personalize sua experiência no sistema</p>
                </div>

                {/* Notifications */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-xl">
                      <Bell className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Notificações</h3>
                      <p className="text-sm text-gray-600">Configure como deseja ser notificado</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Notificações por Email</p>
                        <p className="text-sm text-gray-500">Receba atualizações importantes por email</p>
                      </div>
                      <button
                        onClick={() => setEmailNotifications(!emailNotifications)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${emailNotifications ? 'bg-orange-600' : 'bg-gray-300'
                          }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${emailNotifications ? 'translate-x-7' : 'translate-x-0'
                            }`}
                        ></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Alertas de Pedidos</p>
                        <p className="text-sm text-gray-500">Seja notificado quando receber novos pedidos</p>
                      </div>
                      <button
                        onClick={() => setOrderAlerts(!orderAlerts)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${orderAlerts ? 'bg-orange-600' : 'bg-gray-300'
                          }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${orderAlerts ? 'translate-x-7' : 'translate-x-0'
                            }`}
                        ></div>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-gray-900">Alertas de Estoque Baixo</p>
                        <p className="text-sm text-gray-500">Receba avisos quando o estoque estiver baixo</p>
                      </div>
                      <button
                        onClick={() => setStockAlerts(!stockAlerts)}
                        className={`relative w-14 h-7 rounded-full transition-colors ${stockAlerts ? 'bg-orange-600' : 'bg-gray-300'
                          }`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${stockAlerts ? 'translate-x-7' : 'translate-x-0'
                            }`}
                        ></div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Theme */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-xl">
                      {theme === 'light' ? (
                        <Sun className="w-6 h-6 text-purple-600" />
                      ) : (
                        <Moon className="w-6 h-6 text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Aparência</h3>
                      <p className="text-sm text-gray-600">Personalize o tema do sistema</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-6 rounded-xl border-2 transition-all ${theme === 'light'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <Sun className="w-8 h-8 mx-auto mb-3 text-orange-600" />
                      <p className="font-semibold text-gray-900">Claro</p>
                      <p className="text-xs text-gray-500 mt-1">Tema padrão</p>
                    </button>

                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-6 rounded-xl border-2 transition-all relative ${theme === 'dark'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                      <div className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        Em breve
                      </div>
                      <Moon className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                      <p className="font-semibold text-gray-900">Escuro</p>
                      <p className="text-xs text-gray-500 mt-1">Tema escuro</p>
                    </button>
                  </div>
                </div>
              </div>
            )
          }

          {/* DATA TAB */}
          {
            activeTab === 'data' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Gerenciamento de Dados</h2>
                  <p className="text-gray-600">Faça backup ou gerencie seus dados do sistema</p>
                </div>

                {/* Export Data */}
                <div
                  onClick={handleExportData}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-400 cursor-pointer transition-all hover:shadow-lg group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                      <Download className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Fazer Backup Completo</h3>
                      <p className="text-gray-700 mb-4">
                        Baixe um arquivo JSON com todos os seus dados: produtos, ingredientes, clientes,
                        pedidos e configurações. Mantenha seus dados seguros!
                      </p>
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          <span>{stats.totalProducts} Produtos</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{stats.totalCustomers} Clientes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{stats.totalOrders} Pedidos</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold group-hover:bg-blue-700 transition-colors">
                      <Download size={18} />
                      Baixar
                    </div>
                  </div>
                </div>

                {/* Import Data */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-green-600 rounded-xl">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Importar Dados</h3>
                      <p className="text-gray-700 mb-4">
                        Restaure um backup anterior ou importe dados de outro sistema.
                      </p>
                      <button className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors">
                        <Upload size={18} />
                        Selecionar Arquivo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200">
                  <div className="flex items-start gap-4">
                    <div className="p-4 bg-red-600 rounded-xl">
                      <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-red-900 mb-2">Zona de Perigo</h3>
                      <p className="text-red-700 mb-4">
                        Ações irreversíveis que afetam seus dados permanentemente.
                      </p>
                      <div className="space-y-3">
                        <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-red-200 hover:border-red-400 hover:bg-red-50 transition-all text-left">
                          <div>
                            <p className="font-semibold text-gray-900">Resetar Todos os Dados</p>
                            <p className="text-sm text-gray-600">Apaga todos os seus dados do sistema</p>
                          </div>
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>

                        <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-red-200 hover:border-red-400 hover:bg-red-50 transition-all text-left">
                          <div>
                            <p className="font-semibold text-gray-900">Excluir Conta Permanentemente</p>
                            <p className="text-sm text-gray-600">Remove sua conta e todos os dados associados</p>
                          </div>
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Privacy */}
                <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-gray-700 rounded-xl">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Privacidade dos Dados</h3>
                      <p className="text-sm text-gray-600">Seus dados são criptografados e seguros</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900 text-sm">Criptografia SSL</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900 text-sm">Backup Automático</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-gray-200 text-center">
                      <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <p className="font-semibold text-gray-900 text-sm">LGPD Compliant</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }
        </div >
      </div >
    </div >
  );
};

export default Account;
