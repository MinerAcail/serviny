#!/bin/bash

KEY="$HOME/.ssh/servinykey.pem"
REMOTE="ubuntu@ec2-16-16-254-21.eu-north-1.compute.amazonaws.com"
DEST="/home/ubuntu/works/winneui/dist"
DESTd="/home/ubuntu/works/winneui/"

echo "🔨 Building the project locally..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Local build failed."
  exit 1
fi

echo "✅ Local build completed successfully."


echo "🚀 Removing old files on server..."
ssh -i "$KEY" "$REMOTE" "rm -rf $DESTd/*"
if [ $? -ne 0 ]; then
  echo "❌ Failed to remove old files on server."
  exit 1
fi

echo "🧹 Old files removed."

echo "📤 Uploading new build..."
scp -i "$KEY" -r ./dist/* "$REMOTE:$DEST"
if [ $? -ne 0 ]; then
  echo "❌ Upload failed."
  exit 1
fi

echo "🔧 Fixing file permissions..."
ssh -i "$KEY" "$REMOTE" "sudo chmod -R o+r $DEST && sudo find $DEST -type d -exec chmod o+rx {} \;"

echo "🔄 Reloading Caddy..."
ssh -i "$KEY" "$REMOTE" "sudo systemctl reload caddy && echo '✅ Caddy reloaded.'"

echo "✅ Upload successful."
echo "🎉 Deployment complete!"
