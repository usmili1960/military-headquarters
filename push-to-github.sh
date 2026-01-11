#!/bin/bash
# GitHub Push Script
# Usage: ./push-to-github.sh YOUR_GITHUB_TOKEN

if [ -z "$1" ]; then
    echo "❌ Error: Please provide your GitHub Personal Access Token"
    echo "Usage: ./push-to-github.sh YOUR_TOKEN"
    echo ""
    echo "Get your token from: https://github.com/settings/tokens/new"
    exit 1
fi

TOKEN=$1
USERNAME="usmili1960"
REPO="military-headquarters"

echo "🚀 Pushing to GitHub..."
echo "Repository: https://github.com/$USERNAME/$REPO"
echo ""

# Remove existing remote if any
git remote remove origin 2>/dev/null

# Add remote with token
git remote add origin https://$TOKEN@github.com/$USERNAME/$REPO.git

# Push to GitHub
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Code pushed to GitHub!"
    echo "🌐 View your repository at: https://github.com/$USERNAME/$REPO"
else
    echo ""
    echo "❌ Push failed. Please check your token and repository."
fi
