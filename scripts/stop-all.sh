#!/bin/bash

# Stop all services using Docker Compose
echo "🛑 Stopping all Agentic Company services..."

# Ensure we are in the root directory
cd "$(dirname "$0")/.."

# Run docker compose down
docker compose -f docker/docker-compose.yml down

echo "✅ All services stopped and containers removed."
