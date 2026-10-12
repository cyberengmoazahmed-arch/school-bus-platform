#!/bin/sh
set -e

echo "[SafeRide] pushing schema to database (idempotent)"
npx prisma db push --skip-generate --accept-data-loss

echo "[SafeRide] starting Next.js server"
exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p "${PORT:-3000}"