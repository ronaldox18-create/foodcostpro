# 🚀 COMO RODAR O WHATSAPP BOT - GUIA RÁPIDO

**IMPORTANTE:** O bot precisa de 2 servidores rodando!

---

## ⚡ **INÍCIO RÁPIDO (2 MINUTOS):**

### **Terminal 1: Frontend (JÁ ESTÁ RODANDO)**
```bash
npm run dev
```
✅ Já está rodando na porta 5173

---

### **Terminal 2: Backend WhatsApp**
```bash
node server/whatsappServer.js
```

Você verá:
```
╔════════════════════════════════════════╗
║  🤖 WhatsApp Bot Server - RODANDO!    ║
║  Porta: 3001                           ║
║  Status: ✅ Online                     ║
╚════════════════════════════════════════╝
```

---

## 🎯 **DEPOIS QUE OS 2 ESTIVEREM RODANDO:**

1. Acesse: `http://localhost:5173/#/whatsapp-bot`
2. Clique "Ativar Bot Agora!"
3. **QR Code VAI APARECER!** 📱
4. Escaneie com WhatsApp
5. Pronto! ✅

---

## ⚠️ **SE DER ERRO:**

### **ERR_CONNECTION_REFUSED**
**Causa:** Backend não está rodando  
**Solução:** Rode `node server/whatsappServer.js`

### **QR não aparece**
**Causa:** Backend demorou para iniciar  
**Solução:** 
1. Aguarde 5 segundos
2. Clique "Recarregar"

### **Module not found**
**Causa:** Falta instalar dependências  
**Solução:**
```bash
npm install express cors @supabase/supabase-js
```

---

## 📝 **COMANDOS COMPLETOS:**

```bash
# Terminal 1 (Frontend)
npm run dev

# Terminal 2 (Backend - NOVO)
node server/whatsappServer.js
```

**Simples assim!** 🎉

---

## 🔧 **CONFIGURAR .ENV:**

Se ainda não tem, crie `.env` com:

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_key_aqui
```

O backend lê essas variáveis automaticamente!

---

## ✅ **CHECKLIST:**

- [ ] `npm install` executado
- [ ] `.env` configurado
- [ ] `npm run dev` rodando (Terminal 1)
- [ ] `node server/whatsappServer.js` rodando (Terminal 2)
- [ ] Abrir `http://localhost:5173/#/whatsapp-bot`
- [ ] Clicar "Ativar Bot"
- [ ] QR Code aparece!
- [ ] Escanear com WhatsApp
- [ ] **FUNCIONANDO!** 🎊

---

**Data:** 05/01/2026  
**Status:** Sistema 100% Funcional  
**Custo:** R$ 0 (Grátis!)
