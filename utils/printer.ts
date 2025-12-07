import { Order, AppSettings } from '../types';
import { formatCurrency } from './calculations';

const getBaseStyles = () => `
    <style>
        body {
            font-family: 'Courier New', Courier, monospace;
            width: 80mm;
            margin: 0;
            padding: 10px;
            font-size: 12px;
            color: #000;
        }
        .header {
            text-align: center;
            margin-bottom: 15px;
        }
        .title {
            font-size: 16px;
            font-weight: bold;
            display: block;
            margin-bottom: 5px;
        }
        .subtitle {
            font-size: 12px;
            margin-bottom: 5px;
            display: block;
        }
        .divider {
            border-top: 1px dashed #000;
            margin: 10px 0;
        }
        .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .item-name {
            flex: 1;
            padding-right: 10px;
        }
        .bold {
            font-weight: bold;
        }
        .totals-section {
            margin-top: 10px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }
        .total-final {
            font-size: 16px;
            font-weight: bold;
            margin-top: 5px;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
        }
    </style>
`;

export const printOrderReceipt = (order: Order, settings: AppSettings) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const date = new Date(order.date).toLocaleString('pt-BR');
    const itemsHtml = order.items.map(item => `
        <div class="item-row">
            <span class="item-name">${item.quantity}x ${item.productName}</span>
            <span>${formatCurrency(item.total)}</span>
        </div>
    `).join('');

    const paymentsHtml = order.paymentMethod ? `
        <div class="total-row">
            <span>Forma Pagamento:</span>
            <span>${getPaymentMethodName(order.paymentMethod)}</span>
        </div>
    ` : '';

    const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Cupom Fiscal - ${settings.businessName}</title>
            ${getBaseStyles()}
        </head>
        <body>
            <div class="header">
                <span class="title">${settings.businessName || 'Minha Loja'}</span>
                <span class="subtitle">${date}</span>
                <span class="subtitle">Pedido #${order.id.slice(0, 8)}</span>
                ${order.customerName ? `<span class="subtitle">Cliente: ${order.customerName}</span>` : ''}
            </div>
            
            <div class="divider"></div>
            
            <div class="items">
                ${itemsHtml}
            </div>
            
            <div class="divider"></div>
            
            <div class="totals-section">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(order.subtotal || 0)}</span>
                </div>
                ${order.discount ? `
                    <div class="total-row">
                        <span>Desconto:</span>
                        <span>-${formatCurrency(order.discount)}</span>
                    </div>
                ` : ''}
                ${order.serviceCharge ? `
                    <div class="total-row">
                        <span>Taxa Serviço:</span>
                        <span>+${formatCurrency(order.serviceCharge)}</span>
                    </div>
                ` : ''}
                ${order.tip ? `
                    <div class="total-row">
                        <span>Gorjeta:</span>
                        <span>+${formatCurrency(order.tip)}</span>
                    </div>
                ` : ''}
                
                <div class="divider"></div>
                
                <div class="total-row total-final">
                    <span>TOTAL:</span>
                    <span>${formatCurrency(order.totalAmount)}</span>
                </div>

                ${paymentsHtml}
            </div>
            
            <div class="footer">
                <p>Obrigado pela preferência!</p>
                <p>Volte sempre</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    // window.close(); // Comentado para permitir debug se necessário
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
};

export const printKitchenOrder = (order: Order, settings: AppSettings) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const date = new Date(order.date).toLocaleString('pt-BR');
    const itemsHtml = order.items.map(item => `
        <div class="item-row" style="margin-bottom: 10px;">
            <span class="item-name bold" style="font-size: 14px;">[ ${item.quantity} ] ${item.productName}</span>
        </div>
    `).join('');

    const content = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Pedido Cozinha - ${order.id.slice(0, 8)}</title>
            ${getBaseStyles()}
        </head>
        <body>
            <div class="header">
                <span class="title bold" style="font-size: 18px;">PEDIDO COZINHA</span>
                <span class="subtitle bold" style="font-size: 14px; margin-top: 5px;">#${order.id.slice(0, 8)}</span>
                <span class="subtitle">${date}</span>
                ${order.customerName ? `<span class="subtitle bold" style="margin-top: 5px;">Cliente: ${order.customerName}</span>` : ''}
            </div>
            
            <div class="divider"></div>
            
            <div class="items">
                ${itemsHtml}
            </div>
            
            <div class="divider"></div>
            
            <div class="footer">
                <p>Impressão: ${new Date().toLocaleTimeString()}</p>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
};

const getPaymentMethodName = (method: string) => {
    const methods: Record<string, string> = {
        'money': 'Dinheiro',
        'credit': 'Crédito',
        'debit': 'Débito',
        'pix': 'PIX'
    };
    return methods[method] || method;
};
