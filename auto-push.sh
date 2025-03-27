#!/bin/bash

# Automatically add all changes
git add .

# Get current timestamp for commit message
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Prompt for commit message or use default
read -p "Enter commit message (or press enter for timestamp): " COMMIT_MSG
COMMIT_MSG=${COMMIT_MSG:-"Auto-commit: $TIMESTAMP"}

# Commit with message
git commit -m "$COMMIT_MSG"

# Push to current branch
CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
git push origin $CURRENT_BRANCH

echo "Changes pushed to $CURRENT_BRANCH" 