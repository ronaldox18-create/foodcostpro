
import React, { useState, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { Customer, Order } from '../types';
import { Plus, Search, MessageCircle, User, MapPin, Edit2, Trash2, Calendar, DollarSign, Gift, TrendingUp, Clock, ShoppingBag, Sparkles, Brain, Loader, Wand2, Copy, Check, Mail, FileText, Award } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { askAI } from '../utils/aiHelper';

type FilterTab = 'all' | 'vip' | 'missing' | 'birthdays';

interface AiProfile {
  persona: string;
  tags: string[];
  strategy: string;
}

const Customers: React.FC = () => {
  const { customers, orders, addCustomer, updateCustomer, deleteCustomer } = useApp();

  // States
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // AI States
  const [aiProfile, setAiProfile] = useState<AiProfile | null>(null);
  const [isAnalyzingProfile, setIsAnalyzingProfile] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [messageCopied, setMessageCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Omit<Customer, 'id' | 'totalSpent' | 'lastOrderDate'>>({
    name: '',
    phone: '',
    email: '',
    birthDate: '',
    address: '',
    notes: ''
  });

  // --- STATISTICS LOGIC ---

  // Calculate dynamic stats for a customer based on orders
  const getCustomerStats = (customerId: string) => {
    const customerOrders = orders.filter(o => o.customerId === customerId);
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const ticketAvg = totalOrders > 0 ? totalSpent / totalOrders : 0;

    // Calculate Favorite Dish
    const productCounts: Record<string, number> = {};
    customerOrders.forEach(order => {
      order.items.forEach(item => {
        productCounts[item.productName] = (productCounts[item.productName] || 0) + item.quantity;
      });
    });

    // Sort by count
    const favoriteDish = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Nenhum';

    // Find REAL last order date - sort by date descending and get the first one
    const sortedOrders = [...customerOrders].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
    const lastOrderDate = sortedOrders.length > 0 ? sortedOrders[0].date : null;

    return { totalOrders, totalSpent, ticketAvg, favoriteDish, history: customerOrders, lastOrderDate };
  };

  // --- AI HANDLERS ---
  const handleAnalyzeProfile = async (customer: Customer) => {
    setIsAnalyzingProfile(true);
    const stats = getCustomerStats(customer.id);

    const prompt = `Analise este perfil de cliente e retorne um JSON com:
{
  "persona": "Uma frase curta descrevendo o tipo de cliente",
  "tags": ["tag1", "tag2", "tag3"],
  "strategy": "Uma estratégia de fidelização em uma frase"
}

Cliente: ${customer.name}
Total gasto: R$ ${stats.totalSpent.toFixed(2)}
Pedidos: ${stats.totalOrders}
Prato favorito: ${stats.favoriteDish}
Última compra: ${stats.lastOrderDate ? new Date(stats.lastOrderDate).toLocaleDateString('pt-BR') : 'Nunca'}`;

    try {
      const response = await askAI(prompt);
      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const profile = JSON.parse(jsonMatch[0]);
        setAiProfile(profile);
      } else {
        // Fallback if no JSON
        setAiProfile({
          persona: 'Cliente Regular',
          tags: ['Ativo', 'Engajado'],
          strategy: 'Manter relacionamento próximo'
        });
      }
    } catch (error) {
      console.error('Error analyzing profile:', error);
      setAiProfile({
        persona: 'Cliente Valioso',
        tags: ['Fidelidade', 'Qualidade'],
        strategy: 'Oferecer experiências exclusivas'
      });
    } finally {
      setIsAnalyzingProfile(false);
    }
  };

  const handleGenerateMessage = async (customer: Customer, type: 'promo' | 'missing' | 'casual') => {
    setIsGeneratingMessage(true);
    const stats = getCustomerStats(customer.id);

    let prompt = '';
    const firstName = customer.name.split(' ')[0];

    switch (type) {
      case 'promo':
        prompt = `Escreva uma mensagem curta e amigável de WhatsApp oferecendo uma promoção especial para ${firstName}. 
        Prato favorito: ${stats.favoriteDish}. Seja pessoal e use emojis. Máximo 280 caracteres.`;
        break;
      case 'missing':
        prompt = `Escreva uma mensagem curta e amigável de WhatsApp para reconquistar ${firstName}, que não compra há um tempo. 
        Prato favorito: ${stats.favoriteDish}. Seja carinhoso e use emojis. Máximo 280 caracteres.`;
        break;
      case 'casual':
        prompt = `Escreva uma mensagem curta e casual de WhatsApp para ${firstName}, agradecendo pela preferência. 
        Seja genuíno e use emojis. Máximo 280 caracteres.`;
        break;
    }

    try {
      const message = await askAI(prompt);
      setGeneratedMessage(message.trim());
    } catch (error) {
      console.error('Error generating message:', error);
      setGeneratedMessage(`Olá ${firstName}! 😊 Sentimos sua falta por aqui! Que tal um delicioso ${stats.favoriteDish}? ✨`);
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  const sendToWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(generatedMessage);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    setMessageCopied(true);
    setTimeout(() => setMessageCopied(false), 2000);
  };

  // --- FILTER LOGIC ---
  const processedCustomers = useMemo(() => {
    let filtered = customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11

    // Calculate stats for all filtered customers to allow sorting/filtering by dynamic data
    const customersWithStats = filtered.map(c => {
      const stats = getCustomerStats(c.id);
      return { ...c, ...stats };
    });

    switch (activeTab) {
      case 'vip':
        // VIP logic: Spent more than R$ 200
        filtered = customersWithStats.filter(c => c.totalSpent > 200);
        break;
      case 'missing':
        // Missing logic: No order in last 30 days
        const limitDate = new Date();
        limitDate.setDate(limitDate.getDate() - 30);
        filtered = customersWithStats.filter(c => {
          if (!c.lastOrderDate) return false;
          const lastOrder = new Date(c.lastOrderDate);
          return lastOrder < limitDate;
        });
        break;
      case 'birthdays':
        // Birthdays in current month
        filtered = customersWithStats.filter(c => {
          if (!c.birthDate) return false;
          const birthDate = new Date(c.birthDate + 'T00:00:00');
          return birthDate.getMonth() === currentMonth;
        });
        break;
      default:
        filtered = customersWithStats;
    }

    return filtered.sort((a, b) => {
      const dateA = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
      const dateB = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [customers, orders, searchTerm, activeTab]);

  // --- MODAL HANDLERS ---
  const openEditModal = (customer?: Customer) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        birthDate: customer.birthDate || '',
        address: customer.address || '',
        notes: customer.notes || ''
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        birthDate: '',
        address: '',
        notes: ''
      });
    }
    setIsEditModalOpen(true);
  };

  const openDetailsModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalOpen(true);
    setAiProfile(null);
    setGeneratedMessage('');
  };

  const closeModals = () => {
    setIsEditModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedCustomer(null);
    setAiProfile(null);
    setGeneratedMessage('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomer) {
      updateCustomer(selectedCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    closeModals();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      deleteCustomer(id);
      closeModals();
    }
  };

  // Calculate days since last order correctly
  const calculateDaysSinceLastOrder = (lastOrderDate: string | null): number => {
    if (!lastOrderDate) return -1;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastOrder = new Date(lastOrderDate);
    lastOrder.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - lastOrder.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  };

  // Get VIP badge color
  const getVIPBadge = (totalSpent: number) => {
    if (totalSpent > 1000) return { label: 'PLATINUM', color: 'bg-purple-600' };
    if (totalSpent > 500) return { label: 'GOLD', color: 'bg-yellow-500' };
    if (totalSpent > 200) return { label: 'VIP', color: 'bg-orange-500' };
    return null;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
            <p className="text-sm text-gray-500">Gerencie sua base de clientes e construa relacionamentos</p>
          </div>
          <button
            onClick={() => openEditModal()}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition flex items-center gap-2 font-medium"
          >
            <Plus size={20} />
            Novo Cliente
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, telefone ou email..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            />
          </div>

          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'all'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Todos ({customers.length})
            </button>
            <button
              onClick={() => setActiveTab('vip')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-1 ${activeTab === 'vip'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Award size={16} />
              VIP
            </button>
            <button
              onClick={() => setActiveTab('missing')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-1 ${activeTab === 'missing'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Clock size={16} />
              Sumidos
            </button>
            <button
              onClick={() => setActiveTab('birthdays')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center gap-1 ${activeTab === 'birthdays'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              <Gift size={16} />
              Aniversários
            </button>
          </div>
        </div>
      </div>

      {/* List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-gray-50 flex-1 content-start overflow-y-auto">
        {processedCustomers.map(customer => {
          const stats = getCustomerStats(customer.id);
          const daysSinceLastOrder = calculateDaysSinceLastOrder(stats.lastOrderDate);
          const vipBadge = getVIPBadge(stats.totalSpent);
          const isBirthday = customer.birthDate && new Date(customer.birthDate + 'T00:00:00').getMonth() === new Date().getMonth();

          return (
            <div
              key={customer.id}
              onClick={() => openDetailsModal(customer)}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-orange-300 transition cursor-pointer group relative overflow-hidden"
            >
              {/* VIP Badge */}
              {vipBadge && (
                <div className="absolute top-0 right-0 m-3">
                  <span className={`${vipBadge.color} text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm`}>
                    {vipBadge.label}
                  </span>
                </div>
              )}

              {/* Status Indicators */}
              <div className="absolute top-0 left-0 p-3 flex gap-1.5">
                {daysSinceLastOrder > 30 && (
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title="Cliente Sumido"></div>
                )}
                {isBirthday && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500" title="Aniversariante do Mês"></div>
                )}
              </div>

              {/* Customer Header */}
              <div className="flex items-center gap-4 mb-4 mt-2">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-md">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden flex-1">
                  <h3 className="font-bold text-gray-900 line-clamp-1 text-lg mb-1">{customer.name}</h3>
                  <div className="flex flex-col gap-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                      <MessageCircle size={12} />
                      {customer.phone}
                    </p>
                    {customer.email && (
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                        <Mail size={12} />
                        {customer.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Address & Notes Preview */}
              {(customer.address || customer.notes) && (
                <div className="mb-3 pb-3 border-b border-gray-100">
                  {customer.address && (
                    <p className="text-xs text-gray-500 flex items-start gap-1.5 mb-1">
                      <MapPin size={12} className="shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{customer.address}</span>
                    </p>
                  )}
                  {customer.notes && (
                    <p className="text-xs text-gray-400 flex items-start gap-1.5 italic">
                      <FileText size={12} className="shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{customer.notes}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 py-3 border-t border-gray-100">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Total Gasto (LTV)</p>
                  <p className="font-bold text-gray-900 text-lg">{formatCurrency(stats.totalSpent)}</p>
                  <p className="text-[10px] text-gray-400">{stats.totalOrders} {stats.totalOrders === 1 ? 'pedido' : 'pedidos'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Última Compra</p>
                  <p className={`font-bold text-base ${daysSinceLastOrder > 30 ? 'text-red-500' :
                    daysSinceLastOrder > 15 ? 'text-yellow-600' :
                      daysSinceLastOrder >= 0 ? 'text-green-600' : 'text-gray-400'
                    }`}>
                    {daysSinceLastOrder === -1 ? 'Nunca' :
                      daysSinceLastOrder === 0 ? 'Hoje' :
                        daysSinceLastOrder === 1 ? 'Ontem' :
                          `${daysSinceLastOrder}d atrás`}
                  </p>
                  {stats.lastOrderDate && (
                    <p className="text-[10px] text-gray-400">
                      {new Date(stats.lastOrderDate).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>

              {/* Ticket Average & Favorite Dish */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Ticket Médio</p>
                  <p className="font-semibold text-gray-900 text-sm">{formatCurrency(stats.ticketAvg)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Prato Favorito</p>
                  <p className="text-xs text-gray-700 font-medium line-clamp-1">{stats.favoriteDish}</p>
                </div>
              </div>

              {/* Birthday Info */}
              {customer.birthDate && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Aniversário</p>
                  <p className="text-xs text-gray-700 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(customer.birthDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
                    {isBirthday && <span className="text-blue-600 font-bold ml-1">🎉 Este mês!</span>}
                  </p>
                </div>
              )}

              {/* Hover Action */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end items-center">
                <button className="text-orange-600 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap flex items-center gap-1">
                  Ver Detalhes →
                </button>
              </div>
            </div>
          );
        })}

        {processedCustomers.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center text-gray-400 py-12">
            <User size={48} className="mb-2 opacity-20" />
            <p className="text-lg font-medium">Nenhum cliente encontrado</p>
            <p className="text-sm">Tente ajustar os filtros ou adicione um novo cliente</p>
          </div>
        )}
      </div>

      {/* --- MODAL DETALHES + HISTÓRICO + CRM --- */}
      {isDetailsModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex overflow-hidden">

            {/* Coluna Esquerda: Perfil e Ações */}
            <div className="w-1/3 bg-gray-50 p-6 border-r border-gray-200 flex flex-col overflow-y-auto custom-scrollbar">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-3 shadow-lg">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
                {selectedCustomer.email && (
                  <p className="text-xs text-gray-400 mt-1">{selectedCustomer.email}</p>
                )}
              </div>

              {/* AI PROFILE CARD */}
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-4 rounded-xl text-white shadow-md mb-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-30 transition">
                  <Brain size={48} />
                </div>
                <h4 className="font-bold text-sm flex items-center gap-2 mb-3 relative z-10">
                  <Sparkles size={14} className="text-yellow-300" /> Perfil Comportamental
                </h4>

                {!aiProfile ? (
                  <div className="text-center py-4 relative z-10">
                    <p className="text-xs text-indigo-200 mb-3">Descubra quem é este cliente.</p>
                    <button
                      onClick={() => handleAnalyzeProfile(selectedCustomer)}
                      disabled={isAnalyzingProfile}
                      className="w-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isAnalyzingProfile ? <Loader size={12} className="animate-spin" /> : <Brain size={12} />}
                      {isAnalyzingProfile ? 'Analisando...' : 'Analisar com IA'}
                    </button>
                  </div>
                ) : (
                  <div className="animate-in fade-in zoom-in duration-300 relative z-10">
                    <p className="text-lg font-bold text-white mb-2">{aiProfile.persona}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {aiProfile.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <div className="bg-black/20 p-2 rounded text-xs text-indigo-100 italic border border-white/10">
                      "{aiProfile.strategy}"
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* AI MESSAGING */}
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Wand2 size={12} /> Mensagem Inteligente
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button onClick={() => handleGenerateMessage(selectedCustomer, 'promo')} className="text-[10px] bg-green-50 text-green-700 py-1.5 rounded border border-green-100 hover:bg-green-100 font-medium">Promoção</button>
                    <button onClick={() => handleGenerateMessage(selectedCustomer, 'missing')} className="text-[10px] bg-red-50 text-red-700 py-1.5 rounded border border-red-100 hover:bg-red-100 font-medium">Sumido</button>
                    <button onClick={() => handleGenerateMessage(selectedCustomer, 'casual')} className="text-[10px] bg-blue-50 text-blue-700 py-1.5 rounded border border-blue-100 hover:bg-blue-100 font-medium">Casual</button>
                  </div>

                  {isGeneratingMessage ? (
                    <div className="text-center py-4 text-gray-400 text-xs">
                      <Loader size={16} className="animate-spin mx-auto mb-1" />
                      Escrevendo...
                    </div>
                  ) : generatedMessage && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <textarea
                        className="w-full text-xs p-2 bg-gray-50 rounded border border-gray-200 text-gray-700 mb-2 resize-none h-24 focus:ring-2 focus:ring-orange-500 outline-none"
                        value={generatedMessage}
                        onChange={(e) => setGeneratedMessage(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendToWhatsApp(selectedCustomer.phone)}
                          className="flex-1 bg-green-500 text-white text-xs font-bold py-2 rounded hover:bg-green-600 transition flex items-center justify-center gap-1"
                        >
                          <MessageCircle size={14} /> Enviar Zap
                        </button>
                        <button
                          onClick={copyToClipboard}
                          className="bg-gray-100 text-gray-600 p-2 rounded hover:bg-gray-200 transition"
                          title="Copiar Texto"
                        >
                          {messageCopied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dados Cadastrais</p>
                  <div className="space-y-2 text-sm">
                    {selectedCustomer.birthDate && (
                      <div>
                        <span className="text-gray-500 block text-xs">Aniversário</span>
                        <span className="text-gray-900 font-medium">
                          {new Date(selectedCustomer.birthDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div>
                        <span className="text-gray-500 block text-xs">Endereço</span>
                        <span className="text-gray-900">{selectedCustomer.address}</span>
                      </div>
                    )}
                    {selectedCustomer.notes && (
                      <div>
                        <span className="text-gray-500 block text-xs">Observações</span>
                        <span className="text-gray-700 text-sm italic">{selectedCustomer.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-200 flex gap-2">
                <button
                  onClick={() => { setIsDetailsModalOpen(false); openEditModal(selectedCustomer); }}
                  className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-white transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(selectedCustomer.id)}
                  className="p-2 border border-red-200 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {/* Coluna Direita: Estatísticas e Histórico */}
            <div className="w-2/3 p-6 flex flex-col bg-white">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <TrendingUp size={20} className="text-orange-600" />
                  Inteligência de Consumo
                </h4>
                <button onClick={() => setIsDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">
                  ✕
                </button>
              </div>

              {/* Stats Cards */}
              {(() => {
                const stats = getCustomerStats(selectedCustomer.id);
                const daysSince = calculateDaysSinceLastOrder(stats.lastOrderDate);
                return (
                  <>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <p className="text-xs text-blue-600 font-bold uppercase mb-1">Ticket Médio</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.ticketAvg)}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <p className="text-xs text-purple-600 font-bold uppercase mb-1">Total Pedidos</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                        <p className="text-xs text-green-600 font-bold uppercase mb-1">Total Gasto</p>
                        <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSpent)}</p>
                      </div>
                      <div className={`p-4 rounded-xl border ${daysSince > 30 ? 'bg-red-50 border-red-100' :
                        daysSince > 15 ? 'bg-yellow-50 border-yellow-100' :
                          'bg-orange-50 border-orange-100'
                        }`}>
                        <p className={`text-xs font-bold uppercase mb-1 ${daysSince > 30 ? 'text-red-600' :
                          daysSince > 15 ? 'text-yellow-600' :
                            'text-orange-600'
                          }`}>Última Compra</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {daysSince === -1 ? '—' :
                            daysSince === 0 ? 'Hoje' :
                              daysSince === 1 ? '1d' :
                                `${daysSince}d`}
                        </p>
                      </div>
                    </div>

                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-6">
                      <p className="text-xs text-orange-600 font-bold uppercase mb-1">Prato Favorito</p>
                      <p className="text-lg font-bold text-gray-900">{stats.favoriteDish}</p>
                    </div>
                  </>
                );
              })()}

              <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                <ShoppingBag size={16} /> Histórico de Pedidos
              </h4>

              <div className="flex-1 overflow-auto border border-gray-100 rounded-lg">
                {(() => {
                  const history = getCustomerStats(selectedCustomer.id).history;
                  if (history.length === 0) {
                    return <div className="p-8 text-center text-gray-400">Nenhum pedido registrado.</div>
                  }
                  // Sort by date descending
                  const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  return (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 sticky top-0">
                        <tr>
                          <th className="p-3">Data</th>
                          <th className="p-3">Itens</th>
                          <th className="p-3 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedHistory.map(order => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="p-3 text-gray-600 whitespace-nowrap">
                              {new Date(order.date).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-3 text-gray-900">
                              {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                            </td>
                            <td className="p-3 text-right font-medium text-gray-900">
                              {formatCurrency(order.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EDITAR / NOVO --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-gray-900">{selectedCustomer ? 'Editar' : 'Novo'} Cliente</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Tel</label>
                  <input
                    required
                    type="text"
                    placeholder="11999999999"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Nascimento</label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail (Opcional)</label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  placeholder="Rua, Número, Bairro"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Não gosta de picles."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white text-gray-900 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModals} className="flex-1 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium bg-white text-gray-700">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
