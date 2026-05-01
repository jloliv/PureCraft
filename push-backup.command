#!/bin/bash
# Double-click this file to push committed PureCraft backups to GitHub.
# It will open Terminal, push to origin/main, and pause so you can read the result.

set -u

# Resolve the directory containing this script (works no matter where it's launched from)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR" || { echo "Could not cd to $SCRIPT_DIR"; exit 1; }

echo "=== PureCraft backup push ==="
echo "Repo: $(git remote get-url origin 2>/dev/null || echo 'no remote')"
echo "Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')"
echo ""

echo "--- Status ---"
git status -sb | head -5
echo ""

echo "--- Pushing to origin/main ---"
if git push origin main; then
  echo ""
  echo "Push succeeded."
else
  echo ""
  echo "Push failed. Check the error above."
fi

echo ""
echo "Press Return to close this window."
read -r _
