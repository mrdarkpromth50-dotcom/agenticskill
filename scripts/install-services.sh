#!/bin/bash
# Install all required services globally

echo "🚀 Installing Antigravity Claude Proxy..."
npm install -g antigravity-claude-proxy@latest

echo "🚀 Installing OpenClaw..."
npm install -g openclaw@latest

echo "✅ All services installed successfully!"
echo ""
echo "Next steps:"
echo "1. Run: npm run start:all"
echo "2. Add Google account to Antigravity: antigravity-claude-proxy accounts add"
echo "3. Access services at:"
echo "   - Antigravity UI: http://localhost:8080"
echo "   - Agent Town: http://localhost:3000"
echo "   - OpenClaw: localhost:18789 (WebSocket)"
