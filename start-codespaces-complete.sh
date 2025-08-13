#!/bin/bash
# GLauncher - Complete GitHub Codespaces Setup

echo "Setting up GLauncher for GitHub Codespaces..."

# Export all required environment variables
export PORT=8000
export HOST=0.0.0.0
export NODE_ENV=development

# Get database credentials from the system
if [ -z "$DATABASE_URL" ]; then
    echo "Setting up database connection..."
    export DATABASE_URL="${DATABASE_URL:-postgresql://user:password@localhost:5432/glauncher}"
fi

echo "Environment configured:"
echo "- PORT: $PORT"
echo "- HOST: $HOST" 
echo "- NODE_ENV: $NODE_ENV"
echo "- DATABASE_URL: [CONFIGURED]"

echo "Starting GLauncher server..."
tsx server/index.ts