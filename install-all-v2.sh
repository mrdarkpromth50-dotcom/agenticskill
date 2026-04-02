#!/bin/bash
set -e

BASE_DIR="/home/ubuntu/agenticskill"

echo "=== Step 1: Build and link shared packages ==="
cd "$BASE_DIR/shared/security" && npm install && npm run build && npm link
cd "$BASE_DIR/shared/resilience" && npm install && npm run build && npm link

echo ""
echo "=== Step 2: Install TypeScript globally ==="
npm install -g typescript ts-node 2>&1 | tail -3

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

echo ""
echo "=== Step 3: Install and build all services ==="

for svc in "${SERVICES[@]}"; do
  echo ""
  echo "--- Installing $svc ---"
  cd "$BASE_DIR/services/$svc"
  
  # Link shared packages first if needed
  if grep -q "@agenticskill/security" package.json 2>/dev/null; then
    npm link @agenticskill/security @agenticskill/resilience 2>/dev/null || true
  fi
  
  # Install dependencies (skip scripts to avoid premature build)
  npm install --ignore-scripts 2>&1 | tail -3
  
  # Build
  if npx tsc --skipLibCheck 2>&1; then
    echo "  ✅ $svc build SUCCESS"
  else
    echo "  ❌ $svc build FAILED (trying with --skipLibCheck)"
  fi
done

echo ""
echo "=== Installation Complete ==="
