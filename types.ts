
export type UnitType = 'kg' | 'g' | 'l' | 'ml' | 'un';

export interface Ingredient {
  id: string;
  name: string;
  purchaseUnit: UnitType;
  purchaseQuantity: number;
  purchasePrice: number;
  yieldPercent: number;
  currentStock?: number;
  minStock?: number;
  stockUnit?: UnitType;
  user_id?: string;
  created_at?: string;
}

export interface RecipeItem {
  ingredientId: string;
  quantityUsed: number;
  unitUsed: UnitType;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  currentPrice: number;
  recipe: RecipeItem[];
  preparationMethod?: string;
  created_at?: string;
  user_id?: string;
}

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
  category?: string;
  user_id?: string;
  created_at?: string;
}

export interface AppSettings {
  id?: string;
  targetMargin: number;
  taxAndLossPercent: number;
  businessName: string;
  estimatedMonthlyBilling: number;
  user_id?: string;
  created_at?: string;
}

export interface CalculatedProduct extends Product {
  costIngredients: number;
  costFixed: number;
  costVariable: number;
  totalCost: number;
  suggestedPrice: number;
  currentMargin: number;
  isProfitable: boolean;
  breakdown: {
    fixedCostPercent: number;
    variableCostPercent: number;
    profitPercent: number;
  }
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  birthDate?: string;
  address?: string;
  notes?: string;
  totalSpent: number;
  lastOrderDate: string;
  points?: number;
  currentLevel?: string; // ID do nível atual
  levelExpiresAt?: string; // Data de expiração do nível
  lastLevelUpdate?: string; // Última vez que o nível foi atualizado
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  addedAt?: string;
}

export type PaymentMethod = 'credit' | 'debit' | 'money' | 'pix';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'canceled' | 'open';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  date: string;
  status: OrderStatus;
  tableId?: string;
  tableNumber?: number;
  notes?: string;
  deliveryType?: 'delivery' | 'pickup';
  deliveryAddress?: string;
  phone?: string;
  delivery_type?: 'delivery' | 'pickup';
  delivery_address?: string;
}

// --- NOVO: Sistema de Mesas ---
export interface Table {
  id: string;
  number: number;
  status: 'free' | 'occupied';
  currentOrderId?: string; // ID do pedido aberto, se houver
  currentOrderTotal?: number; // Total parcial
}

export interface User {
  id: string;
  name: string;
  email: string;
  storeName: string;
  plan: PlanType;
  createdAt: string;
}

export type PlanType = 'free' | 'starter' | 'pro';

import { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthContextType {
  user: SupabaseUser | null;
  signIn: (email: string, pass: string) => Promise<any>;
  signOut: () => Promise<void>;
}

// --- Sistema de Horários de Funcionamento ---
export type ServiceType = 'all' | 'delivery' | 'pickup';

export interface BusinessHours {
  id: string;
  user_id: string;
  day_of_week: number; // 0 = Domingo, 6 = Sábado
  is_open: boolean;
  open_time: string | null; // Formato HH:MM:SS
  close_time: string | null; // Formato HH:MM:SS
  pause_start: string | null; // Início da pausa
  pause_end: string | null; // Fim da pausa
  service_type: ServiceType; // Tipo de serviço
  created_at?: string;
}

export interface SpecialHours {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  name: string; // Ex: "Natal", "Ano Novo"
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  pause_start: string | null;
  pause_end: string | null;
  service_type: ServiceType;
  notes?: string;
  created_at?: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  notify_on_open: boolean;
  notify_on_close_soon: boolean;
  notify_customers_on_open: boolean;
  notification_methods: string[]; // ['app', 'email', 'whatsapp']
  advance_notice_minutes: number;
  created_at?: string;
  updated_at?: string;
}

export interface StoreStatus {
  isOpen: boolean;
  message: string;
  reason?: 'regular_open' | 'special_open' | 'pause' | 'regular_closed' | 'special_closed' | 'outside_hours';
  nextOpenTime?: string;
  todayHours?: {
    open: string;
    close: string;
    pauseStart?: string;
    pauseEnd?: string;
  };
  serviceType?: ServiceType;
  specialEvent?: string; // Nome do evento especial, se houver
}

// --- Sistema de Fidelidade e Pontos ---

/**
 * Nível de fidelidade configurável
 */
export interface LoyaltyLevel {
  id: string;
  user_id: string;
  name: string; // Ex: "Bronze", "Prata", "Ouro", "Diamante"
  pointsRequired: number; // Pontos necessários para alcançar este nível
  discountPercent: number; // Desconto em % que este nível oferece
  color: string; // Cor para exibição (hex)
  icon?: string; // Emoji ou ícone
  benefits?: string; // Descrição dos benefícios
  order: number; // Ordem de exibição (1, 2, 3...)
  created_at?: string;
}

/**
 * Configurações do programa de fidelidade
 */
export interface LoyaltySettings {
  id: string;
  user_id: string;
  isEnabled: boolean; // Ativar/desativar o sistema de pontos

  // Configuração de pontos
  pointsPerReal: number; // Quantos pontos o cliente ganha por R$ 1,00 gasto

  // Configuração de expiração de nível
  levelExpirationEnabled: boolean; // Se true, níveis expiram
  levelExpirationDays: number; // Dias sem compra para cair de nível

  // Configuração de resgate
  enablePointsRedemption: boolean; // Permitir trocar pontos por desconto
  pointsToRealRate: number; // Quantos pontos = R$ 1,00 de desconto
  minPointsToRedeem: number; // Mínimo de pontos para resgatar

  created_at?: string;
  updated_at?: string;
}

/**
 * Histórico de pontos do cliente
 */
export interface PointsHistory {
  id: string;
  user_id: string;
  customer_id: string;
  points: number; // Positivo = ganhou, Negativo = gastou
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted'; // Tipo de transação
  description: string; // Ex: "Compra de R$ 50,00", "Resgate de desconto"
  order_id?: string; // Referência ao pedido, se aplicável
  created_at: string;
}

/**
 * Histórico de mudanças de nível
 */
export interface LevelHistory {
  id: string;
  user_id: string;
  customer_id: string;
  from_level_id?: string; // Nível anterior (null se é o primeiro)
  to_level_id: string; // Novo nível
  reason: 'points_earned' | 'expired' | 'manual'; // Motivo da mudança
  created_at: string;
}

