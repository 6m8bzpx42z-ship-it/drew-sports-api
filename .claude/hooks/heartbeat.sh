#!/bin/bash
# Project Dashboard - Claude Code Heartbeat Hook
# Sends a heartbeat when Claude Code performs commits
# This supplements daily Vercel cron for Hobby plan projects

# Get API key from .env.local or .env
API_KEY=""
if [ -f ".env.local" ]; then
    API_KEY=$(grep -E "^PROJECT_DASHBOARD_API_KEY=" .env.local 2>/dev/null | sed 's/^PROJECT_DASHBOARD_API_KEY=//' | tr -d '"' | tr -d "'")
fi
if [ -z "$API_KEY" ] && [ -f ".env" ]; then
    API_KEY=$(grep -E "^PROJECT_DASHBOARD_API_KEY=" .env 2>/dev/null | sed 's/^PROJECT_DASHBOARD_API_KEY=//' | tr -d '"' | tr -d "'")
fi

if [ -z "$API_KEY" ]; then
    exit 0  # Silently exit if no API key
fi

DASHBOARD_URL="${DASHBOARD_URL:-https://projects.paulrbrown.org}"

# Detect project info
PROJECT_NAME=""
APP_VERSION=""
if [ -f "package.json" ]; then
    PROJECT_NAME=$(grep -m1 '"name"' package.json 2>/dev/null | sed 's/.*"name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")
    APP_VERSION=$(grep -m1 '"version"' package.json 2>/dev/null | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "")
fi
[ -z "$PROJECT_NAME" ] && PROJECT_NAME=$(basename "$(pwd)")

# Get git info
GIT_BRANCH=""
GIT_COMMIT=""
GIT_COMMIT_DATE=""
if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "")
    GIT_COMMIT_DATE=$(git log -1 --format=%cI 2>/dev/null || echo "")
fi

# Send heartbeat
curl -s -X POST "${DASHBOARD_URL}/api/heartbeats" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "{
        \"status\": \"healthy\",
        \"message\": \"Claude Code commit\",
        \"version\": \"$APP_VERSION\",
        \"metadata\": {
            \"project_name\": \"$PROJECT_NAME\",
            \"hostname\": \"$(hostname)\",
            \"user\": \"$(whoami)\",
            \"cwd\": \"$(pwd)\",
            \"git_branch\": \"$GIT_BRANCH\",
            \"git_commit\": \"$GIT_COMMIT\",
            \"git_commit_date\": \"$GIT_COMMIT_DATE\",
            \"type\": \"claude-code-hook\",
            \"script_version\": \"1.0.0\"
        }
    }" > /dev/null 2>&1

exit 0
