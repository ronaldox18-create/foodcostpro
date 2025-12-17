import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { formatCurrency } from '../utils/calculations';
import { Order, OrderStatus, PaymentMethod } from '../types';
import {
    Package, Clock, CheckCircle, XCircle, Truck, User, Phone, MapPin,
    ShoppingBag, DollarSign, FileText, Utensils, Store, Globe,
    Filter, Search, Calendar, Grid3x3, ChefHat, CheckCircle2,
    LayoutGrid, List, SlidersHorizontal, ArrowUpRight, AlertCircle, Trash2, MoreHorizontal, Printer
} from 'lucide-react';
import ConfirmPaymentModal from '../components/ConfirmPaymentModal';

const AllOrders: React.FC = () => {
    const navigate = useNavigate();
    const { orders, loading: contextLoading, updateOrder, handleStockUpdate, checkStockAvailability } = useApp();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterGroup, setFilterGroup] = useState<'all' | 'active' | 'history' | 'canceled'>('active');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedSource, setSelectedSource] = useState<'all' | 'virtual' | 'table' | 'counter' | 'ifood'>('all');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);

    // Paginação
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Filtro de Data
    const [dateFilter, setDateFilter] = useState<'today' | '7days' | 'month' | 'all'>('all');

    // Quick Stats do dia
    const todayStats = useMemo(() => {
        const today = new Date().toDateString();
        const todaysOrders = orders.filter(o => new Date(o.date).toDateString() === today);
        return {
            count: todaysOrders.length,
            total: todaysOrders.reduce((acc, o) => acc + o.totalAmount, 0),
            active: todaysOrders.filter(o => !['completed', 'canceled'].includes(o.status)).length
        };
    }, [orders]);

    // Helpers
    const getOrderSource = (order: Order): 'virtual' | 'table' | 'counter' | 'ifood' => {
        if ((order as any).integrationSource === 'ifood' || (order as any).integration_source === 'ifood') return 'ifood';
        if (order.deliveryType) return 'virtual';
        if (order.tableId) return 'table';
        return 'counter';
    };

    const getStatusInfo = (status: OrderStatus) => {
        switch (status) {
            case 'pending': return { label: 'Pendente', color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', icon: Clock };
            case 'confirmed': return { label: 'Confirmado', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: CheckCircle };
            case 'preparing': return { label: 'Preparando', color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', icon: ChefHat };
            case 'ready': return { label: 'Pronto', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: CheckCircle2 };
            case 'delivered': return { label: 'Saiu p/ Entrega', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', icon: Truck };
            case 'completed': return { label: 'Concluído', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200', icon: CheckCircle2 };
            case 'canceled':
                return { label: 'Cancelado', color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', icon: XCircle };
            default: return { label: status, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', icon: Clock };
        }
    };

    const getSourceInfo = (source: string) => {
        const map = {
            virtual: { label: 'Cardápio Virtual', icon: Globe, color: 'text-blue-600' },
            table: { label: 'Mesa/Salão', icon: Utensils, color: 'text-gray-600' },
            counter: { label: 'Balcão/PDV', icon: Store, color: 'text-gray-600' },
            ifood: { label: 'iFood', icon: Store, color: 'text-red-500 font-black' } // Usando Store temporário se não tiver icone especifico, mas vamos customizar
        };
        // @ts-ignore
        if (source === 'ifood') return { label: 'iFood', icon: () => <span className="font-black text-red-500 tracking-tighter text-xs">iFood</span>, color: 'text-red-600' };

        return map[source as keyof typeof map] || map.counter;
    };

    const handlePrintOrder = (e: React.MouseEvent, order: any) => {
        e.stopPropagation();
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <html>
            <head>
                <title>Pedido #${order.id.slice(0, 8)}</title>
                <style>
                    body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                    .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
                    .total { border-top: 1px dashed #000; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between; font-weight: bold; }
                    .footer { text-align: center; margin-top: 20px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>PEDIDO #${order.id.slice(0, 6).toUpperCase()}</h2>
                    <p>${new Date(order.date).toLocaleString('pt-BR')}</p>
                    <p>Cliente: ${order.customerName}</p>
                    ${order.tableNumber ? `<p>Mesa: ${order.tableNumber}</p>` : ''}
                    ${order.delivery_type === 'delivery' ? `<p>Entrega: ${order.delivery_address || 'Endereço não informado'}</p>` : ''}
                </div>
                <div class="items">
                    ${order.items.map((item: any) => `
                        <div class="item">
                            <span>${item.quantity}x ${item.productName}</span>
                            <span>${item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        ${item.selectedAddons && item.selectedAddons.length > 0 ? `
                            <div style="margin-left: 20px; margin-top: 2px; margin-bottom: 5px;">
                                ${item.selectedAddons.map((addon: any) => `
                                    <div style="font-size: 11px; color: #666;">
                                        <span>  + ${addon.addon_name}</span>
                                        ${addon.price_adjustment > 0 ? ` <span style="float: right;">+${addon.price_adjustment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    `).join('')}
                </div>
                <div class="total">
                    <span>TOTAL</span>
                    <span>${order.totalAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div class="footer">
                    <p style="font-weight: bold; margin-bottom: 5px;">*** NÃO É DOCUMENTO FISCAL ***</p>
                    <p>Obrigado pela preferência!</p>
                </div>
                <script>
                    window.onload = function() { 
                        window.focus();
                        setTimeout(function() { window.print(); }, 250);
                    }
                    window.onafterprint = function() {
                        window.close();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    // Filtragem
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const s = order.status.toLowerCase().trim();

            // Filtro por Grupo de Status
            if (filterGroup === 'active') {
                // Ativos são todos que NÃO são concluídos nem cancelados
                if (['completed', 'canceled', 'cancelled'].includes(s)) return false;
            } else if (filterGroup === 'history') {
                if (s !== 'completed') return false;
            } else if (filterGroup === 'canceled') {
                if (!['canceled', 'cancelled'].includes(s)) return false;
            }

            // Filtro de Data
            const orderDate = new Date(order.date);
            const now = new Date();

            if (dateFilter === 'today') {
                if (orderDate.toDateString() !== now.toDateString()) return false;
            } else if (dateFilter === '7days') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                if (orderDate < sevenDaysAgo) return false;
            } else if (dateFilter === 'month') {
                if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) return false;
            }

            if (selectedSource !== 'all') {
                const isVirtual = (order as any).delivery_type || (order as any).deliveryType;
                const isTable = order.tableId;
                const isIfood = (order as any).integrationSource === 'ifood' || (order as any).integration_source === 'ifood';

                if (selectedSource === 'virtual' && (!isVirtual || isIfood)) return false; // iFood não é virtual padrão
                if (selectedSource === 'table' && !isTable) return false;
                if (selectedSource === 'counter' && (isVirtual || isTable || isIfood)) return false;
                if (selectedSource === 'ifood' && !isIfood) return false;
            }

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesCustomer = order.customerName?.toLowerCase().includes(term);
                const matchesId = order.id.toLowerCase().includes(term);
                const matchesItems = order.items?.some(item => item.productName.toLowerCase().includes(term));

                if (!matchesCustomer && !matchesId && !matchesItems) return false;
            }

            return true;
        })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Sempre ordenar por data decrescente
    }, [orders, filterGroup, selectedSource, searchTerm, dateFilter]);

    // Pedidos paginados
    const paginatedOrders = useMemo(() => {
        return filteredOrders.slice(0, page * ITEMS_PER_PAGE);
    }, [filteredOrders, page]);

    const hasMore = paginatedOrders.length < filteredOrders.length;

    const handleConfirmPayment = async (paymentMethod: PaymentMethod, cashRegisterId: string | null) => {
        if (!confirmingOrder) return;

        setUpdatingOrderId(confirmingOrder.id);
        try {
            // CRITICAL: Verificar estoque antes de finalizar
            const itemsToCheck = confirmingOrder.items.map(item => ({ ...item }));
            const { available, missingItems } = await checkStockAvailability(itemsToCheck);

            if (!available) {
                alert(`❌ ESTOQUE INSUFICIENTE!\n\nNão é possível finalizar o pedido. Itens em falta:\n\n${missingItems.join('\n')}\n\nReponha o estoque antes de continuar.`);
                setConfirmingOrder(null);
                setUpdatingOrderId(null);
                return;
            }

            await updateOrder({
                ...confirmingOrder,
                status: 'completed',
                paymentMethod: paymentMethod,
                cash_register_id: cashRegisterId
            } as any);

            setConfirmingOrder(null);
            setSelectedOrder(null);
        } catch (error) {
            console.error("Erro ao finalizar pagamento:", error);
            alert("Erro ao finalizar pagamento.");
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
        // INTERCEPT COMPLETION FOR PAYMENT CONFIRMATION
        if (newStatus === 'completed') {
            // Check if we need to confirm payment (basically always good practice before closing)
            // Especially for Cash orders or if we want to ensure it enters a register
            setConfirmingOrder(order);
            return;
        }

        setUpdatingOrderId(order.id);
        try {
            // Verificar e baixar estoque se estiver aceitando um pedido pendente
            if (order.status === 'pending' && newStatus === 'confirmed') {
                const itemsToCheck = order.items.map(item => ({ ...item }));
                const { available, missingItems } = await checkStockAvailability(itemsToCheck);

                if (!available) {
                    alert(`Estoque insuficiente:\n${missingItems.join('\n')}`);
                    return;
                }

                await handleStockUpdate(itemsToCheck);
            }

            await updateOrder({ ...order, status: newStatus });
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status.");
        } finally {
            setUpdatingOrderId(null);
        }
    };

    if (contextLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 md:pb-8 animate-fade-in relative">
            {/* Header com Stats e Título */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-2">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Gerenciamento de Pedidos</h1>
                    <p className="text-gray-500 mt-1">Acompanhe e controle o fluxo de produção em tempo real.</p>
                </div>

                {/* Stats Rápidos */}
                <div className="flex gap-3 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                    <div className="bg-white p-3 min-w-[140px] rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
                            <ShoppingBag size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Hoje</p>
                            <p className="text-xl font-black text-gray-900">{todayStats.count}</p>
                        </div>
                    </div>
                    <div className="bg-white p-3 min-w-[140px] rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-xl text-green-600">
                            <DollarSign size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Faturamento</p>
                            <p className="text-xl font-black text-gray-900">{formatCurrency(todayStats.total)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar Principal (Tabs + Search) */}
            <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md py-2 -mx-4 px-4 md:mx-0 md:px-0 md:static md:bg-transparent">
                <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                    {/* Tabs de Filtro (Grupo) */}
                    <div className="flex p-1 bg-gray-100/50 rounded-xl w-full md:w-auto overflow-x-auto hide-scrollbar">
                        {[
                            { id: 'active', label: 'Em Andamento', icon: Clock },
                            { id: 'history', label: 'Concluídos', icon: CheckCircle2 },
                            { id: 'canceled', label: 'Cancelados', icon: XCircle },
                            { id: 'all', label: 'Todos', icon: List }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setFilterGroup(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 ${filterGroup === tab.id
                                    ? 'bg-white text-gray-900 shadow-sm ring-1 ring-black/5'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                                    }`}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Busca e Filtros */}
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar cliente, ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-gray-400"
                            />
                        </div>

                        <div className="relative">
                            <select
                                value={selectedSource}
                                onChange={(e) => setSelectedSource(e.target.value as any)}
                                className="appearance-none pl-9 pr-8 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-600 focus:ring-2 focus:ring-orange-100 cursor-pointer min-w-[140px]"
                            >
                                <option value="all">Todas Origens</option>
                                <option value="table">Mesas</option>
                                <option value="virtual">Delivery</option>
                                <option value="counter">Balcão</option>
                                <option value="ifood">iFood</option>
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                <Filter size={14} />
                            </div>
                        </div>

                        {/* Filtro de Data */}
                        <div className="relative">
                            <select
                                value={dateFilter}
                                onChange={(e) => { setDateFilter(e.target.value as any); setPage(1); }}
                                className="appearance-none pl-9 pr-8 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-600 focus:ring-2 focus:ring-orange-100 cursor-pointer min-w-[120px]"
                            >
                                <option value="all">Todo Período</option>
                                <option value="today">Hoje</option>
                                <option value="7days">Últimos 7 dias</option>
                                <option value="month">Este Mês</option>
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                <Calendar size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid de Pedidos */}
            <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 ${viewMode === 'list' ? 'md:grid-cols-1 xl:grid-cols-1' : ''}`}>
                {paginatedOrders.length === 0 ? (
                    <div className="md:col-span-3 text-center py-20">
                        <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={40} className="text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Nenhum pedido encontrado</h3>
                        <p className="text-gray-500">Tente mudar os filtros ou busque por outro termo.</p>
                    </div>
                ) : (
                    paginatedOrders.map(order => {
                        const statusInfo = getStatusInfo(order.status);
                        const sourceInfo = getSourceInfo(getOrderSource(order));

                        return (
                            <div
                                key={order.id}
                                onClick={() => setSelectedOrder(order)}
                                className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-orange-100 transition-all duration-300 cursor-pointer overflow-hidden relative flex flex-col"
                            >
                                {/* Active Strip */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusInfo.bgColor.replace('bg-', 'bg-').replace('50', '500')}`}></div>

                                <div className="p-5 pl-6 flex-1 flex flex-col">
                                    {/* Header Card */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                    #{order.id.slice(0, 6).toUpperCase()}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-1">{order.customerName}</h3>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5 border ${statusInfo.bgColor} ${statusInfo.color} ${statusInfo.borderColor}`}>
                                            {React.createElement(statusInfo.icon, { size: 12 })}
                                            {statusInfo.label}
                                        </div>
                                    </div>

                                    {/* Items Preview */}
                                    <div className="space-y-2 mb-4 flex-1">
                                        {order.items.slice(0, 3).map((item, i) => (
                                            <div key={i} className="flex justify-between items-center text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                                                <span className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-xs min-w-[24px] text-center">{item.quantity}x</span>
                                                    <span className="line-clamp-1">{item.productName}</span>
                                                </span>
                                            </div>
                                        ))}
                                        {order.items.length > 3 && (
                                            <p className="text-xs text-violet-600 font-bold pl-8">+ {order.items.length - 3} itens...</p>
                                        )}
                                    </div>

                                    {/* Footer Card */}
                                    <div className="border-t border-dashed border-gray-100 pt-3 mt-auto space-y-2">
                                        {/* Forma de Pagamento */}
                                        {order.paymentMethod && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <DollarSign size={12} className="text-green-600" />
                                                <span className="text-gray-600 font-medium">
                                                    {{
                                                        'dinheiro': '💵 Dinheiro',
                                                        'pix': '🔗 PIX',
                                                        'cartao_credito': '💳 Crédito',
                                                        'cartao_debito': '💳 Débito'
                                                    }[order.paymentMethod] || order.paymentMethod}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                                                {React.createElement(sourceInfo.icon, { size: 14 })}
                                                <span>
                                                    {sourceInfo.label}
                                                    {order.tableNumber && <span className="text-gray-900 ml-1">Mesa {order.tableNumber}</span>}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={(e) => handlePrintOrder(e, order)}
                                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                                    title="Imprimir Recibo"
                                                >
                                                    <Printer size={18} />
                                                </button>
                                                <p className="font-black text-gray-900 text-lg">{formatCurrency(order.totalAmount)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Action Button Overlay */}
                                <div className="absolute right-4 bottom-20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                    <button className="w-10 h-10 bg-orange-600 text-white rounded-full shadow-lg hover:bg-orange-700 flex items-center justify-center">
                                        <ArrowUpRight size={20} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Botão Carregar Mais */}
            {hasMore && (
                <div className="text-center mt-8">
                    <button
                        onClick={() => setPage(page + 1)}
                        className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-pink-600 transition shadow-lg inline-flex items-center gap-2"
                    >
                        <ArrowUpRight size={20} />
                        Carregar Mais Pedidos
                    </button>
                    <p className="text-xs text-gray-500 mt-3">
                        Mostrando {paginatedOrders.length} de {filteredOrders.length} pedidos
                    </p>
                </div>
            )}

            {/* Modal de Detalhes do Pedido */}
            {selectedOrder && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedOrder(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="p-6 bg-white border-b border-gray-100 flex justify-between items-start shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Pedido #{selectedOrder.id.slice(0, 6).toUpperCase()}</h2>
                                <p className="text-sm text-gray-500 font-medium mt-1 flex items-center gap-2">
                                    <Clock size={14} /> {new Date(selectedOrder.date).toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => handlePrintOrder(e, selectedOrder)}
                                    className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition text-gray-500"
                                    title="Imprimir Recibo"
                                >
                                    <Printer size={20} />
                                </button>
                                <button onClick={() => setSelectedOrder(null)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition text-gray-500">
                                    <XCircle size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {/* Status Bar */}
                            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Status Atual</p>
                                    <div className={`flex items-center gap-2 font-bold ${getStatusInfo(selectedOrder.status).color}`}>
                                        {React.createElement(getStatusInfo(selectedOrder.status).icon, { size: 18 })}
                                        {getStatusInfo(selectedOrder.status).label}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total</p>
                                    <p className="text-2xl font-black text-gray-900 line-clamp-1">{formatCurrency(selectedOrder.totalAmount)}</p>
                                </div>
                            </div>

                            {/* Itens List */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
                                    <ShoppingBag size={16} className="text-orange-600" /> Itens do Pedido
                                </h4>
                                {selectedOrder.items?.map((item, idx) => (
                                    <div key={idx} className="border-b border-dashed border-gray-100 last:border-0 py-3">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-gray-900 w-6">{item.quantity}x</span>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{item.productName}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-gray-600">{formatCurrency(item.total)}</span>
                                        </div>

                                        {/* Complementos */}
                                        {(item as any).selectedAddons && (item as any).selectedAddons.length > 0 && (
                                            <div className="ml-9 mt-2 space-y-1">
                                                {(item as any).selectedAddons.map((addon: any, addonIdx: number) => (
                                                    <div key={addonIdx} className="flex items-center justify-between text-xs text-gray-600">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="w-1 h-1 bg-yellow-500 rounded-full"></span>
                                                            <span className="font-medium">{addon.addon_name}</span>
                                                        </div>
                                                        {addon.price_adjustment > 0 && (
                                                            <span className="text-green-600 font-semibold">
                                                                +{formatCurrency(addon.price_adjustment)}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Customer Info */}
                            <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100/50 space-y-3">
                                <h4 className="font-bold text-orange-900 flex items-center gap-2 text-sm uppercase tracking-wide">
                                    <User size={16} /> Cliente
                                </h4>
                                <div>
                                    <p className="font-bold text-gray-900 text-lg">{selectedOrder.customerName}</p>
                                    {(selectedOrder as any).phone && (
                                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                                            <Phone size={14} /> {(selectedOrder as any).phone}
                                        </p>
                                    )}
                                    {/* Endereço se houver */}
                                    {(selectedOrder as any).delivery_address && (
                                        <div className="mt-2 pt-2 border-t border-orange-100">
                                            <p className="text-xs font-bold text-orange-800 uppercase mb-1">Entrega</p>
                                            <p className="text-sm text-gray-700 flex items-center gap-2">
                                                <MapPin size={14} className="flex-shrink-0 text-orange-500" />
                                                <span className="line-clamp-2">{(selectedOrder as any).delivery_address}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Forma de Pagamento */}
                            {selectedOrder.paymentMethod && (
                                <div className="bg-green-50 p-4 rounded-2xl border border-green-200">
                                    <h4 className="font-bold text-green-900 flex items-center gap-2 text-sm uppercase tracking-wide mb-2">
                                        <DollarSign size={16} /> Pagamento
                                    </h4>
                                    <p className="text-lg font-bold text-gray-900">
                                        {{
                                            'dinheiro': '💵 Dinheiro',
                                            'pix': '🔗 PIX',
                                            'cartao_credito': '💳 Cartão de Crédito',
                                            'cartao_debito': '💳 Cartão de Débito'
                                        }[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer - Actions */}
                        <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                            <div className="grid grid-cols-2 gap-3">
                                {selectedOrder.status === 'open' && (
                                    <button onClick={() => { handleStatusChange(selectedOrder, 'completed'); }} className="col-span-2 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200">
                                        Concluir Venda
                                    </button>
                                )}
                                {selectedOrder.status === 'pending' && (
                                    <>
                                        <button onClick={() => { handleStatusChange(selectedOrder, 'confirmed'); setSelectedOrder(null); }} className="py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                                            <CheckCircle2 size={18} /> Aceitar
                                        </button>
                                        <button onClick={() => { if (confirm('Cancelar este pedido?')) { handleStatusChange(selectedOrder, 'canceled'); setSelectedOrder(null); } }} className="py-3 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition flex items-center justify-center gap-2">
                                            <XCircle size={18} /> Cancelar
                                        </button>
                                    </>
                                )}
                                {selectedOrder.status === 'confirmed' && (
                                    <button onClick={() => { handleStatusChange(selectedOrder, 'preparing'); setSelectedOrder(null); }} className="col-span-2 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition flex items-center justify-center gap-2 shadow-lg shadow-orange-200">
                                        <ChefHat size={18} /> Iniciar Preparo
                                    </button>
                                )}
                                {selectedOrder.status === 'preparing' && (
                                    <button onClick={() => { handleStatusChange(selectedOrder, 'ready'); setSelectedOrder(null); }} className="col-span-2 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                                        <CheckCircle2 size={18} /> Marcar Pronto
                                    </button>
                                )}
                                {selectedOrder.status === 'ready' && (
                                    (selectedOrder as any).deliveryType === 'delivery' ? (
                                        <button onClick={() => { handleStatusChange(selectedOrder, 'delivered'); setSelectedOrder(null); }} className="col-span-2 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                                            <Truck size={18} /> Saiu para Entrega
                                        </button>
                                    ) : (
                                        <button onClick={() => { handleStatusChange(selectedOrder, 'completed'); }} className="col-span-2 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                                            <CheckCircle2 size={18} /> Entregue / Concluído
                                        </button>
                                    )
                                )}
                                {selectedOrder.status === 'delivered' && (
                                    <button onClick={() => { handleStatusChange(selectedOrder, 'completed'); }} className="col-span-2 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg shadow-green-200">
                                        <CheckCircle size={18} /> Finalizar Pedido
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            )
            }

            {/* Confirm Payment Modal */}
            {confirmingOrder && (
                <ConfirmPaymentModal
                    order={confirmingOrder}
                    onConfirm={handleConfirmPayment}
                    onCancel={() => setConfirmingOrder(null)}
                />
            )}
        </div >
    );
};

export default AllOrders;
