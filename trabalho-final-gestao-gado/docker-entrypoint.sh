#!/bin/sh
# Roda as migrations pendentes (idempotente — seguro em todo boot do
# container) e então inicia o servidor. O seed dos dados de exemplo roda
# sozinho dentro do próprio app se o banco estiver vazio (ver
# src/config/autoSeed.ts); desative com AUTO_SEED=false no .env.
set -e

echo "🐘 Aplicando migrations do Prisma (prisma migrate deploy)..."
npx prisma migrate deploy

echo "🚀 Iniciando aplicação..."
exec node dist/app.js
