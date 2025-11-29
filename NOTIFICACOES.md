# Sistema de Notificações de Pedidos em Tempo Real 🔔

## Configuração do Supabase Realtime

Para que as notificações funcionem, você precisa **habilitar o Realtime** na tabela `orders` no Supabase:

### Passos:

1. **Acesse o Supabase Dashboard**
2. **Vá em Database → Replication**
3. **Encontre a tabela `orders`**
4. **Habilite** as seguintes opções:
   - ✅ **INSERT** - Para detectar novos pedidos
   - ✅ **UPDATE** - Para detectar mudanças de status (opcional)

### SQL Alternativo (se preferir via SQL):

```sql
-- Habilitar replicação para a tabela orders
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Publicar mudanças
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
```

## Como Funciona

### 1. **Hook `useOrderNotifications`**
- Monitora novos pedidos em tempo real usando Supabase Realtime
- Toca um som de notificação (3 beeps crescentes)
- Retorna o novo pedido para exibição no modal

### 2. **Modal de Notificação**
- Aparece automaticamente quando um novo pedido chega
- Mostra:
  - Nome do cliente
  - Valor total do pedido
  - ID do pedido
- Botões de ação:
  - **Aceitar**: Confirma o pedido (status → 'confirmed')
  - **Recusar**: Cancela o pedido (status → 'cancelled')

### 3. **Som de Notificação**
- Gerado usando Web Audio API
- 3 beeps progressivos (800Hz → 1000Hz → 1200Hz)
- Não requer arquivos de áudio externos

## Testando

1. **Abra a página "Pedidos (Cardápio)"** no admin
2. **Em outra aba/navegador**, acesse o cardápio virtual como cliente
3. **Faça um pedido**
4. **Volte para a aba do admin**
   - ✅ Você deve ouvir o som de notificação
   - ✅ O modal deve aparecer automaticamente

## Características

- ✅ **Tempo Real**: Pedidos aparecem instantaneamente
- ✅ **Som de Notificação**: 3 beeps para chamar atenção
- ✅ **Modal Animado**: Animações suaves de entrada
- ✅ **Aceitar/Recusar Rápido**: Botões diretos no modal
- ✅ **Auto-atualização**: Lista de pedidos atualiza automaticamente após ação

## Notas Técnicas

- O hook previne notificações duplicadas usando `lastOrderIdRef`
- A subscription é limpa automaticamente quando o componente desmonta
- O som é gerado sinteticamente (não requer arquivos de áudio)
- Funciona apenas se o usuário estiver na página (tab ativa)

## Próximas Melhorias Sugeridas

- [ ] Notificações do browser (Notification API)
- [ ] Badge com contador de pedidos pendentes
- [ ] Som customizável
- [ ] Histórico de notificações
- [ ] Push notifications (PWA)
