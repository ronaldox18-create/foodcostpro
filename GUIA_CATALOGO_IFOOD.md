
# Sincronização de Cardápio com iFood (Status do Desenvolvimento)

## Estado Atual (Dezembro 2025)

Realizamos uma série de implementações robustas na Edge Function `sync-catalog`. O sistema está tecnicamente capaz de comunicar com a API V2 do iFood, mas enfrentamos limitações de **consistência de dados** no ambiente de teste/sandbox do iFood.

### O que JÁ FUNCIONA:
1.  **Autenticação**: O sistema consegue gerar tokens e identificar o Merchant ID corretamente.
2.  **Identificação de Catálogo**: O sistema encontra o catálogo padrão ou cria um novo se não existir.
3.  **Sincronização de Categoria (Parcial)**:
    *   Conseguimos criar categorias.
    *   Conseguimos atualizar categorias.
    *   **Inteligência de Conflito**: Se tentamos criar uma categoria que já existe, o sistema identifica o erro, captura o ID da categoria existente e "adota" ela automaticamente, evitando duplicações.
    *   **Recuperação de Erro**: O sistema tenta renomear categorias com timestamp (`Bebidas 9932`) se houver bloqueios severos.

### O que ESTÁ FALHANDO (Bloqueante):
*   **Erro `404 Not Found` / `no Route matched` na Criação de Produto**:
    *   Mesmo após criar/adotar uma categoria com sucesso, a tentativa de POSTar um produto nela falha com erro de rota.
    *   Tentamos variações de endpoints: `/products` (Padrão V2), `/templates/DEFAULT/products`, e `/items`. Todas retornam 404.
    *   Tentamos recriar a categoria em tempo real (Auto-Recovery), mas a falha persiste na nova categoria.

### Hipótese Técnica: **Delay de Propagação (Consistency Delay)**
A causa mais provável é que a infraestrutura do iFood (especialmente Sandbox) tem um atraso entre a **Criação da Categoria** e a **Disponibilidade da Rota** para produtos.
Ao tentarmos criar o produto milissegundos após a categoria, a rota ainda não existe nos balanceadores de carga do iFood.

## Como Retomar no Futuro

Quando decidir retomar esta tarefa, sugerimos as seguintes abordagens:

1.  **Implementar Delay Exponencial**: Adicionar um mecanismo de espera (polling) que aguarda 5s, 10s, 30s após criar a categoria antes de tentar inserir o produto.
2.  **Fluxo de Importação Inversa**: Em vez de enviar do FoodCostPro -> iFood, criar uma função que **Lê** o cardápio já existente no iFood e popula o FoodCostPro. Isso garante que estamos usando IDs válidos e categorias já estabelecidas.
3.  **Verificar Permissões de Conta**: Confirmar se a conta de desenvolvedor tem restrições específicas de escrita em catálogo (algumas contas só permitem leitura).

---

## Estrutura Técnica Atual

A função `sync-catalog` está configurada com:
*   **Auto-Recovery Unificado**: Um bloco `try/catch` global que captura falhas e tenta auto-reparar a estrutura de categorias.
*   **Estratégia Híbrida de Rotas**: Tenta primeiro a rota padrão V2, e se falhar, tenta a rota de Templates.
*   **Logs Detalhados**: O console da Edge Function imprime passo-a-passo das URLs e IDs usados.

Para retomar, basta descomentar ou ajustar a lógica em `supabase/functions/sync-catalog/index.ts`.
