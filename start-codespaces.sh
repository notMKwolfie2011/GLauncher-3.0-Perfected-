#!/bin/bash
# GLauncher - GitHub Codespaces Startup Script
# This script configures the environment for GitHub Codespaces and starts the server on port 8000

echo "🚀 Starting GLauncher in GitHub Codespaces mode..."

# Set environment variables for Codespaces
export PORT=8000
export HOST=0.0.0.0
export NODE_ENV=development

echo "📡 Server will be accessible on port 8000"
echo "🔧 Starting development server..."

# Start the development server
npm run dev