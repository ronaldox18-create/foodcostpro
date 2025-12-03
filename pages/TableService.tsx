import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Product, OrderItem } from '../types';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Search,
    Plus,
    Minus,
    Trash2,
    Clock,
    ArrowLeft,
    ChefHat,
    XCircle,
    Printer,
    Receipt,
    CheckCircle2,
    AlertCircle,
    Package
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

const TableService: React.FC = () => {
    const { products, orders, tables, addOrder, updateOrder, checkStockAvailability } = useApp();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Parâmetros da Mesa
    const tableId = searchParams.get('tableId');
    const existingOrderId = searchParams.get('orderId');

    // Estado do Carrinho e Interface
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [originalItems, setOriginalItems] = useState<OrderItem[]>([]); // Items já salvos no banco
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Estado para controlar o drawer

    // Modais
    const [showKitchenModal, setShowKitchenModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [lastKitchenOrderItems, setLastKitchenOrderItems] = useState<OrderItem[]>([]);

    // Info da Mesa
    const currentTable = useMemo(() => tables.find(t => t.id === tableId), [tables, tableId]);

    // Buscar pedido com fallback
    const currentOrder = useMemo(() => {
        // Primeiro tenta pelo ID exato
        let order = orders.find(o => o.id === existingOrderId);

        // Se não encontrou mas tem tableId, procura pedido aberto dessa mesa
        if (!order && tableId) {
            order = orders.find(o => o.tableId === tableId && o.status === 'open');
        }

        return order;
    }, [orders, existingOrderId, tableId]);

    // Carregar pedido existente
    useEffect(() => {
        if (existingOrderId && currentOrder && currentOrder.items) {
            setCart(currentOrder.items);
            setOriginalItems(currentOrder.items); // Salva o estado inicial para comparação
        } else if (!existingOrderId) {
            setCart([]);
            setOriginalItems([]);
        }
    }, [existingOrderId, currentOrder]);

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
    const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    // Adicionar ao Carrinho
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
                addedAt: new Date().toISOString()
            }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
        if (cart.length <= 1) setIsDrawerOpen(false); // Fecha drawer se remover último item
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

    // Enviar para Cozinha
    const handleSendToKitchen = async () => {
        if (cart.length === 0 || !tableId || !currentTable) return;

        setIsSending(true);
        try {
            const orderData = {
                id: currentOrder?.id || crypto.randomUUID(),
                customerId: 'guest',
                customerName: `Mesa ${currentTable.number}`,
                items: cart,
                totalAmount: cartTotal,
                paymentMethod: 'money' as const,
                status: 'open' as const,
                date: currentOrder?.date || new Date().toISOString(),
                tableId: tableId,
                tableNumber: currentTable.number
            };

            // CALCULAR DIFERENÇA (Apenas novos itens para impressão)
            const newItemsToPrint: OrderItem[] = [];

            cart.forEach(cartItem => {
                const originalItem = originalItems.find(oi => oi.productId === cartItem.productId);

                if (!originalItem) {
                    // Item totalmente novo
                    newItemsToPrint.push(cartItem);
                } else if (cartItem.quantity > originalItem.quantity) {
                    // Quantidade aumentou (adicionar apenas a diferença)
                    const diffQty = cartItem.quantity - originalItem.quantity;
                    newItemsToPrint.push({
                        ...cartItem,
                        quantity: diffQty,
                        total: diffQty * cartItem.unitPrice
                    });
                }
            });

            // Se não houver novos itens, mas o usuário clicou em enviar, 
            // pode ser que ele queira reimprimir tudo ou houve algum erro.
            // Nesse caso, se a lista estiver vazia, usamos o cart todo (fallback),
            // MAS idealmente queremos imprimir só o novo.
            // Se newItemsToPrint for vazio, significa que não houve mudança.

            if (newItemsToPrint.length === 0 && cart.length > 0) {
                // Se não tem nada novo, avisa ou imprime tudo? 
                // Vamos assumir que se ele clicou, ele quer reenviar tudo se não tiver nada novo,
                // OU melhor: avisar que não há novos itens.
                // Mas para simplificar e evitar bloqueio, se não tiver novos, imprime tudo (reimpressão).
                console.log('⚠️ Nenhum item novo detectado. Usando carrinho completo para impressão.');
                setLastKitchenOrderItems(cart);
            } else {
                console.log('✅ Novos itens detectados para cozinha:', newItemsToPrint);

                // VERIFICAR ESTOQUE DOS NOVOS ITENS
                const { available, missingItems } = await checkStockAvailability(newItemsToPrint);
                if (!available) {
                    alert(`⚠️ NÃO É POSSÍVEL ENVIAR O PEDIDO!\n\nEstoque insuficiente para:\n${missingItems.join('\n')}\n\nPor favor, remova os itens sem estoque ou faça a reposição.`);
                    setIsSending(false);
                    return;
                }

                setLastKitchenOrderItems(newItemsToPrint);
            }

            // Atualizar originalItems para o próximo ciclo (após salvar com sucesso)
            // Faremos isso implicitamente pois o updateOrder vai atualizar o currentOrder,
            // que vai disparar o useEffect e atualizar o originalItems.

            if (currentOrder?.id) {
                await updateOrder(orderData);
            } else {
                await addOrder(orderData);
            }

            setShowKitchenModal(true);
        } catch (error) {
            console.error('Erro ao enviar pedido:', error);
            alert('Erro ao enviar pedido para a cozinha. Tente novamente.');
        } finally {
            setIsSending(false);
        }
    };

    // Cancelar Mesa
    const handleCancelTable = async () => {
        if (!currentOrder?.id || !tableId || !currentTable) return;

        try {
            const orderToCancel = {
                id: currentOrder.id,
                customerId: 'guest',
                customerName: 'Cancelado',
                items: [],
                totalAmount: 0,
                paymentMethod: 'money' as const,
                status: 'canceled' as const,
                date: new Date().toISOString(),
                tableId: tableId,
                tableNumber: currentTable.number
            };

            await updateOrder(orderToCancel);
            navigate('/tables');
        } catch (error) {
            console.error('Erro ao cancelar mesa:', error);
            alert('Erro ao cancelar mesa. Tente novamente.');
        }
    };

    // Imprimir Comanda da Cozinha
    const printKitchenTicket = () => {
        // Usar items salvos se disponíveis, senão usar o cart atual
        const itemsToPrint = lastKitchenOrderItems.length > 0 ? lastKitchenOrderItems : cart;

        console.log('👨‍🍳 [TableService] Imprimindo comanda de cozinha...');
        console.log('📦 Items para imprimir:', itemsToPrint.length);

        if (itemsToPrint.length === 0) {
            console.error('❌ Nenhum item para imprimir!');
            alert('Erro: Não há items para imprimir.');
            return;
        }

        const receiptWindow = window.open('', '', 'width=350,height=600');
        if (!receiptWindow) return;

        const dateStr = new Date().toLocaleString('pt-BR');
        const itemsHtml = itemsToPrint.map(item => `
      <div style="margin-bottom: 10px; border-bottom: 1px dashed #ccc; padding-bottom: 5px;">
        <div style="font-size: 18px; font-weight: bold;">${item.quantity}x ${item.productName}</div>
        ${item.addedAt ? `<div style="font-size: 12px; color: #666;">Hora: ${new Date(item.addedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>` : ''}
      </div>
    `).join('');

        const html = `
      <html>
        <head>
          <title>Cozinha - Mesa ${currentTable?.number}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 14px; margin: 0; padding: 15px; width: 80mm; }
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
            .title { font-size: 28px; font-weight: 900; margin-bottom: 5px; }
            .table { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">🍳 COZINHA</div>
            <div class="table">MESA ${currentTable?.number || '-'}</div>
            <div>${dateStr}</div>
          </div>
          <div>${itemsHtml}</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
        receiptWindow.document.write(html);
        receiptWindow.document.close();
    };

    const closeKitchenModal = () => {
        setShowKitchenModal(false);
        navigate('/tables');
    };

    if (!tableId || !currentTable) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <AlertCircle size={64} className="text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Mesa não encontrada</h2>
                    <p className="text-gray-500 mb-6">A mesa que você está tentando acessar não existe.</p>
                    <button onClick={() => navigate('/tables')} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition">
                        Voltar para Mesas
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-safe">
            {/* Header Mobile-First */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={() => navigate('/tables')} className="p-2 hover:bg-gray-100 rounded-full transition -ml-2">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-xs text-gray-400 font-bold uppercase">Mesa</div>
                                <div className="text-2xl font-black text-gray-900">{currentTable.number}</div>
                            </div>

                            {currentOrder && (
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                                    title="Cancelar Mesa"
                                >
                                    <XCircle size={24} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tempo da Mesa */}
                    {currentOrder && (
                        <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl px-4 py-2">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-orange-600" />
                                <span className="text-sm font-bold text-orange-900">Mesa Aberta</span>
                            </div>
                            <span className="text-sm text-orange-600 font-mono">
                                {new Date(currentOrder.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    )}
                </div>

                {/* Busca e Categorias */}
                <div className="px-4 pb-3 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar produto..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-orange-200 text-gray-900 placeholder-gray-400"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat
                                    ? 'bg-orange-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid de Produtos */}
            <div className="p-4 pb-32">
                {/* Aviso: Mesa Aberta Sem Itens */}
                {currentOrder && cart.length === 0 && (
                    <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                        <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="font-bold text-blue-900 mb-1">Mesa aberta sem itens</h4>
                            <p className="text-sm text-blue-700">
                                Esta mesa foi aberta mas ainda não tem nenhum item pedido.
                                Adicione produtos abaixo e clique em "Enviar Cozinha" para registrar o pedido.
                            </p>
                        </div>
                    </div>
                )}

                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Package size={64} className="mb-4 opacity-50" />
                        <p className="font-medium">Nenhum produto encontrado</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filteredProducts.map(product => (
                            <button
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all text-left active:scale-95"
                            >
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1">
                                    {product.category}
                                </span>
                                <h3 className="font-bold text-gray-900 leading-tight mb-3 line-clamp-2 min-h-[40px]">
                                    {product.name}
                                </h3>
                                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                    <span className="font-bold text-lg text-gray-900">{formatCurrency(product.currentPrice)}</span>
                                    <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                                        <Plus size={18} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Carrinho Fixo Mobile - Mostra se tem itens OU se é mesa ocupada */}
            {(cart.length > 0 || currentOrder) && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-40 safe-area-bottom">
                    <div className="px-4 py-3">
                        {/* Resumo Compacto */}
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="text-xs text-gray-400 font-bold uppercase">Total</div>
                                <div className="text-2xl font-black text-gray-900">{formatCurrency(cartTotal)}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-400 font-bold uppercase">{itemCount} Itens</div>
                                {cart.length > 0 && (
                                    <button
                                        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                                        className="text-sm text-orange-600 font-bold hover:underline"
                                    >
                                        {isDrawerOpen ? 'Ocultar Itens' : 'Ver Itens'}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Ações */}
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={handleSendToKitchen}
                                disabled={isSending || cart.length === 0}
                                className="py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                <ChefHat size={18} />
                                <span>Enviar Cozinha</span>
                            </button>
                            <button
                                onClick={() => navigate(`/orders?tableId=${tableId}${currentOrder?.id ? `&orderId=${currentOrder.id}` : ''}`)}
                                className="py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg"
                            >
                                <Receipt size={18} />
                                <span>Fechar Conta</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Drawer de Carrinho (Slide-up) */}
            <div
                className={`fixed inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 z-50 max-h-[70vh] flex flex-col ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full'
                    }`}
            >
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Itens do Pedido ({cart.length})</h3>
                        <button
                            onClick={() => setIsDrawerOpen(false)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <XCircle size={24} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {cart.map((item, index) => (
                        <div key={item.id || `${item.productId}-${index}`} className="bg-gray-50 p-3 rounded-xl">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900">{item.productName}</p>
                                    <p className="text-sm text-gray-500">{formatCurrency(item.unitPrice)} cada</p>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.productId)}
                                    className="text-gray-300 hover:text-red-500 p-1"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 bg-white rounded-lg p-1">
                                    <button
                                        onClick={() => updateQuantity(item.productId, -1)}
                                        className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-600 hover:bg-red-100 hover:text-red-600 active:scale-95 transition"
                                    >
                                        <Minus size={16} />
                                    </button>
                                    <span className="text-lg font-bold w-8 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.productId, 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-600 hover:bg-green-100 hover:text-green-600 active:scale-95 transition"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <span className="text-lg font-bold text-gray-900">{formatCurrency(item.total)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal: Enviado para Cozinha */}
            {showKitchenModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-scale-in">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Pedido Enviado!</h2>
                        <p className="text-gray-500 mb-8">O pedido foi enviado para a cozinha.<br />A mesa continua aberta.</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={printKitchenTicket}
                                className="w-full py-3.5 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"
                            >
                                <Printer size={18} /> Imprimir Comanda
                            </button>
                            <button
                                onClick={closeKitchenModal}
                                className="w-full py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition"
                            >
                                Voltar para Mesas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Cancelar Mesa */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
                        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Cancelar Mesa?</h2>
                        <p className="text-gray-500 mb-8">Esta ação irá cancelar o pedido e liberar a mesa. Tem certeza?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 py-3.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                            >
                                Não
                            </button>
                            <button
                                onClick={handleCancelTable}
                                className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition"
                            >
                                Sim, Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TableService;
