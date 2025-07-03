#!/bin/bash

KEY="$HOME/.ssh/servinykey.pem"
REMOTE="ubuntu@ec2-16-16-254-21.eu-north-1.compute.amazonaws.com"
REMOTE_BASE="/home/ubuntu/works/winneui"
LIVE_DIR="$REMOTE_BASE/dist"
BACKUP_DIR="$REMOTE_BASE/dist_backup"

echo "⚠️  Rolling back to previous deployment..."

ssh -i "$KEY" "$REMOTE" << EOF
  set -e

  if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ No backup folder found. Cannot rollback."
    exit 1
  fi

  echo "🗑️  Removing broken deployment..."
  rm -rf "$LIVE_DIR"

  echo "↩️  Restoring from backup..."
  mv "$BACKUP_DIR" "$LIVE_DIR"
EOF

echo "🔄 Reloading Caddy..."
ssh -i "$KEY" "$REMOTE" "sudo systemctl reload caddy && echo '✅ Caddy reloaded after rollback.'"

echo "✅ Rollback complete. Your site is now running the previous version."
