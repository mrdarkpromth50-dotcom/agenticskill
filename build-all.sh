#!/bin/bash
set -e
BASE_DIR="/home/ubuntu/agenticskill"

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
  echo ""
  echo "=== Building $svc ==="
  cd "$BASE_DIR/services/$svc"
  
  # Install dependencies
  npm install 2>&1 | tail -3
  
  # Link shared packages
  npm link @agenticskill/security @agenticskill/resilience 2>/dev/null || true
  
  # Build
  if npx tsc --skipLibCheck 2>&1; then
    echo "  ✅ $svc build SUCCESS"
    SUCCESS+=("$svc")
  else
    echo "  ❌ $svc build FAILED"
    FAILED+=("$svc")
  fi
done

echo ""
echo "========================================="
echo "BUILD SUMMARY"
echo "========================================="
echo "SUCCESS (${#SUCCESS[@]}): ${SUCCESS[*]}"
echo "FAILED (${#FAILED[@]}): ${FAILED[*]}"
