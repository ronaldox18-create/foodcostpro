# 🚀 AÇÃO IMEDIATA: Aplicar Migration do Cardápio Virtual

## ⏱️ Tempo Estimado: 5 minutos

---

## 📋 PASSO A PASSO (COPY & PASTE)

### PASSO 1: Abrir Supabase Dashboard
1. Abra seu navegador
2. Acesse: https://app.supabase.com
3. Faça login com sua conta
4. Selecione o projeto **FoodCostPro**

### PASSO 2: Abrir SQL Editor
1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique no botão **"New query"** (canto superior direito)

### PASSO 3: Copiar Migration
1. Abra o arquivo: `migrations/cardapio_virtual_complete.sql`
2. Selecione TODO o conteúdo (Ctrl+A)
3. Copie (Ctrl+C)

### PASSO 4: Executar Migration
1. Cole no editor SQL do Supabase (Ctrl+V)
2. Clique em **"Run"** ou pressione **Ctrl + Enter**
3. Aguarde 5-10 segundos

### PASSO 5: Verificar Sucesso
Você deve ver esta mensagem na parte inferior:

```
✅ Migração completa executada com sucesso!
📊 Tabelas criadas: 17
🔐 Políticas RLS configuradas
⚡ Índices criados para performance
🎯 Sistema pronto para Cardápio Virtual Profissional!
```

---

## ✅ VALIDAÇÃO (Copie e execute este SQL)

```sql
-- Verificar se as tabelas foram criadas
SELECT table_name, 
       pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (
    table_name LIKE 'product_%' 
    OR table_name LIKE 'store_%' 
    OR table_name LIKE 'promotion%'
    OR table_name LIKE '%coupon%'
    OR table_name LIKE '%combo%'
    OR table_name = 'customer_favorites'
    OR table_name = 'search_history'
  )
ORDER BY table_name;
```

**Resultado Esperado:** 17 tabelas listadas

---

## 🎯 APÓS APLICAR MIGRATION

### 1. Testar Personalização Visual
```bash
# No seu terminal (pasta do projeto):
# Se ainda não estiver rodando:
npm run dev

# Depois:
1. Acesse: http://localhost:5173
2. Faça login
3. Vá em: "Cardápio Virtual"
4. Clique na aba: "Personalização"
5. Faça upload de uma logo de teste
6. Altere as cores
7. Gere um QR Code
```

### 2. Criar Bucket de Storage (Se ainda não existe)
```sql
-- Execute no SQL Editor do Supabase
-- Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

-- Política: Permitir upload autenticado
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Política: Permitir leitura pública
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Política: Usuários podem deletar suas próprias imagens
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');
```

---

## 🚨 PROBLEMAS COMUNS

### Erro: "permission denied"
**Causa:** Você não tem permissões de admin no projeto  
**Solução:** Certifique-se de estar logado com a conta correta

### Erro: "relation already exists"
**Causa:** A migration já foi executada antes  
**Solução:** Tudo bem! Significa que já está aplicada

### Erro: "syntax error at or near..."
**Causa:** Parte do SQL pode estar faltando  
**Solução:** Copie NOVAMENTE todo o arquivo, do início ao fim

### Erro: Storage "product-images" não existe
**Causa:** Bucket ainda não foi criado  
**Solução:** Execute o SQL da seção "Criar Bucket de Storage" acima

---

## 📸 SCREENSHOTS IMPORTANTES

### Como deve parecer o SQL Editor:
```
┌─────────────────────────────────────────────┐
│  SQL Editor                                 │
├─────────────────────────────────────────────┤
│  + New query   [Run] [Format] [Save]       │
├─────────────────────────────────────────────┤
│                                             │
│  -- ═══════════════════════════            │
│  -- MIGRAÇÃO COMPLETA: CARDÁPIO...         │
│  -- ═══════════════════════════            │
│                                             │
│  CREATE TABLE IF NOT EXISTS...             │
│  ...                                        │
│  (todo o conteúdo aqui)                    │
│                                             │
└─────────────────────────────────────────────┘
```

### Resultado esperado após Run:
```
Success. No rows returned
── Mensagens ──
✅ Migração completa executada com sucesso!
📊 Tabelas criadas: 17
```

---

## ⏭️ DEPOIS DE APLICAR

### Você poderá:
1. ✅ Personalizar logo e cores da loja
2. ✅ Gerar QR Code profissional
3. ✅ Baixar/Imprimir QR Code
4. ✅ Preparar para próximas fases (complementos, variações, etc)

### Ainda NÃO funcionará (precisa FASE 3):
- ❌ Adicionar complementos aos produtos
- ❌ Criar variações de tamanho/volume
- ❌ Modal de customização no carrinho

---

## 📞 PRECISA DE AJUDA?

Se algo der errado:

1. **Copie a mensagem de erro completa**
2. **Tire um screenshot do SQL Editor**
3. **Verifique o arquivo de logs:**
   - Dashboard > Logs > Database
4. **Me avise qual erro apareceu**

---

## ✅ CHECKLIST FINAL

Antes de continuar, verifique:

- [ ] Migration executada sem erros
- [ ] 17 tabelas apareceram na validação
- [ ] Bucket `product-images` criado
- [ ] Políticas de storage aplicadas
- [ ] `npm run dev` está rodando
- [ ] Consegue acessar "Cardápio Virtual" > "Personalização"

---

**AGORA PODE APLICAR A MIGRATION! 🚀**

Boa sorte! Qualquer dúvida, me avise.
