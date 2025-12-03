# 🚨 AÇÃO NECESSÁRIA PARA CORRIGIR O ERRO 400

O erro **HTTP 400** que você está vendo ao tentar salvar pedidos acontece porque o **Banco de Dados (Supabase)** não está alinhado com o código.

O código está tentando salvar na coluna `price` e `added_at`, mas é muito provável que uma dessas colunas não exista ou tenha outro nome no seu banco.

## 🛠️ Como Resolver (Passo a Passo)

1.  Acesse o **SQL Editor** do seu projeto no Supabase.
2.  Copie e cole o conteúdo do arquivo `FIX_DB_STRUCTURE.sql` que eu acabei de criar na pasta do projeto.
3.  **Execute o script**.

Isso vai:
*   Criar a coluna `added_at` (se faltar).
*   Renomear `unit_price` para `price` (se estiver errado).
*   Corrigir as permissões de segurança (RLS).

## ✅ Outras Correções Feitas

*   **Corrigido `addIngredient is not defined`**: O arquivo `AppContext.tsx` estava com funções fora de lugar. Eu corrigi isso e agora o aplicativo deve carregar sem a tela branca de erro.

Após rodar o SQL, recarregue a página e tente fazer um pedido. Deve funcionar!
