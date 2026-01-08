# 🚀 GUIA DEFINITIVO: EVOLUTION API + FOODCOST PRO

> **Criado em:** 06 Jan 2026  
> **Status:** Pronto para implementar  
> **Tempo estimado:** 30-45 minutos

---

## 📋 **ÍNDICE**

1. [O que é Evolution API](#o-que-é)
2. [Por que Evolution > Baileys](#vantagens)
3. [Pré-requisitos](#pre-requisitos)
4. [Opção A: Deploy no Railway](#railway)
5. [Opção B: Evolution Hospedado](#hospedado)
6. [Integração com FoodCost Pro](#integracao)
7. [Testando tudo](#testando)
8. [Troubleshooting](#problemas)

---

## 🤔 **O QUE É EVOLUTION API** {#o-que-é}

**Evolution API** é uma solução profissional baseada em Baileys que:

- ✅ Adiciona camada de **estabilidade**
- ✅ Sistema de **reconexão automática**
- ✅ **Webhooks** integrados
- ✅ Interface **administrativa**
- ✅ Suporte a **multi-instâncias**
- ✅ **Docker** pronto
- ✅ Usado por **empresas reais**

**GitHub:** https://github.com/EvolutionAPI/evolution-api

---

## 🏆 **POR QUE EVOLUTION > BAILEYS PURO** {#vantagens}

| Feature | Baileys Puro | Evolution API |
|---------|--------------|---------------|
| Reconexão automática | ❌ | ✅ |
| Webhooks integrados | ❌ | ✅ |
| Interface admin | ❌ | ✅ |
| Multi-instância | Manual | ✅ Nativo |
| Persistência | Manual | ✅ Automática |
| Produção-ready | ⚠️ | ✅ |

---

## ✅ **PRÉ-REQUISITOS** {#pre-requisitos}

- [x] Conta no Railway.app
- [x] Número de WhatsApp **SECUNDÁRIO** (recomendado!)
- [x] Conta Supabase ativa
- [x] Git instalado
- [ ] 30-45 minutos de tempo livre

**⚠️ IMPORTANTE:** Use número NOVO ou secundário para evitar bloqueio!

---

## 🚂 **OPÇÃO A: DEPLOY NO RAILWAY** {#railway}

### **1. Criar Novo Service**

1. Abra https://railway.app
2. Vá no projeto **"worthy-strength"**
3. Clique **"+ New"** → **"Empty Service"**
4. Nome: **"evolution-api"**

### **2. Deploy com Docker**

1. Clique no service **evolution-api**
2. Vá em **"Settings"**
3. Role até **"Source"**
4. Clique **"Deploy from GitHub repo"**
5. Selecione: **EvolutionAPI/evolution-api**
   - **Branch:** `main`
   - **Root Directory:** `/`

### **3. Configurar Variáveis de Ambiente**

Vá em **"Variables"** e adicione:

```env
# Autenticação API
AUTHENTICATION_API_KEY=SUA_CHAVE_SECRETA_AQUI

# URL do servidor (Railway gera automaticamente)
SERVER_URL=${RAILWAY_PUBLIC_DOMAIN}

# Database (SQLite padrão)
DATABASE_ENABLED=true
DATABASE_PROVIDER=sqlite

# Logs
LOG_LEVEL=ERROR
LOG_COLOR=true

# WhatsApp
QRCODE_LIMIT=30
```

**Gere uma chave aleatória:**
```bash
# No terminal, execute:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **4. Gerar Domain Público**

1. Em **"Settings"** → **"Networking"**
2. Clique **"Generate Domain"**
3. Copie a URL (ex: `evolution-api-production.up.railway.app`)
4. Salve essa URL!

### **5. Aguardar Deploy**

- Aguarde ~3-5 minutos
- Quando ficar **verde** = pronto! ✅

### **6. Testar Health Check**

Abra no navegador:
```
https://SEU-DOMINIO.up.railway.app
```

Deve mostrar:
```json
{
  "status": "ok",
  "message": "Evolution API is running"
}
```

---

## ☁️ **OPÇÃO B: EVOLUTION HOSPEDADO** {#hospedado}

**Mais fácil, mas menos controle!**

### **Provedores:**

1. **CloudAPI** - https://cloudapi.com.br
   - Trial: 7 dias grátis
   - Depois: ~R$ 30/mês

2. **Z-API** - https://z-api.io
   - Trial: 14 dias grátis
   - Depois: ~R$ 50/mês

### **Como usar:**

1. Cadastre-se no provedor
2. Crie uma **instância**
3. Copie **API URL** e **API Key**
4. Pule direto pro passo de **Integração**

---

## 🔌 **INTEGRAÇÃO COM FOODCOST PRO** {#integracao}

### **1. Criar arquivo de config**

Crie: `c:\Users\Ronaldo Luiz\Documents\foodcostpro\config\evolutionApi.ts`

```typescript
// Configuração Evolution API
export const EVOLUTION_CONFIG = {
    // URL do seu Evolution API
    baseURL: 'https://SEU-DOMINIO.up.railway.app',
    
    // API Key (gerada antes)
    apiKey: 'SUA_API_KEY_AQUI',
    
    // Nome da instância (pode ser qualquer nome)
    instanceName: 'foodcostpro',
    
    // Webhook URL (nosso backend do Supabase)
    webhookUrl: 'https://ifmmqlccvwniiwhxbsau.supabase.co/functions/v1/whatsapp-webhook'
};
```

### **2. Criar serviço Evolution**

Crie: `c:\Users\Ronaldo Luiz\Documents\foodcostpro\services\evolutionApi.ts`

```typescript
import axios from 'axios';
import { EVOLUTION_CONFIG } from '../config/evolutionApi';

const api = axios.create({
    baseURL: EVOLUTION_CONFIG.baseURL,
    headers: {
        'apikey': EVOLUTION_CONFIG.apiKey
    }
});

export const EvolutionAPI = {
    // Criar instância
    async createInstance() {
        try {
            const response = await api.post('/instance/create', {
                instanceName: EVOLUTION_CONFIG.instanceName,
                qrcode: true,
                webhook: EVOLUTION_CONFIG.webhookUrl
            });
            return response.data;
        } catch (error) {
            console.error('Erro ao criar instância:', error);
            throw error;
        }
    },

    // Buscar QR Code
    async getQRCode() {
        try {
            const response = await api.get(
                `/instance/connect/${EVOLUTION_CONFIG.instanceName}`
            );
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar QR:', error);
            throw error;
        }
    },

    // Verificar status da conexão
    async getStatus() {
        try {
            const response = await api.get(
                `/instance/connectionState/${EVOLUTION_CONFIG.instanceName}`
            );
            return response.data;
        } catch (error) {
            console.error('Erro ao verificar status:', error);
            throw error;
        }
    },

    // Enviar mensagem
    async sendMessage(number: string, message: string) {
        try {
            const response = await api.post(
                `/message/sendText/${EVOLUTION_CONFIG.instanceName}`,
                {
                    number: number,
                    text: message
                }
            );
            return response.data;
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            throw error;
        }
    },

    // Desconectar
    async logout() {
        try {
            const response = await api.delete(
                `/instance/logout/${EVOLUTION_CONFIG.instanceName}`
            );
            return response.data;
        } catch (error) {
            console.error('Erro ao desconectar:', error);
            throw error;
        }
    }
};
```

### **3. Atualizar WhatsAppBotSetup.tsx**

Substituir as chamadas antigas de Baileys pelas da Evolution API:

```typescript
import { EvolutionAPI } from '../services/evolutionApi';

// No botão "Ativar Bot"
const enableBot = async () => {
    setSaving(true);
    try {
        // Criar instância no Evolution
        await EvolutionAPI.createInstance();
        
        // Buscar QR Code
        const qrData = await EvolutionAPI.getQRCode();
        setQrImage(qrData.base64);
        
        // Começar a verificar conexão
        startConnectionCheck();
    } catch (error) {
        alert('Erro ao iniciar bot: ' + error.message);
    } finally {
        setSaving(false);
    }
};

// Verificar conexão
const startConnectionCheck = () => {
    const interval = setInterval(async () => {
        const status = await EvolutionAPI.getStatus();
        
        if (status.state === 'open') {
            clearInterval(interval);
            setConfig(prev => ({ ...prev, is_connected: true }));
            setStep(3);
        }
    }, 3000);
};
```

---

## 🧪 **TESTANDO TUDO** {#testando}

### **1. Teste manual da API**

No terminal ou Postman:

```bash
# Criar instância
curl -X POST https://SEU-DOMINIO/instance/create \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "foodcostpro",
    "qrcode": true
  }'

# Buscar QR Code
curl https://SEU-DOMINIO/instance/connect/foodcostpro \
  -H "apikey: SUA_API_KEY"
```

### **2. Teste no app**

1. Abra FoodCost Pro
2. Vá em **WhatsApp Bot**
3. Clique **"Ativar Bot"**
4. QR Code deve aparecer
5. Escaneie com WhatsApp
6. Deve conectar! ✅

---

## 🔧 **TROUBLESHOOTING** {#problemas}

### ❌ **Erro: "Unauthorized"**
**Solução:** Verifique se a `apikey` está correta nas variáveis do Railway

### ❌ **QR Code não aparece**
**Solução:** 
1. Verifique logs do Railway
2. Teste o endpoint `/instance/connect` manualmente
3. Delete a instância e crie de novo

### ❌ **"Failed to connect device"**
**Soluções:**
1. ⭐ Use número **NOVO/secundário**
2. Aguarde 24h se já tentou muitas vezes
3. Tente em rede diferente (dados móveis vs WiFi)
4. Limpe cache do WhatsApp no celular

### ❌ **Desconecta sozinho**
**Solução:** Evolution API reconecta automaticamente após ~2 minutos

### ❌ **Deploy falhou no Railway**
**Solução:**
1. Verifique se selecionou o repo correto
2. Tente fazer fork do repo Evolution e use seu fork
3. Verifique variáveis de ambiente

---

## 📚 **RECURSOS ÚTEIS**

- **Docs Evolution API:** https://doc.evolution-api.com
- **GitHub:** https://github.com/EvolutionAPI/evolution-api
- **Postman Collection:** https://www.postman.com/evolution-api
- **Grupo Telegram:** https://t.me/evolutionapi

---

## 🎯 **PRÓXIMOS PASSOS AMANHÃ**

1. [ ] Escolher: Railway ou Hospedado?
2. [ ] Fazer deploy do Evolution API
3. [ ] Configurar variáveis de ambiente
4. [ ] Criar arquivos `evolutionApi.ts` e `services/evolutionApi.ts`
5. [ ] Atualizar `WhatsAppBotSetup.tsx`
6. [ ] Testar conexão
7. [ ] Integrar com IA (DeepSeek)
8. [ ] Criar FAQs automáticos
9. [ ] **CELEBRAR!** 🎉

---

## 💡 **DICAS FINAIS**

### **Para maior sucesso:**

1. ⭐ **Use número secundário!** (Chip novo, ~R$ 10)
2. 🔄 Teste em **horários diferentes** (WhatsApp menos rigoroso à noite)
3. 📱 **NÃO use** seu número principal
4. ⏰ Se der erro, **aguarde 24h** antes de tentar de novo
5. 🌐 Tente trocar de **rede** (WiFi → Dados móveis)

### **Se tudo falhar:**

- Evolution API é **MUITO mais estável** que Baileys puro
- Mas WhatsApp ainda pode bloquear conexões não-oficiais
- Considere **Meta API** para 100% de estabilidade

---

**BOA SORTE AMANHÃ!** 🚀

*Qualquer dúvida, é só chamar!*
