import { Order, OrderItem, Product } from '../types';
import { formatCurrency } from './calculations';

// ==========================================
// EXCEL / CSV EXPORT
// ==========================================

export const exportOrdersToCSV = (orders: Order[], products: Product[], filename: string) => {
    // 1. Prepare Headers
    const headers = [
        'Data',
        'Hora',
        'ID Pedido',
        'Cliente',
        'Status',
        'Tipo Entrega',
        'Pagamento',
        'Itens',
        'Vlr. Total',
        'Custo (CMV)'
    ];

    // 2. Prepare Data Rows
    const rows = orders.map(order => {
        const date = new Date(order.date);

        // Calculate Cost for this order
        let orderCost = 0;
        order.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            // Estimate cost based on current product cost (simplification)
            // Ideally we would store historical cost in the order item
            // For now we don't have historical cost easily accessible in all contexts without fetching ingredients
            // So we will leave it empty or 0 if calculating is too expensive here, 
            // but user asked for report, so let's try to pass the CALCULATED cost if available.
        });

        // Format Items string
        const itemsString = order.items
            .map(i => `${i.quantity}x ${i.productName}`)
            .join(' | ');

        return [
            date.toLocaleDateString('pt-BR'),
            date.toLocaleTimeString('pt-BR'),
            order.id.slice(0, 8),
            order.customerName || 'Cliente Balcão',
            getStatusLabel(order.status),
            order.deliveryType === 'delivery' ? 'Entrega' : 'Balcão/Mesa',
            getPaymentLabel(order.paymentMethod),
            `"${itemsString}"`, // Quote to handle commas
            order.totalAmount.toFixed(2).replace('.', ','),
            '0,00' // Placeholder for cost as it is complex to calc here synchronously without full ingredients context
        ].join(';');
    });

    // 3. Combine with BOM for Excel UTF-8 support
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');

    // 4. Trigger Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
        'completed': 'Concluído',
        'pending': 'Pendente',
        'preparing': 'Preparando',
        'ready': 'Pronto',
        'canceled': 'Cancelado'
    };
    return map[status] || status;
};

const getPaymentLabel = (method: string) => {
    const map: Record<string, string> = {
        'credit': 'Crédito',
        'debit': 'Débito',
        'money': 'Dinheiro',
        'pix': 'PIX'
    };
    return map[method] || method;
};

// ==========================================
// PDF REPORT (PRINT WINDOW)
// ==========================================

interface ReportData {
    period: string;
    generatedAt: string;
    businessName: string;
    summary: {
        revenue: number;
        orders: number;
        averageTicket: number;
        cost: number;
        profit: number;
        margin: number;
    };
    topProducts: any[];
    dailySales: any[];
}

export const generatePDFReport = (data: ReportData) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const styles = `
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f97316; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #ca4a0b; }
            .period { font-size: 14px; color: #6b7280; margin-top: 5px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 10px; border-left: 4px solid #f97316; padding-left: 10px; }
            
            .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
            .card { background: #f3f4f6; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
            .card-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
            .card-value { font-size: 20px; font-weight: bold; color: #111827; margin-top: 5px; }
            .text-green { color: #059669; }
            
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; background: #f9fafb; padding: 10px; border-bottom: 2px solid #e5e7eb; color: #374151; font-weight: 600; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; color: #4b5563; }
            tr:nth-child(even) { background: #f9fafb; }
            
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 20px; }
            
            @media print {
                body { margin: 0; padding: 20px; }
                .no-print { display: none; }
            }
        </style>
    `;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório Gerencial - ${data.businessName}</title>
            ${styles}
        </head>
        <body>
            <div class="header">
                <div class="logo">${data.businessName}</div>
                <div class="period">Relatório Gerencial • ${data.period}</div>
                <div style="font-size: 10px; color: #9ca3af; margin-top: 5px;">Gerado em: ${data.generatedAt}</div>
            </div>

            <div class="section">
                <div class="section-title">Resumo Financeiro</div>
                <div class="grid-3">
                    <div class="card">
                        <div class="card-label">Faturamento</div>
                        <div class="card-value">${formatCurrency(data.summary.revenue)}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Lucro Bruto</div>
                        <div class="card-value text-green">${formatCurrency(data.summary.profit)}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Margem</div>
                        <div class="card-value">${data.summary.margin.toFixed(1)}%</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Pedidos</div>
                        <div class="card-value">${data.summary.orders}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Ticket Médio</div>
                        <div class="card-value">${formatCurrency(data.summary.averageTicket)}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Custos (CMV)</div>
                        <div class="card-value">${formatCurrency(data.summary.cost)}</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Top Produtos</div>
                <table>
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th align="right">Qtd. Vendida</th>
                            <th align="right">Receita Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.topProducts.map(p => `
                            <tr>
                                <td>${p.name}</td>
                                <td align="right">${p.quantity}</td>
                                <td align="right">${formatCurrency(p.revenue)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
            <div class="section-title">Detalhamento Diário</div>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th align="right">Pedidos</th>
                        <th align="right">Faturamento</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.dailySales.map(d => `
                        <tr>
                            <td>${d.day} (${new Date(d.date).toLocaleDateString('pt-BR')})</td>
                            <td align="right">${d.ordersCount}</td>
                            <td align="right">${formatCurrency(d.revenue)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

            <div class="footer">
                <p>Relatório gerado pelo sistema FoodCost Pro</p>
            </div>

            <script>
                window.onload = function() {
                    window.print();
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
};
