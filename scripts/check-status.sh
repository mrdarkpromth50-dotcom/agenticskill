#!/bin/bash
# Check status of all services

echo "🔍 Checking service status..."
echo ""

# Function to check if port is listening
check_port() {
    if nc -z 127.0.0.1 $2 2>/dev/null; then
        echo "✅ $1 is running on port $2"
        return 0
    else
        echo "❌ $1 is NOT running on port $2"
        return 1
    fi
}

check_port "Antigravity Claude Proxy" 8080
check_port "OpenClaw Gateway" 18789
check_port "Agent Town" 3000

echo ""
echo "───────────────────────────────────────────────────────────"
echo "Service URLs:"
echo "───────────────────────────────────────────────────────────"
echo "📍 Antigravity Proxy: http://localhost:8080"
echo "📍 OpenClaw Gateway: ws://localhost:18789"
echo "📍 Agent Town: http://localhost:3000"
echo ""
echo "To start services: npm run start:all"
echo "───────────────────────────────────────────────────────────"
