# 🚀 Guia Rápido: Ativar Sistema de Horários

## Passo 1: Executar Migração SQL

1. Abra o **Supabase Dashboard** (https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **SQL Editor** (na barra lateral esquerda)
4. Clique em **"New Query"**
5. Copie TODO o conteúdo do arquivo `migration_business_hours.sql`
6. Cole no editor
7. Clique em **RUN** (ou pressione Ctrl+Enter)
8. Aguarde a mensagem de sucesso ✅

## Passo 2: Verificar

Após executar, verifique se a tabela foi criada:

```sql
-- Execute esta query para confirmar:
SELECT * FROM business_hours LIMIT 1;
```

Se retornar dados ou "no rows", está funcionando! ✅

## Passo 3: Configurar Horários

1. Recarregue a aplicação
2. Faça login
3. Vá no menu lateral: **"Horários"**
4. Configure os dias e horários
5. Salve

## Passo 4: Testar no Cardápio

1. Acesse o cardápio online da sua loja
2. Veja o badge "Aberto/Fechado" no topo
3. Pronto! 🎉

## Problemas?

### Erro: "relation business_hours does not exist"
- Execute a migração SQL novamente
- Verifique se você está no projeto correto do Supabase

### Erro: "permission denied"
- Verifique se as políticas RLS foram criadas
- Execute todo o script `migration_business_hours.sql`

### Horários não aparecem
- Faça um refresh (F5) na aplicação
- Verifique o console do navegador (F12) por erros

## Dúvidas?

Veja a documentação completa em `HORARIOS_IMPLEMENTATION.md`
