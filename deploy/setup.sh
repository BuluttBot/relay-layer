#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "Installing dependencies..."
npm install

echo "Building shared..."
npm run build:shared

echo "Building API..."
npm run build:api

echo "Building Web..."
npm run build:web

echo "Initializing database..."
npm run db:init

echo "Setup complete. Start with: pm2 start deploy/ecosystem.config.cjs"
