// GLauncher - GitHub Codespaces Runner
// This script starts the server on port 8000 for GitHub Codespaces

process.env.PORT = '8000';
process.env.HOST = '0.0.0.0';
process.env.NODE_ENV = 'development';

console.log('🚀 Starting GLauncher for GitHub Codespaces...');
console.log('📡 Server will be available on port 8000');

// Import and run the server
import('./server/index.js').catch(console.error);