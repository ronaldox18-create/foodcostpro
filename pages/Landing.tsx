
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChefHat,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Star,
  LayoutDashboard,
  Brain,
  Coins,
  Users,
  Smartphone,
  MessageCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Landing: React.FC = () => {
  const { user } = useAuth();
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;

      let closestIndex = 0;
      let minDistance = Number.MAX_VALUE;

      // Iterate through direct children (the cards)
      Array.from(container.children).forEach((child, index) => {
        const div = child as HTMLElement;
        const rect = div.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Center of the card relative to the container's viewport
        const cardCenter = rect.left + rect.width / 2;
        const containerCenterPoint = containerRect.left + containerRect.width / 2;

        const distance = Math.abs(cardCenter - containerCenterPoint);

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      setActiveSlide(closestIndex);
    }
  };

  const scrollToSlide = (index: number) => {
    if (scrollContainerRef.current) {
      const children = scrollContainerRef.current.children;
      if (children[index]) {
        children[index].scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 scroll-smooth">
      {/* Header */}
      <header className="fixed w-full bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-orange-600 transition-transform hover:scale-105">
            <ChefHat size={36} className="drop-shadow-sm" />
            <span className="text-2xl font-black tracking-tight text-gray-900">FoodCost <span className="text-orange-600">Pro</span></span>
          </div>
          <div className="flex gap-4 items-center">
            {user ? (
              <Link to="/dashboard" className="bg-orange-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-orange-700 transition shadow-lg hover:shadow-orange-200 flex items-center gap-2 transform hover:-translate-y-0.5">
                <LayoutDashboard size={18} /> Acessar Painel
              </Link>
            ) : (
              <>
                <Link to="/auth" className="hidden md:block text-gray-600 font-semibold hover:text-orange-600 transition">Entrar</Link>
                <Link to="/auth" className="bg-gray-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-800 transition shadow-lg flex items-center gap-2 transform hover:-translate-y-0.5">
                  Começar Grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-28 md:pt-40 pb-12 md:pb-24 px-6 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-orange-100/50 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-100/50 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white border border-orange-100 text-orange-800 px-4 py-1.5 rounded-full font-bold text-sm mb-8 shadow-sm hover:shadow-md transition cursor-default">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
            </span>
            Nova IA de Engenharia de Cardápio Disponível!
          </div>

          <h1 className="text-4xl md:text-7xl font-black text-gray-900 tracking-tight mb-8 leading-[1.1]">
            Seu Restaurante Lucrando <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">Como Nunca Antes.</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            Deixe a <strong>Inteligência Artificial</strong> cuidar dos preços, estoque e fidelidade, enquanto você foca no que importa: <span className="text-gray-900 font-semibold">a comida e a experiência.</span>
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link to={user ? "/dashboard" : "/auth"} className="bg-orange-600 text-white text-lg px-10 py-4 rounded-full font-bold hover:bg-orange-700 transition shadow-xl hover:shadow-orange-300/50 flex items-center justify-center gap-3 transform hover:-translate-y-1">
              {user ? "Ir para o Sucesso" : "Testar Grátis Agora"} <ArrowRight className="animate-bounce-x" />
            </Link>
            {!user && (
              <a href="#features" className="bg-white text-gray-700 border border-gray-200 text-lg px-10 py-4 rounded-full font-bold hover:bg-gray-50 transition shadow-sm hover:shadow-md">
                Conhecer Recursos
              </a>
            )}
          </div>

          {/* Social Proof */}
          <div className="pt-8 border-t border-gray-100 flex flex-col items-center">
            <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">Confiado por grandes chefs</p>
            <div className="flex flex-wrap justify-center gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Placeholders for logos (Icons used as stand-ins) */}
              <div className="flex items-center gap-2 font-black text-2xl text-gray-800"><ChefHat /> BistroTech</div>
              <div className="flex items-center gap-2 font-black text-2xl text-gray-800"><Star /> BurgerKingz</div>
              <div className="flex items-center gap-2 font-black text-2xl text-gray-800"><LayoutDashboard /> PizzaFlow</div>
              <div className="flex items-center gap-2 font-black text-2xl text-gray-800"><Zap /> SushiGo</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem / Agitation */}
      <section className="py-16 md:py-24 bg-red-50/50 relative overflow-hidden">
        {/* Background Alert Accents */}
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-red-100/40 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-orange-100/40 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-1.5 rounded-full font-bold text-sm mb-6 border border-red-200">
              <AlertTriangle size={16} /> Dado Alarmante de Mercado
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 leading-tight">
              Por que <span className="text-red-600 underline decoration-4 decoration-red-200">60% dos Restaurantes</span> fecham as portas em menos de 2 anos?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Não é por falta de comida boa. É por <strong>cegueira financeira</strong>. Um restaurante sem gestão de dados é uma bomba-relógio esperando para explodir.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Pain Point 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-l-4 border-red-500 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Coins size={120} className="text-red-500" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-2">
                  <span className="text-red-500">01.</span> Precificação Suicida
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  "Copiar o preço do vizinho" é o erro #1. Se você não sabe seu CMV exato e seus custos fixos, <strong className="text-red-600">você está pagando para trabalhar</strong> em cada prato que sai da cozinha.
                </p>
                <div className="bg-red-50 p-3 rounded-lg text-red-800 text-sm font-medium">
                  📉 Resultado: Prejuízo invisível acumulado.
                </div>
              </div>
            </div>

            {/* Pain Point 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-l-4 border-orange-500 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertTriangle size={120} className="text-orange-500" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-2">
                  <span className="text-orange-500">02.</span> O Buraco do Estoque
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Cerca de <strong className="text-orange-600">10% a 15% do seu estoque</strong> vai para o lixo ou some sem você ver. Fichas técnicas desatualizadas mascaram roubos e desperdícios que sangram seu caixa diariamente.
                </p>
                <div className="bg-orange-50 p-3 rounded-lg text-orange-800 text-sm font-medium">
                  🗑️ Resultado: Dinheiro indo direto para o lixo.
                </div>
              </div>
            </div>

            {/* Pain Point 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border-l-4 border-gray-800 hover:-translate-y-2 transition-all duration-300 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Users size={120} className="text-gray-800" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-3 text-gray-900 flex items-center gap-2">
                  <span className="text-gray-800">03.</span> Clientes de Uma Vez
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Conseguir um cliente novo custa <strong className="text-gray-900">5x mais caro</strong> do que manter um antigo. Sem um CRM ou Clube de Fidelidade, você deixa seu cliente ir embora e nunca mais voltar.
                </p>
                <div className="bg-gray-100 p-3 rounded-lg text-gray-800 text-sm font-medium">
                  🏃 Resultado: Esforço máximo por retorno mínimo.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution / AI Feature Highlight */}
      <section id="features" className="py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-wide">
                <Brain size={14} /> Exclusivo
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                Conheça seu novo <br />
                <span className="text-purple-600">Consultor IA.</span>
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Não é apenas um painel de controle. É uma inteligência que analisa seus dados 24h por dia e te diz exatamente o que fazer para lucrar mais.
              </p>

              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mt-1"><TrendingUp size={24} /></div>
                  <div>
                    <h4 className="font-bold text-xl text-gray-900">Previsão de Vendas</h4>
                    <p className="text-gray-500">Saiba quanto vai faturar semana que vem e prepare seu estoque e equipe sem desperdícios.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mt-1"><Star size={24} /></div>
                  <div>
                    <h4 className="font-bold text-xl text-gray-900">Engenharia de Cardápio</h4>
                    <p className="text-gray-500">Identificamos seus pratos "Estrela" (lucram e vendem muito) e os "Burros de Carga" que precisam de atenção.</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600 mt-1"><MessageCircle size={24} /></div>
                  <div>
                    <h4 className="font-bold text-xl text-gray-900">Sugestões de Promoção</h4>
                    <p className="text-gray-500">A IA cria textos persuasivos para você enviar no WhatsApp e recuperar clientes inativos.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-200 to-orange-200 rounded-full blur-[100px] opacity-50 -z-10"></div>
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden transform rotate-2 hover:rotate-0 transition duration-500 group">
                <div className="bg-gray-900 p-4 flex items-center justify-between border-b border-gray-800">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-gray-400 text-xs font-mono">foodcost_ai_advisor.exe</div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2"><Brain className="text-purple-600" /> Insights do Dia</h3>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Online</span>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                    <h4 className="font-bold text-orange-800 text-sm mb-1">Oportunidade Detectada</h4>
                    <p className="text-orange-700 text-sm">O "Burger Clássico" tem margem baixa mas alto volume (Plowhorse). <strong>Sugestão:</strong> Crie um combo com batata e refri para aumentar o ticket médio em 15%.</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Meta de Lucro</span>
                      <span className="font-bold text-green-600">82% Atingida</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 w-[82%] rounded-full"></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                      <div className="text-2xl font-black text-gray-900">R$ 12.4k</div>
                      <div className="text-xs text-gray-500">Previsão 7 Dias</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                      <div className="text-2xl font-black text-purple-600">+12%</div>
                      <div className="text-xs text-gray-500">Tendência</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* More Features Grid */}
      <section className="py-16 md:py-24 bg-white relative">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-6 text-gray-900">Uma Suíte Completa de Operações</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">Do estoque ao delivery, controlamos cada centavo da sua operação.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 shadow-lg hover:shadow-orange-100 group">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                <Smartphone size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">PDV Moderno</h3>
              <p className="text-gray-500 leading-relaxed text-sm">Frente de caixa ágil. Abra mesas, lance pedidos e feche contas em segundos, direto do tablet ou celular.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 shadow-lg hover:shadow-blue-100 group">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                <LayoutDashboard size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Gestão de Mesas</h3>
              <p className="text-gray-500 leading-relaxed text-sm">Mapa visual do salão em tempo real. Saiba exatamente quais mesas estão livres, ocupadas ou aguardando pagamento.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 shadow-lg hover:shadow-green-100 group">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Controle de Estoque</h3>
              <p className="text-gray-500 leading-relaxed text-sm">Baixa automática inteligente. A cada prato vendido, os ingredientes são deduzidos da sua ficha técnica.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100 shadow-lg hover:shadow-purple-100 group">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                <Star size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Clube de Fidelidade</h3>
              <p className="text-gray-500 leading-relaxed text-sm">Sistema de cashback e pontos integrado. Faça seu cliente voltar 3x mais com recompensas automáticas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section (Infinite Scroll) */}
      <section className="py-16 md:py-24 bg-gray-50 border-y border-gray-100 overflow-hidden">
        <div className="text-center mb-16 px-6">
          <h2 className="text-3xl md:text-5xl font-black mb-6 text-gray-900">Quem usa, recomenda!</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto">Veja como donos de restaurantes transformaram seus negócios com o FoodCost Pro.</p>
        </div>

        <div className="relative w-full">
          {/* Gradient Masks for smooth fade out */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-50 to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-50 to-transparent z-10"></div>

          {/* Marquee Container */}
          <div className="flex animate-marquee hover-pause w-max gap-8 px-8">
            {/* List 1 */}
            {[
              {
                name: "Chef Ana Souza",
                role: "Bistrô da Vila",
                image: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                text: "Eu achava que tinha lucro, mas no primeiro mês descobri que 3 pratos do meu cardápio davam prejuízo. Ajustei os preços com a ajuda da IA e meu faturamento subiu 20%!"
              },
              {
                name: "Carlos Mendes",
                role: "Burger Kingz",
                image: "https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                text: "O sistema de ficha técnica é sensacional. Acabou o achismo na cozinha. Agora sei exatamente quanto custa cada grama que vai no prato. Essencial para qualquer dono de restaurante."
              },
              {
                name: "Mariana Lima",
                role: "Pizzaria Napolitana",
                image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                text: "O PDV integrado com o estoque me poupa horas por dia. Antes eu perdia tempo conferindo tudo na mão. Hoje é tudo automático. Recomendo demais!"
              },
              {
                name: "Ricardo Oliveira",
                role: "Sushi House",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                text: "Minha perda de insumos caiu 15% depois que comecei a usar o controle de estoque preciso do FoodCost Pro. O sistema se pagou na primeira semana."
              },
              {
                name: "Fernanda Costa",
                role: "Café & Aroma",
                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                text: "O CRM é incrível! Consegui trazer de volta clientes que não vinham há meses mandando promoções automáticas pelo WhatsApp."
              },
              {
                name: "Roberto Silva",
                role: "Churrascaria Gaúcha",
                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                text: "Gerenciar as mesas no fim de semana era um caos. Com o mapa de mesas do sistema, minha operação flui muito melhor e atendo mais rápido."
              }
            ].map((t, i) => (
              <div key={`l1-${i}`} className="w-[300px] md:w-[400px] bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex-shrink-0">
                <div className="flex text-orange-400 mb-4 gap-1">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed italic text-sm">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden shrink-0">
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{t.name}</h4>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* List 2 (Duplicate) */}
            {[
              {
                name: "Chef Ana Souza",
                role: "Bistrô da Vila",
                image: "https://images.unsplash.com/photo-1583394293214-28ded15ee548?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                text: "Eu achava que tinha lucro, mas no primeiro mês descobri que 3 pratos do meu cardápio davam prejuízo. Ajustei os preços com a ajuda da IA e meu faturamento subiu 20%!"
              },
              {
                name: "Carlos Mendes",
                role: "Burger Kingz",
                image: "https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                text: "O sistema de ficha técnica é sensacional. Acabou o achismo na cozinha. Agora sei exatamente quanto custa cada grama que vai no prato. Essencial para qualquer dono de restaurante."
              },
              {
                name: "Mariana Lima",
                role: "Pizzaria Napolitana",
                image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                text: "O PDV integrado com o estoque me poupa horas por dia. Antes eu perdia tempo conferindo tudo na mão. Hoje é tudo automático. Recomendo demais!"
              },
              {
                name: "Ricardo Oliveira",
                role: "Sushi House",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                text: "Minha perda de insumos caiu 15% depois que comecei a usar o controle de estoque preciso do FoodCost Pro. O sistema se pagou na primeira semana."
              },
              {
                name: "Fernanda Costa",
                role: "Café & Aroma",
                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                text: "O CRM é incrível! Consegui trazer de volta clientes que não vinham há meses mandando promoções automáticas pelo WhatsApp."
              },
              {
                name: "Roberto Silva",
                role: "Churrascaria Gaúcha",
                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
                text: "Gerenciar as mesas no fim de semana era um caos. Com o mapa de mesas do sistema, minha operação flui muito melhor e atendo mais rápido."
              }
            ].map((t, i) => (
              <div key={`l2-${i}`} className="w-[300px] md:w-[400px] bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 flex-shrink-0">
                <div className="flex text-orange-400 mb-4 gap-1">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed italic text-sm">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden shrink-0">
                    <img src={t.image} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">{t.name}</h4>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 md:py-24" id="pricing">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Investimento que se Paga no 1º Dia</h2>
            <p className="text-xl text-gray-600">Escolha o plano ideal para o tamanho do seu sonho.</p>
          </div>

          {/* Mobile: Horizontal Scroll Snap | Desktop: Grid */}
          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-8 items-start overflow-x-auto md:overflow-visible snap-x snap-mandatory pt-12 pb-8 md:pb-0 px-6 md:px-0 -mx-6 md:mx-0 scrollbar-hide">
            {/* Plan 1: Local Operation */}
            <div className="min-w-[80vw] md:min-w-0 snap-center p-6 md:p-8 rounded-3xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition duration-300 relative group">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-100 text-gray-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-gray-200">
                Salão & Balcão
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Operação Local</h3>
              <div className="text-4xl font-black text-gray-900 mb-6">R$ 89,90 <span className="text-sm font-normal text-gray-500">/mês</span></div>
              <p className="text-gray-500 text-sm mb-8">Ideal para restaurantes clássicos, bares e buffets que focam no atendimento presencial.</p>

              <Link to="/auth" className="block w-full py-4 px-6 bg-gray-50 hover:bg-gray-100 text-gray-900 font-bold rounded-xl text-center transition border border-gray-200">
                Começar Grátis (7 dias)
              </Link>

              <div className="mt-8 space-y-4">
                <div className="flex gap-3 text-sm text-gray-700"><CheckCircle2 className="text-gray-400 shrink-0" size={18} /> <strong>Frente de Caixa (PDV)</strong> Ágil</div>
                <div className="flex gap-3 text-sm text-gray-700"><CheckCircle2 className="text-gray-400 shrink-0" size={18} /> <strong>Mapa de Mesas</strong> em Tempo Real</div>
                <div className="flex gap-3 text-sm text-gray-700"><CheckCircle2 className="text-gray-400 shrink-0" size={18} /> Impressão de Comandas</div>
                <div className="flex gap-3 text-sm text-gray-700"><CheckCircle2 className="text-gray-400 shrink-0" size={18} /> Controle de Estoque Básico</div>
              </div>
            </div>

            {/* Plan 3: PRO (Center) */}
            <div className="order-first md:order-none min-w-[80vw] md:min-w-0 snap-center p-6 md:p-8 rounded-3xl bg-gray-900 text-white relative shadow-2xl transform md:-translate-y-6 md:scale-105 z-10 border border-orange-500/30">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-lg shadow-orange-500/40 flex items-center gap-2">
                <Star size={14} fill="currentColor" /> Recomendado
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">FoodCost PRO</h3>
              <div className="text-5xl font-black mb-6 text-white">R$ 149,90 <span className="text-sm font-normal text-gray-400">/mês</span></div>
              <p className="text-gray-300 text-sm mb-8">A suíte completa para quem busca <strong>lucro máximo</strong> e inteligência de dados.</p>

              <Link to="/auth" className="block w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold rounded-xl text-center transition shadow-lg shadow-orange-900/50 transform hover:-translate-y-1">
                Testar Grátis por 7 Dias
              </Link>

              <div className="mt-8 space-y-5">
                <div className="flex gap-3 text-sm text-orange-100 bg-orange-500/10 p-2 rounded-lg -mx-2"><Zap className="text-orange-400 shrink-0" size={18} /> <strong>TUDO dos outros planos</strong></div>
                <div className="flex gap-3 text-sm"><CheckCircle2 className="text-orange-500 shrink-0" size={18} /> <strong>Consultor IA</strong> (Menu Engineering)</div>
                <div className="flex gap-3 text-sm"><CheckCircle2 className="text-orange-500 shrink-0" size={18} /> <strong>Previsão de Vendas</strong> (Forecast)</div>
                <div className="flex gap-3 text-sm"><CheckCircle2 className="text-orange-500 shrink-0" size={18} /> Estoque Avançado (Perda Yield %)</div>
                <div className="flex gap-3 text-sm"><CheckCircle2 className="text-orange-500 shrink-0" size={18} /> Relatórios Financeiros Detalhados</div>
                <div className="flex gap-3 text-sm"><CheckCircle2 className="text-orange-500 shrink-0" size={18} /> Prioridade no Suporte</div>
              </div>
            </div>

            {/* Plan 2: Delivery & Online */}
            <div className="min-w-[80vw] md:min-w-0 snap-center p-6 md:p-8 rounded-3xl bg-white border border-blue-100 hover:border-blue-300 hover:shadow-xl transition duration-300 relative group">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-50 text-blue-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-200">
                Delivery & Digital
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Operação Online</h3>
              <div className="text-4xl font-black text-gray-900 mb-6">R$ 89,90 <span className="text-sm font-normal text-gray-500">/mês</span></div>
              <p className="text-gray-500 text-sm mb-8">Perfeito para Dark Kitchens, Hamburguerias e negócios focados em entrega.</p>

              <Link to="/auth" className="block w-full py-4 px-6 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-xl text-center transition border border-blue-200">
                Começar Grátis (7 dias)
              </Link>

              <div className="mt-8 space-y-4">
                <div className="flex gap-3 text-sm text-gray-700"><CheckCircle2 className="text-blue-400 shrink-0" size={18} /> <strong>Cardápio Digital</strong> (Link na Bio)</div>
                <div className="flex gap-3 text-sm text-gray-700"><CheckCircle2 className="text-blue-400 shrink-0" size={18} /> Gestão de Entregas & Motoboy</div>
                <div className="flex gap-3 text-sm text-gray-700"><CheckCircle2 className="text-blue-400 shrink-0" size={18} /> <strong>CRM de Clientes</strong> (Fidelidade)</div>
                <div className="flex gap-3 text-sm text-gray-700"><CheckCircle2 className="text-blue-400 shrink-0" size={18} /> Integração Pedidos WhatsApp</div>
              </div>
            </div>
          </div>

          {/* Mobile Scroll Indicator (Dots) */}
          <div className="flex justify-center gap-2 mt-4 md:hidden">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => scrollToSlide(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${activeSlide === i ? 'bg-orange-600 w-4' : 'bg-orange-200'
                  }`}
                aria-label={`Ir para plano ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-24 px-6 bg-orange-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Pronto para assumir o controle?</h2>
          <p className="text-xl opacity-90 mb-12 max-w-2xl mx-auto">Junte-se a milhares de donos de restaurantes que pararam de perder dinheiro e começaram a construir um legado.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/auth" className="bg-white text-orange-600 text-xl px-12 py-5 rounded-full font-black hover:bg-gray-100 transition shadow-2xl transform hover:-translate-y-1">
              Criar Conta Gratuita
            </Link>
          </div>
          <p className="mt-6 text-sm opacity-70">Não requer cartão de crédito • Cancelamento a qualquer momento</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-500 py-12 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <ChefHat size={24} className="text-orange-600" />
            <span className="text-lg font-bold">FoodCost Pro</span>
          </div>
          <div className="text-sm">
            © 2025 FoodCost Pro. Todos os direitos reservados.
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Termos</a>
            <a href="#" className="hover:text-white transition">Privacidade</a>
            <a href="#" className="hover:text-white transition">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
