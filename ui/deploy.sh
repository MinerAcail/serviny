#!/bin/bash

KEY="$HOME/.ssh/servinykey.pem"
REMOTE="ubuntu@51.21.45.25"
REMOTE_BASE="/home/ubuntu/works/winneui"
LIVE_DIR="$REMOTE_BASE/dist"
TEMP_DIR="$REMOTE_BASE/dist_temp"
BACKUP_DIR="$REMOTE_BASE/dist_backup"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROD_FILE="$SCRIPT_DIR/src/index.tsx"


# Step 1: Check and optionally enable Production mode
echo "🔍 Checking current Production flag in $PROD_FILE..."

# Look for the active (uncommented) Production line
ACTIVE_LINE=$(grep -E '^\s*export const Production = (true|false);' "$PROD_FILE")
CURRENT_PROD=$(echo "$ACTIVE_LINE" | grep -oE '(true|false)')

if [ -z "$CURRENT_PROD" ]; then
  echo "❌ Couldn't detect active 'export const Production = true|false' in $PROD_FILE."
  echo "🛑 Aborting deployment."
  exit 1
fi

echo "📋 Current active line: $ACTIVE_LINE"
echo "🔍 Current Production value: $CURRENT_PROD"

if [ "$CURRENT_PROD" = "true" ]; then
  echo "✅ Production mode is already ENABLED."
else
  echo "⚠️  Production mode is currently DISABLED."
  read -p "🔄 Do you want to enable Production = true before deploying? (y/n): " toggle_choice
  if [[ "$toggle_choice" == [yY] ]]; then
    echo "📝 Updating Production flag in $PROD_FILE..."
    
    # Create backup
    cp "$PROD_FILE" "$PROD_FILE.bak"
    
    # Method 1: Comment out the false line and uncomment the true line
    sed -i -E 's|^(\s*)(export const Production = false;)|\1//\2|' "$PROD_FILE"
    sed -i -E 's|^(\s*)//(\s*export const Production = true;)|\1\2|' "$PROD_FILE"
    
    # Verify the change worked
    NEW_ACTIVE_LINE=$(grep -E '^\s*export const Production = (true|false);' "$PROD_FILE")
    NEW_PROD=$(echo "$NEW_ACTIVE_LINE" | grep -oE '(true|false)')
    
    if [ "$NEW_PROD" = "true" ]; then
      echo "✅ Production flag successfully set to true."
      echo "📋 New active line: $NEW_ACTIVE_LINE"
    else
      echo "❌ Failed to toggle Production flag. Restoring backup."
      mv "$PROD_FILE.bak" "$PROD_FILE"
      exit 1
    fi
  else
    echo "🛑 Deployment cancelled."
    exit 1
  fi
fi

# Final defensive check
FINAL_ACTIVE_LINE=$(grep -E '^\s*export const Production = (true|false);' "$PROD_FILE")
FINAL_PROD=$(echo "$FINAL_ACTIVE_LINE" | grep -oE '(true|false)')

if [ "$FINAL_PROD" != "true" ]; then
  echo "❌ Production flag is still not true. Deployment stopped."
  echo "📋 Final active line: $FINAL_ACTIVE_LINE"
  exit 1
fi

echo "✅ Production mode confirmed. Proceeding with deployment..."

read -p "🛠️  Do you want to build the project locally first? (y/n): " build_choice
if [[ "$build_choice" == [yY] ]]; then
  echo "🔨 Building the project locally..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "❌ Local build failed."
    exit 1
  fi
  echo "✅ Local build completed successfully."
else
  echo "⏭️  Skipping local build..."
fi

echo "🚀 Cleaning up old temporary directory on server..."
ssh -i "$KEY" "$REMOTE" "rm -rf $TEMP_DIR"
if [ $? -ne 0 ]; then
  echo "❌ Failed to clean up temporary directory."
  exit 1
fi

echo "📤 Uploading new build to temporary folder..."
scp -i "$KEY" -r ./dist "$REMOTE:$TEMP_DIR"
if [ $? -ne 0 ]; then
  echo "❌ Upload failed."
  exit 1
fi

echo "🔧 Fixing file permissions in temporary folder..."
ssh -i "$KEY" "$REMOTE" "sudo chmod -R o+r $TEMP_DIR && sudo find $TEMP_DIR -type d -exec chmod o+rx {} \;"

echo "🔁 Switching to new build on server..."
ssh -i "$KEY" "$REMOTE" << EOF
  set -e
  rm -rf $BACKUP_DIR
  mv $LIVE_DIR $BACKUP_DIR
  mv $TEMP_DIR $LIVE_DIR
EOF

echo "🔄 Reloading Caddy..."
ssh -i "$KEY" "$REMOTE" "sudo systemctl reload caddy && echo '✅ Caddy reloaded.'"

echo "✅ Upload and switch successful."
echo "🎉 Zero-downtime deployment complete!"
