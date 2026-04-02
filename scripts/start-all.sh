#!/bin/bash

# Start all services using Docker Compose
echo "🚀 Starting all Agentic Company services..."

# Ensure we are in the root directory
cd "$(dirname "$0")/.."

# Check if .env file exists in docker/
if [ ! -f "./docker/.env" ]; then
  echo "⚠️  WARNING: .env file not found in ./docker/. Copying .env.example..."
  cp ./docker/.env.example ./docker/.env
  echo "👉 Please edit ./docker/.env with your actual configurations (tokens, keys, etc.)"
fi

# Run docker compose
docker compose -f docker/docker-compose.yml --env-file ./docker/.env up --build -d

echo ""
echo "───────────────────────────────────────────────────────────"
echo "✅ Services Started in Detached Mode"
echo "───────────────────────────────────────────────────────────"
echo "📍 Memory System: http://localhost:3001"
echo "📍 Persistent Agent Layer: http://localhost:3002"
echo "📍 Spawn Manager: http://localhost:3003"
echo "📍 CEO Agent: http://localhost:3004"
echo "📍 Translation Layer: http://localhost:3005"
echo "📍 Account Manager: http://localhost:3006"
echo "📍 Agent Town UI: http://localhost:3000"
echo "📍 OpenClaw Gateway: ws://localhost:18789"
echo "📍 Antigravity Proxy: http://localhost:8080"
echo "───────────────────────────────────────────────────────────"
echo "To check status: ./scripts/health-check.sh"
echo "To stop all: ./scripts/stop-all.sh"
echo "───────────────────────────────────────────────────────────"
