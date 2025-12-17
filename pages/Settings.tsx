import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import {
  Save, Store, DollarSign, Globe, Printer, Bell, Zap, TrendingUp,
  Percent, Calculator, FileText, Mail, Phone, MapPin, CreditCard,
  Clock, AlertCircle, CheckCircle, Settings as SettingsIcon, Loader2,
  Info, ChevronRight, BarChart3, Package, Users, Lock, Radio, RefreshCw, XCircle, Database, Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import PlanGuard from '../components/PlanGuard';
import { IntegrationService } from '../services/integrations';
import WhatsAppSettings from '../components/WhatsAppSettings';

type TabType = 'business' | 'pricing' | 'system' | 'pdv' | 'notifications' | 'integrations';

const Settings: React.FC = () => {
  const { settings, updateSettings } = useApp();

  const [activeTab, setActiveTab] = useState<TabType>('business');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Business Settings
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');

  // Pricing Settings
  const [targetMargin, setTargetMargin] = useState(30);
  const [taxAndLoss, setTaxAndLoss] = useState(10);
  const [serviceCharge, setServiceCharge] = useState(10);
  const [deliveryFee, setDeliveryFee] = useState(5);

  // System Settings
  const [currency, setCurrency] = useState('BRL');
  const [language, setLanguage] = useState('pt-BR');
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  // PDV Settings
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(true);
  const [printKitchen, setPrintKitchen] = useState(false);
  const [taxInvoice, setTaxInvoice] = useState(false);
  const [cashDrawer, setCashDrawer] = useState(true);

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState(true);
  const [newOrderAlerts, setNewOrderAlerts] = useState(true);
  const [dailyReport, setDailyReport] = useState(false);

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || '');
      setTargetMargin(settings.targetMargin || 30);
      setTaxAndLoss(settings.taxAndLossPercent || 10);
    }
  }, [settings]);

  const handleSaveSettings = async () => {
    setLoading(true);
    setMsg(null);

    try {
      // 1. Salvar configurações gerais
      await updateSettings({
        ...settings,
        businessName,
        targetMargin,
        taxAndLossPercent: taxAndLoss
      });

      // 2. Salvar credenciais do iFood (se preenchidas e na aba correta)
      if (activeTab === 'integrations' && (ifoodClientId || ifoodClientSecret)) {
        await saveIntegrationCredentials();
      }

      setMsg({ type: 'success', text: 'Configurações salvas com sucesso!' });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      setMsg({ type: 'error', text: 'Erro ao salvar configurações: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  // iFood State
  const [ifoodClientId, setIfoodClientId] = useState('');
  const [ifoodClientSecret, setIfoodClientSecret] = useState('');
  const [ifoodMerchantId, setIfoodMerchantId] = useState('');
  const [ifoodStatus, setIfoodStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [testingConnection, setTestingConnection] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);

  // Demo Data State
  const [generatingImages, setGeneratingImages] = useState(false);

  const handleGenerateExampleImages = async () => {
    if (!confirm('Isso irá atualizar as fotos dos produtos que ainda não possuem imagem. Deseja continuar?')) return;

    setGeneratingImages(true);
    try {
      // Buscar usuário autenticado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar apenas produtos do usuário
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      let count = 0;

      const IMAGES = {
        burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?fm=jpg&w=800&fit=max',
        pizza: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?fm=jpg&w=800&fit=max',
        hotdog: 'https://images.unsplash.com/photo-1612392062798-2307c8975a78?fm=jpg&w=800&fit=max',
        drink: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?fm=jpg&w=800&fit=max',
        fries: 'https://images.unsplash.com/photo-1573080496982-b9418e624310?fm=jpg&w=800&fit=max',
        acai: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?fm=jpg&w=800&fit=max',
        icecream: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?fm=jpg&w=800&fit=max',
        tapioca: 'https://images.unsplash.com/photo-1604085572504-a392ddf0d86a?fm=jpg&w=800&fit=max',
        dessert: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?fm=jpg&w=800&fit=max',
        salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?fm=jpg&w=800&fit=max',
        default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?fm=jpg&w=800&fit=max'
      };

      for (const product of products) {
        // Atualizar apenas se não houver imagem
        if (!product.image_url) {
          const text = (product.name + ' ' + (product.category || '')).toLowerCase();
          let imageUrl = IMAGES.default;

          if (text.includes('hamburguer') || text.includes('burger') || text.includes('x-') || text.includes('smash') || text.includes('bacon'))
            imageUrl = IMAGES.burger;
          else if (text.includes('pizza') || text.includes('calabresa') || text.includes('mussarela'))
            imageUrl = IMAGES.pizza;
          else if (text.includes('hot') || text.includes('dog') || text.includes('salsicha'))
            imageUrl = IMAGES.hotdog;
          else if (text.includes('bebida') || text.includes('coca') || text.includes('suco') || text.includes('refrigerante') || text.includes('água') || text.includes('agua') || text.includes('milkshake'))
            imageUrl = IMAGES.drink;
          else if (text.includes('batata') || text.includes('frita') || text.includes('porção'))
            imageUrl = IMAGES.fries;
          else if (text.includes('açaí') || text.includes('acai'))
            imageUrl = IMAGES.acai;
          else if (text.includes('sorvete') || text.includes('sundae') || text.includes('picolé') || text.includes('picole'))
            imageUrl = IMAGES.icecream;
          else if (text.includes('tapioca'))
            imageUrl = IMAGES.tapioca;
          else if (text.includes('sobremesa') || text.includes('doce') || text.includes('bolo') || text.includes('pudim') || text.includes('chocolate'))
            imageUrl = IMAGES.dessert;
          else if (text.includes('salada') || text.includes('fitness') || text.includes('natural'))
            imageUrl = IMAGES.salad;

          await supabase.from('products').update({ image_url: imageUrl }).eq('id', product.id);
          count++;
        }
      }

      setMsg({ type: 'success', text: `✅ Imagens geradas para ${count} produtos com sucesso!` });
    } catch (error: any) {
      console.error("Error generating images:", error);
      setMsg({ type: 'error', text: '❌ Erro ao gerar imagens: ' + error.message });
    } finally {
      setGeneratingImages(false);
    }
  };

  // Fetch Logs
  useEffect(() => {
    if (activeTab === 'integrations') {
      const fetchLogs = async () => {
        const { data } = await supabase
          .from('catalog_sync_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        if (data) setSyncLogs(data);
      };
      fetchLogs();
    }
  }, [activeTab]);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      await IntegrationService.testConnection('ifood');
      setIfoodStatus('connected');
      setMsg({ type: 'success', text: 'Conexão testada com sucesso! Credenciais válidas.' });
    } catch (error: any) {
      setIfoodStatus('error');
      setMsg({ type: 'error', text: `Falha na conexão: ${error.message}` });
    } finally {
      setTestingConnection(false);
    }
  };

  // Carregar credenciais existentes
  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const ifoodData = await IntegrationService.getIntegration('ifood');
        if (ifoodData) {
          if (ifoodData.credentials) {
            setIfoodClientId(ifoodData.credentials.clientId || '');
            setIfoodClientSecret(ifoodData.credentials.clientSecret || '');
            setIfoodMerchantId(ifoodData.credentials.merchantId || '');
          }
          if (ifoodData.status === 'active') setIfoodStatus('connected');
          else if (ifoodData.status === 'error') setIfoodStatus('error');
          else setIfoodStatus('disconnected');
        }
      } catch (error) {
        console.error("Erro ao carregar integrações:", error);
      }
    };
    if (activeTab === 'integrations') loadIntegrations();
  }, [activeTab]);

  const saveIntegrationCredentials = async () => {
    try {
      await IntegrationService.saveIntegration('ifood', {
        clientId: ifoodClientId,
        clientSecret: ifoodClientSecret,
        merchantId: ifoodMerchantId
      });

      setIfoodStatus('connected');
      setMsg({ type: 'success', text: 'Integração iFood salva com sucesso!' });
    } catch (error: any) {
      console.error("Erro ao salvar iFood:", error);
      setIfoodStatus('error');
      setMsg({ type: 'error', text: 'Erro ao salvar credenciais: ' + error.message });
    }
  };


  const tabs = [
    { id: 'business' as TabType, label: 'Negócio', icon: Store },
    { id: 'pricing' as TabType, label: 'Preços', icon: DollarSign },
    { id: 'system' as TabType, label: 'Sistema', icon: Globe },
    { id: 'pdv' as TabType, label: 'PDV', icon: Printer },
    { id: 'notifications' as TabType, label: 'Notificações', icon: Bell },
    { id: 'integrations' as TabType, label: 'Integrações', icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl shadow-2xl overflow-hidden mb-8">
          <div className="p-8 text-white relative">
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <SettingsIcon className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Configurações</h1>
                  <p className="text-white/80">Personalize seu sistema de gestão</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <TrendingUp className="w-5 h-5 mb-2" />
                  <div className="text-2xl font-bold">{targetMargin}%</div>
                  <div className="text-xs text-white/70">Margem Alvo</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <Percent className="w-5 h-5 mb-2" />
                  <div className="text-2xl font-bold">{taxAndLoss}%</div>
                  <div className="text-xs text-white/70">Impostos/Perdas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <CreditCard className="w-5 h-5 mb-2" />
                  <div className="text-2xl font-bold">{serviceCharge}%</div>
                  <div className="text-xs text-white/70">Taxa de Serviço</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {/* Messages - Global (only show if NOT on integrations tab or if msg is generic) */}
        {msg && activeTab !== 'integrations' && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-5 ${msg.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
            }`}>
            {msg.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
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

          {/* BUSINESS TAB */}
          {activeTab === 'business' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Informações do Negócio</h2>
                <p className="text-gray-600">Dados principais do seu estabelecimento</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Store className="w-4 h-4 text-gray-400" />
                    Nome do Estabelecimento
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
                    <Mail className="w-4 h-4 text-gray-400" />
                    E-mail do Negócio
                  </label>
                  <input
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="contato@seunegocio.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Telefone de Contato
                  </label>
                  <input
                    type="tel"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="Rua, número, bairro, cidade - UF"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Por que essas informações?</h4>
                    <p className="text-sm text-blue-800">
                      Essas informações serão usadas em cupons fiscais, notas fiscais, recibos de venda
                      e no atendimento ao cliente.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PRICING TAB */}
          {activeTab === 'pricing' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Configurações de Precificação</h2>
                <p className="text-gray-600">Defina margens, taxas e custos padrão</p>
              </div>

              {/* Main Pricing Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-600 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Margem de Lucro Alvo</h3>
                      <p className="text-sm text-gray-600">Percentual desejado de lucro</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={targetMargin}
                      onChange={(e) => setTargetMargin(parseFloat(e.target.value))}
                      className="w-full px-4 py-4 pr-12 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-2xl font-bold text-gray-900"
                    />
                    <span className="absolute right-4 top-4 text-2xl font-bold text-gray-400">%</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Lucro sobre vendas</span>
                    <span className="font-semibold text-green-700">{targetMargin}%</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-600 rounded-xl">
                      <Percent className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">Impostos e Perdas</h3>
                      <p className="text-sm text-gray-600">Custos extras e perdas</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxAndLoss}
                      onChange={(e) => setTaxAndLoss(parseFloat(e.target.value))}
                      className="w-full px-4 py-4 pr-12 border-2 border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-2xl font-bold text-gray-900"
                    />
                    <span className="absolute right-4 top-4 text-2xl font-bold text-gray-400">%</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Custos adicionais</span>
                    <span className="font-semibold text-red-700">{taxAndLoss}%</span>
                  </div>
                </div>
              </div>

              {/* Additional Fees */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Taxas Adicionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      Taxa de Serviço (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={serviceCharge}
                        onChange={(e) => setServiceCharge(parseFloat(e.target.value))}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                      <span className="absolute right-4 top-3.5 text-gray-400">%</span>
                    </div>
                    <p className="text-xs text-gray-500">Aplicada em pedidos para consumo local</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      Taxa de Entrega (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-400">R$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(parseFloat(e.target.value))}
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <p className="text-xs text-gray-500">Valor padrão para delivery</p>
                  </div>
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <Calculator className="w-6 h-6 text-purple-600" />
                  <h3 className="font-bold text-gray-900">Simulação de Preço</h3>
                </div>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Custo</div>
                    <div className="text-xl font-bold text-gray-900">R$ 10,00</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">+Impostos</div>
                    <div className="text-xl font-bold text-red-600">+{taxAndLoss}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">+Margem</div>
                    <div className="text-xl font-bold text-green-600">+{targetMargin}%</div>
                  </div>
                  <div className="bg-white rounded-xl p-2">
                    <div className="text-sm text-gray-600 mb-1">Preço Final</div>
                    <div className="text-xl font-bold text-orange-600">
                      R$ {(10 * (1 + taxAndLoss / 100) * (1 + targetMargin / 100)).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM TAB */}
          {activeTab === 'system' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Configurações do Sistema</h2>
                <p className="text-gray-600">Personalize idioma, moeda e formatos</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    Idioma do Sistema
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es">Español</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    Moeda
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="BRL">Real (R$)</option>
                    <option value="USD">Dólar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Fuso Horário
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                    <option value="America/Manaus">Manaus (GMT-4)</option>
                    <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Formato de Data
                  </label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                  </select>
                </div>
              </div>

              {/* Demo Data Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Database size={20} className="text-purple-600" />
                  Dados de Demonstração
                </h3>
                <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-purple-900">Gerar Imagens de Exemplo</h4>
                      <p className="text-sm text-purple-700 mt-1">
                        Preenche produtos sem foto com imagens de alta qualidade baseadas no nome/categoria.
                        Útil para testar o cardápio digital.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateExampleImages}
                      disabled={generatingImages}
                      className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition shadow-sm disabled:opacity-50"
                    >
                      {generatingImages ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                      {generatingImages ? 'Gerando...' : 'Gerar Imagens'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PDV TAB */}
          {activeTab === 'pdv' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Configurações do PDV</h2>
                <p className="text-gray-600">Configure impressoras, recibos e periféricos</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Printer className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Impressão Automática de Recibos</h4>
                      <p className="text-sm text-gray-600">Imprimir automaticamente após finalizar venda</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAutoPrintReceipt(!autoPrintReceipt)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${autoPrintReceipt ? 'bg-orange-600' : 'bg-gray-300'
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${autoPrintReceipt ? 'translate-x-7' : 'translate-x-0'
                        }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Impressão na Cozinha</h4>
                      <p className="text-sm text-gray-600">Enviar pedidos automaticamente para a cozinha</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPrintKitchen(!printKitchen)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${printKitchen ? 'bg-orange-600' : 'bg-gray-300'
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${printKitchen ? 'translate-x-7' : 'translate-x-0'
                        }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Emissão de Nota Fiscal</h4>
                      <p className="text-sm text-gray-600">Integração com sistema de cupom fiscal</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setTaxInvoice(!taxInvoice)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${taxInvoice ? 'bg-orange-600' : 'bg-gray-300'
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${taxInvoice ? 'translate-x-7' : 'translate-x-0'
                        }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Gaveta de Dinheiro</h4>
                      <p className="text-sm text-gray-600">Abrir gaveta automaticamente ao finalizar venda</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setCashDrawer(!cashDrawer)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${cashDrawer ? 'bg-orange-600' : 'bg-gray-300'
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${cashDrawer ? 'translate-x-7' : 'translate-x-0'
                        }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Notificações</h2>
                <p className="text-gray-600">Gerencie alertas e avisos do sistema</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Notificações por E-mail</h4>
                      <p className="text-sm text-gray-600">Receber atualizações importantes por e-mail</p>
                    </div>
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

                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Package className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Alertas de Estoque Baixo</h4>
                      <p className="text-sm text-gray-600">Avisar quando ingredientes estiverem acabando</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setLowStockAlerts(!lowStockAlerts)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${lowStockAlerts ? 'bg-orange-600' : 'bg-gray-300'
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${lowStockAlerts ? 'translate-x-7' : 'translate-x-0'
                        }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Bell className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Novos Pedidos</h4>
                      <p className="text-sm text-gray-600">Notificar quando receber novos pedidos</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setNewOrderAlerts(!newOrderAlerts)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${newOrderAlerts ? 'bg-orange-600' : 'bg-gray-300'
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${newOrderAlerts ? 'translate-x-7' : 'translate-x-0'
                        }`}
                    ></div>
                  </button>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Relatório Diário</h4>
                      <p className="text-sm text-gray-600">Receber resumo de vendas todo dia por e-mail</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDailyReport(!dailyReport)}
                    className={`relative w-14 h-7 rounded-full transition-colors ${dailyReport ? 'bg-orange-600' : 'bg-gray-300'
                      }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${dailyReport ? 'translate-x-7' : 'translate-x-0'
                        }`}
                    ></div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* INTEGRATIONS TAB */}
          {activeTab === 'integrations' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Integrações</h2>
                <p className="text-gray-600">Conecte seu sistema com serviços externos</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* iFood Integration Card */}
                <PlanGuard feature="integrations" showLock={true}>
                  <div className="bg-white rounded-2xl border-2 border-red-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-red-50 bg-gradient-to-r from-red-50 to-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-white p-2 rounded-xl border border-red-100 shadow-sm">
                            {/* iFood Logo Placeholder or Icon */}
                            <img src="https://logodownload.org/wp-content/uploads/2017/05/ifood-logo-0.png" alt="iFood" className="w-10 h-10 object-contain" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg">iFood</h3>
                            <p className="text-sm text-gray-600">Receba pedidos automaticamente</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ifoodStatus === 'connected' ? 'bg-green-100 text-green-800' :
                            ifoodStatus === 'error' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                            {ifoodStatus === 'connected' ? 'Conectado' :
                              ifoodStatus === 'error' ? 'Erro' : 'Desconectado'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl flex gap-3">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        <div>
                          Para integrar, você precisa das credenciais de desenvolvedor do iFood.
                          <a href="https://developer.ifood.com.br/" target="_blank" rel="noopener noreferrer" className="font-bold underline ml-1">
                            Acesse o Portal do Desenvolvedor
                          </a>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-1">
                            Client ID
                          </label>
                          <input
                            value={ifoodClientId}
                            onChange={(e) => setIfoodClientId(e.target.value)}
                            type="text"
                            placeholder="Ex: 4945-8495-..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-1">
                            Client Secret
                          </label>
                          <input
                            value={ifoodClientSecret}
                            onChange={(e) => setIfoodClientSecret(e.target.value)}
                            type="password"
                            placeholder="••••••••••••••••"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-gray-700 block mb-1">
                            Merchant ID (Opcional)
                          </label>
                          <input
                            value={ifoodMerchantId}
                            onChange={(e) => setIfoodMerchantId(e.target.value)}
                            type="text"
                            placeholder="ID da loja"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none text-sm"
                          />
                        </div>

                        {/* Local Message for Integration Tab */}
                        {msg && activeTab === 'integrations' && (
                          <div className={`mt-4 p-3 rounded-lg border text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${msg.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            <span className="font-medium">{msg.text}</span>
                          </div>
                        )}
                      </div>

                      {/* Botões de Ação */}
                      <div className="pt-2 flex flex-col gap-2">
                        {/* Botão Salvar / Conectar */}
                        <button
                          onClick={handleSaveSettings}
                          disabled={loading}
                          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-red-200 disabled:opacity-50">
                          {loading ? <Loader2 className="animate-spin inline-block mr-2" /> : null}
                          {ifoodStatus === 'connected' ? 'Salvar Alterações' : 'Salvar Credenciais'}
                        </button>

                        {/* Botão Testar Conexão - Visível se houver credenciais preenchidas */}
                        {(ifoodClientId && ifoodClientSecret) && (
                          <button
                            onClick={handleTestConnection}
                            disabled={testingConnection}
                            className={`w-full py-2 border font-medium rounded-xl transition-colors flex items-center justify-center gap-2 ${testingConnection
                              ? 'bg-gray-100 text-gray-400 border-gray-200'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                          >
                            {testingConnection ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />}
                            {testingConnection ? 'Testando...' : 'Testar Conexão com iFood'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </PlanGuard>

                {/* WhatsApp Business Integration */}
                <PlanGuard feature="integrations" showLock={true}>
                  <WhatsAppSettings />
                </PlanGuard>

                {/* Other Integrations (Coming Soon) */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 opacity-75">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Mercado Pago</h3>
                        <p className="text-sm text-gray-600">Pagamentos online (Em breve)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SYNC LOGS SECTION */}
              <div className="mt-8 border-t border-gray-200 pt-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <RefreshCw size={20} className="text-gray-500" />
                  Histórico de Sincronização
                </h3>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {syncLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-3">Data/Hora</th>
                            <th className="px-4 py-3">Ação</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Detalhes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {syncLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-600">
                                {new Date(log.created_at).toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${log.action === 'CREATE' ? 'bg-blue-100 text-blue-700' :
                                  log.action === 'UPDATE' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {log.status === 'SUCCESS' ? (
                                  <span className="flex items-center gap-1 text-green-600 font-medium">
                                    <CheckCircle size={14} /> Sucesso
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-red-600 font-medium">
                                    <XCircle size={14} /> Erro
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={log.message}>
                                {log.message}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      Nenhum registro de sincronização encontrado.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Save Button (Fixed at bottom) */}
          <div className="flex justify-end pt-6 border-t border-gray-200 mt-8">
            <button
              onClick={handleSaveSettings}
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
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
