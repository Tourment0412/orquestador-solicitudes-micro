FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# Generar cliente Prisma, ejecutar migraciones y compilar TS
RUN npx prisma generate && npx prisma db push --accept-data-loss && npm run build

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
COPY <<EOF /app/start.sh
#!/bin/sh
echo "Ejecutando migraciones de Prisma..."
npx prisma db push --accept-data-loss
echo "Iniciando aplicación..."
node dist/server.js
EOF

RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]

