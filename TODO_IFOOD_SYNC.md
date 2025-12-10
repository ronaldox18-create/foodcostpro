# Status da Sincronização iFood (Debug)

**Data:** 09/12/2025
**Erro Atual:** `500 Internal Server Error` -> `no Route matched with those values`
**Endpoint Falhando:** `POST /merchants/{mId}/catalogs/{cId}/categories/{catId}/products`

## Análise
Mesmo simplificando para o fluxo de um único passo ("One-Step Creation"), a API retorna que a rota não existe. Isso indica que a estrutura de URL para adicionar produtos nesta conta/catálogo específico difere do padrão V2.0 direto.

## Próximos Passos (Para a próxima sessão)
1. **Testar Variação de Template:** Tentar a rota com template explícito:
   `.../categories/{categoryId}/templates/DEFAULT/products`
   
2. **Testar Criação via Itens:** Tentar o endpoint de itens se o conceito de "Produto" direto falhar:
   `.../categories/{categoryId}/items`

3. **Verificar IDs:** Garantir (novamente) que o `catalogId` e `categoryId` são 100% válidos e pertencem um ao outro fazendo um GET em `.../categories/{categoryId}` antes de postar.

## Estado do Código
- A função `sync-catalog/index.ts` está atualmente configurada para o fluxo "One-Step".
- O frontend exibe o erro detalhado JSON retornando da Edge Function.
