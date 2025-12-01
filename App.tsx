import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { OrderNotificationProvider } from './contexts/OrderNotificationContext';
import Layout from './components/Layout';

import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Products from './pages/Products';
import Ingredients from './pages/Ingredients';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Settings from './pages/Settings';
import Advisor from './pages/Advisor';
import Customers from './pages/Customers';
import Orders from './pages/Orders';
import Account from './pages/Account';
import Tables from './pages/Tables'; // Nova Página
import MenuManager from './pages/MenuManager';
import Categories from './pages/Categories';
import MenuOrders from './pages/MenuOrders';
import AllOrders from './pages/AllOrders'; // Nova Página Unificada
import BusinessHoursAdvanced from './pages/BusinessHoursAdvanced'; // Horários de Funcionamento Avançado

// Menu Pages
import MenuLayout from './pages/Menu/MenuLayout';
import StoreMenu from './pages/Menu/StoreMenu';
import CustomerAuth from './pages/Menu/CustomerAuth';
import CustomerProfile from './pages/Menu/CustomerProfile';
import CustomerOrders from './pages/Menu/CustomerOrders';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/auth" />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return !user ? <>{children}</> : <Navigate to="/dashboard" />;
};

// Layout para rotas privadas que precisam de notificação
const PrivateLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <OrderNotificationProvider>
      <PrivateRoute>{children}</PrivateRoute>
    </OrderNotificationProvider>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />

      {/* Public Menu Routes - REALMENTE SEM OrderNotificationProvider AGORA */}
      <Route path="/menu/:storeId" element={<MenuLayout />}>
        <Route index element={<StoreMenu />} />
        <Route path="auth" element={<CustomerAuth />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="orders" element={<CustomerOrders />} />
      </Route>

      {/* Private Routes - WITH OrderNotificationProvider */}
      <Route path="/dashboard" element={<PrivateLayout><Dashboard /></PrivateLayout>} />
      <Route path="/tables" element={<PrivateLayout><Tables /></PrivateLayout>} />
      <Route path="/orders" element={<PrivateLayout><Orders /></PrivateLayout>} />
      <Route path="/all-orders" element={<PrivateLayout><AllOrders /></PrivateLayout>} />
      <Route path="/customers" element={<PrivateLayout><Customers /></PrivateLayout>} />
      <Route path="/products" element={<PrivateLayout><Products /></PrivateLayout>} />
      <Route path="/categories" element={<PrivateLayout><Categories /></PrivateLayout>} />
      <Route path="/menu-manager" element={<PrivateLayout><MenuManager /></PrivateLayout>} />
      <Route path="/menu-orders" element={<PrivateLayout><MenuOrders /></PrivateLayout>} />
      <Route path="/ingredients" element={<PrivateLayout><Ingredients /></PrivateLayout>} />
      <Route path="/inventory" element={<PrivateLayout><Inventory /></PrivateLayout>} />
      <Route path="/expenses" element={<PrivateLayout><Expenses /></PrivateLayout>} />
      <Route path="/settings" element={<PrivateLayout><Settings /></PrivateLayout>} />
      <Route path="/business-hours" element={<PrivateLayout><BusinessHoursAdvanced /></PrivateLayout>} />
      <Route path="/advisor" element={<PrivateLayout><Advisor /></PrivateLayout>} />
      <Route path="/account" element={<PrivateLayout><Account /></PrivateLayout>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
