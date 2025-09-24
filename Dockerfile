FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# Generar cliente Prisma y compilar TS (sin migraciones en build)
ENV DATABASE_URL="postgresql://temp:temp@temp:5432/temp"
RUN npx prisma generate && npm run build

# Incluir plantillas compiladas en la imagen final
COPY src/templates ./dist/templates

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 3000

# Script de inicialización que ejecuta migraciones y arranca la aplicación
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Ejecutando migraciones de Prisma..."' >> /app/start.sh && \
    echo 'npx prisma db push --accept-data-loss' >> /app/start.sh && \
    echo 'echo "Iniciando aplicación..."' >> /app/start.sh && \
    echo 'node dist/server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

CMD ["/app/start.sh"]

