# Installation Guide

## Prerequisites

Before installing AgenticSkill, ensure you have:

- **Node.js 20+** (LTS recommended)
  ```bash
  node --version
  npm --version
  ```
- **Git** installed and configured
- **Netcat** (for checking ports) - usually pre-installed on Linux/macOS
  ```bash
  nc --version
  ```

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|------------|
| **RAM** | 2 GB | 4+ GB |
| **Disk** | 500 MB | 2 GB |
| **CPU** | Dual-core | Quad-core+ |
| **OS** | macOS, Linux, Windows (WSL2) | Linux/macOS |

---

## Installation Steps

### Step 1: Clone Repository

```bash
git clone https://github.com/mrdarkpromth50-dotcom/agenticskill.git
cd agenticskill
```

### Step 2: Install Global Services

```bash
# This will install all three services globally
npm run install:all
```

Or manually install each:
```bash
npm install -g antigravity-claude-proxy@latest
npm install -g openclaw@latest
```

### Step 3: Setup OpenClaw Configuration

```bash
npm run setup:openclaw
```

This creates `~/.openclaw/openclaw.json` with Antigravity Proxy configuration.

### Step 4: Add Google Account

```bash
antigravity-claude-proxy accounts add
```

Follow the prompts to authenticate your Google account.

### Step 5: Verify Installation

```bash
npm run status
```

You should see:
```
❌ Antigravity Claude Proxy is NOT running on port 8080
❌ OpenClaw Gateway is NOT running on port 18789
❌ Agent Town is NOT running on port 3000
```

This is normal - services haven't started yet.

---

## Starting Services

### Option A: Manual Start (Recommended for Development)

Terminal 1:
```bash
npm run start:all
```

Terminal 2:
```bash
npm run start:agent-town
```

Then verify:
```bash
npm run status
```

### Option B: Docker Start (Recommended for Production)

```bash
npm run docker:build
npm run docker:up
npm run docker:logs
```

---

## Configuration

### 1. Environment Variables (Optional)

Create `.env` file:
```bash
cp config/.env.example .env
```

Edit with your settings.

### 2. OpenClaw Models

Advanced: Edit `~/.openclaw/openclaw.json`

```json
{
  "models": {
    "providers": {
      "antigravity-proxy": {
        "baseUrl": "http://127.0.0.1:8080",
        "apiKey": "test",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-3-5-sonnet-20241022",
            "name": "Claude 3.5 Sonnet",
            "contextWindow": 200000
          }
        ]
      }
    }
  }
}
```

---

## Troubleshooting

### Issue: Port Already in Use

```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>

# Or restart all services
npm run stop:all
npm run start:all
```

### Issue: npm command not found

Make sure Node.js and npm are installed:
```bash
node -v
npm -v
```

If not installed, download from https://nodejs.org/

### Issue: Permission Denied

On Linux/macOS, add execute permissions:
```bash
chmod +x scripts/*.sh
```

### Issue: Google Account Authentication Failed

1. Generate app-specific password for Google Account
2. Use that instead of regular password
3. Ensure 2FA is enabled on Google Account

---

## Next Steps

After successful installation:

1. **Access Antigravity Dashboard:** http://localhost:8080
2. **Create Agents in Agent Town:** http://localhost:3000
3. **Configure OpenClaw Channels:** Edit `~/.openclaw/openclaw.json`
4. **Read Documentation:** See `docs/` folder

---

## Uninstalling

```bash
# Stop all services
npm run stop:all

# Remove global packages
npm uninstall -g antigravity-claude-proxy openclaw

# Remove configuration
rm -rf ~/.openclaw
```

---

## Getting Help

- **Documentation:** See other files in `docs/`
- **GitHub Issues:** https://github.com/mrdarkpromth50-dotcom/agenticskill/issues
- **Project Links:**
  - Antigravity: https://github.com/badrisnarayanan/antigravity-claude-proxy
  - OpenClaw: https://github.com/openclaw/openclaw
  - Agent Town: https://github.com/geezerrrr/agent-town
