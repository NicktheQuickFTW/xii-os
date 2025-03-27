#!/bin/bash

# Change to project directory (update this path for your system)
cd /Users/nickthequick/XII-OS

# Check if there are changes
if [[ -n $(git status -s) ]]; then
  # Get current timestamp for commit message
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
  
  # Add all changes
  git add .
  
  # Commit with timestamp
  git commit -m "Auto-sync: $TIMESTAMP"
  
  # Push to current branch
  CURRENT_BRANCH=$(git symbolic-ref --short HEAD)
  git push origin $CURRENT_BRANCH
  
  echo "Changes pushed to $CURRENT_BRANCH"
else
  echo "No changes to commit"
fi 