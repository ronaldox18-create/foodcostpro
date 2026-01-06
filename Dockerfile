# WhatsApp Bot Backend - Railway Deploy
FROM node:18-alpine

# Diretório de trabalho
WORKDIR /app

# Copiar package.json do servidor
COPY server/package.json ./

# Instalar dependências
RUN npm install --production

# Copiar código do servidor
COPY server/ ./

# Copiar .env (Railway vai sobrescrever com variáveis)
COPY .env* ./

# Expor porta
EXPOSE 3001

# Comando de start
CMD ["node", "whatsappServer.js"]
