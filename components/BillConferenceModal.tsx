import React, { useState, useEffect } from 'react';
import { X, Printer, Music, Percent, Receipt, ChevronRight } from 'lucide-react';
import { OrderItem } from '../types';
import { formatCurrency } from '../utils/calculations';

interface BillConferenceModalProps {
    isOpen: boolean;
    onClose: () => void;
    cart: OrderItem[];
    tableNumber: number | undefined;
}

const BillConferenceModal: React.FC<BillConferenceModalProps> = ({
    isOpen,
    onClose,
    cart,
    tableNumber
}) => {
    const [couvertValue, setCouvertValue] = useState<string>('0.00');
    const [includeService, setIncludeService] = useState(true);

    if (!isOpen) return null;

    // Cálculos
    const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
    const couvert = parseFloat(couvertValue.replace(',', '.')) || 0;
    const serviceCharge = includeService ? subtotal * 0.10 : 0;
    const totalEstimado = subtotal + serviceCharge + couvert;

    const handlePrint = () => {
        const receiptWindow = window.open('', '', 'width=350,height=600');
        if (!receiptWindow) return;

        const html = `<html>
        <head>
            <title>Conferência Mesa ${tableNumber}</title>
            <style>
                body { font-family: 'Courier New', monospace; font-size: 12px; padding: 15px; width: 80mm; margin: 0 auto; }
                .text-center { text-align: center; }
                .bold { font-weight: bold; }
                .line { border-bottom: 1px dashed #000; margin: 5px 0; }
                .flex { display: flex; justify-content: space-between; margin-bottom: 3px; }
            </style>
        </head>
        <body>
            <div class="text-center bold" style="font-size: 16px; margin-bottom: 5px;">CONFERÊNCIA DE CONTA</div>
            <div class="text-center">Mesa ${tableNumber}</div>
            <div class="text-center">${new Date().toLocaleString('pt-BR')}</div>
            <div class="line"></div>
            ${cart.map(item => `
                <div class="flex">
                    <span style="flex:1">${item.quantity}x ${item.productName}</span>
                    <span>${item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
            `).join('')}
            <div class="line"></div>
            <div class="flex bold">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            ${includeService ? `
             <div class="flex">
                <span>Serviço (10%)</span>
                <span>${serviceCharge.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>` : ''}
            ${couvert > 0 ? `
            <div class="flex">
                <span>Couvert Artístico</span>
                <span>${couvert.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            ` : ''}
            <div class="line"></div>
             <div class="flex bold" style="font-size: 16px;">
                <span>TOTAL ESTIMADO</span>
                <span>${totalEstimado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
             <br/>
             <div class="text-center bold">*** NÃO É DOCUMENTO FISCAL ***</div>
             <div class="text-center">Conferência de itens consumidos</div>
             <script>
                window.onload = function() { window.focus(); setTimeout(() => { window.print(); window.close(); }, 250); }
             </script>
        </body></html>`;

        receiptWindow.document.write(html);
        receiptWindow.document.close();
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                            <Receipt className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Conferência de Conta</h2>
                            <p className="text-gray-400 text-sm">Mesa {String(tableNumber).padStart(2, '0')}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Sumário */}
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center text-gray-600 mb-2">
                            <span>Itens ({cart.length})</span>
                            <span className="font-semibold">{formatCurrency(subtotal)}</span>
                        </div>

                        {/* Controles */}
                        <div className="space-y-3 mt-4 pt-4 border-t border-gray-200">
                            {/* Serviço Toggle */}
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg transition-colors ${includeService ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Percent size={18} />
                                    </div>
                                    <span className="font-medium text-gray-700 group-hover:text-gray-900">Taxa de Serviço (10%)</span>
                                </div>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={includeService}
                                        onChange={(e) => setIncludeService(e.target.checked)}
                                    />
                                    <div className={`w-11 h-6 rounded-full transition-colors ${includeService ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${includeService ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                </div>
                            </label>

                            {/* Couvert Input */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                        <Music size={18} />
                                    </div>
                                    <span className="font-medium text-gray-700">Couvert Artístico</span>
                                </div>
                                <div className="relative w-32">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">R$</span>
                                    <input
                                        type="number"
                                        value={couvertValue}
                                        onChange={(e) => setCouvertValue(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-right font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Final Display */}
                    <div className="flex justify-between items-end p-4 bg-gray-900 rounded-2xl text-white shadow-lg shadow-gray-200">
                        <div>
                            <p className="text-gray-400 text-sm font-medium mb-1">Total Estimado</p>
                            <p className="text-xs text-gray-500">Não fiscal</p>
                        </div>
                        <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                            {formatCurrency(totalEstimado)}
                        </div>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={handlePrint}
                        className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-200 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        <Printer size={20} />
                        Imprimir Conferência
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillConferenceModal;
