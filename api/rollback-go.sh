#!/bin/bash

KEY="$HOME/.ssh/servinykey.pem"
REMOTE="ubuntu@ec2-16-16-254-21.eu-north-1.compute.amazonaws.com"
CADDYFILE="/etc/caddy/Caddyfile"
DOMAIN="api.winnemart.com"
PORT_A=4003
PORT_B=4004

echo "🔍 Checking current live port..."
CURRENT_PORT=$(ssh -i "$KEY" "$REMOTE" "grep -A 1 '$DOMAIN' $CADDYFILE | grep 'localhost:' | grep -o '[0-9]*'")

if [[ "$CURRENT_PORT" == "$PORT_A" ]]; then
  ROLLBACK_PORT=$PORT_B
else
  ROLLBACK_PORT=$PORT_A
fi

echo "↩️ Rolling back to port $ROLLBACK_PORT..."
ssh -i "$KEY" "$REMOTE" << EOF
  set -e
  sudo sed -i 's/localhost:$CURRENT_PORT/localhost:$ROLLBACK_PORT/' $CADDYFILE
  sudo systemctl reload caddy
  APP_PORT=$CURRENT_PORT Port=$CURRENT_PORT docker compose down
EOF

echo "✅ Rollback complete! Back on port $ROLLBACK_PORT"
