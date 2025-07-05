#!/bin/bash

KEY="$HOME/.ssh/servinykey.pem"
REMOTE="ubuntu@ec2-16-16-254-21.eu-north-1.compute.amazonaws.com"
APP_DIR="/home/ubuntu/works/serviny/api"
DOMAIN="api.winnemart.com"
CADDYFILE="/etc/caddy/Caddyfile"
PORT_A=4003
PORT_B=4004

# Ask for rebuild
read -p "🛠️  Do you want to rebuild the app before deploying? (y/n): " build_choice

echo "🔍 Getting current port from Caddy..."
CURRENT_PORT=$(ssh -i "$KEY" "$REMOTE" "grep -A 1 '$DOMAIN' $CADDYFILE | grep 'localhost:' | grep -o '[0-9]*'")

echo "🌐 Current port in use is: $CURRENT_PORT"

# Decide new and old port
if [[ "$CURRENT_PORT" == "$PORT_A" ]]; then
  CANDIDATE_PORT=$PORT_B
  OTHER_PORT=$PORT_A
else
  CANDIDATE_PORT=$PORT_A
  OTHER_PORT=$PORT_B
fi

# Ask if the user wants to use port 4003
read -p "❓ Do you want to deploy on port 4003? (y/n): " use_port_4003
if [[ "$use_port_4003" == "y" || "$use_port_4003" == "Y" ]]; then
  NEW_PORT=$PORT_A
  OLD_PORT=$OTHER_PORT
else
  NEW_PORT=$CANDIDATE_PORT
  OLD_PORT=$OTHER_PORT
fi

echo "🚀 Deploying on port $NEW_PORT..."

ssh -i "$KEY" "$REMOTE" bash << EOF
  set -e
  cd $APP_DIR
  git pull

  if [[ "$build_choice" == "y" || "$build_choice" == "Y" ]]; then
    echo "🔨 Building Docker image..."
    APP_PORT=$NEW_PORT Port=$NEW_PORT sudo docker compose build --progress=plain
  else
    echo "⏭️  Skipping build step..."
  fi

  echo "⬆️  Starting container on port $NEW_PORT..."
  APP_PORT=$NEW_PORT Port=$NEW_PORT sudo docker compose up -d

  echo "⏳ Waiting for new app on port $NEW_PORT to be ready..."
  for i in {1..15}; do
    if curl -s http://localhost:$NEW_PORT/query >/dev/null; then
      echo "✅ New app is responding on port $NEW_PORT"
      break
    fi
    echo "⌛ Waiting... ($i/15)"
    sleep 2
  done

  if ! curl -s http://localhost:$NEW_PORT/query >/dev/null; then
    echo "❌ New app did not start properly on port $NEW_PORT"
    exit 1
  fi

  echo "🔄 Updating Caddy to port $NEW_PORT..."
  sudo sed -i 's/localhost:$OLD_PORT/localhost:$NEW_PORT/' $CADDYFILE
  sudo systemctl reload caddy

  echo "🧹 Stopping old container on port $OLD_PORT..."
  APP_PORT=$OLD_PORT Port=$OLD_PORT sudo docker compose down
EOF

echo "✅ Deployment complete! Live on port $NEW_PORT"
