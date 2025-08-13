#!/bin/bash
# GLauncher - Force Port 8000 Startup
echo "🚀 Starting GLauncher on port 8000..."

# Kill any existing processes
pkill -f "tsx server/index.ts" 2>/dev/null || true
sleep 2

# Start server on port 8000
PORT=8000 HOST=0.0.0.0 NODE_ENV=development tsx server/index.ts