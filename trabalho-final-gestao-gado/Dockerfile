# ============================================
# Etapa 1 — build (compila backend TS -> dist/ e frontend TS -> public/js/)
# ============================================
FROM node:20-slim AS build

WORKDIR /app

# Prisma precisa de openssl para gerar/rodar o client corretamente no Linux.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Instala dependências primeiro (cache de camada) usando só os manifests.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

# Copia o resto do código-fonte.
COPY . .

# Gera o client do Prisma (precisa existir antes do `tsc` compilar src/).
RUN npx prisma generate

# Compila backend (dist/) e frontend (public/js/ a partir de public/ts/).
RUN npm run build

# ============================================
# Etapa 2 — runtime (imagem final, só com o necessário para rodar)
# ============================================
FROM node:20-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
# Fuso horário padrão do container (horário de Brasília) — o .env pode
# sobrescrever via env_file/environment do docker-compose, mas isso garante
# que "hoje"/"agora" já nascem corretos mesmo sem TZ definida em lugar nenhum.
ENV TZ=America/Sao_Paulo

# tzdata é necessário para o Node reconhecer fusos horários (America/Sao_Paulo);
# a imagem slim não vem com o banco de fusos instalado por padrão.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl tzdata \
    && rm -rf /var/lib/apt/lists/*

# node_modules já vem com o Prisma Client gerado (etapa build) — reaproveita
# em vez de reinstalar, mantendo `prisma` (CLI) disponível para o
# `prisma migrate deploy` do entrypoint.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
