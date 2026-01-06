# 📱 GUIA: CONFIGURAR WEBHOOK DO WHATSAPP

**Objetivo:** Receber mensagens dos clientes no sistema  
**Tempo:** 15 minutos  
**Pré-requisito:** Código deployado na Vercel

---

## 🚀 **PASSO 1: DEPLOY NA VERCEL**

### **1.1 - Preparar Variáveis de Ambiente**

Adicione na Vercel:
```
WHATSAPP_VERIFY_TOKEN=foodcostpro_webhook_2026
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_key_do_supabase
```

### **1.2 - Deploy**

```bash
cd foodcostpro
vercel --prod
```

**URL resultante será:**
```
https://foodcostpro.vercel.app
```

**Endpoint do webhook:**
```
https://foodcostpro.vercel.app/api/whatsapp/webhook
```

---

## 🔧 **PASSO 2: CONFIGURAR NO META**

### **2.1 - Acessar Meta Business**

1. Vá em: https://business.facebook.com/
2. WhatsApp Manager
3. Seu número do WhatsApp
4. Configuration

### **2.2 - Adicionar Webhook**

1. **Callback URL:**
   ```
   https://foodcostpro.vercel.app/api/whatsapp/webhook
   ```

2. **Verify Token:**
   ```
   foodcostpro_webhook_2026
   ```

3. **Clique em "Verify and Save"**

✅ Deve aparecer "Successfully verified"

### **2.3 - Inscrever em Eventos**

**Marque:**
- ✅ messages (Mensagens)
- ✅ message_status (Status de mensagens)

**Salve!**

---

## 🧪 **PASSO 3: TESTAR**

### **Teste 1: Enviar mensagem de teste**

1. **Mande uma mensagem do seu celular:**
   ```
   Teste de webhook
   ```

2. **Verifique no Vercel Logs:**
   - Deve aparecer "📥 Webhook recebido"
   - Mensagem processada

3. **Verifique no Supabase:**
   ```sql
   SELECT * FROM whatsapp_conversations 
   ORDER BY created_at DESC LIMIT 1;
   
   SELECT * FROM whatsapp_messages 
   ORDER BY created_at DESC LIMIT 1;
   ```

✅ Deve ter registro da conversa e mensagem!

---

### **Teste 2: FAQ Automático**

1. **Cadastre um FAQ primeiro** (via interface)

2. **Mande mensagem:**
   ```
   Qual o horário?
   ```

3. **Deve receber resposta automática!**

---

## ⚠️ **SOLUÇÃO DE PROBLEMAS:**

### **Erro: Webhook not verified**
- Verifique se URL está correta
- Verifique se VERIFY_TOKEN está correto
- Veja logs na Vercel

### **Mensagens não chegam**
- Verifique se eventos estão inscritos
- Veja logs da API
- Confirme que DB tables existem

### **FAQ não responde**
- Verifique se FAQ está ativo
- Veja keywords corretas
- Confira logs de processamento

---

## 📊 **PRÓXIMOS PASSOS:**

Com webhook configurado:
✅ Mensagens chegam no sistema
✅ FAQ responde automaticamente  
✅ Pronto para Inbox de conversas!

**Criado:** 05/01/2026  
**Status:** Aguardando deploy + config
