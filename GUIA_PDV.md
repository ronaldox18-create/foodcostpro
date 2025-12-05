# 🏪 Sistema de PDV (Ponto de Venda) - Guia Completo

## 📋 Visão Geral

O **Sistema de PDV** é uma solução completa para vendas rápidas de balcão e delivery, totalmente integrada ao FoodCost Pro.

## ✨ Funcionalidades Principais

### 1️⃣ **Gerenciamento de Caixa**

#### Abertura de Caixa
- Informe o **nome do operador** responsável
- Defina o **valor inicial** do caixa
- Sistema registra horário de abertura automaticamente

#### Movimentações de Caixa
- **Sangria**: Retirar dinheiro do caixa (ex: depósito bancário, pagamento a fornecedor)
- **Reforço**: Adicionar dinheiro ao caixa (ex: troco)
- Todas as movimentações ficam registradas com motivo e horário

#### Fechamento de Caixa
- **Caixa Esperado**: Calculado automaticamente (inicial + vendas em dinheiro + reforços - sangrias)
- **Caixa Real**: Você informa o valor contado
- **Diferença**: Sistema calcula automaticamente (sobra/falta)
- Resumo detalhado por forma de pagamento

### 2️⃣ **Vendas Rápidas**

#### Interface Otimizada
- **Busca inteligente** de produtos
- **Filtro por categorias**
- **Grid visual** com preços destacados
- **Adicionar produtos** com um clique

#### Carrinho Dinâmico
- Visualização em tempo real
- **Aumentar/diminuir** quantidades facilmente
- **Remover** itens individualmente
- **Limpar carrinho** com um clique
- **Total atualizado** automaticamente

### 3️⃣ **Sistema de Pagamento Avançado**

#### Múltiplas Formas de Pagamento
- 💵 **Dinheiro** (com cálculo automático de troco)
- 💳 **Cartão de Crédito**
- 💳 **Cartão de Débito**
- 📱 **PIX**

#### Pagamento Misto
- Aceite **pagamento em múltiplas formas**
  - Exemplo: R$ 50 em dinheiro + R$ 30 no PIX
- Sistema valida se o total foi pago

#### Descontos e Taxas
- **Desconto**: Em R$ ou %
- **Taxa de Serviço**: Adicione % (ex: 10%)
- **Gorjeta**: Valor livre em R$

### 4️⃣ **Integração com Clientes**

#### Clientes Cadastrados
- **Identifique o cliente** antes de finalizar
- Visualize **pontos de fidelidade**
- Aplique **desconto de fidelidade** automaticamente
- Ganho de pontos automático após venda

#### Cliente Balcão
- Vendas sem cadastro (cliente anônimo)
- Ideal para vendas rápidas

### 5️⃣ **Controle de Estoque**

- ✅ Verificação automática de disponibilidade
- ⚠️ Alerta quando produto está em falta
- 📦 Baixa automática no estoque após venda

### 6️⃣ **Dashboard em Tempo Real**

- 💰 **Vendas do Caixa**: Total arrecadado
- 📦 **Itens Vendidos**: Quantidade total
- 📊 **Ticket Médio**: Valor médio por venda
- 🕐 **Horário de Abertura**: Quando o caixa foi aberto

---

## 🚀 Como Usar

### Passo 1: Abrir o Caixa

1. Acesse **PDV (Balcão)** no menu lateral
2. Se o caixa estiver fechado, clique em **"Abrir Caixa"**
3. Informe:
   - Nome do operador
   - Valor inicial (ex: R$ 100,00 para troco)
4. Clique em **"Abrir Caixa"**

### Passo 2: Realizar uma Venda

1. **Busque ou navegue** pelos produtos
2. **Clique no produto** para adicionar ao carrinho
3. **Ajuste as quantidades** se necessário
4. **(Opcional)** Selecione um **cliente cadastrado**
5. Clique em **"Finalizar Venda"**

### Passo 3: Processar Pagamento

1. **Escolha a forma de pagamento**:
   - Para pagamento total: Clique em "Pagar tudo em [Método]"
   - Para pagamento misto: Adicione cada valor parcial

2. **(Opcional)** Configure:
   - Desconto (R$ ou %)
   - Taxa de serviço (%)
   - Gorjeta (R$)
   - Desconto de fidelidade (se cliente cadastrado)

3. **Se dinheiro**: Informe o valor recebido para calcular troco

4. **Confirme** o pagamento

### Passo 4: Movimentações de Caixa

#### Fazer Sangria (Retirar Dinheiro)
1. Clique em **"Gerenciar Caixa"**
2. Selecione **"Sangria / Reforço"**
3. Escolha **"Sangria"**
4. Informe:
   - Valor a retirar
   - Motivo (ex: "Depósito bancário")
5. Confirme

#### Fazer Reforço (Adicionar Dinheiro)
1. Clique em **"Gerenciar Caixa"**
2. Selecione **"Sangria / Reforço"**
3. Escolha **"Reforço"**
4. Informe:
   - Valor a adicionar
   - Motivo (ex: "Troco do banco")
5. Confirme

### Passo 5: Fechar o Caixa

1. Clique em **"Gerenciar Caixa"**
2. Selecione **"Fechar Caixa"**
3. **Conte o dinheiro** no caixa
4. Informe o **valor real contado**
5. Sistema mostra:
   - ✅ **Certo**: Se bateu exato
   - 💰 **Sobra**: Se tem mais dinheiro
   - ⚠️ **Falta**: Se tem menos dinheiro
6. Confirme o fechamento

---

## 📊 Relatórios e Controle

### Durante o Caixa Aberto
- **Vendas em tempo real**: Acompanhe o faturamento
- **Detalhamento por meio de pagamento**:
  - Dinheiro, Crédito, Débito, PIX
- **Histórico de movimentações**: Sangrias e reforços

### Após Fechar o Caixa
- **Diferença calculada**: Sobra ou falta
- **Relatório completo** salvo no banco
- Dados disponíveis para análises futuras

---

## 💡 Dicas de Uso

### ✅ Melhores Práticas

1. **Sempre abra o caixa** no início do expediente
2. **Registre todas as sangrias/reforços** com motivos claros
3. **Conte o dinheiro** cuidadosamente ao fechar
4. **Cadastre clientes frequentes** para usar fidelidade
5. **Verifique o estoque** regularmente

### ⚡ Atalhos Rápidos

- **F2**: Focar na busca de produtos
- **F12**: Finalizar venda (quando carrinho tem itens)
- **Enter**: No campo de pagamento, adiciona valor

### 🎯 Pagamento Misto - Exemplo

Cliente comprou **R$ 150,00** e quer pagar:
- R$ 100,00 no **PIX**
- R$ 50,00 em **Dinheiro**

**Como fazer:**
1. Selecione **PIX**
2. Digite **100** e clique "Adicionar"
3. Selecione **Dinheiro**
4. Digite **50** e clique "Adicionar"
5. Confirme o pagamento

---

## 🔧 Configuração Inicial (Primeira Vez)

### 1. Executar Migração do Banco
```sql
-- Execute o arquivo: migration_pdv_system.sql
-- Ele criará as tabelas necessárias:
-- - cash_registers (caixas)
-- - cash_movements (movimentações)
```

### 2. Verificar Produtos
- Certifique-se de ter **produtos cadastrados** com preços
- Produtos devem ter **estoque** se controle estiver ativo

### 3. (Opcional) Cadastrar Clientes
- Cadastre clientes frequentes em **Clientes (CRM)**
- Configure o **Programa de Fidelidade** em Configurações

---

## ❓ Problemas Comuns

### ❌ "Você precisa abrir o caixa"
**Solução**: Clique em "Abrir Caixa" e informe os dados iniciais

### ❌ "Estoque insuficiente"
**Solução**: Reponha o estoque em **Estoque** > **Adicionar Entrada**

### ❌ "Pagamento incompleto"
**Solução**: Adicione mais valores até completar o total da venda

### ❌ Diferença no fechamento de caixa
**Solução**: 
1. Reconte o dinheiro
2. Verifique se todas as sangrias/reforços foram registrados
3. Confirme que não há vendas em dinheiro não registradas

---

## 📱 Suporte

Caso tenha dúvidas ou problemas:
1. Verifique este guia
2. Consulte o **Consultor IA** no sistema
3. Entre em contato com o suporte técnico

---

**Sistema PDV - FoodCost Pro**  
*Vendas rápidas, controle total* 🚀
