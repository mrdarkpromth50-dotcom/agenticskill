#!/bin/bash
# Setup OpenClaw configuration to work with Antigravity Claude Proxy

OPENCLAW_CONFIG_DIR="$HOME/.openclaw"
OPENCLAW_CONFIG_FILE="$OPENCLAW_CONFIG_DIR/openclaw.json"

mkdir -p "$OPENCLAW_CONFIG_DIR"

echo "📝 Creating OpenClaw configuration..."

cat > "$OPENCLAW_CONFIG_FILE" << 'EOF'
{
  "models": {
    "mode": "merge",
    "providers": {
      "antigravity-proxy": {
        "baseUrl": "http://127.0.0.1:8080",
        "apiKey": "test",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "gemini-3-flash",
            "name": "Gemini 3 Flash",
            "reasoning": true,
            "contextWindow": 1048576
          },
          {
            "id": "claude-sonnet-4-6-thinking",
            "name": "Claude Sonnet 4.6 Thinking",
            "reasoning": true,
            "contextWindow": 200000
          },
          {
            "id": "claude-3-5-sonnet-20241022",
            "name": "Claude 3.5 Sonnet",
            "reasoning": false,
            "contextWindow": 200000
          }
        ]
      }
    }
  }
}
EOF

echo "✅ OpenClaw configuration created at: $OPENCLAW_CONFIG_FILE"
echo ""
echo "Configuration details:"
cat "$OPENCLAW_CONFIG_FILE"
