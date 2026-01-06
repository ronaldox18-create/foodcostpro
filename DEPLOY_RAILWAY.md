# 🚀 DEPLOY WHATSAPP BOT - RAILWAY (GRÁTIS)

**Backend sempre online - 24/7!**

---

## ⚡ **PASSO A PASSO (10 MINUTOS):**

### **1. Criar conta no Railway**

1. Acesse: https://railway.app
2. Clique "Start a New Project"
3. Login com GitHub (ou email)
4. ✅ Conta criada!

---

### **2. Criar novo projeto**

1. Clique "New Project"
2. Escolha "Deploy from GitHub repo"
3. Conecte sua conta GitHub
4. Selecione o repositório `foodcostpro`
5. ✅ Projeto criado!

---

### **3. Configurar variáveis de ambiente**

No Railway, vá em "Variables" e adicione:

```
VITE_SUPABASE_URL=https://ifmmqlccvwniiwhxbsau.supabase.co
VITE_SUPABASE_ANON_KEY=sua_key_aqui
PORT=3001
NODE_ENV=production
```

✅ Variáveis configuradas!

---

### **4. Deploy automático**

Railway vai detectar o `Procfile` e fazer deploy automático!

Aguarde 2-3 minutos...

✅ **Deploy concluído!**

---

### **5. Pegar URL do backend**

Railway vai gerar uma URL tipo:
```
https://foodcostpro-production.up.railway.app
```

**COPIE ESSA URL!**

---

### **6. Atualizar frontend**

No arquivo `pages/WhatsAppBotSetup.tsx`, troque:

**DE:**
```typescript
const response = await fetch('http://localhost:3001/api/whatsapp/start'
```

**PARA:**
```typescript
const response = await fetch('https://SUA-URL.railway.app/api/whatsapp/start'
```

Faça isso em TODAS as chamadas de API!

---

## ✅ **PRONTO!**

Agora o backend está:
- ✅ Sempre online (24/7)
- ✅ HTTPS automático
- ✅ Logs em tempo real
- ✅ Deploy automático (quando fizer commit)
- ✅ **100% GRÁTIS!**

---

## 🔍 **VERIFICAR SE ESTÁ FUNCIONANDO:**

Acesse no navegador:
```
https://SUA-URL.railway.app/health
```

Deve mostrar:
```json
{
  "status": "ok",
  "message": "WhatsApp Bot Server está rodando!",
  "activeBots": 0
}
```

---

## 📊 **MONITORAR:**

No Railway:
- Ver logs em tempo real
- Restart se necessário
- Ver uso de recursos

---

## ⚠️ **IMPORTANTE:**

**SESSÕES DO BAILEYS:**

O Railway vai resetar a cada deploy, então:
- Pasta `whatsapp_sessions` será perdida
- Precisará escanear QR de novo após cada deploy

**SOLUÇÃO:** Salvar sessões no Supabase Storage (vou criar depois!)

---

## 💰 **CUSTO:**

Railway free tier:
- ✅ 500 horas/mês (mais de 20 dias!)
- ✅ 100 GB transferência
- ✅ Mais que suficiente!

Se acabar o free tier:
- Railway: ~R$ 25/mês
- Render: Grátis com sleep (acorda quando usar)
- Fly.io: ~R$ 15/mês

---

## 🎯 **PRÓXIMOS PASSOS:**

1. ✅ Criar conta Railway
2. ✅ Deploy do backend
3. ✅ Copiar URL
4. ✅ Atualizar frontend
5. ✅ Testar!

---

**Data:** 05/01/2026  
**Status:** Pronto para deploy  
**Dificuldade:** ⭐⭐ (Fácil)  
**Tempo:** 10 minutos
