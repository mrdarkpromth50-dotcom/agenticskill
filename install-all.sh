#!/bin/bash
set -e

BASE_DIR="/home/ubuntu/agenticskill"

echo "=== Installing shared packages ==="
cd "$BASE_DIR/shared/security" && npm install && npm run build
cd "$BASE_DIR/shared/resilience" && npm install && npm run build

# Create npm links for shared packages
cd "$BASE_DIR/shared/security" && npm link 2>/dev/null || true
cd "$BASE_DIR/shared/resilience" && npm link 2>/dev/null || true

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

for svc in "${SERVICES[@]}"; do
  echo ""
  echo "=== Installing $svc ==="
  cd "$BASE_DIR/services/$svc"
  
  # Install dependencies
  npm install 2>&1 | tail -3
  
  # Link shared packages if they are dependencies
  if grep -q "@agenticskill/security" package.json 2>/dev/null; then
    npm link @agenticskill/security 2>/dev/null || true
  fi
  if grep -q "@agenticskill/resilience" package.json 2>/dev/null; then
    npm link @agenticskill/resilience 2>/dev/null || true
  fi
  
  # Build
  if npm run build 2>&1; then
    echo "  ✅ $svc build SUCCESS"
  else
    echo "  ❌ $svc build FAILED"
  fi
done

echo ""
echo "=== All services installed ==="
