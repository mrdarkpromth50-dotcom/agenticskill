#!/bin/bash
set -e
BASE_DIR="/home/ubuntu/agenticskill"

# Function to install, link, and build a service
build_service() {
  local svc=$1
  echo ""
  echo "--- Building $svc ---"
  cd "$BASE_DIR/services/$svc"
  
  # Link shared packages
  npm link @agenticskill/security @agenticskill/resilience 2>/dev/null || true
  
  # Install missing type packages
  npm install --save-dev @types/uuid @types/node-cron 2>/dev/null || true
  
  # Build with skipLibCheck
  if npx tsc --skipLibCheck 2>&1; then
    echo "  ✅ $svc build SUCCESS"
    return 0
  else
    echo "  ❌ $svc build FAILED"
    return 1
  fi
}

SERVICES=(
  "memory-system"
  "persistent-agent-layer"
  "spawn-manager"
  "spawn-agents"
  "translation-layer"
  "account-manager"
  "antigravity-proxy"
  "ceo-agent"
  "accountant-agent"
  "cto-agent"
  "cmo-agent"
  "cso-agent"
  "devops-agent"
  "monitoring"
  "discord-bot"
  "telegram-bot"
)

FAILED=()
SUCCESS=()

for svc in "${SERVICES[@]}"; do
  if build_service "$svc"; then
    SUCCESS+=("$svc")
  else
    FAILED+=("$svc")
  fi
done

echo ""
echo "=== BUILD SUMMARY ==="
echo "SUCCESS (${#SUCCESS[@]}): ${SUCCESS[*]}"
echo "FAILED (${#FAILED[@]}): ${FAILED[*]}"
