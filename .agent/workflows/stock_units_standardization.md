---
description: Padronização de Unidades de Estoque (KG/L)
---

# Padronização de Unidades

O sistema foi ajustado para **NÃO** realizar conversões automáticas de unidade (ex: KG -> Gramas) ao salvar ou editar itens no estoque.

## Como funciona agora:

1. **O que você vê é o que você tem**: Se você digitar `11` no campo de estoque e a unidade for `kg`, o sistema salvará `11` e entenderá como `11 kg`.
2. **Sem multiplicadores ocultos**: Anteriormente, o sistema multiplicava por 1000 ao salvar KG/L. Isso foi removido.
3. **Alerta de Segurança**: Se você tentar salvar um valor maior que 100 para um item em KG ou Litros, o sistema exibirá um alerta sugerindo que talvez você queira converter para a unidade correta (ex: digitar 500g como 0.5kg).

## Ação Necessária:

- **Verifique seu estoque**: Se você tinha itens salvos anteriormente como KG mas que estavam aparecendo com valores enormes (ex: 11000 kg), edite-os e coloque o valor correto (ex: 11). O sistema agora respeitará sua edição.
