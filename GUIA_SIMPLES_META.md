# 🎯 Guia ULTRA Simplificado - Meta Business

## ⏰ Tempo Total: 15-20 minutos

---

## 🔥 PASSO 1: Criar Conta Meta Business (5 min)

1. Abra: https://business.facebook.com
2. Botão azul: **"Criar Conta"**
3. Preencha:
   - Nome da empresa: **FoodCostPro**
   - Seu nome: **[Seu Nome]**
   - Email: **[Seu Email]**
4. Clique: **"Avançar"**
5. Clique: **"Concluir"**

✅ Conta criada!

---

## 📱 PASSO 2: Criar App (3 min)

**Já está na tela do Meta Business:**

1. Procure: **"Criar Conta de Negócios"** ou **"Apps"**
2. Clique: **"Criar App"**
3. Escolha: **"Business"** (NÃO Consumer)
4. Preencha:
   - Nome do app: **FoodCostPro**
   - Email de contato: **[Seu Email]**
5. Clique: **"Criar App"**

✅ App criado!

---

## 💬 PASSO 3: Adicionar WhatsApp (2 min)

**No painel do app:**

1. **IGNORE** avisos de política por enquanto
2. Procure: **"Conectar-se com clientes pelo WhatsApp"**
3. Clique na **seta →** ao lado
4. Aparece wizard? Clique: **"Começar"** ou **"Avançar"**

---

## 📞 PASSO 4: Adicionar Número (5 min)

**No wizard:**

1. Escolha: **"Usar meu número de telefone"**
2. Digite SEU celular: **11 99999-9999**
3. Clique: **"Enviar código SMS"**
4. **Abra seu WhatsApp no celular**
5. Recebeu código? Digite aqui
6. Clique: **"Verificar"**

⚠️ **PROBLEMA? Número já em uso?**
→ Use outro número OU
→ Escolha "Testar com número do Meta" (temporário)

✅ Número verificado!

---

## 🔑 PASSO 5: COPIAR Credenciais (5 min)

**No menu lateral, clique em: "WhatsApp"**

Depois clique em: **"API Setup"** ou **"Início Rápido"**

### Encontre e COPIE (cole em um bloco de notas):

#### 1. Phone Number ID
```
Onde: Tela API Setup, campo "Phone number ID"
Copie: O número grande (ex: 123456789012345)
Cole aqui: ___________________________
```

#### 2. Business Account ID  
```
Onde: Tela API Setup, campo "WhatsApp Business Account ID"
Copie: Outro número grande (ex: 987654321098765)
Cole aqui: ___________________________
```

#### 3. Access Token
```
⚠️ IMPORTANTE: Token TEMPORÁRIO funciona por 24h

Onde: Tela API Setup, campo "Temporary access token"
Copie: Token longo (EAAxxxxxxxx...)
Cole aqui: ___________________________

⚠️ Se quiser token PERMANENTE (avançado):
1. Menu lateral: Configurações → Usuários do Sistema
2. Adicionar → Nome: "api_user" → Gerar Token
3. Marcar: whatsapp_business_messaging
4. Copiar e SALVAR (não mostra de novo!)
```

#### 4. Webhook Verify Token (VOCÊ INVENTA!)
```
Crie AGORA uma senha qualquer:

Exemplo: foodcostpro2024secret

Cole aqui: ___________________________

⚠️ ANOTE! Vai precisar no FoodCostPro
```

---

## ✅ PRONTO! Agora cole no FoodCostPro:

1. Login: http://localhost:5173
2. Configurações → Integrações → WhatsApp
3. Cole os 4 valores que você copiou acima
4. Ative os toggles
5. Salvar → Testar Conexão

---

## 🆘 PROBLEMAS COMUNS:

### "Não encontro WhatsApp no menu"
→ Espere 1-2 minutos após adicionar
→ F5 (atualizar página)

### "Token inválido"
→ Copie de novo, sem espaços
→ Use o temporário primeiro (funciona 24h)

### "Número já em uso"
→ Use outro número
→ OU use "Testar com número Meta" (temporário)

### "Ainda com dúvida?"
→ SKIP! Use FoodCostPro sem WhatsApp
→ WhatsApp é OPCIONAL!

---

## 💡 LEMBRE-SE:

**WhatsApp é EXTRA, não obrigatório!**

Seu sistema funciona 100% sem ele.

Configure quando:
- Tiver mais tempo
- Tiver ajuda técnica
- Realmente precisar

**Não force se estiver difícil!** 😊
