import React from 'react';
import { X, Receipt, Check, Printer, FileText, ArrowRight } from 'lucide-react';
import { Order, AppSettings } from '../types';
import { printOrderReceipt, printKitchenOrder } from '../utils/printer';
import { useApp } from '../contexts/AppContext';

interface OrderSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onNewOrder: () => void;
}

const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
    isOpen,
    onClose,
    order,
    onNewOrder
}) => {
    const { settings } = useApp();

    if (!isOpen || !order) return null;

    const handlePrintReceipt = () => {
        printOrderReceipt(order, settings);
    };

    const handlePrintKitchen = () => {
        printKitchenOrder(order, settings);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden scale-100 animate-scale-in">
                {/* Header de Sucesso */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-center text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Check className="w-10 h-10 text-white" strokeWidth={3} />
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Venda Realizada!</h2>
                        <p className="text-white/90 font-medium">
                            Pedido #{order.id.slice(0, 8)} confirmado com sucesso
                        </p>
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="p-8">
                    <div className="space-y-4 mb-8">
                        <button
                            onClick={handlePrintReceipt}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl hover:border-orange-500 hover:bg-orange-50 hover:text-orange-700 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                    <Receipt className="w-6 h-6 text-gray-600 group-hover:text-orange-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900 group-hover:text-orange-800">Imprimir Comprovante</p>
                                    <p className="text-sm text-gray-500 group-hover:text-orange-600">Via do Cliente</p>
                                </div>
                            </div>
                            <Printer className="w-5 h-5 text-gray-400 group-hover:text-orange-500" />
                        </button>

                        <button
                            onClick={handlePrintKitchen}
                            className="w-full flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
                                    <FileText className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900 group-hover:text-blue-800">Imprimir Pedido</p>
                                    <p className="text-sm text-gray-500 group-hover:text-blue-600">Via da Cozinha</p>
                                </div>
                            </div>
                            <Printer className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                        </button>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onNewOrder}
                            className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowRight className="w-5 h-5" />
                            Nova Venda
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccessModal;
