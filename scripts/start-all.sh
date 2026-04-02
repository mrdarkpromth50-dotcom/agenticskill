#!/bin/bash
# Start all services

echo "🚀 Starting all services..."
echo ""

# Function to check if process is running
check_service() {
    if nc -z 127.0.0.1 $1 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Start Antigravity Claude Proxy
echo "1️⃣  Starting Antigravity Claude Proxy (port 8080)..."
antigravity-claude-proxy start &
PROXY_PID=$!
sleep 3

# Check if proxy started
if check_service 8080; then
    echo "✅ Antigravity Claude Proxy started (PID: $PROXY_PID)"
else
    echo "⚠️  Waiting for Antigravity proxy to be ready..."
    sleep 5
fi

echo ""
echo "2️⃣  Starting OpenClaw Gateway (port 18789)..."
openclaw gateway --port 18789 &
OPENCLAW_PID=$!
sleep 3

echo "✅ OpenClaw Gateway started (PID: $OPENCLAW_PID)"

echo ""
echo "3️⃣  Starting Agent Town (port 3000)..."
echo "   Command: npx @geezerrrr/agent-town --port 3000 --gateway ws://127.0.0.1:18789/"
echo ""
echo "Run in a new terminal:"
echo "   npm run start:agent-town"
echo ""
echo "───────────────────────────────────────────────────────────"
echo "✅ Services Starting:"
echo "───────────────────────────────────────────────────────────"
echo "📍 Antigravity Proxy Dashboard: http://localhost:8080"
echo "📍 OpenClaw Gateway: ws://localhost:18789"
echo "📍 Agent Town: http://localhost:3000 (run in another terminal)"
echo ""
echo "To stop all services: npm run stop:all"
echo "To check status: npm run status"
echo "───────────────────────────────────────────────────────────"

# Keep processes running
wait
