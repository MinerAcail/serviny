#!/bin/bash

KEY="$HOME/.ssh/servinykey.pem"
REMOTE="ubuntu@ec2-16-16-254-21.eu-north-1.compute.amazonaws.com"
REMOTE_BASE="/home/ubuntu/works/winneui"
LIVE_DIR="$REMOTE_BASE/dist"
TEMP_DIR="$REMOTE_BASE/dist_temp"
BACKUP_DIR="$REMOTE_BASE/dist_backup"

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
