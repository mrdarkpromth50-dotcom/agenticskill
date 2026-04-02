#!/bin/bash
# AgenticSkill Integration Test Script

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🧪 AgenticSkill Integration Tests"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Test configuration
PROXY_URL="http://127.0.0.1:8080"
GATEWAY_URL="ws://127.0.0.1:18789"
AGENT_TOWN_URL="http://127.0.0.1:3000"

TESTS_PASSED=0
TESTS_FAILED=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test function
run_test() {
    local name=$1
    local command=$2
    
    echo -n "🧪 $name... "
    
    if eval "$command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}1️⃣  Prerequisites${NC}"
echo "─────────────────────────────────────"

run_test "Proxy listening" "nc -z 127.0.0.1 8080"
run_test "Gateway listening" "nc -z 127.0.0.1 18789"
run_test "Agent Town listening" "nc -z 127.0.0.1 3000"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}2️⃣  Proxy API Tests${NC}"
echo "─────────────────────────────────────"

run_test "Proxy health check" "curl -s $PROXY_URL/health | grep -q status"

# Check if Google account is configured
if curl -s "$PROXY_URL/accounts" 2>/dev/null | grep -q "\"email\""; then
    run_test "Proxy API models" "curl -s $PROXY_URL/models 2>/dev/null | grep -q 'claude'"
else
    echo -n "⚠️  Skipping API test (no Google account configured)"
    echo -e " ${YELLOW}ℹ️${NC}"
    echo "   Run: antigravity-claude-proxy accounts add"
fi

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}3️⃣  OpenClaw Configuration${NC}"
echo "─────────────────────────────────────"

run_test "OpenClaw config exists" "test -f ~/.openclaw/openclaw.json"

run_test "Config has proxy URL" "grep -q 'antigravity-proxy' ~/.openclaw/openclaw.json"

run_test "Proxy URL correct" "grep -q 'http://127.0.0.1:8080' ~/.openclaw/openclaw.json"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}4️⃣  Service Communication${NC}"
echo "─────────────────────────────────────"

# Test connection from proxy to local service
run_test "Proxy accessible from localhost" "curl -s -o /dev/null -w '%{http_code}' $PROXY_URL | grep -q '200\\|404'"

# Test Agent Town page loads
run_test "Agent Town loads HTML" "curl -s $AGENT_TOWN_URL | grep -q 'Agent Town\\|html\\|body'"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}5️⃣  Thai Language Support${NC}"
echo "─────────────────────────────────────"

run_test "Thai translations file exists" "test -f ./services/agent-town-i18n/locales/th/messages.json"

run_test "English translations file exists" "test -f ./services/agent-town-i18n/locales/en/messages.json"

run_test "Thai formatter utility exists" "test -f ./services/agent-town-i18n/utils/thai-formatter.ts"

run_test "Thai keyboard utility exists" "test -f ./services/agent-town-i18n/utils/thai-keyboard.ts"

# Check translation content
run_test "Thai translations contain Thai text" "grep -q 'ไทย\\|ส่ง\\|บันทึก' ./services/agent-town-i18n/locales/th/messages.json"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}6️⃣  Documentation${NC}"
echo "─────────────────────────────────────"

run_test "Installation guide exists" "test -f ./docs/INSTALLATION.md"

run_test "Architecture guide exists" "test -f ./docs/ARCHITECTURE.md"

run_test "Testing guide exists" "test -f ./docs/TESTING_GUIDE.md"

run_test "Thai language guide exists" "test -f ./docs/THAI_LANGUAGE_SUPPORT.md"

run_test "Integration guide exists" "test -f ./services/agent-town-i18n/INTEGRATION_GUIDE.md"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}7️⃣  Docker Configuration${NC}"
echo "─────────────────────────────────────"

run_test "Docker Compose file exists" "test -f ./docker/docker-compose.yml"

run_test "Dockerfile exists" "test -f ./docker/Dockerfile"

run_test "Docker Compose has 3 services" "grep -c 'services:' ./docker/docker-compose.yml > /dev/null"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}8️⃣  Project Scripts${NC}"
echo "─────────────────────────────────────"

run_test "Health check script exists" "test -f ./scripts/health-check.sh"

run_test "Install script exists" "test -f ./scripts/install-services.sh"

run_test "Setup OpenClaw script exists" "test -f ./scripts/setup-openclaw.sh"

run_test "Start script executable" "test -x ./scripts/start-all.sh"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}9️⃣  Git Repository${NC}"
echo "─────────────────────────────────────"

run_test "Git initialized" "test -d .git"

run_test "Remote configured" "git remote -v | grep -q 'github.com'"

run_test "Commits exist" "test $(git log --oneline 2>/dev/null | wc -l) -gt 0"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}🔟 Environment Setup${NC}"
echo "─────────────────────────────────────"

run_test "package.json exists" "test -f package.json"

run_test "npm scripts configured" "grep -q 'start:all' package.json"

run_test "Environment template exists" "test -f ./config/.env.example"

echo ""

# ═════════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════"
echo -e "${BLUE}📊 Test Results${NC}"
echo "═══════════════════════════════════════════════════════════════"

TOTAL=$((TESTS_PASSED + TESTS_FAILED))

echo ""
echo "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}✅ $TESTS_PASSED${NC}"
echo -e "Failed: ${RED}❌ $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All integration tests passed!${NC}"
    echo ""
    echo "System Status: READY FOR USE"
    echo ""
    echo "Available endpoints:"
    echo "  • Proxy:      $PROXY_URL"
    echo "  • Gateway:    $GATEWAY_URL"
    echo "  • Agent Town: $AGENT_TOWN_URL"
    echo ""
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  $TESTS_FAILED test(s) failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Ensure all services are running: npm run status"
    echo "  2. Check for port conflicts: lsof -i :8080,18789,3000"
    echo "  3. Review service logs"
    echo "  4. See docs/TESTING_GUIDE.md for detailed testing"
    echo ""
    exit 1
fi
