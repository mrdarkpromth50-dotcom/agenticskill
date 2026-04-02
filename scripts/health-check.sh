#!/bin/bash
# System Health Check Script for AgenticSkill

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 AgenticSkill System Health Check"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function
test_command() {
    local name=$1
    local command=$2
    local expected=$3
    
    echo -n "🔸 $name... "
    
    if output=$(eval "$command" 2>&1); then
        if [[ "$output" == *"$expected"* ]] || [ -z "$expected" ]; then
            echo -e "${GREEN}✅${NC}"
            ((TESTS_PASSED++))
            return 0
        else
            echo -e "${RED}❌${NC}"
            echo "   Expected: $expected"
            echo "   Got: $output"
            ((TESTS_FAILED++))
            return 1
        fi
    else
        echo -e "${RED}❌${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

test_port() {
    local name=$1
    local port=$2
    
    echo -n "🔸 $name (port $port)... "
    
    if nc -z 127.0.0.1 $port 2>/dev/null; then
        echo -e "${GREEN}✅${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC}"
        echo "   Port $port not listening"
        ((TESTS_FAILED++))
        return 1
    fi
}

test_file() {
    local name=$1
    local filepath=$2
    
    echo -n "🔸 $name... "
    
    if [ -f "$filepath" ]; then
        echo -e "${GREEN}✅${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}❌${NC}"
        echo "   File not found: $filepath"
        ((TESTS_FAILED++))
        return 1
    fi
}

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}📦 1. System Requirements${NC}"
echo "─────────────────────────────────────"

test_command "Node.js installed" "which node" "/"
test_command "npm installed" "which npm" "/"
test_command "git installed" "which git" "/"
test_command "Node.js version 20+" "node -v | grep -E 'v2[0-9]'" "v"
test_command "npm version 10+" "npm -v | grep -E '^1[0-9]'" ""

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}🎯 2. AgenticSkill Project Files${NC}"
echo "─────────────────────────────────────"

test_file "README.md" "./README.md"
test_file "package.json" "./package.json"
test_file "docker-compose.yml" "./docker/docker-compose.yml"
test_file "Installation guide" "./docs/INSTALLATION.md"
test_file "Architecture docs" "./docs/ARCHITECTURE.md"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}📋 3. Configuration Files${NC}"
echo "─────────────────────────────────────"

test_file "Environment template" "./config/.env.example"
test_file "OpenClaw config template" "./config/openclaw-template.json"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}⚙️ 4. Installation Scripts${NC}"
echo "─────────────────────────────────────"

test_file "Install script" "./scripts/install-services.sh"
test_file "Setup OpenClaw script" "./scripts/setup-openclaw.sh"
test_file "Start all script" "./scripts/start-all.sh"
test_file "Stop all script" "./scripts/stop-all.sh"
test_file "Status check script" "./scripts/check-status.sh"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}🌐 5. Global Packages${NC}"
echo "─────────────────────────────────────"

echo -n "🔸 Antigravity Claude Proxy... "
if npm list -g 2>/dev/null | grep -q "antigravity-claude-proxy"; then
    echo -e "${GREEN}✅${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}ℹ️${NC} (not installed - run: npm run install:all)"
fi

echo -n "🔸 OpenClaw... "
if npm list -g 2>/dev/null | grep -q "openclaw"; then
    echo -e "${GREEN}✅${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}ℹ️${NC} (not installed - run: npm run install:all)"
fi

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}🚀 6. Service Ports (Running Services)${NC}"
echo "─────────────────────────────────────"

test_port "Antigravity Proxy" 8080
test_port "OpenClaw Gateway" 18789
test_port "Agent Town UI" 3000

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}🌍 7. API Health Checks${NC}"
echo "─────────────────────────────────────"

echo -n "🔸 Proxy health endpoint... "
if curl -s http://localhost:8080/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}ℹ️${NC} (Proxy not running)"
fi

echo -n "🔸 OpenClaw connection... "
if [ -S /tmp/.openclaw.sock ] 2>/dev/null || nc -z 127.0.0.1 18789 2>/dev/null; then
    echo -e "${GREEN}✅${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}ℹ️${NC} (OpenClaw not running)"
fi

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}🗂️ 8. Configuration Status${NC}"
echo "─────────────────────────────────────"

test_file "Antigravity config directory" "$HOME/.antigravity"
test_file "OpenClaw config directory" "$HOME/.openclaw"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}🇹🇭 9. Thai Language Support${NC}"
echo "─────────────────────────────────────"

test_file "Thai i18n package" "./services/agent-town-i18n"
test_file "English translations" "./services/agent-town-i18n/locales/en/messages.json"
test_file "Thai translations" "./services/agent-town-i18n/locales/th/messages.json"
test_file "Thai formatter utils" "./services/agent-town-i18n/utils/thai-formatter.ts"
test_file "Thai keyboard utils" "./services/agent-town-i18n/utils/thai-keyboard.ts"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}📚 10. Documentation${NC}"
echo "─────────────────────────────────────"

test_file "Testing guide" "./docs/TESTING_GUIDE.md"
test_file "Thai language docs" "./docs/THAI_LANGUAGE_SUPPORT.md"
test_file "Integration guide" "./services/agent-town-i18n/INTEGRATION_GUIDE.md"
test_file "Contributing guidelines" "./CONTRIBUTING.md"

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}📊 11. Disk Space Check${NC}"
echo "─────────────────────────────────────"

echo -n "🔸 Disk space available... "
available=$(df /workspaces | awk 'NR==2 {print $4}')
if [ "$available" -gt 1000000 ]; then
    echo -e "${GREEN}✅${NC} ($(numfmt --to=iec-i --suffix=B 2>/dev/null <<<$((available*1024)) || echo $((available/1024))MB free))"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌${NC} (Only $available KB free)"
    ((TESTS_FAILED++))
fi

echo ""

# ═════════════════════════════════════════════════════════════════
echo -e "${BLUE}🔄 12. Git Status${NC}"
echo "─────────────────────────────────────"

echo -n "🔸 Git repository initialized... "
if [ -d .git ]; then
    echo -e "${GREEN}✅${NC}"
    ((TESTS_PASSED++))
    
    echo -n "🔸 Remote configured... "
    if git remote -v | grep -q "github.com"; then
        echo -e "${GREEN}✅${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}ℹ️${NC} (No remote configured)"
    fi
    
    echo -n "🔸 Latest commits... "
    commits=$(git log --oneline | wc -l)
    if [ "$commits" -gt 0 ]; then
        echo -e "${GREEN}✅${NC} ($commits total)"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌${NC} (No commits)"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}❌${NC} (Not a git repository)"
    ((TESTS_FAILED++))
fi

echo ""

# ═════════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════"
echo -e "${BLUE}📊 Test Summary${NC}"
echo "═══════════════════════════════════════════════════════════════"

TOTAL=$((TESTS_PASSED + TESTS_FAILED))

echo ""
echo -e "Total Tests: $TOTAL"
echo -e "Passed: ${GREEN}✅ $TESTS_PASSED${NC}"
echo -e "Failed: ${RED}❌ $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! System is ready.${NC}"
    echo ""
    echo "📖 Next steps:"
    echo "  1. npm run install:all    # Install services (if not done)"
    echo "  2. npm run setup:openclaw # Configure OpenClaw (if not done)"
    echo "  3. npm run start:all      # Start services in Terminal 1"
    echo "  4. npm run start:agent-town # Start Agent Town in Terminal 2"
    echo "  5. Visit http://localhost:3000 to access Agent Town"
    echo ""
    exit 0
elif [ $TESTS_FAILED -le 5 ]; then
    echo -e "${YELLOW}⚠️  Some checks need attention (services not running ok)${NC}"
    echo ""
    echo "Common solutions:"
    echo "  • Run 'npm run install:all' to install services"
    echo "  • Run 'npm run start:all' to start services"
    echo "  • Run 'npm run status' to check service status"
    echo "  • Check 'docs/TESTING_GUIDE.md' for detailed testing"
    echo ""
    exit 1
else
    echo -e "${RED}❌ System needs setup. Please follow installation guide.${NC}"
    echo ""
    echo "Setup steps:"
    echo "  1. cd /workspaces/agenticskill"
    echo "  2. npm install"
    echo "  3. npm run install:all"
    echo "  4. npm run setup:openclaw"
    echo ""
    exit 1
fi
