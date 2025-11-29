import React from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { ShoppingBag, User, LogOut } from 'lucide-react';

const MenuLayout: React.FC = () => {
    const navigate = useNavigate();
    const { storeId } = useParams();
    const customerAuth = localStorage.getItem('customer_auth');
    const customer = customerAuth ? JSON.parse(customerAuth) : null;

    const handleLogout = () => {
        localStorage.removeItem('customer_auth');
        navigate(`/menu/${storeId}/auth`);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Top Bar */}
            <div className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
                    <h1 className="font-black text-xl tracking-tight text-gray-900">FoodCost<span className="text-orange-600">Pro</span></h1>

                    <div className="flex items-center gap-3">
                        {customer ? (
                            <>
                                <button onClick={() => navigate(`/menu/${storeId}/profile`)} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition">
                                    <User size={16} className="text-gray-600" />
                                    <span className="text-xs font-bold text-gray-700 truncate max-w-[80px]">{customer.name.split(' ')[0]}</span>
                                </button>
                                <button onClick={handleLogout} className="text-gray-400 hover:text-red-500">
                                    <LogOut size={20} />
                                </button>
                            </>
                        ) : (
                            <button onClick={() => navigate(`/menu/${storeId}/auth`)} className="text-sm font-bold text-gray-900 hover:underline">
                                Entrar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-md mx-auto">
                <Outlet />
            </div>

            {/* Bottom Nav (Only if logged in or browsing) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50">
                <div className="max-w-md mx-auto flex justify-around items-center">
                    <button onClick={() => navigate(`/menu/${storeId}`)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-600 active:text-orange-600">
                        <ShoppingBag size={24} />
                        <span className="text-[10px] font-bold">Cardápio</span>
                    </button>
                    <button onClick={() => navigate(`/menu/${storeId}/profile`)} className="flex flex-col items-center gap-1 text-gray-400 hover:text-orange-600 active:text-orange-600">
                        <User size={24} />
                        <span className="text-[10px] font-bold">Perfil</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuLayout;
