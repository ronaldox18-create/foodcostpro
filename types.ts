
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
  // Integração Catalog
  ifood_id?: string;
  ifood_external_code?: string;
  ifood_status?: 'AVAILABLE' | 'UNAVAILABLE';
  image_url?: string;
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
  plan?: PlanType;
  plan_expires_at?: string;
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
  subtotal?: number;
  discount?: number;
  serviceCharge?: number;
  tip?: number;
  couvert?: number;

  // Integrações
  external_id?: string;
  integration_source?: 'interna' | 'ifood' | 'rappi';
  external_metadata?: any;
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

export type PlanType = 'free' | 'starter' | 'online' | 'pro';

import { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthContextType {
  user: SupabaseUser | null;
  userPlan: PlanType;
  checkAccess: (feature: any) => boolean | 'basic' | 'advanced' | 'unlimited' | number; // rough typing to avoid circular dep issues in types file
  signIn: (email: string, pass: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshUserPlan: () => Promise<void>;
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

// --- Sistema de PDV (Ponto de Venda) ---

/**
 * Caixa - Abertura/Fechamento
 */
export interface CashRegister {
  id: string;
  user_id: string;
  openedBy: string; // Nome do operador
  opened_by?: string; // snake_case variant from Supabase
  openedAt: string;
  opened_at?: string; // snake_case variant from Supabase
  closedAt?: string;
  closed_at?: string; // snake_case variant from Supabase
  initialCash: number; // Valor inicial do caixa
  initial_cash?: number; // snake_case variant from Supabase
  finalCash?: number; // Valor final (no fechamento)
  final_cash?: number; // snake_case variant from Supabase
  expectedCash?: number; // Valor esperado (calculado)
  expected_cash?: number; // snake_case variant from Supabase
  difference?: number; // Diferença entre esperado e real
  status: 'open' | 'closed';
  created_at?: string;
}

/**
 * Movimentação de Caixa (Sangria/Reforço)
 */
export interface CashMovement {
  id: string;
  user_id: string;
  cashRegisterId: string;
  type: 'withdrawal' | 'addition'; // sangria ou reforço
  amount: number;
  reason: string;
  performedBy: string;
  created_at: string;
}

/**
 * Pagamento em uma venda do PDV (pode ter múltiplos)
 */
export interface POSPayment {
  method: PaymentMethod;
  amount: number;
}

/**
 * Venda do PDV
 */
export interface POSSale extends Order {
  cashRegisterId: string;
  payments: POSPayment[]; // Múltiplas formas de pagamento
  change?: number; // Troco (se dinheiro)
  serviceCharge?: number; // Taxa de serviço (%)
  tip?: number; // Gorjeta
  discount?: number; // Desconto em R$
  discountPercent?: number; // Desconto em %
  subtotal: number; // Total antes de taxas e descontos
  loyaltyPointsUsed?: number; // Pontos utilizados
  loyaltyDiscountApplied?: number; // Desconto do programa de fidelidade
}

/**
 * Integrações com plataformas externas (iFood, etc)
 */
export interface UserIntegration {
  id: string;
  user_id: string;
  provider: 'ifood' | 'rappi' | 'ubereats';
  is_enabled: boolean;
  credentials: {
    clientId?: string;
    clientSecret?: string;
    merchantId?: string;
    accessToken?: string; // Tokens temporários se necessário
    refreshToken?: string;
  };
  status: 'active' | 'error' | 'disconnected';
  last_synced_at?: string;
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}

// --- Sistema de WhatsApp Business ---

/**
 * Configuração do WhatsApp Business Cloud API
 */
export interface WhatsAppConfig {
  id: string;
  user_id: string;
  phone_number_id: string;
  business_account_id: string;
  access_token: string; // Criptografado
  webhook_verify_token: string;
  is_enabled: boolean;
  status: 'active' | 'error' | 'disconnected';
  last_tested_at?: string;
  error_message?: string;

  // Configurações de envio automático
  auto_send_order_confirmed: boolean;
  auto_send_order_preparing: boolean;
  auto_send_order_ready: boolean;
  auto_send_order_delivered: boolean;
  auto_send_loyalty_points: boolean;

  created_at?: string;
  updated_at?: string;
}

/**
 * Template de mensagem aprovado pelo Meta
 */
export interface WhatsAppTemplate {
  id: string;
  user_id: string;
  name: string;
  category: 'utility' | 'marketing' | 'authentication';
  language: string;
  status: 'pending' | 'approved' | 'rejected';
  meta_template_id?: string;
  template_body: any; // JSON do template
  created_at?: string;
  updated_at?: string;
}

/**
 * Mensagem enviada via WhatsApp (log)
 */
export interface WhatsAppMessage {
  id: string;
  user_id: string;
  customer_id?: string;
  order_id?: string;
  message_type: WhatsAppNotificationType;
  template_name?: string;
  recipient_phone: string;
  whatsapp_message_id?: string;
  whatsapp_conversation_id?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  failed_at?: string;
  error_code?: string;
  error_message?: string;
  message_content?: any;
  created_at: string;
}

/**
 * Tipos de notificação WhatsApp
 */
export type WhatsAppNotificationType =
  | 'order_confirmed'
  | 'order_preparing'
  | 'order_ready'
  | 'order_out_for_delivery'
  | 'order_delivered'
  | 'order_cancelled'
  | 'loyalty_points_earned'
  | 'loyalty_level_up'
  | 'loyalty_points_expiring'
  | 'marketing_promo'
  | 'marketing_happy_hour'
  | 'marketing_new_product'
  | 'marketing_birthday'
  | 'cart_abandoned'
  | 'feedback_request'
  | 'reservation_confirmed'
  | 'reservation_reminder'
  | 'item_unavailable'
  | 'delivery_delay'
  | 'ifood_order_received';

/**
 * Conversa de atendimento
 */
export interface WhatsAppConversation {
  id: string;
  user_id: string;
  customer_id?: string;
  customer_phone: string;
  customer_name?: string;
  whatsapp_conversation_id?: string;
  status: 'open' | 'closed' | 'archived';
  assigned_to?: string;
  last_message_at: string;
  last_message_from?: 'customer' | 'business';
  created_at: string;
  closed_at?: string;
}

/**
 * Mensagem dentro de uma conversa
 */
export interface WhatsAppConversationMessage {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  message_type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'interactive';
  content: {
    text?: string;
    media_url?: string;
    caption?: string;
    filename?: string;
    latitude?: number;
    longitude?: number;
    [key: string]: any;
  };
  whatsapp_message_id?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  sent_by?: string;
  created_at: string;
}

/**
 * Métricas diárias do WhatsApp
 */
export interface WhatsAppMetrics {
  id: string;
  user_id: string;
  date: string;
  messages_sent: number;
  messages_delivered: number;
  messages_read: number;
  messages_failed: number;
  utility_messages: number;
  marketing_messages: number;
  orders_from_whatsapp: number;
  total_revenue_attributed: number;
  conversations_started: number;
  customer_replies: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload para enviar mensagem template
 */
export interface WhatsAppTemplatePayload {
  recipientPhone: string;
  templateName: string;
  parameters: (string | number)[];
  notificationType: WhatsAppNotificationType;
  orderId?: string;
  customerId?: string;
}

// ============================================
// SISTEMA DE CARDÁPIO VIRTUAL PROFISSIONAL
// ============================================

/**
 * Grupo de Complementos/Adicionais
 */
export interface ProductAddonGroup {
  id: string;
  user_id: string;
  name: string; // Ex: "Adicionais", "Remover Ingredientes", "Molhos"
  description?: string;
  is_required: boolean; // Cliente DEVE escolher algo deste grupo?
  min_selections: number; // Mínimo de seleções
  max_selections: number | null; // Máximo de seleções (null = ilimitado)
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Complemento/Adicional individual
 */
export interface ProductAddon {
  id: string;
  group_id: string;
  name: string; // Ex: "Bacon Extra", "Sem Cebola", "Molho Barbecue"
  price_adjustment: number; // Valor adicional (pode ser negativo para remoções)
  is_available: boolean;

  // Vínculo com ingrediente do estoque (opcional)
  ingredient_id?: string | null; // Se preenchido, desconta do estoque deste ingrediente
  quantity_used?: number | null; // Quantidade a descontar (ex: 100 para 100g)
  unit_used?: 'g' | 'kg' | 'ml' | 'l' | 'un' | null; // Unidade de medida

  display_order: number;
  created_at?: string;
}

/**
 * Vínculo entre produto e grupo de complementos
 */
export interface ProductAddonGroupLink {
  id: string;
  product_id: string;
  group_id: string;
  created_at?: string;
}

/**
 * Variação de Produto (tamanhos, volumes, etc)
 */
export interface ProductVariation {
  id: string;
  product_id: string;
  name: string; // Ex: "300ml", "500ml", "1L", "Pizza Média", "Porção Família"
  price: number;
  is_default: boolean;
  is_available: boolean;
  stock_quantity?: number;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Imagem de produto (múltiplas fotos)
 */
export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean; // Imagem principal
  display_order: number;
  created_at?: string;
}

/**
 * Avaliação de Produto
 */
export interface ProductReview {
  id: string;
  product_id: string;
  customer_id: string;
  customer?: Customer; // Populated se necessário
  order_id?: string;
  rating: number; // 1-5 estrelas
  comment?: string;
  images?: string[]; // URLs de fotos da avaliação
  is_approved: boolean; // Moderação
  admin_response?: string; // Resposta da loja
  admin_response_date?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Configurações Visuais da Loja
 */
export interface StoreVisualSettings {
  id: string;
  user_id: string;
  logo_url?: string;
  banner_url?: string;
  favicon_url?: string;
  primary_color: string; // Cor primária do tema
  secondary_color: string; // Cor secundária
  theme_mode: 'light' | 'dark' | 'auto';
  font_family: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Informações de Contato e Redes Sociais
 */
export interface StoreContactInfo {
  id: string;
  user_id: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  instagram_url?: string;
  facebook_url?: string;
  website_url?: string;
  delivery_info?: string; // Informações sobre entrega
  payment_methods?: string[]; // ['pix', 'dinheiro', 'cartão']
  created_at?: string;
  updated_at?: string;
}

/**
 * Promoção
 */
export interface Promotion {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y' | 'combo';
  discount_value?: number; // Porcentagem ou valor fixo
  buy_quantity?: number; // Para tipo "2x1" = compre 2
  get_quantity?: number; // Ganhe 1
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  min_purchase_amount?: number; // Valor mínimo para aplicar
  max_discount_amount?: number; // Desconto máximo
  created_at?: string;
  updated_at?: string;
}

/**
 * Vínculo entre promoção e produto
 */
export interface PromotionProduct {
  id: string;
  promotion_id: string;
  product_id: string;
  created_at?: string;
}

/**
 * Cupom de Desconto
 */
export interface DiscountCoupon {
  id: string;
  user_id: string;
  code: string; // Ex: "PRIMEIRACOMPRA", "NATAL2025"
  description?: string;
  type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount?: number;
  max_uses?: number; // Limite de usos total
  max_uses_per_customer: number;
  valid_from?: string;
  valid_until?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Uso de Cupom (histórico)
 */
export interface CouponUsage {
  id: string;
  coupon_id: string;
  customer_id: string;
  order_id: string;
  discount_applied: number;
  created_at: string;
}

/**
 * Combo de Produtos
 */
export interface ProductCombo {
  id: string;
  user_id: string;
  name: string; // Ex: "Combo Família", "Pizza + Refrigerante"
  description?: string;
  image_url?: string;
  combo_price: number;
  original_price?: number; // Soma dos preços individuais
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
  items?: ComboItem[]; // Populated se necessário
}

/**
 * Item de um Combo
 */
export interface ComboItem {
  id: string;
  combo_id: string;
  product_id: string;
  product?: Product; // Populated se necessário
  quantity: number;
  variation_id?: string;
  variation?: ProductVariation; // Populated se necessário
  created_at?: string;
}

/**
 * Produto Favorito do Cliente
 */
export interface CustomerFavorite {
  id: string;
  customer_id: string;
  product_id: string;
  product?: Product; // Populated se necessário
  created_at: string;
}

/**
 * Analytics de Produto
 */
export interface ProductAnalytics {
  id: string;
  product_id: string;
  customer_id?: string;
  action: 'view' | 'add_to_cart' | 'purchase' | 'favorite';
  session_id?: string;
  created_at: string;
}

/**
 * Histórico de Buscas
 */
export interface SearchHistory {
  id: string;
  user_id: string;
  customer_id?: string;
  search_term: string;
  results_count: number;
  created_at: string;
}

/**
 * Customizações em um item do pedido
 */
export interface OrderItemCustomization {
  variation_id?: string;
  variation_name?: string;
  variation_price?: number;
  selected_addons?: Array<{
    addon_id: string;
    group_id: string;
    group_name: string;
    addon_name: string;
    price_adjustment: number;
  }>;
  item_notes?: string;
}

/**
 * Extensão do Product com novos campos
 */
export interface ProductExtended extends Product {
  is_featured?: boolean;
  is_available?: boolean;
  badges?: string[]; // ['novo', 'promocao', 'mais_vendido']
  tags?: string[]; // ['vegetariano', 'vegano', 'sem_gluten', 'picante']
  view_count?: number;
  purchase_count?: number;
  average_rating?: number;
  review_count?: number;
  preparation_time?: number; // Minutos
  calories?: number;
  allergens?: string[];

  // Populated relationships
  variations?: ProductVariation[];
  images?: ProductImage[];
  addon_groups?: ProductAddonGroup[];
  reviews?: ProductReview[];
  promotions?: Promotion[];
}

/**
 * Resposta da validação de cupom
 */
export interface CouponValidationResult {
  is_valid: boolean;
  discount_amount: number;
  message: string;
  coupon_id?: string;
}

/**
 * Badge de produto (novo, promoção, etc)
 */
export type ProductBadge = 'novo' | 'promocao' | 'mais_vendido' | 'destaque' | 'exclusivo';

/**
 * Tag de produto (filtros alimentares)
 */
export type ProductTag =
  | 'vegetariano'
  | 'vegano'
  | 'sem_gluten'
  | 'sem_lactose'
  | 'picante'
  | 'picante_suave'
  | 'picante_medio'
  | 'picante_forte'
  | 'kids'
  | 'light'
  | 'diet'
  | 'organico'
  | 'fit';

/**
 * Dados de checkout com customizações
 */
export interface CheckoutDataExtended {
  deliveryType: 'delivery' | 'pickup';
  deliveryAddress?: string;
  phone: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  coupon_code?: string;
  use_loyalty_points?: number;
}

/**
 * Item do carrinho com customizações
 */
export interface CartItem {
  productId: string;
  product?: Product;
  quantity: number;
  variation_id?: string;
  variation?: ProductVariation;
  selected_addons?: Array<{
    addon_id: string;
    group_id: string;
    group_name: string;
    addon_name: string;
    price_adjustment: number;
  }>;
  item_notes?: string;
  unit_price: number; // Preço base
  total_price: number; // Preço com adicionais
}

// --- FASE 3: Sistema de Complementos e Variações ---

/**
 * Grupo de complementos/adicionais (ex: "Adicionais", "Remover", "Molhos")
 */
export interface ProductAddonGroup {
  id: string;
  user_id: string;
  name: string; // Ex: "Adicionais", "Remover"
  is_required: boolean; // Se é obrigatório escolher
  min_selections: number; // Mínimo de seleções
  max_selections: number; // Máximo de seleções
  display_order: number;
  created_at?: string;
  updated_at?: string;
  product_addons?: ProductAddon[]; // Relação com os complementos
}

/**
 * Complemento individual (ex: "Bacon Extra", "Sem Cebola")
 */
export interface ProductAddon {
  id: string;
  group_id: string;
  user_id: string;
  name: string; // Ex: "Bacon Extra", "Queijo Extra"
  price_adjustment: number; // Quanto adiciona/remove do preço (+5.00, -2.00, 0.00)
  is_available: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Variação de produto (ex: tamanho, volume)
 */
export interface ProductVariation {
  id: string;
  product_id: string | null;
  user_id: string;
  name: string; // Ex: "300ml", "500ml", "1L", "P", "M", "G"
  price: number; // Preço específico desta variação
  sku?: string; // Código SKU opcional
  stock_quantity?: number | null; // Estoque individual
  is_available: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}


 
 
 / /   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
 / /   G E S T � O   F I N A N C E I R A   E M P R E S A R I A L 
 / /   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = 
 
 e x p o r t   i n t e r f a c e   F i n a n c i a l A c c o u n t   { 
     i d :   s t r i n g ; 
     n a m e :   s t r i n g ; 
     t y p e :   ' p r o l a b o r e '   |   ' e m e r g e n c y '   |   ' i n v e s t m e n t '   |   ' i m p r o v e m e n t '   |   ' d i s t r i b u t i o n ' ; 
     p e r c e n t a g e :   n u m b e r ; 
     c u r r e n t B a l a n c e :   n u m b e r ; 
     t a r g e t B a l a n c e ? :   n u m b e r ; 
     i c o n :   s t r i n g ; 
     c o l o r :   s t r i n g ; 
     d e s c r i p t i o n :   s t r i n g ; 
     u s e r _ i d ? :   s t r i n g ; 
     c r e a t e d _ a t ? :   s t r i n g ; 
 } 
 
 e x p o r t   i n t e r f a c e   F i n a n c i a l G o a l   { 
     i d :   s t r i n g ; 
     n a m e :   s t r i n g ; 
     t y p e :   ' r e v e n u e '   |   ' p r o f i t '   |   ' m a r g i n '   |   ' t i c k e t '   |   ' c u s t o m e r s '   |   ' c u s t o m ' ; 
     t a r g e t V a l u e :   n u m b e r ; 
     c u r r e n t V a l u e :   n u m b e r ; 
     p e r i o d :   ' m o n t h l y '   |   ' q u a r t e r l y '   |   ' y e a r l y ' ; 
     d e a d l i n e ? :   s t r i n g ; 
     u s e r _ i d ? :   s t r i n g ; 
     c r e a t e d _ a t ? :   s t r i n g ; 
 } 
 
 e x p o r t   i n t e r f a c e   I n v e s t m e n t   { 
     i d :   s t r i n g ; 
     n a m e :   s t r i n g ; 
     c a t e g o r y :   ' e q u i p m e n t '   |   ' r e n o v a t i o n '   |   ' m a r k e t i n g '   |   ' t e c h n o l o g y '   |   ' e x p a n s i o n '   |   ' o t h e r ' ; 
     a m o u n t :   n u m b e r ; 
     e x p e c t e d R O I :   n u m b e r ; 
     a c t u a l R O I ? :   n u m b e r ; 
     s t a t u s :   ' p l a n n e d '   |   ' a p p r o v e d '   |   ' i n _ p r o g r e s s '   |   ' c o m p l e t e d '   |   ' c a n c e l l e d ' ; 
     s t a r t D a t e ? :   s t r i n g ; 
     c o m p l e t i o n D a t e ? :   s t r i n g ; 
     n o t e s ? :   s t r i n g ; 
     u s e r _ i d ? :   s t r i n g ; 
     c r e a t e d _ a t ? :   s t r i n g ; 
 } 
 
 e x p o r t   i n t e r f a c e   C a s h F l o w P r o j e c t i o n   { 
     d a t e :   s t r i n g ; 
     p r o j e c t e d R e v e n u e :   n u m b e r ; 
     p r o j e c t e d E x p e n s e s :   n u m b e r ; 
     p r o j e c t e d B a l a n c e :   n u m b e r ; 
     t y p e :   ' a c t u a l '   |   ' p r o j e c t e d ' ; 
 } 
 
 e x p o r t   i n t e r f a c e   F i n a n c i a l K P I   { 
     n a m e :   s t r i n g ; 
     v a l u e :   n u m b e r ; 
     t r e n d :   ' u p '   |   ' d o w n '   |   ' s t a b l e ' ; 
     s t a t u s :   ' g o o d '   |   ' w a r n i n g '   |   ' c r i t i c a l ' ; 
     d e s c r i p t i o n :   s t r i n g ; 
 } 
  
 