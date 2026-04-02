#!/bin/bash

# Health check for all services

echo "🩺 Performing health checks for all Agentic Company services..."

# Ensure we are in the root directory
cd "$(dirname "$0")/.."

SERVICES=(
  "memory-system:3001"
  "persistent-agent-layer:3002"
  "spawn-manager:3003"
  "ceo-agent:3004"
  "translation-layer:3005"
  "account-manager:3006"
  "agent-town:3000"
  "antigravity-proxy:8080"
  "openclaw:18789"
  "redis:6379"
  "chromadb:8000"
  "ollama:11434"
)

for service_port in "${SERVICES[@]}"; do
  SERVICE=$(echo $service_port | cut -d':' -f1)
  PORT=$(echo $service_port | cut -d':' -f2)
  URL="http://localhost:${PORT}/health"

  echo -n "Checking ${SERVICE} (${URL})... "
  
  # For services that don't have a /health endpoint, just check if the port is open
  if [ "$SERVICE" == "redis" ] || [ "$SERVICE" == "chromadb" ] || [ "$SERVICE" == "ollama" ] || [ "$SERVICE" == "antigravity-proxy" ] || [ "$SERVICE" == "openclaw" ] || [ "$SERVICE" == "agent-town" ]; then
    if nc -z localhost $PORT; then
      echo "✅ Running"
    else
      echo "❌ Not Running"
    fi
  else
    # For services with /health endpoint
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${URL})
    if [ "$HTTP_STATUS" -eq 200 ]; then
      echo "✅ Healthy (HTTP ${HTTP_STATUS})"
    else
      echo "❌ Unhealthy (HTTP ${HTTP_STATUS})"
    fi
  fi
  
done

echo "
Health check complete."
