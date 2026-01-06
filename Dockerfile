# WhatsApp Bot Backend - Railway Deploy
FROM node:20-alpine

# Instalar git e python (necessários para Baileys)
RUN apk add --no-cache git python3 make g++

# Diretório de trabalho
WORKDIR /app

# Copiar todo o projeto primeiro
COPY package*.json ./
COPY server/package.json ./server/

# Instalar dependências do servidor
WORKDIR /app/server
RUN npm install --production

# Voltar para root e copiar tudo
WORKDIR /app
COPY . .

# Setar working directory para server
WORKDIR /app/server

# Expor porta
EXPOSE 3001

# Comando de start
CMD ["node", "whatsappServer.js"]
