#!/bin/sh
set -e

export CI=true

if [ ! -d "node_modules" ] || [ ! -d "node_modules/.pnpm" ]; then
    echo "node_modules not found or incomplete. Installing dependencies..."
    pnpm install --frozen-lockfile --config.confirmModulesPurge=false 2>&1 || pnpm install --frozen-lockfile
fi

echo "Generating Prisma Client..."
pnpm exec prisma generate || npx prisma generate

echo "Waiting for database..."
sleep 3

echo "NODE_ENV: ${NODE_ENV}"
echo "HOT_RELOAD: ${HOT_RELOAD}"

if [ "${NODE_ENV}" = "development" ] || [ "${HOT_RELOAD}" = "true" ]; then
    echo "=========================================="
    echo "Starting application in development mode with hot reload..."
    echo "Nodemon will watch for file changes"
    echo "=========================================="
    exec pnpm dev
else
    echo "=========================================="
    echo "Starting application in production mode..."
    echo "=========================================="
    exec pnpm start
fi

