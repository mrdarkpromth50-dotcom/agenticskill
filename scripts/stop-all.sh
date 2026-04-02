#!/bin/bash
# Stop all services

echo "🛑 Stopping all services..."

# Stop Antigravity Claude Proxy
echo "Stopping Antigravity Claude Proxy..."
antigravity-claude-proxy stop 2>/dev/null || pkill -f "antigravity-claude-proxy" 2>/dev/null

# Stop OpenClaw
echo "Stopping OpenClaw..."
pkill -f "openclaw gateway" 2>/dev/null

# Stop Agent Town
echo "Stopping Agent Town..."
pkill -f "agent-town" 2>/dev/null

echo "✅ All services stopped"
