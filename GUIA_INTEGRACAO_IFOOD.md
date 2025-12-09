# Guia de Integração iFood

Este documento descreve como integrar os pedidos do iFood ao sistema FoodCostPro.

## 1. Visão Geral

A integração funciona através da **API do iFood (Merchant API)**. O processo básico é:
1. **Autenticação**: O sistema se conecta ao iFood usando suas credenciais de desenvolvedor.
2. **Polling de Eventos**: O sistema pergunta ao iFood a cada 30 segundos: "Tem algo novo?".
3. **Download do Pedido**: Se houver um novo pedido, o sistema baixa os detalhes completos.
4. **Confirmação**: O sistema avisa ao iFood que recebeu o pedido (para não baixar de novo).
5. **Salvar no Banco**: O pedido é convertido e salvo no Supabase, aparecendo na tela de Pedidos.

## 2. Pré-requisitos

Para que isso funcione, você precisa:
1.  Ter uma conta no [Portal do Desenvolvedor iFood](https://developer.ifood.com.br/).
2.  Criar uma Aplicação lá para obter:
    *   **Client ID**
    *   **Client Secret**
    *   **Merchant ID** (ID da sua loja no iFood)

## 3. Estrutura de Implementação

### Banco de Dados (Já preparado)
Adicionamos os campos:
* `external_id`: ID do pedido no iFood.
* `integration_source`: Identifica que veio do 'ifood'.
* `external_metadata`: Guarda o JSON original para auditoria.

### Backend (Próximos Passos)
Como o iFood exige segurança nas chaves de acesso, **não podemos** colocar o código de conexão direto no navegador (frontend).

Precisamos de uma **Edge Function** (Supabase) ou **Serverless Function** (Vercel) que roda em segundo plano.

**Fluxo Sugerido:**
1.  Criar uma função `sync-ifood` no Supabase.
2.  Configurar um "Cron Job" (tarefa agendada) no Supabase para rodar essa função a cada 1 ou 2 minutos.
3.  A função faz o login, busca pedidos e insere no banco.

## 4. Como Obter as Credenciais

1. Acesse https://developer.ifood.com.br/
2. Vá em "Minhas Aplicações" -> "Nova Aplicação".
3. Escolha "API Distribuída" ou "API Própria" (dependendo do seu caso).
4. Copie o `clientId` e `clientSecret`.

---

**Você já possui essas credenciais?** Se sim, podemos prosseguir com a criação da função de sincronização.
