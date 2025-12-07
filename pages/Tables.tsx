import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Trash2, Utensils, Clock, DollarSign, LayoutGrid,
    AlertCircle, CheckCircle2, User, Search, RefreshCw, XCircle, ArrowRight
} from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import PlanGuard from '../components/PlanGuard';

// Status Enum para filtros
type TableFilter = 'all' | 'free' | 'occupied';

// Componente Card de Mesa Individual
const TableCard = ({ table, onDelete, onClick }: { table: any, onDelete: (id: string) => void, onClick: (id: string, status: string, orderId?: string) => void }) => {
    const { orders } = useApp();
    const [elapsedTime, setElapsedTime] = useState<string>('-');
    const [durationMinutes, setDurationMinutes] = useState(0);

    const associatedOrder = useMemo(() => {
        if (table.status !== 'occupied') return null;
        if (table.currentOrderId) {
            return orders.find(o => o.id === table.currentOrderId);
        }
        return orders.find(o => o.tableId === table.id && o.status === 'open');
    }, [table, orders]);

    useEffect(() => {
        if (table.status !== 'occupied' || !associatedOrder) {
            setElapsedTime('-');
            setDurationMinutes(0);
            return;
        }

        const updateTime = () => {
            try {
                const start = new Date(associatedOrder.date).getTime();
                const now = new Date().getTime();

                if (isNaN(start)) {
                    setElapsedTime('-');
                    return;
                }

                const diffMs = now - start;
                if (diffMs < 0) {
                    setElapsedTime('Iniciando...');
                    return;
                }

                const diffMins = Math.floor(diffMs / 60000);
                setDurationMinutes(diffMins);

                if (diffMins < 60) {
                    setElapsedTime(`${diffMins} min`);
                } else {
                    const hours = Math.floor(diffMins / 60);
                    const mins = diffMins % 60;
                    setElapsedTime(`${hours}h ${mins}m`);
                }
            } catch (e) {
                console.error("Erro calc tempo mesa", e);
                setElapsedTime('-');
            }
        };

        updateTime();
        const timer = setInterval(updateTime, 60000);
        return () => clearInterval(timer);
    }, [table.status, associatedOrder]);

    const isOccupied = table.status === 'occupied' && associatedOrder;
    const currentTotal = associatedOrder ? associatedOrder.totalAmount : 0;

    // Alerta de tempo (vermelho se > 2h)
    const timeAlert = durationMinutes > 120;

    return (
        <div
            onClick={() => onClick(table.id, table.status, associatedOrder?.id)}
            className={`
                group relative p-0 rounded-3xl border-2 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-xl hover:-translate-y-1
                ${isOccupied ? 'bg-white border-orange-100 hover:border-orange-300' : 'bg-white border-gray-100 hover:border-emerald-300'}
            `}
        >
            {/* Status Strip Header */}
            <div className={`p-4 flex justify-between items-start ${isOccupied ? 'bg-orange-50/50' : 'bg-gray-50/50'}`}>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">MESA</span>
                    <span className={`text-4xl font-black ${isOccupied ? 'text-gray-900' : 'text-gray-400 group-hover:text-emerald-500 transition-colors'}`}>
                        {String(table.number).padStart(2, '0')}
                    </span>
                </div>

                {isOccupied ? (
                    <div className={`flex flex-col items-end gap-1`}>
                        <div className="flex items-center gap-1.5 bg-white border border-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                            OCUPADA
                        </div>
                        {associatedOrder && (
                            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                <User size={10} /> {associatedOrder.customerName === 'Cliente Balcão' ? 'Visitante' : associatedOrder.customerName.split(' ')[0]}
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        LIVRE
                    </div>
                )}
            </div>

            {/* Body Content */}
            <div className="flex-1 p-5 flex flex-col justify-center items-center relative">
                {isOccupied ? (
                    <div className="w-full space-y-4 animate-in fade-in zoom-in duration-300">
                        {/* Timer */}
                        <div className={`flex items-center justify-between text-sm ${timeAlert ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                            <div className="flex items-center gap-2">
                                <Clock size={16} />
                                <span>Tempo</span>
                            </div>
                            <span className="font-mono bg-gray-50 px-2 py-1 rounded border border-gray-100">{elapsedTime}</span>
                        </div>

                        {/* Total */}
                        <div className="flex flex-col items-center pt-2 border-t border-dashed border-gray-100">
                            <span className="text-xs uppercase font-bold text-gray-400 mb-1">Total da Conta</span>
                            <span className="text-3xl font-black text-gray-900 tracking-tight">{formatCurrency(currentTotal)}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-gray-300 group-hover:text-emerald-500 transition-colors duration-300">
                        <div className="w-16 h-16 rounded-full bg-gray-50 group-hover:bg-emerald-50 flex items-center justify-center transition-colors">
                            <Utensils size={32} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                            Abrir Mesa
                        </span>
                    </div>
                )}
            </div>

            {/* Footer Action Strip */}
            {isOccupied && (
                <div className="bg-orange-600 text-white p-3 flex items-center justify-center gap-2 text-sm font-bold opacity-0 group-hover:opacity-100 transition-all translate-y-full group-hover:translate-y-0 absolute bottom-0 left-0 right-0">
                    <span>Ver Comanda</span>
                    <ArrowRight size={16} />
                </div>
            )}

            {/* Delete Button */}
            {!isOccupied && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(table.id); }}
                    className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Excluir Mesa"
                >
                    <Trash2 size={18} />
                </button>
            )}
        </div>
    );
};

// Main Page Component
const Tables: React.FC = () => {
    const { tables, addTable, deleteTable, fixTableStatuses } = useApp();
    const navigate = useNavigate();

    const [isAdding, setIsAdding] = useState(false);
    const [newTableNumber, setNewTableNumber] = useState('');
    const [isFixing, setIsFixing] = useState(false);
    const [filter, setFilter] = useState<TableFilter>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Métricas
    const metrics = useMemo(() => {
        const total = tables.length;
        const occupied = tables.filter(t => t.status === 'occupied').length;
        const free = total - occupied;
        const revenue = tables.reduce((acc, t) => acc + (t.currentOrderTotal || 0), 0);
        return { total, occupied, free, revenue };
    }, [tables]);

    // Filtragem e Ordenação
    const filteredTables = useMemo(() => {
        let result = [...tables].sort((a, b) => a.number - b.number);

        if (filter === 'occupied') {
            result = result.filter(t => t.status === 'occupied');
        } else if (filter === 'free') {
            result = result.filter(t => t.status !== 'occupied');
        }

        if (searchTerm) {
            result = result.filter(t => t.number.toString().includes(searchTerm));
        }

        return result;
    }, [tables, filter, searchTerm]);

    const handleAddTable = async () => {
        if (!newTableNumber) return;
        const num = parseInt(newTableNumber);
        if (isNaN(num)) return;

        if (tables.some(t => t.number === num)) {
            alert("Já existe uma mesa com este número.");
            return;
        }

        await addTable(num);
        setNewTableNumber('');
        setIsAdding(false);
    };

    const handleTableClick = (tableId: string, status: string, orderId?: string) => {
        if (status === 'occupied' && orderId) {
            navigate(`/table-service?tableId=${tableId}&orderId=${orderId}`);
        } else {
            navigate(`/table-service?tableId=${tableId}`);
        }
    };

    const handleDeleteTable = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir esta mesa?")) {
            await deleteTable(id);
        }
    };

    return (
        <PlanGuard feature="tableManagement" showLock={true} fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 space-y-6 max-w-2xl mx-auto animate-fade-in">
                <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center animate-pulse">
                    <LayoutGrid size={48} className="text-orange-600" />
                </div>
                <h2 className="text-3xl font-black text-gray-900">Gestão de Mesas em Tempo Real</h2>
                <p className="text-lg text-gray-500">
                    Abandone o papel. Saiba exatamente quais mesas estão livres, ocupadas ou aguardando pagamento com nosso mapa digital.
                </p>
                <div className="flex flex-col gap-2">
                    <button disabled className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold opacity-50 cursor-not-allowed shadow-xl">
                        Disponível no Plano Starter e PRO
                    </button>
                    <p className="text-xs text-gray-400">Faça upgrade em Configurações</p>
                </div>
            </div>
        }>
            <div className="space-y-8 animate-fade-in pb-20">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3 mb-2">
                            <LayoutGrid className="text-orange-600" size={32} />
                            Gestão de Mesas
                        </h1>
                        <p className="text-gray-500 font-medium">Controle total do seu salão em tempo real.</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                        <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-w-[140px]">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Ocupação</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-orange-600">{metrics.occupied}</span>
                                <span className="text-sm font-bold text-gray-300">/ {metrics.total}</span>
                            </div>
                        </div>
                        <div className="bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-w-[160px]">
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Faturamento Atual</span>
                            <span className="text-2xl font-black text-emerald-600">{formatCurrency(metrics.revenue)}</span>
                        </div>
                    </div>
                </div>

                {/* Toolbar Section */}
                <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur py-4 -mx-4 px-4 md:mx-0 md:px-0">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl w-full md:w-auto">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFilter('free')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'free' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-emerald-600'}`}
                            >
                                Livres
                            </button>
                            <button
                                onClick={() => setFilter('occupied')}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'occupied' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500 hover:text-orange-600'}`}
                            >
                                Ocupadas
                            </button>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Buscar mesa..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-100"
                                />
                            </div>

                            <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

                            <button
                                onClick={async () => {
                                    setIsFixing(true);
                                    try { await fixTableStatuses(); } finally { setIsFixing(false); }
                                }}
                                disabled={isFixing}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Sincronizar Status"
                            >
                                <RefreshCw size={20} className={isFixing ? "animate-spin" : ""} />
                            </button>

                            <button
                                onClick={() => setIsAdding(!isAdding)}
                                className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-gray-200 transition-all active:scale-95 whitespace-nowrap"
                            >
                                <Plus size={18} /> Nova Mesa
                            </button>
                        </div>
                    </div>
                </div>

                {/* Add Form */}
                {isAdding && (
                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xl flex flex-col sm:flex-row gap-4 animate-in slide-in-from-top-4 max-w-lg mx-auto relative z-10 mb-8">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Número da Nova Mesa</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Ex: 10"
                                    value={newTableNumber}
                                    onChange={e => setNewTableNumber(e.target.value)}
                                    className="w-full pl-4 pr-12 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-xl outline-none text-xl font-black text-gray-900 transition-all"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTable()}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">#</span>
                            </div>
                        </div>
                        <div className="flex items-end gap-2">
                            <button onClick={() => setIsAdding(false)} className="px-5 py-4 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                                <XCircle size={24} />
                            </button>
                            <button onClick={handleAddTable} className="px-8 py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg shadow-orange-200 flex items-center gap-2">
                                <Plus size={20} /> Adicionar
                            </button>
                        </div>
                    </div>
                )}

                {/* Grid */}
                {filteredTables.length === 0 && !isAdding ? (
                    <div className="text-center py-24 opacity-60">
                        <div className="inline-flex bg-gray-100 p-6 rounded-full mb-4">
                            <LayoutGrid size={48} className="text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Nenhuma mesa encontrada</h3>
                        <p className="text-gray-500">Tente ajustar seus filtros ou adicione novas mesas.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {filteredTables.map(table => (
                            <TableCard
                                key={table.id}
                                table={table}
                                onDelete={handleDeleteTable}
                                onClick={handleTableClick}
                            />
                        ))}
                    </div>
                )}
            </div>
        </PlanGuard>
    );
};

export default Tables;
