/**
 * EXEMPLO DE INTEGRAÇÃO DO SISTEMA DE FIDELIDADE
 * 
 * Este arquivo mostra como integrar o sistema de fidelidade
 * com o fluxo de pedidos existente.
 */

import { Customer, Order, LoyaltyLevel, LoyaltySettings } from './types';
import {
    calculatePointsEarned,
    updateCustomerAfterPurchase,
    calculateLevelDiscount,
    canRedeemPoints,
    calculatePointsRedemption
} from './utils/loyaltySystem';

// ============================================
// EXEMPLO 1: Processar Pedido com Pontos
// ============================================

/**
 * Função que processa um pedido e adiciona pontos ao cliente
 */
async function processOrderWithLoyalty(
    customer: Customer,
    orderAmount: number,
    levels: LoyaltyLevel[],
    settings: LoyaltySettings
) {
    // 1. Calcular desconto do nível (se aplicável)
    const levelDiscount = calculateLevelDiscount(
        orderAmount,
        customer,
        levels,
        settings
    );

    // 2. Calcular valor final
    const finalAmount = orderAmount - levelDiscount;

    // 3. Processar pagamento...
    // await processPayment(finalAmount);

    // 4. Atualizar pontos e nível do cliente
    const result = updateCustomerAfterPurchase(
        customer,
        orderAmount, // Usar valor ORIGINAL para calcular pontos
        levels,
        settings
    );

    // 5. Salvar cliente atualizado no banco
    // await updateCustomerInDatabase(customer.id, result.updatedCustomer);

    // 6. Registrar histórico de pontos
    // await addPointsHistory({
    //   customer_id: customer.id,
    //   points: result.pointsEarned,
    //   type: 'earned',
    //   description: `Compra de ${formatCurrency(orderAmount)}`,
    //   order_id: order.id
    // });

    // 7. Se mudou de nível, registrar e notificar
    if (result.levelChanged) {
        // await addLevelHistory({
        //   customer_id: customer.id,
        //   from_level_id: result.oldLevel?.id,
        //   to_level_id: result.newLevel?.id,
        //   reason: 'points_earned'
        // });

        // Notificar cliente
        console.log(`🎉 ${customer.name} subiu para ${result.newLevel?.name}!`);

        // Enviar WhatsApp, email, etc.
        // await sendLevelUpNotification(customer, result.newLevel);
    }

    return {
        finalAmount,
        levelDiscount,
        pointsEarned: result.pointsEarned,
        newLevel: result.newLevel,
        levelChanged: result.levelChanged
    };
}

// ============================================
// EXEMPLO 2: Tela de Checkout com Desconto
// ============================================

/**
 * Componente de checkout que mostra desconto de fidelidade
 */
function CheckoutWithLoyalty() {
    const customer = getCurrentCustomer();
    const cart = getCart();
    const levels = getLoyaltyLevels();
    const settings = getLoyaltySettings();

    // Calcular valores
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const levelDiscount = calculateLevelDiscount(subtotal, customer, levels, settings);
    const total = subtotal - levelDiscount;

    // Calcular pontos que o cliente vai ganhar
    const pointsToEarn = calculatePointsEarned(subtotal, settings);

    return (
        <div className="checkout">
            <h2>Resumo do Pedido</h2>

            {/* Itens do carrinho */}
            <div className="cart-items">
                {cart.map(item => (
                    <div key={item.id}>
                        {item.name} - {formatCurrency(item.total)}
                    </div>
                ))}
            </div>

            {/* Subtotal */}
            <div className="subtotal">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
            </div>

            {/* Desconto de Fidelidade */}
            {levelDiscount > 0 && (
                <div className="loyalty-discount">
                    <span>
                        🏆 Desconto {customer.currentLevel}
                        ({getCurrentLevelInfo(customer, levels).discountPercent}%):
                    </span>
                    <span className="text-green-600">
                        -{formatCurrency(levelDiscount)}
                    </span>
                </div>
            )}

            {/* Total */}
            <div className="total">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
            </div>

            {/* Pontos que vai ganhar */}
            <div className="points-info">
                <span>✨ Você vai ganhar:</span>
                <span className="font-bold text-purple-600">
                    {pointsToEarn} pontos
                </span>
            </div>

            <button onClick={() => processOrder()}>
                Finalizar Pedido
            </button>
        </div>
    );
}

// ============================================
// EXEMPLO 3: Resgate de Pontos
// ============================================

/**
 * Função para resgatar pontos por desconto
 */
async function redeemPoints(
    customer: Customer,
    pointsToRedeem: number,
    settings: LoyaltySettings
) {
    // 1. Validar se pode resgatar
    const validation = canRedeemPoints(customer, pointsToRedeem, settings);

    if (!validation.canRedeem) {
        throw new Error(validation.reason);
    }

    // 2. Calcular valor do desconto
    const discountValue = calculatePointsRedemption(pointsToRedeem, settings);

    // 3. Deduzir pontos do cliente
    const updatedCustomer = {
        ...customer,
        points: (customer.points || 0) - pointsToRedeem
    };

    // 4. Salvar no banco
    // await updateCustomerInDatabase(customer.id, updatedCustomer);

    // 5. Registrar no histórico
    // await addPointsHistory({
    //   customer_id: customer.id,
    //   points: -pointsToRedeem,
    //   type: 'redeemed',
    //   description: `Resgate de ${pointsToRedeem} pontos por ${formatCurrency(discountValue)}`
    // });

    return {
        discountValue,
        pointsRedeemed: pointsToRedeem,
        remainingPoints: updatedCustomer.points
    };
}

// ============================================
// EXEMPLO 4: Exibir Badge de Fidelidade
// ============================================

/**
 * Componente que mostra badge do cliente
 */
function CustomerCard({ customer }: { customer: Customer }) {
    const levels = getLoyaltyLevels();
    const settings = getLoyaltySettings();

    return (
        <div className="customer-card">
            <h3>{customer.name}</h3>

            {/* Badge de Fidelidade */}
            <LoyaltyBadge
                customer={customer}
                levels={levels}
                settings={settings}
                size="medium"
                showProgress={true}
                showExpiration={true}
            />

            {/* Outras informações do cliente */}
            <div className="customer-info">
                <p>Total gasto: {formatCurrency(customer.totalSpent)}</p>
                <p>Última compra: {formatDate(customer.lastOrderDate)}</p>
            </div>
        </div>
    );
}

// ============================================
// EXEMPLO 5: Verificar Expiração de Níveis
// ============================================

/**
 * Função que verifica e atualiza níveis expirados
 * Deve ser executada periodicamente (cron job)
 */
async function checkExpiredLevels() {
    const settings = getLoyaltySettings();

    if (!settings.levelExpirationEnabled) {
        return; // Expiração desabilitada
    }

    const customers = await getAllCustomers();
    const levels = getLoyaltyLevels();

    for (const customer of customers) {
        if (isLevelExpired(customer, settings)) {
            // Encontrar nível anterior
            const currentLevel = levels.find(l => l.id === customer.currentLevel);
            const sortedLevels = levels.sort((a, b) => a.pointsRequired - b.pointsRequired);
            const currentIndex = sortedLevels.findIndex(l => l.id === customer.currentLevel);

            if (currentIndex > 0) {
                const previousLevel = sortedLevels[currentIndex - 1];

                // Atualizar cliente
                const updatedCustomer = {
                    ...customer,
                    currentLevel: previousLevel.id,
                    last_level_update: new Date().toISOString()
                };

                // Salvar no banco
                // await updateCustomerInDatabase(customer.id, updatedCustomer);

                // Registrar no histórico
                // await addLevelHistory({
                //   customer_id: customer.id,
                //   from_level_id: currentLevel?.id,
                //   to_level_id: previousLevel.id,
                //   reason: 'expired'
                // });

                // Notificar cliente
                console.log(`⚠️ ${customer.name} caiu para ${previousLevel.name} por inatividade`);
                // await sendLevelDownNotification(customer, previousLevel);
            }
        }
    }
}

// ============================================
// EXEMPLO 6: Dashboard de Fidelidade
// ============================================

/**
 * Componente de dashboard com estatísticas
 */
function LoyaltyDashboard() {
    const customers = getAllCustomers();
    const levels = getLoyaltyLevels();
    const stats = getLoyaltyStats(customers, levels);

    return (
        <div className="loyalty-dashboard">
            <h2>Estatísticas do Programa de Fidelidade</h2>

            {/* Cards de Estatísticas */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Clientes com Pontos</h3>
                    <p className="stat-value">{stats.totalCustomersWithPoints}</p>
                </div>

                <div className="stat-card">
                    <h3>Média de Pontos</h3>
                    <p className="stat-value">{Math.round(stats.averagePoints)}</p>
                </div>
            </div>

            {/* Distribuição por Nível */}
            <div className="level-distribution">
                <h3>Clientes por Nível</h3>
                {stats.customersByLevel.map(({ level, count }) => (
                    <div key={level.id} className="level-bar">
                        <span>{level.icon} {level.name}</span>
                        <div className="bar" style={{ width: `${(count / customers.length) * 100}%` }} />
                        <span>{count} clientes</span>
                    </div>
                ))}
            </div>

            {/* Top Clientes */}
            <div className="top-customers">
                <h3>Top 10 Clientes</h3>
                {stats.topCustomers.map(({ customer, level }, index) => (
                    <div key={customer.id} className="top-customer">
                        <span>#{index + 1}</span>
                        <span>{customer.name}</span>
                        <span>{level?.icon} {level?.name}</span>
                        <span>{customer.points} pontos</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================
// EXEMPLO 7: Notificações de Fidelidade
// ============================================

/**
 * Enviar notificação quando cliente sobe de nível
 */
async function sendLevelUpNotification(customer: Customer, newLevel: LoyaltyLevel) {
    const message = `
🎉 Parabéns, ${customer.name}!

Você alcançou o nível ${newLevel.icon} ${newLevel.name}!

Agora você tem ${newLevel.discountPercent}% de desconto em todos os pedidos!

${newLevel.benefits}

Continue comprando e acumulando pontos! 🚀
  `.trim();

    // Enviar por WhatsApp
    // await sendWhatsApp(customer.phone, message);

    // Enviar por email
    // await sendEmail(customer.email, 'Você subiu de nível!', message);

    // Notificação no app
    // await sendPushNotification(customer.id, message);

    console.log('Notificação enviada:', message);
}

/**
 * Enviar lembrete quando nível está prestes a expirar
 */
async function sendExpirationWarning(customer: Customer, daysRemaining: number) {
    const currentLevel = getCurrentLevelInfo(customer, getLoyaltyLevels());

    const message = `
⏰ Atenção, ${customer.name}!

Seu nível ${currentLevel.currentLevelIcon} ${currentLevel.currentLevelName} 
expira em ${daysRemaining} dias!

Faça um pedido para manter seus benefícios de ${currentLevel.discountPercent}% de desconto!

Não perca seus privilégios! 🏆
  `.trim();

    // Enviar notificação
    // await sendWhatsApp(customer.phone, message);

    console.log('Alerta de expiração enviado:', message);
}

// ============================================
// FUNÇÕES AUXILIARES (Mock)
// ============================================

function getCurrentCustomer(): Customer {
    // Mock - substituir por lógica real
    return {} as Customer;
}

function getCart(): any[] {
    // Mock - substituir por lógica real
    return [];
}

function getLoyaltyLevels(): LoyaltyLevel[] {
    // Mock - substituir por lógica real
    return [];
}

function getLoyaltySettings(): LoyaltySettings {
    // Mock - substituir por lógica real
    return {} as LoyaltySettings;
}

function getAllCustomers(): Customer[] {
    // Mock - substituir por lógica real
    return [];
}

function getCurrentLevelInfo(customer: Customer, levels: LoyaltyLevel[]) {
    // Mock - substituir por lógica real
    return {
        currentLevelName: '',
        currentLevelIcon: '',
        currentLevelColor: '',
        discountPercent: 0,
        isExpired: false,
        daysUntilExpiration: null
    };
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-BR');
}

// ============================================
// EXPORT
// ============================================

export {
    processOrderWithLoyalty,
    redeemPoints,
    checkExpiredLevels,
    sendLevelUpNotification,
    sendExpirationWarning
};
