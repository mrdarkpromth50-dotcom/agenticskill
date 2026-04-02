# AgenticSkill Testing Guide - Phase 3

🧪 **Complete Testing Plan for AgenticSkill System**

---

## 📋 Testing Phases

### Phase 3A: Local Installation Testing
- [ ] Installation script verification
- [ ] All services install without errors
- [ ] Global packages available
- [ ] Configuration files created

### Phase 3B: Service Startup Testing
- [ ] Antigravity Claude Proxy starts
- [ ] OpenClaw Gateway starts
- [ ] Agent Town UI loads
- [ ] Services listen on correct ports

### Phase 3C: Service Communication Testing
- [ ] Proxy ↔ OpenClaw connectivity
- [ ] OpenClaw ↔ Agent Town WebSocket
- [ ] Model loading in OpenClaw
- [ ] Task routing through Agent Town

### Phase 3D: Thai Language Testing
- [ ] Thai UI displays correctly
- [ ] Thai formatting works
- [ ] Thai keyboard support active
- [ ] Locale switching works

### Phase 3E: Integration Testing
- [ ] Add Google account
- [ ] Create test agents
- [ ] Assign test tasks
- [ ] Monitor execution
- [ ] View real-time updates

---

## 🚀 Testing Execution Plan

### Step 1: Pre-Installation Checklist

**Requirements:**
```bash
# Verify Node.js version (20+ recommended)
node --version
# Expected: v20.x.x or higher

# Verify npm
npm --version
# Expected: 10.x.x or higher

# Verify git
git --version
# Expected: git version 2.x.x or higher

# Verify disk space (minimum 2GB free)
df -h | head -1
```

**Expected Output:**
```
✅ v20.x.x
✅ 10.x.x
✅ git version 2.x.x
✅ /dev/xxx 500G 250G 250G 50% /workspaces
```

### Step 2: Installation Testing

**Test 1.1: Run Installation Script**
```bash
npm run install:all

# Expected in output:
# 🚀 Installing Antigravity Claude Proxy...
# 🚀 Installing OpenClaw...
# ✅ All services installed successfully!
```

**Verify Installation:**
```bash
# Check global packages
npm list -g --depth=0 | grep -E "antigravity|openclaw"

# Expected:
# ├── antigravity-claude-proxy
# └── openclaw
```

**Test 1.2: Package Versions**
```bash
antigravity-claude-proxy --version
openclaw --version

# Expected outputs should show version numbers
```

**Test 1.3: Configuration Created**
```bash
ls -la ~/.antigravity
ls -la ~/.openclaw

# Expected: directories exist with config files
```

---

### Step 3: Service Startup Testing

**Test 2.1: Start Individual Services**

```bash
# Terminal 1: Start Antigravity Proxy
antigravity-claude-proxy start

# Expected output:
# Starting Antigravity Claude Proxy...
# ✅ Server listening on http://localhost:8080
# Dashboard available at http://localhost:8080/ui
```

**Verify Proxy Health:**
```bash
# In another terminal
curl http://localhost:8080/health

# Expected response:
# {"status":"healthy","version":"x.x.x"}
```

---

**Test 2.2: Start OpenClaw Gateway**

```bash
# Terminal 2: Start OpenClaw
openclaw gateway --port 18789 --verbose

# Expected output:
# ✅ OpenClaw Gateway started
# Listening on ws://localhost:18789
```

**Verify OpenClaw Connection:**
```bash
# Test WebSocket connection
npm run status

# Expected: ✅ OpenClaw Gateway is running on port 18789
```

---

**Test 2.3: Start Agent Town**

```bash
# Terminal 3: Start Agent Town
npx @geezerrrr/agent-town --port 3000 --gateway ws://127.0.0.1:18789/

# Expected output:
# ✅ Agent Town started
# 🎮 Game ready on http://localhost:3000
# 🔗 Connected to OpenClaw gateway
```

---

### Step 4: Port Verification

**Test 3.1: Verify All Ports**

```bash
#!/bin/bash
# Check all required ports

echo "🔍 Checking service ports..."

check_port() {
    if nc -z 127.0.0.1 $2 2>/dev/null; then
        echo "✅ $1 listening on port $2"
        return 0
    else
        echo "❌ $1 NOT listening on port $2"
        return 1
    fi
}

check_port "Antigravity Proxy" 8080
check_port "OpenClaw Gateway" 18789
check_port "Agent Town" 3000

echo "Done! All services should be running."
```

**Expected Output:**
```
✅ Antigravity Proxy listening on port 8080
✅ OpenClaw Gateway listening on port 18789
✅ Agent Town listening on port 3000
```

---

### Step 5: Service Communication Testing

**Test 4.1: Proxy to OpenClaw**

```bash
# Test OpenClaw configuration
cat ~/.openclaw/openclaw.json | grep -A5 "antigravity-proxy"

# Expected: Shows proxy URL as http://127.0.0.1:8080
```

**Test 4.2: OpenClaw Model List**

```bash
openclaw models list

# Expected output:
# ✅ Available Models:
# - claude-3-5-sonnet-20241022 (via antigravity-proxy)
# - claude-sonnet-4-6-thinking (via antigravity-proxy)
# - gemini-3-flash (via antigravity-proxy)
```

**Test 4.3: Agent Town WebSocket Connection**

```bash
# Open browser dev tools at http://localhost:3000
# Check Network tab under WS (WebSocket)

# Expected:
# Connected: ws://127.0.0.1:18789/
# Status: 101 Switching Protocols
# Messages: No errors in console
```

---

### Step 6: Google Account Setup Testing

**Test 5.1: Add Test Google Account**

```bash
antigravity-claude-proxy accounts add

# Follow prompts:
# 1. Visit Google authentication URL
# 2. Approve permissions
# 3. Enter verification code
# 4. Confirm account added
```

**Test 5.2: Account Verification**

```bash
antigravity-claude-proxy accounts list

# Expected:
# Accounts:
# 1. test-account@gmail.com (status: active)
```

**Test 5.3: API Call Test**

```bash
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role":"user","content":"Hello!"}],
    "model": "claude-3-5-sonnet-20241022"
  }'

# Expected:
# {"id":"msg_...","content":"Hello! How can I help..."}
```

---

### Step 7: Agent Town UI Testing

**Test 6.1: UI Load and Render**

```bash
# Visit http://localhost:3000
# Expected to see:
# ✅ Pixel-art office environment
# ✅ NPC workers walking around
# ✅ Chat panel at bottom
# ✅ Task panel on right
# ✅ Worker panel on right
# ✅ Top bar with connection status
```

**Test 6.2: Connection Status**

```bash
# In Agent Town UI, check top bar
# Expected: "Online" badge with green indicator
```

**Test 6.3: Chat Interaction**

```bash
# Type in chat panel: "Hello, agents!"
# Press Enter
# Expected:
# ✅ Message appears in chat
# ✅ Status changes to "Processing"
# ✅ Agent responds
```

**Test 6.4: Task Assignment**

```bash
# Type: "Write a Python function to calculate factorial"
# Expected:
# ✅ Task shows in Tasks panel
# ✅ Worker becomes active
# ✅ Status updates: submitted → queued → running → done
# ✅ Result appears in chat
```

---

### Step 8: Thai Language Testing

**Test 7.1: Verify Thai Language Package**

```bash
ls -la services/agent-town-i18n/locales/

# Expected:
# drwxr-xr-x th/
# drwxr-xr-x en/
```

**Test 7.2: Check Thai Translations**

```bash
cat services/agent-town-i18n/locales/th/messages.json | jq '.ui.buttons' | head -5

# Expected:
# "send": "ส่ง"
# "save": "บันทึก"
# "close": "ปิด"
```

**Test 7.3: Thai Date Formatting (when integrated)**

```typescript
// After integration in Agent Town
import { formatDateTHAI } from '@/i18n/utils/thai-formatter';

const date = new Date('2026-04-02');
console.log(formatDateTHAI(date));
// Expected: "2 เมษายน 2569"
```

**Test 7.4: Thai Keyboard (when integrated)**

```typescript
// After integration in Agent Town
import { isThaiCharacter } from '@/i18n/utils/thai-keyboard';

console.log(isThaiCharacter('ก'));  // Expected: true
console.log(isThaiCharacter('a'));  // Expected: false
```

---

### Step 9: Load Testing

**Test 8.1: Multiple Task Submission**

```bash
# Rapidly submit 5 tasks
Task 1: "Hello"
Task 2: "Test parallel execution"
Task 3: "Performance check"
Task 4: "Multiple agents"
Task 5: "End test"

# Expected:
# ✅ All tasks queue properly
# ✅ No dropped messages
# ✅ System remains responsive
# ✅ Memory usage stable (< 500MB)
```

**Test 8.2: Long-Running Task**

```bash
# Submit long task: "Write a detailed blog post about AI"
# Monitor for 5 minutes

# Expected:
# ✅ Task continues without timeout
# ✅ Status updates visible
# ✅ Response fully received
# ✅ UI remains responsive
```

---

### Step 10: Error Handling Testing

**Test 9.1: Service Restart Resilience**

```bash
# Start all services
npm run start:all

# Stop Antigravity Proxy (Ctrl+C in terminal)
# Expected in OpenClaw:
# ⚠️ Proxy connection lost
# 🔄 Attempting reconnect...

# Restart proxy
antigravity-claude-proxy start
# Expected:
# ✅ Reconnected
# ✅ OpenClaw resumes
```

**Test 9.2: Invalid Configuration**

```bash
# Temporarily break OpenClaw config
mv ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.bak

# Try to start OpenClaw
openclaw gateway --port 18789
# Expected: Clear error message

# Restore config
mv ~/.openclaw/openclaw.json.bak ~/.openclaw/openclaw.json
```

**Test 9.3: Port Conflict**

```bash
# Start service on port 8080 (conflicting)
nc -l 8080 &
PORT_PID=$!

# Try to start Antigravity Proxy
antigravity-claude-proxy start
# Expected: Clear error about port in use

# Clean up
kill $PORT_PID
```

---

## ✅ Test Results Template

Create `TEST_RESULTS.md`:

```markdown
# Test Results - AgenticSkill System

Date: April 2, 2026
Tester: [Name]
System: [OS/Configuration]

## Pre-Installation Checklist
- [ ] Node.js 20+: ✅
- [ ] npm 10+: ✅
- [ ] git 2+: ✅
- [ ] Disk space: ✅

## Installation Phase
- [ ] Installation script runs: ✅
- [ ] All packages install: ✅
- [ ] Global packages accessible: ✅
- [ ] Configuration created: ✅

## Service Startup
- [ ] Antigravity Proxy: ✅ (port 8080)
- [ ] OpenClaw Gateway: ✅ (port 18789)
- [ ] Agent Town: ✅ (port 3000)

## Service Communication
- [ ] Proxy → OpenClaw: ✅
- [ ] OpenClaw ↔ Agent Town: ✅
- [ ] Models available: ✅

## Google Account Setup
- [ ] Account added: ✅
- [ ] API calls work: ✅

## Agent Town UI
- [ ] UI loads: ✅
- [ ] Chat works: ✅
- [ ] Tasks execute: ✅

## Thai Language
- [ ] Package present: ✅
- [ ] Translations valid: ✅
- [ ] Date formatting works: ✅

## Load Testing
- [ ] Multiple tasks: ✅
- [ ] System memory: ✅ (< 500MB)

## Error Handling
- [ ] Service restart: ✅
- [ ] Error messages: ✅
- [ ] Port conflicts: ✅

## Overall Result: ✅ PASS

Notes:
- All services started successfully
- Communication between services working
- System stable under normal load
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Port Already in Use
```bash
# Find process using port 8080
lsof -i :8080

# Kill it
kill -9 <PID>

# Or change port
HOST=127.0.0.1 PORT=9000 antigravity-claude-proxy start
```

### Issue 2: OpenClaw Can't Connect to Proxy
```bash
# Check proxy is running
curl http://localhost:8080/health

# Check config
cat ~/.openclaw/openclaw.json | grep baseUrl

# Restart OpenClaw
npm run stop:all
npm run start:all
```

### Issue 3: Agent Town WebSocket Failing
```bash
# Check WebSocket URL
# Browser DevTools → Network → WS tab

# Should show: ws://127.0.0.1:18789/

# If not, restart all services
npm run stop:all
npm run start:all
```

### Issue 4: Google Account Auth Failed
```bash
# Verify account added
antigravity-claude-proxy accounts list

# Try adding account again
antigravity-claude-proxy accounts add

# Check Google has 2FA enabled
# Use app-specific password, not regular password
```

---

## 📊 Performance Metrics

Track these during testing:

| Metric | Target | Method |
|--------|--------|--------|
| Proxy startup | < 5s | Time from start command to listening |
| OpenClaw startup | < 10s | Time from command to ready |
| Agent Town load | < 3s | Page load time |
| Chat response | < 2s | Time from submit to first token |
| Task execution | Variable | Monitor in UI |
| Memory usage | < 750MB | `top` or Task Manager |
| CPU usage | < 50% | Monitor during task |

---

## ✨ Success Criteria

### Minimal Pass (MVP)
- ✅ All services start without errors
- ✅ All ports accessible
- ✅ No error messages in console
- ✅ UI responds to input

### Good Pass
- ✅ All above
- ✅ Service communication verified
- ✅ Google account works
- ✅ Tasks execute successfully
- ✅ Performance within targets

### Excellent Pass
- ✅ All above
- ✅ Thai language verified
- ✅ Error handling tested
- ✅ Load testing passed
- ✅ Documented issues found
- ✅ Ready for production

---

## 🔄 Testing Workflow

```
1. Pre-test checks ✅
   ↓
2. Install services ✅
   ↓
3. Start services ✅
   ↓
4. Verify ports ✅
   ↓
5. Test communication ✅
   ↓
6. Add account ✅
   ↓
7. Test UI ✅
   ↓
8. Test Thai language ✅
   ↓
9. Load testing ✅
   ↓
10. Error scenarios ✅
    ↓
11. Document results ✅
    ↓
12. Status: READY ✅
```

---

## 📝 Next Steps After Testing

### If All Passes:
1. ✅ Mark Phase 3 complete
2. Move to Phase 4: Documentation & Community
3. Consider production deployment

### If Issues Found:
1. Document in GitHub Issues
2. Fix prioritized issues
3. Re-test
4. Document workarounds

---

## 🎯 Test Execution Timeline

- **Pre-test:** 5 minutes
- **Installation:** 5 minutes
- **Service startup:** 10 minutes
- **Communication tests:** 15 minutes
- **Account setup:** 10 minutes
- **UI testing:** 15 minutes
- **Thai language:** 10 minutes
- **Load testing:** 10 minutes
- **Error handling:** 15 minutes
- **Documentation:** 10 minutes

**Total: ~95 minutes (1.5-2 hours)**

---

**Created:** April 2, 2026  
**Purpose:** Complete system testing for AgenticSkill  
**Status:** Ready to execute
