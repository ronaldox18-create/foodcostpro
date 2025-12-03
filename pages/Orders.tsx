import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Product, Order, OrderItem, PaymentMethod } from '../types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CreditCard,
  Banknote,
  QrCode,
  Clock,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  Utensils,
  Save,
  ChefHat,
  XCircle,
  MoreVertical,
  Printer,
  Percent,
  Music,
  DollarSign,
  FileText
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

const Orders: React.FC = () => {
  const { products, customers, addOrder, updateOrder, orders, tables, checkStockAvailability } = useApp();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Parâmetros de Mesa
  const tableId = searchParams.get('tableId');
  const existingOrderId = searchParams.get('orderId');

  // Estado do Carrinho e Contexto
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('guest');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [viewMode, setViewMode] = useState<'pos' | 'history'>('pos');

  // Modais
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showKitchenModal, setShowKitchenModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [lastOrderDetails, setLastOrderDetails] = useState<Order | null>(null);
  const [lastKitchenOrderItems, setLastKitchenOrderItems] = useState<OrderItem[]>([]);

  // Estados de Fechamento de Conta
  const [checkoutConfig, setCheckoutConfig] = useState({
    serviceFeePercent: 10,
    couvertFee: 0,
    discount: 0,
    paymentMethod: 'money' as PaymentMethod
  });

  // Carregar pedido existente se vier da mesa ocupada
  useEffect(() => {
    if (existingOrderId) {
      const existingOrder = orders.find(o => o.id === existingOrderId);
      if (existingOrder) {
        setCart(existingOrder.items);
        setSelectedCustomerId(existingOrder.customerId);
      }
    } else {
      setCart([]);
      setSelectedCustomerId('guest');
    }
  }, [existingOrderId, orders]);

  // Info da Mesa
  const currentTable = useMemo(() => tables.find(t => t.id === tableId), [tables, tableId]);

  // Categorias
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || 'Outros'));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  // Filtros
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  const cartTotal = cart.reduce((acc, item) => acc + item.total, 0);

  // Cálculos de Fechamento
  const checkoutTotals = useMemo(() => {
    const subtotal = cartTotal;
    const serviceFee = (subtotal * checkoutConfig.serviceFeePercent) / 100;
    const totalBeforeDiscount = subtotal + serviceFee + checkoutConfig.couvertFee;
    const discountAmount = checkoutConfig.discount; // Assumindo valor fixo por enquanto
    const finalTotal = Math.max(0, totalBeforeDiscount - discountAmount);

    return { subtotal, serviceFee, totalBeforeDiscount, discountAmount, finalTotal };
  }, [cartTotal, checkoutConfig]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.currentPrice,
        total: product.currentPrice,
        addedAt: new Date().toISOString() // Registrando horário
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty, total: newQty * item.unitPrice };
        }
        return item;
      });
    });
  };

  // Helper para calcular itens novos/incrementados para verificação de estoque
  const getNewItemsToCheck = () => {
    if (!existingOrderId) return cart;

    const existingOrder = orders.find(o => o.id === existingOrderId);
    if (!existingOrder || !existingOrder.items) return cart;

    const newItems: OrderItem[] = [];
    cart.forEach(cartItem => {
      const originalItem = existingOrder.items?.find(i => i.productId === cartItem.productId);
      if (!originalItem) {
        newItems.push(cartItem);
      } else if (cartItem.quantity > originalItem.quantity) {
        newItems.push({
          ...cartItem,
          quantity: cartItem.quantity - originalItem.quantity,
          total: (cartItem.quantity - originalItem.quantity) * cartItem.unitPrice
        });
      }
    });
    return newItems;
  };

  // Salvar Pedido (Mesa Aberta - Enviar para Cozinha)
  const handleSaveOrder = async () => {
    if (cart.length === 0) return;

    // VERIFICAR ESTOQUE
    const itemsToCheck = getNewItemsToCheck();
    if (itemsToCheck.length > 0) {
      const { available, missingItems } = await checkStockAvailability(itemsToCheck);
      if (!available) {
        alert(`⚠️ NÃO É POSSÍVEL SALVAR O PEDIDO!\n\nEstoque insuficiente para:\n${missingItems.join('\n')}\n\nPor favor, remova os itens sem estoque ou faça a reposição.`);
        return;
      }
    }

    if (!tableId) return;

    const customerName = selectedCustomerId === 'guest'
      ? 'Mesa ' + currentTable?.number
      : customers.find(c => c.id === selectedCustomerId)?.name || 'Cliente';

    const orderData: Order = {
      id: existingOrderId || crypto.randomUUID(),
      customerId: selectedCustomerId,
      customerName,
      items: cart,
      totalAmount: cartTotal,
      paymentMethod: 'money', // Provisório
      status: 'open',
      date: existingOrderId ? orders.find(o => o.id === existingOrderId)?.date || new Date().toISOString() : new Date().toISOString(),
      tableId: tableId,
      tableNumber: currentTable?.number
    };

    // Salvar items ANTES de qualquer limpeza de estado
    setLastKitchenOrderItems(cart);

    if (existingOrderId) {
      await updateOrder(orderData);
    } else {
      await addOrder(orderData);
    }

    setShowKitchenModal(true);
  };

  const closeKitchenModal = () => {
    setShowKitchenModal(false);
    navigate('/tables');
  };

  // Abrir Modal de Fechamento
  const openCheckoutModal = (method?: PaymentMethod) => {
    if (method) {
      setCheckoutConfig(prev => ({ ...prev, paymentMethod: method }));
    }
    setShowCheckoutModal(true);
  };

  // Fechar Conta (Checkout Final)
  const handleFinalizeCheckout = async () => {
    // Permite fechar mesa vazia se ela já existir (liberar mesa)
    if (cart.length === 0 && !existingOrderId) return;

    // VERIFICAR ESTOQUE (Apenas se houver novos itens não salvos)
    const itemsToCheck = getNewItemsToCheck();
    if (itemsToCheck.length > 0) {
      const { available, missingItems } = await checkStockAvailability(itemsToCheck);
      if (!available) {
        alert(`⚠️ NÃO É POSSÍVEL FINALIZAR A VENDA!\n\nEstoque insuficiente para:\n${missingItems.join('\n')}\n\nPor favor, remova os itens sem estoque ou faça a reposição.`);
        return;
      }
    }

    const customerName = selectedCustomerId === 'guest'
      ? (tableId ? `Mesa ${currentTable?.number}` : 'Consumidor Final')
      : customers.find(c => c.id === selectedCustomerId)?.name || 'Cliente';

    const orderToSave: Order = {
      id: existingOrderId || crypto.randomUUID(),
      customerId: selectedCustomerId,
      customerName,
      items: cart,
      totalAmount: checkoutTotals.finalTotal, // Total com taxas
      paymentMethod: checkoutConfig.paymentMethod,
      status: 'completed',
      date: existingOrderId ? orders.find(o => o.id === existingOrderId)?.date || new Date().toISOString() : new Date().toISOString(),
      tableId: tableId || undefined,
      tableNumber: currentTable?.number
    };

    if (existingOrderId) {
      await updateOrder(orderToSave);
    } else {
      await addOrder(orderToSave);
    }

    setLastOrderDetails(orderToSave);
    setShowCheckoutModal(false);
    setShowSuccessModal(true);
    setCart([]);
    setSelectedCustomerId('guest');
  };

  // Cancelar Mesa Manualmente
  const handleCancelTable = async () => {
    if (!existingOrderId || !tableId) return;

    if (confirm("Deseja cancelar a mesa e liberar? O pedido será marcado como cancelado.")) {
      const orderToCancel: Order = {
        id: existingOrderId,
        customerId: selectedCustomerId,
        customerName: 'Cancelado',
        items: [],
        totalAmount: 0,
        paymentMethod: 'money',
        status: 'canceled',
        date: new Date().toISOString(),
        tableId: tableId,
        tableNumber: currentTable?.number
      };

      await updateOrder(orderToCancel);
      navigate('/tables');
    }
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setLastOrderDetails(null);
    if (tableId) navigate('/tables');
  };

  // Função de Impressão Unificada e Robusta
  const printReceipt = (data: {
    items: OrderItem[],
    subtotal: number,
    serviceFee?: number,
    couvertFee?: number,
    discount?: number,
    total: number,
    tableNumber?: number,
    date: string,
    id?: string,
    isConference?: boolean
  }) => {
    const receiptWindow = window.open('', '', 'width=350,height=600');
    if (!receiptWindow) return;

    const businessName = 'FoodCostPro Restaurante';
    const dateStr = new Date(data.date).toLocaleString('pt-BR');

    // Verificação de segurança
    if (!data.items || data.items.length === 0) {
      console.error('❌ printReceipt chamado sem items!', data);
      alert('Erro: Não é possível imprimir recibo sem items.');
      return;
    }

    console.log('🖨️ Gerando HTML de impressão com', data.items.length, 'items');
    const itemsHtml = data.items.map(item => {
      const time = item.addedAt ? new Date(item.addedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      return `
          <div style="margin-bottom: 5px; border-bottom: 1px dotted #eee; padding-bottom: 2px;">
              <div style="display: flex; justify-content: space-between; font-weight: bold;">
                  <span>${item.quantity}x ${item.productName}</span>
                  <span>${formatCurrency(item.total)}</span>
              </div>
              ${time ? `<div style="font-size: 10px; color: #666;">Adicionado às ${time}</div>` : ''}
          </div>
      `}).join('');

    const html = `
        <html>
          <head>
            <title>Recibo</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; width: 80mm; color: #000; }
              .header { text-align: center; margin-bottom: 15px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
              .footer { text-align: center; margin-top: 20px; border-top: 1px dashed #000; padding-top: 10px; font-size: 10px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
              .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; }
              .subtitle { text-align: center; font-weight: bold; margin-bottom: 5px; text-transform: uppercase; }
            </style>
          </head>
          <body>
            <div class="header">
              <b style="font-size: 16px;">${businessName}</b><br/>
              Rua Exemplo, 123 - Centro<br/>
              CNPJ: 00.000.000/0001-00<br/>
              <br/>
              <div class="subtitle">${data.isConference ? '*** CONFERÊNCIA DE MESA ***' : 'RECIBO DE VENDA'}</div>
              ${dateStr}<br/>
              ${data.id ? `Pedido: #${data.id.slice(0, 6)}<br/>` : ''}
              ${data.tableNumber ? `Mesa: ${data.tableNumber}` : 'Balcão'}
            </div>
            
            <div style="margin-bottom: 10px;">
                ${itemsHtml}
            </div>

            <div style="border-top: 1px dashed #000; padding-top: 5px;">
                <div class="row">
                    <span>Subtotal</span>
                    <span>${formatCurrency(data.subtotal)}</span>
                </div>
                
                ${data.serviceFee ? `
                <div class="row">
                    <span>Serviço (10%)</span>
                    <span>${formatCurrency(data.serviceFee)}</span>
                </div>` : ''}

                ${data.couvertFee ? `
                <div class="row">
                    <span>Couvert Artístico</span>
                    <span>${formatCurrency(data.couvertFee)}</span>
                </div>` : ''}

                ${data.discount ? `
                <div class="row">
                    <span>Desconto</span>
                    <span>-${formatCurrency(data.discount)}</span>
                </div>` : ''}
            </div>

            <div class="total-row">
                <span>TOTAL ${data.isConference ? 'ESTIMADO' : 'PAGO'}</span>
                <span>${formatCurrency(data.total)}</span>
            </div>
            
            <div class="footer">
                ${data.isConference ? 'Não é documento fiscal.<br/>Confira os itens antes de pagar.' : 'Obrigado pela preferência!<br/>Volte sempre.'}
            </div>
            <script>
                window.onload = function() { window.print(); }
            </script>
          </body>
        </html>
      `;
    receiptWindow.document.write(html);
    receiptWindow.document.close();
  };

  // Handler para o botão de Conferência
  const handlePrintConference = () => {
    const subtotal = cartTotal;
    const serviceFee = subtotal * (checkoutConfig.serviceFeePercent / 100); // Usar a taxa configurada
    const total = subtotal + serviceFee + checkoutConfig.couvertFee - checkoutConfig.discount;

    printReceipt({
      items: cart,
      subtotal,
      serviceFee,
      couvertFee: checkoutConfig.couvertFee,
      discount: checkoutConfig.discount,
      total,
      date: new Date().toISOString(),
      tableNumber: currentTable?.number,
      id: existingOrderId,
      isConference: true
    });
  };

  // Handler para o botão de Recibo Final (após pagamento)
  const handlePrintFinal = () => {
    if (!lastOrderDetails) {
      console.error('❌ lastOrderDetails não encontrado!');
      return;
    }

    console.log('🖨️ Imprimindo recibo final...');
    console.log('📦 Order ID:', lastOrderDetails.id);
    console.log('📦 Items:', lastOrderDetails.items);
    console.log('📦 Quantidade de items:', lastOrderDetails.items?.length || 0);

    // VERIFICAÇÃO: Se items estiver vazio, isso é um erro crítico
    if (!lastOrderDetails.items || lastOrderDetails.items.length === 0) {
      console.error('❌ ERRO CRÍTICO: Pedido sem items!', lastOrderDetails);
      alert('Erro: Não há items para imprimir. Este pedido não possui items.');
      return;
    }

    // Tentar reconstruir os valores se não tivermos salvo breakdown
    // Assumindo que o totalAmount é o final.
    // Se tivermos salvo checkoutConfig no estado antes de limpar, poderíamos usar.
    // Mas como lastOrderDetails é salvo no banco apenas com totalAmount, é difícil recuperar o breakdown exato sem salvar campos extras.
    // Para simplificar no recibo final, mostramos o total.
    // Se quisermos ser precisos, deveríamos salvar service_fee, etc no banco.

    // Por enquanto, imprimimos o total direto.
    printReceipt({
      items: lastOrderDetails.items,
      subtotal: lastOrderDetails.totalAmount, // Simplificação
      total: lastOrderDetails.totalAmount,
      date: lastOrderDetails.date,
      tableNumber: lastOrderDetails.tableNumber,
      id: lastOrderDetails.id,
      isConference: false
    });
  };

  const PaymentIcon = ({ method }: { method: string }) => {
    switch (method) {
      case 'credit': return <CreditCard size={14} />;
      case 'debit': return <CreditCard size={14} className="text-blue-500" />;
      case 'pix': return <QrCode size={14} className="text-green-500" />;
      default: return <Banknote size={14} className="text-green-600" />;
    }
  };

  const printKitchenTicket = () => {
    // Usar items salvos ao invés do cart (que pode estar vazio)
    const itemsToPrint = lastKitchenOrderItems.length > 0 ? lastKitchenOrderItems : cart;

    console.log('👨‍🍳 Imprimindo comanda de cozinha...');
    console.log('📦 Items para imprimir:', itemsToPrint.length);
    console.log('📦 Detalhes dos items:', itemsToPrint);

    if (itemsToPrint.length === 0) {
      console.error('❌ Nenhum item para imprimir na comanda da cozinha!');
      alert('Erro: Não há items para imprimir.');
      return;
    }

    const receiptWindow = window.open('', '', 'width=350,height=600');
    if (!receiptWindow) return;

    const dateStr = new Date().toLocaleString('pt-BR');

    const itemsHtml = itemsToPrint.map(item => `
          <div style="margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
              <div style="font-size: 16px; font-weight: bold;">${item.quantity}x ${item.productName}</div>
              ${item.addedAt ? `<div style="font-size: 12px; color: #000;">Hora: ${new Date(item.addedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>` : ''}
          </div>
      `).join('');

    const html = `
        <html>
          <head>
            <title>Cozinha - Mesa ${currentTable?.number || 'Balcão'}</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 10px; width: 80mm; color: #000; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .title { font-size: 24px; font-weight: 900; display: block; margin-bottom: 5px; }
              .table { font-size: 20px; font-weight: bold; display: block; margin-bottom: 5px; }
            </style>
          </head>
          <body>
            <div class="header">
              <span class="title">COZINHA</span>
              <span class="table">${currentTable ? `MESA ${currentTable.number}` : 'BALCÃO'}</span>
              <span>${dateStr}</span>
            </div>
            
            <div>
                ${itemsHtml}
            </div>
            
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `;
    receiptWindow.document.write(html);
    receiptWindow.document.close();
  };

  const isActionDisabled = cart.length === 0 && !existingOrderId;

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col bg-gray-50 animate-fade-in relative -m-6 p-6">

      {/* Header Simplificado */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/tables')} className="p-2 hover:bg-white hover:shadow-sm rounded-full text-gray-500 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {tableId ? <><Utensils className="text-orange-600" size={24} /> Mesa {currentTable?.number}</> : 'Novo Pedido'}
          </h1>
          <p className="text-gray-500 text-sm">{tableId ? 'Gerencie os pedidos da mesa' : 'Venda de balcão'}</p>
        </div>

        {/* Toggle View Mode se não for mesa */}
        {!tableId && (
          <div className="ml-auto bg-white p-1 rounded-lg border border-gray-200 flex">
            <button onClick={() => setViewMode('pos')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'pos' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>PDV</button>
            <button onClick={() => setViewMode('history')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'history' ? 'bg-orange-50 text-orange-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}>Histórico</button>
          </div>
        )}
      </div>

      {viewMode === 'pos' ? (
        <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">

          {/* ESQUERDA: Catálogo de Produtos */}
          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Barra de Pesquisa e Categorias */}
            <div className="p-5 border-b border-gray-100 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-orange-100 text-gray-900 placeholder-gray-400 transition-all"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-orange-600 text-white shadow-md shadow-orange-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Produtos */}
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50">
              {filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                  <ShoppingBag size={64} className="mb-4 text-gray-300" />
                  <p className="font-medium">Nenhum produto encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map(product => (
                    <div
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 cursor-pointer transition-all group flex flex-col h-full"
                    >
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1 block">{product.category}</span>
                      <h3 className="font-bold text-gray-900 leading-tight mb-auto line-clamp-2">{product.name}</h3>
                      <div className="flex justify-between items-end mt-4 pt-4 border-t border-gray-50">
                        <span className="font-bold text-lg text-gray-900">{formatCurrency(product.currentPrice)}</span>
                        <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-sm">
                          <Plus size={16} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* DIREITA: Carrinho / Comanda */}
          <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden flex-shrink-0 h-full">

            {/* Header do Carrinho - Mais Limpo */}
            <div className={`px-6 py-4 text-white flex justify-between items-center ${tableId ? 'bg-gray-900' : 'bg-gray-800'}`}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  {tableId ? <Utensils size={20} /> : <ShoppingBag size={20} />}
                </div>
                <div>
                  <h2 className="font-bold text-base leading-tight">
                    {tableId ? `Mesa ${currentTable?.number}` : 'Novo Pedido'}
                  </h2>
                  <p className="text-xs text-white/60 font-medium">
                    {cart.length} itens lançados
                  </p>
                </div>
              </div>
              {tableId && existingOrderId && (
                <button onClick={handleCancelTable} title="Cancelar Mesa" className="p-2 hover:bg-white/10 rounded-lg transition text-white/60 hover:text-red-400">
                  <XCircle size={20} />
                </button>
              )}
            </div>

            {/* Lista de Itens - Mais Compacta */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                    <ShoppingBag size={32} strokeWidth={1.5} className="text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">Nenhum item adicionado</p>
                  <p className="text-xs">Selecione produtos ao lado</p>
                </div>
              ) : (
                cart.map((item, index) => (
                  <div key={item.id || `${item.productId}-${index}`} className="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm animate-slide-up group hover:border-orange-200 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 pr-2">
                        <p className="text-sm font-bold text-gray-900 leading-tight mb-0.5">{item.productName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatCurrency(item.unitPrice)}</span>
                          {item.addedAt && (
                            <span className="flex items-center gap-1 text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">
                              <Clock size={8} /> {new Date(item.addedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-gray-900">
                        {formatCurrency(item.total)}
                      </div>
                    </div>

                    {/* Controles de Quantidade */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <button onClick={() => removeFromCart(item.productId)} className="text-gray-300 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={16} />
                      </button>
                      <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1">
                        <button onClick={() => updateQuantity(item.productId, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-red-500 active:scale-95 transition"><Minus size={12} /></button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.productId, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-green-500 active:scale-95 transition"><Plus size={12} /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Otimizado */}
            <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10">
              <div className="flex justify-between items-end mb-5">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Total Parcial</p>
                  <p className="text-3xl font-black text-gray-900 tracking-tight leading-none">{formatCurrency(cartTotal)}</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Ações Secundárias (Grid) */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Botão Imprimir Conferência (NOVO) */}
                  <button
                    type="button"
                    onClick={handlePrintConference}
                    disabled={cart.length === 0}
                    className="py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2 text-xs uppercase disabled:opacity-50"
                  >
                    <Printer size={18} /> Conferência
                  </button>

                  {/* Botão Enviar Cozinha */}
                  {tableId && (
                    <button
                      onClick={handleSaveOrder}
                      disabled={cart.length === 0}
                      className="py-3 bg-orange-100 text-orange-700 font-bold rounded-xl hover:bg-orange-200 transition flex items-center justify-center gap-2 text-xs uppercase disabled:opacity-50"
                    >
                      <ChefHat size={18} /> Cozinha
                    </button>
                  )}
                </div>

                {/* Botão Principal: Fechar Conta */}
                <button
                  onClick={() => openCheckoutModal()} // Abre modal sem método pré-definido
                  disabled={isActionDisabled}
                  className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle size={20} /> Fechar Conta & Pagar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Modo Histórico */
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col p-8 items-center justify-center text-gray-400">
          <p>Histórico disponível na aba de Pedidos do menu principal.</p>
        </div>
      )}

      {/* MODAL DE CHECKOUT PROFISSIONAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <FileText className="text-orange-600" /> Fechamento de Conta
              </h2>
              <p className="text-sm text-gray-500">Revise os valores antes de finalizar.</p>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Resumo do Consumo */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Subtotal (Consumo)</span>
                  <span className="font-bold">{formatCurrency(checkoutTotals.subtotal)}</span>
                </div>

                {/* Taxa de Serviço */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Percent size={16} />
                    <span>Taxa de Serviço (%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={checkoutConfig.serviceFeePercent}
                      onChange={e => setCheckoutConfig({ ...checkoutConfig, serviceFeePercent: Number(e.target.value) })}
                      className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-right font-bold text-sm"
                    />
                    <span className="font-bold w-20 text-right text-orange-600">
                      + {formatCurrency(checkoutTotals.serviceFee)}
                    </span>
                  </div>
                </div>

                {/* Couvert Artístico */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Music size={16} />
                    <span>Couvert Artístico (R$)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={checkoutConfig.couvertFee}
                      onChange={e => setCheckoutConfig({ ...checkoutConfig, couvertFee: Number(e.target.value) })}
                      className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-right font-bold text-sm"
                    />
                  </div>
                </div>

                {/* Desconto */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={16} />
                    <span>Desconto (R$)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={checkoutConfig.discount}
                      onChange={e => setCheckoutConfig({ ...checkoutConfig, discount: Number(e.target.value) })}
                      className="w-24 px-2 py-1 border border-gray-200 rounded-lg text-right font-bold text-sm text-green-600"
                    />
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 my-4"></div>

                {/* Total Final */}
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black text-gray-900">TOTAL FINAL</span>
                  <span className="text-3xl font-black text-gray-900">{formatCurrency(checkoutTotals.finalTotal)}</span>
                </div>
              </div>

              {/* Método de Pagamento */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-4 gap-2">
                  {['credit', 'debit', 'pix', 'money'].map((method) => (
                    <button
                      key={method}
                      onClick={() => setCheckoutConfig({ ...checkoutConfig, paymentMethod: method as PaymentMethod })}
                      className={`py-2 rounded-xl border text-xs font-bold uppercase transition-all ${checkoutConfig.paymentMethod === method ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                    >
                      {method === 'money' ? 'Dinheiro' : method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button onClick={() => setShowCheckoutModal(false)} className="flex-1 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-100 transition">
                Voltar
              </button>
              <button onClick={handleFinalizeCheckout} className="flex-[2] py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition shadow-lg shadow-green-200 flex items-center justify-center gap-2">
                <CheckCircle size={18} /> Finalizar Conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUCESSO - FECHAR CONTA */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-scale-in">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><CheckCircle size={40} /></div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Conta Fechada!</h2>
            <p className="text-gray-500 mb-8 font-medium">Mesa liberada e pedido finalizado.</p>
            <div className="flex flex-col gap-3">
              <button onClick={handlePrintFinal} className="w-full py-3.5 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2">
                <Printer size={18} /> Imprimir Recibo
              </button>
              <button onClick={closeSuccessModal} className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-lg">Novo Pedido</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUCESSO - COZINHA */}
      {showKitchenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-scale-in">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm"><ChefHat size={40} /></div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Enviado!</h2>
            <p className="text-gray-500 mb-8 font-medium">O pedido foi para a cozinha.<br />A mesa continua aberta.</p>
            <div className="flex flex-col gap-3">
              <button onClick={printKitchenTicket} className="w-full py-3.5 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2">
                <Printer size={18} /> Imprimir para Cozinha
              </button>

              <div className="flex gap-3">
                <button onClick={() => setShowKitchenModal(false)} className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition">
                  Continuar
                </button>
                <button onClick={closeKitchenModal} className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Orders;
