# 🚀 Guia: Sistema Avançado de Horários

Implementamos funcionalidades avançadas para o controle de horários da sua loja!

## Novas Funcionalidades

1.  **Horários Especiais (Feriados/Eventos)** 📅
    *   Configure dias específicos onde o horário é diferente ou a loja fecha.
    *   Prioridade sobre o horário regular.
    *   Ex: Natal, Ano Novo, Aniversário da Loja.

2.  **Pausas/Intervalos** ☕
    *   Configure intervalos dentro do horário de funcionamento.
    *   Ex: Aberto das 11:00 às 22:00, com pausa das 15:00 às 18:00.
    *   O sistema mostra "Em Pausa" durante esse período.

3.  **Tipos de Serviço** 🛵
    *   Configure horários diferentes para **Delivery** e **Balcão (Pickup)**.
    *   Ou use "Todos" para aplicar o mesmo horário.

4.  **Notificações** 🔔
    *   Configure preferências para ser notificado quando a loja abrir ou fechar.

## Como Ativar (Migração)

Para ativar essas novas funcionalidades, você precisa atualizar o banco de dados.

1.  Abra o **Supabase Dashboard**.
2.  Vá em **SQL Editor**.
3.  Crie uma **New Query**.
4.  Copie e cole o conteúdo do arquivo `migration_business_hours_advanced.sql`.
5.  Execute (**RUN**).

## Como Usar

1.  Acesse o menu **"Horários"** na aplicação.
2.  Você verá uma nova interface com abas:
    *   **Horários Regulares**: Configure a semana normal, agora com opção de Pausa e Tipo de Serviço.
    *   **Feriados/Eventos**: Adicione dias específicos (ex: 25/12).
    *   **Notificações**: Ative alertas.

## Exemplo de Uso

**Cenário: Feriado**
*   Adicione um evento para 25/12.
*   Marque como "Fechado".
*   No dia 25, o cardápio mostrará "Fechado - Natal".

**Cenário: Almoço e Jantar**
*   Configure Segunda-feira: 11:00 às 23:00.
*   Adicione Pausa: 15:00 às 18:00.
*   Resultado: A loja abre para almoço, fecha à tarde (mostra "Em Pausa") e reabre para o jantar.

## Suporte

Se tiver dúvidas, consulte a documentação técnica em `HORARIOS_IMPLEMENTATION.md` (atualizada).
