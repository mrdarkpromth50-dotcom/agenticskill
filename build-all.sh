#!/bin/bash
# ============================================================
# AgenticSkill Build Script v2.0
# Builds all shared packages and services in dependency order
# ============================================================
set -e
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================="
echo "AgenticSkill Build Script v2.0"
echo "Base directory: $BASE_DIR"
echo "============================================="

FAILED=()
SUCCESS=()

# ============================================================
# Step 1: Build Shared Packages (in dependency order)
# ============================================================
SHARED_PACKAGES=(
  "security"
  "resilience"
  "memory-client"
)

echo ""
echo "=== Building Shared Packages ==="
for pkg in "${SHARED_PACKAGES[@]}"; do
  echo ""
  echo "--- Building shared/$pkg ---"
  cd "$BASE_DIR/shared/$pkg"
  
  if npm install 2>&1 | tail -3 && npm run build 2>&1 | tail -3; then
    echo "  ✅ shared/$pkg build SUCCESS"
    SUCCESS+=("shared/$pkg")
  else
    echo "  ❌ shared/$pkg build FAILED"
    FAILED+=("shared/$pkg")
  fi
done

# ============================================================
# Step 2: Build Services
# ============================================================
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
  "agent-town-bridge"
)

echo ""
echo "=== Building Services ==="
for svc in "${SERVICES[@]}"; do
  echo ""
  echo "--- Building services/$svc ---"
  cd "$BASE_DIR/services/$svc"
  
  # Install dependencies (file: references resolve automatically)
  if npm install 2>&1 | tail -3; then
    # Build TypeScript
    if npx tsc --skipLibCheck 2>&1 | tail -5; then
      echo "  ✅ $svc build SUCCESS"
      SUCCESS+=("$svc")
    else
      echo "  ❌ $svc build FAILED (TypeScript error)"
      FAILED+=("$svc")
    fi
  else
    echo "  ❌ $svc npm install FAILED"
    FAILED+=("$svc")
  fi
done

# ============================================================
# Step 3: Build Agent Town (UI)
# ============================================================
echo ""
echo "=== Building Agent Town UI ==="
if [ -d "$BASE_DIR/../agent-town" ]; then
  cd "$BASE_DIR/../agent-town"
  if pnpm install 2>&1 | tail -3 && pnpm build 2>&1 | tail -5; then
    echo "  ✅ agent-town UI build SUCCESS"
    SUCCESS+=("agent-town-ui")
  else
    echo "  ❌ agent-town UI build FAILED"
    FAILED+=("agent-town-ui")
  fi
else
  echo "  ⚠️  agent-town directory not found at $BASE_DIR/../agent-town"
  echo "     Run: git clone https://github.com/geezerrrr/agent-town ../agent-town"
fi

# ============================================================
# Summary
# ============================================================
echo ""
echo "============================================="
echo "BUILD SUMMARY"
echo "============================================="
echo "SUCCESS (${#SUCCESS[@]}): ${SUCCESS[*]}"
if [ ${#FAILED[@]} -gt 0 ]; then
  echo "FAILED  (${#FAILED[@]}): ${FAILED[*]}"
  exit 1
else
  echo "ALL BUILDS SUCCESSFUL ✅"
fi
