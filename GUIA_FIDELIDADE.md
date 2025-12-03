# 🏆 Sistema de Fidelidade e Pontos - Guia Completo

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Configurações Principais](#configurações-principais)
3. [Níveis de Fidelidade](#níveis-de-fidelidade)
4. [Como Funciona](#como-funciona)
5. [Exemplos Práticos](#exemplos-práticos)
6. [Perguntas Frequentes](#perguntas-frequentes)

---

## 🎯 Visão Geral

O **Sistema de Fidelidade** permite que você recompense seus clientes mais fiéis com:
- ✨ **Pontos** acumulados a cada compra
- 🏅 **Níveis** progressivos com benefícios crescentes
- 💰 **Descontos automáticos** baseados no nível do cliente
- 🎁 **Resgate de pontos** por desconto (opcional)

---

## ⚙️ Configurações Principais

### 1️⃣ Ativar/Desativar o Sistema

**Onde:** Topo da página de configurações  
**O que faz:** Liga ou desliga todo o sistema de pontos

- ✅ **Ativado:** Clientes ganham pontos e recebem descontos
- ❌ **Desativado:** Sistema pausado, nenhum ponto é acumulado

> 💡 **Dica:** Você pode desativar temporariamente sem perder as configurações!

---

### 2️⃣ Pontos por Real (R$)

**Onde:** Seção "Acúmulo de Pontos"  
**O que faz:** Define quantos pontos o cliente ganha por cada R$ 1,00 gasto

#### Exemplos:
| Configuração | Compra de R$ 50 | Compra de R$ 100 | Compra de R$ 200 |
|--------------|-----------------|------------------|------------------|
| 1 ponto/R$   | 50 pontos       | 100 pontos       | 200 pontos       |
| 5 pontos/R$  | 250 pontos      | 500 pontos       | 1000 pontos      |
| 10 pontos/R$ | 500 pontos      | 1000 pontos      | 2000 pontos      |

> 💡 **Recomendação:** 
> - **Restaurantes pequenos:** 1-2 pontos por real
> - **Restaurantes médios:** 5-10 pontos por real
> - **Grandes redes:** 10-20 pontos por real

---

### 3️⃣ Expiração de Nível

**Onde:** Seção "Expiração de Nível"  
**O que faz:** Clientes perdem o nível se ficarem muito tempo sem comprar

#### Como Funciona:
1. Cliente alcança nível **Ouro** (1500 pontos)
2. Fica **90 dias** sem comprar (se configurado 90 dias)
3. Automaticamente **volta para o nível anterior**

#### Configurações:
- **Ativar Expiração:** Liga/desliga esta funcionalidade
- **Dias sem compra:** Quantos dias de inatividade até perder o nível

> ⚠️ **Importante:** 
> - Os **pontos NÃO são perdidos**, apenas o nível!
> - Quando o cliente comprar novamente, pode recuperar o nível
> - Isso incentiva compras recorrentes

#### Exemplos de Configuração:
| Tipo de Negócio | Dias Recomendados |
|-----------------|-------------------|
| Fast Food       | 30-45 dias        |
| Restaurante     | 60-90 dias        |
| Delivery        | 45-60 dias        |
| Cafeteria       | 30-60 dias        |

---

### 4️⃣ Resgate de Pontos (Avançado)

**Onde:** Seção "Resgate de Pontos"  
**O que faz:** Permite que clientes troquem pontos acumulados por desconto em dinheiro

> 💡 **Diferença Importante:**
> - **Desconto por Nível:** Automático, baseado no nível (Bronze 5%, Prata 10%, etc.)
> - **Resgate de Pontos:** Cliente escolhe gastar pontos para ter desconto EXTRA

#### Configurações:

##### Taxa de Conversão
Define quantos pontos = R$ 1,00 de desconto

**Exemplo:** 100 pontos = R$ 1,00
- Cliente com 500 pontos pode resgatar até R$ 5,00
- Cliente com 1000 pontos pode resgatar até R$ 10,00

##### Mínimo para Resgatar
Pontos mínimos necessários para fazer um resgate

**Exemplo:** Mínimo de 500 pontos
- Cliente com 300 pontos: ❌ Não pode resgatar ainda
- Cliente com 600 pontos: ✅ Pode resgatar R$ 6,00

> ⚠️ **Atenção:** Quando o cliente resgata pontos, eles são **descontados** do saldo!

---

## 🏅 Níveis de Fidelidade

### O que são Níveis?

Níveis são "categorias" que seus clientes alcançam conforme acumulam pontos. Cada nível oferece um **desconto automático** diferente.

### Configurando Níveis

Cada nível possui:

#### 1. **Nome**
- Exemplo: Bronze, Prata, Ouro, Diamante
- Pode ser qualquer nome criativo!

#### 2. **Pontos Necessários**
- Quantos pontos o cliente precisa para alcançar este nível
- Exemplo: Bronze = 0, Prata = 500, Ouro = 1500

#### 3. **Desconto (%)**
- Desconto automático que este nível oferece
- Exemplo: Bronze = 5%, Prata = 10%, Ouro = 15%

#### 4. **Cor**
- Cor visual para identificar o nível na interface
- Escolha cores que fazem sentido (Bronze = marrom, Ouro = dourado)

#### 5. **Ícone**
- Emoji que representa o nível
- Exemplos: 🥉 🥈 🥇 💎 👑 ⭐

#### 6. **Benefícios**
- Descrição dos benefícios deste nível
- Exemplo: "Desconto premium + brindes exclusivos"

---

### Exemplo de Configuração de Níveis

| Nível    | Pontos | Desconto | Ícone | Benefícios                           |
|----------|--------|----------|-------|--------------------------------------|
| Bronze   | 0      | 5%       | 🥉    | Desconto básico                      |
| Prata    | 500    | 10%      | 🥈    | Desconto + prioridade                |
| Ouro     | 1500   | 15%      | 🥇    | Desconto premium + brindes           |
| Diamante | 3000   | 20%      | 💎    | Máximo desconto + experiências VIP   |

---

## 🔄 Como Funciona na Prática

### Fluxo Completo

```
1. Cliente faz uma compra de R$ 100,00
   ↓
2. Sistema calcula pontos (ex: 1 ponto/R$ = 100 pontos)
   ↓
3. Pontos são adicionados ao saldo do cliente
   ↓
4. Sistema verifica se o cliente subiu de nível
   ↓
5. Se subiu, desconto do novo nível é aplicado nas próximas compras
   ↓
6. Cliente recebe notificação de pontos ganhos e nível atual
```

### Exemplo Detalhado

#### Configuração:
- Pontos por Real: **1 ponto**
- Expiração: **90 dias** sem compra
- Níveis:
  - Bronze (0 pts) = 5% desconto
  - Prata (500 pts) = 10% desconto
  - Ouro (1500 pts) = 15% desconto

#### Jornada do Cliente João:

**Dia 1:**
- João faz primeira compra: R$ 50,00
- Ganha: 50 pontos
- Nível: Bronze (5% desconto)
- Total de pontos: 50

**Dia 15:**
- João compra: R$ 100,00
- Desconto Bronze aplicado: R$ 5,00 (5%)
- Paga: R$ 95,00
- Ganha: 100 pontos
- Total de pontos: 150

**Dia 30:**
- João compra: R$ 400,00
- Desconto Bronze: R$ 20,00
- Paga: R$ 380,00
- Ganha: 400 pontos
- Total de pontos: 550
- 🎉 **SUBIU PARA PRATA!** (passou de 500 pontos)

**Dia 45:**
- João compra: R$ 200,00
- Desconto Prata aplicado: R$ 20,00 (10%)
- Paga: R$ 180,00
- Ganha: 200 pontos
- Total de pontos: 750

**Dia 150 (105 dias depois):**
- João não comprou há 105 dias
- Expiração configurada: 90 dias
- ⚠️ **CAIU PARA BRONZE** (ficou inativo)
- Pontos mantidos: 750 (não perde pontos!)

**Dia 151:**
- João volta e compra: R$ 300,00
- Desconto Bronze: R$ 15,00 (5%)
- Ganha: 300 pontos
- Total: 1050 pontos
- 🎉 **VOLTOU PARA PRATA!**

---

## 💡 Exemplos Práticos

### Exemplo 1: Pizzaria Pequena

**Objetivo:** Incentivar pedidos semanais

**Configuração:**
- Pontos por Real: **2 pontos**
- Expiração: **30 dias**
- Níveis:
  - Iniciante (0 pts) = 0% desconto
  - Frequente (200 pts) = 5% desconto
  - VIP (600 pts) = 10% desconto
  - Master (1200 pts) = 15% desconto

**Resultado:**
- Cliente que pede 1 pizza/semana (R$ 50) = 100 pts/semana
- Em 2 semanas: Frequente (5% off)
- Em 6 semanas: VIP (10% off)
- Em 12 semanas: Master (15% off)

---

### Exemplo 2: Restaurante Sofisticado

**Objetivo:** Recompensar clientes de alto valor

**Configuração:**
- Pontos por Real: **1 ponto**
- Expiração: **90 dias**
- Níveis:
  - Bronze (0 pts) = 5% desconto
  - Prata (1000 pts) = 8% desconto
  - Ouro (3000 pts) = 12% desconto
  - Platina (6000 pts) = 18% desconto

**Resultado:**
- Cliente precisa gastar R$ 1000 para Prata
- Cliente precisa gastar R$ 3000 para Ouro
- Foco em clientes de alto ticket

---

### Exemplo 3: Delivery com Resgate

**Objetivo:** Máxima fidelização com resgate de pontos

**Configuração:**
- Pontos por Real: **10 pontos**
- Expiração: **60 dias**
- Resgate: **100 pontos = R$ 1,00** (mínimo 500 pts)
- Níveis:
  - Novo (0 pts) = 0%
  - Regular (500 pts) = 5%
  - Premium (2000 pts) = 10%

**Resultado:**
- Cliente gasta R$ 50 = 500 pontos
- Pode resgatar 500 pts = R$ 5,00 de desconto
- OU guardar para subir de nível e ter desconto permanente

---

## ❓ Perguntas Frequentes

### 1. **O que acontece se eu mudar a configuração de pontos?**
As novas configurações valem apenas para **compras futuras**. Pontos já acumulados não mudam.

### 2. **Posso ter quantos níveis eu quiser?**
Sim! Você pode ter de 1 a quantos níveis quiser. Recomendamos 3-5 níveis para não complicar.

### 3. **O cliente perde os pontos quando o nível expira?**
**NÃO!** O cliente só perde o **nível** (e o desconto associado), mas os **pontos permanecem**.

### 4. **Posso desativar o sistema temporariamente?**
Sim! Basta desligar o switch no topo. Todas as configurações e pontos dos clientes são mantidos.

### 5. **Como o desconto é aplicado?**
O desconto do nível é aplicado **automaticamente** no total da compra, antes do pagamento.

### 6. **Posso ter desconto por nível E resgate de pontos ao mesmo tempo?**
Sim! São sistemas complementares:
- **Desconto por nível:** Automático e permanente
- **Resgate de pontos:** Cliente escolhe quando usar

### 7. **O que acontece se eu deletar um nível?**
Clientes que estavam neste nível voltarão para o nível anterior. **Cuidado!**

### 8. **Posso mudar os pontos necessários de um nível?**
Sim, mas clientes que já alcançaram o nível mantêm ele. A mudança afeta apenas novos clientes.

### 9. **Como os clientes sabem seus pontos e nível?**
Você pode mostrar na tela de clientes, enviar por WhatsApp, ou criar uma área do cliente.

### 10. **Qual a melhor configuração para meu negócio?**
Depende! Considere:
- **Ticket médio:** Quanto maior, menos pontos por real
- **Frequência de compra:** Quanto mais frequente, menor a expiração
- **Margem de lucro:** Quanto maior, mais generoso pode ser nos descontos

---

## 🎨 Dicas de Uso

### ✅ Boas Práticas

1. **Comece simples:** 3-4 níveis são suficientes
2. **Seja generoso no início:** Facilite alcançar o primeiro nível premium
3. **Comunique claramente:** Explique o programa para seus clientes
4. **Monitore os resultados:** Veja se está aumentando a frequência de compras
5. **Ajuste conforme necessário:** Não tenha medo de mudar as configurações

### ❌ Evite

1. **Muitos níveis:** Confunde o cliente
2. **Descontos muito altos:** Pode prejudicar sua margem
3. **Expiração muito curta:** Frustra clientes
4. **Mudanças frequentes:** Gera desconfiança

---

## 🚀 Próximos Passos

1. ✅ Configure o sistema na página de Fidelidade
2. ✅ Defina seus níveis e benefícios
3. ✅ Ative o sistema
4. ✅ Comunique aos clientes (WhatsApp, redes sociais)
5. ✅ Monitore os resultados
6. ✅ Ajuste conforme necessário

---

## 📞 Suporte

Precisa de ajuda? Entre em contato com o suporte técnico!

**Última atualização:** Dezembro 2025
