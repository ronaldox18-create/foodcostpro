# Implementação do Sistema de Horários de Funcionamento (Avançado)

## O que foi implementado? 🎯

O sistema foi evoluído para suportar cenários complexos de funcionamento de restaurantes e deliverys.

## Componentes Criados/Atualizados

### 1. **Banco de Dados (Atualizado)**
- Tabela `business_hours`: Adicionados campos `pause_start`, `pause_end`, `service_type`.
- Nova Tabela `special_hours`: Para feriados e exceções.
- Nova Tabela `notification_preferences`: Configurações de alerta.
- Função SQL `is_store_open`: Lógica complexa de verificação direto no banco.

### 2. **Tipos TypeScript**
- Atualizados para suportar `SpecialHours`, `ServiceType` e `NotificationPreferences`.

### 3. **Utilitários (`utils/businessHours.ts`)**
- `checkStoreStatus()`: Agora verifica:
  1. Horário Especial (Feriado) ? -> Usa ele.
  2. Horário Regular ? -> Usa ele.
  3. Está no horário ? -> Sim.
  4. Está em pausa ? -> Retorna status "pause".
- `findNextOpenDay()`: Considera feriados futuros.
- `isNearClosing()`: Alerta sobre fechamento próximo.

### 4. **Frontend Admin (`BusinessHoursAdvanced.tsx`)**
- Interface completa com abas.
- Gerenciamento de exceções de calendário.
- Configuração de pausas.

### 5. **Frontend Cliente (`StoreMenu.tsx`)**
- Exibe status detalhado: "Em Pausa", "Fechado - Feriado", etc.
- Busca dados de horários especiais.

### 6. **Dashboard Widget**
- Mostra status atual considerando pausas e eventos.
- Lista horários da semana indicando pausas.

## Como usar

### 1. Executar a Migração SQL

Execute o arquivo `migration_business_hours_advanced.sql` no Supabase.

### 2. Configurar

Acesse a página de Horários e explore as novas abas.

## Detalhes Técnicos

### Prioridade de Verificação
1. **Special Hours**: Se existir uma entrada para a data atual (`YYYY-MM-DD`), ela tem precedência total sobre o horário regular.
2. **Regular Hours**: Se não houver data especial, usa o dia da semana (`0-6`).

### Pausas
Se `pause_start` e `pause_end` estiverem definidos, o sistema considera a loja **ABERTA** no dia, mas com status temporário de **PAUSA** durante esse intervalo. O cardápio não permite pedidos (dependendo da implementação de bloqueio) ou apenas avisa.

### Tipos de Serviço
- `all`: Aplica para tudo.
- `delivery`: Apenas para entrega.
- `pickup`: Apenas para retirada.
*Nota: A implementação atual do frontend usa preferencialmente 'all' ou o tipo selecionado na configuração.*
