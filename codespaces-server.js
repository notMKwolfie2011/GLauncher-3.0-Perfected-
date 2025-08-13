#!/usr/bin/env node

// Set environment for Codespaces
process.env.PORT = '8000';
process.env.HOST = '0.0.0.0';
process.env.NODE_ENV = 'development';

console.log('Starting GLauncher for GitHub Codespaces on port 8000...');

// Import the server using dynamic import
import('./server/index.js')
  .then(() => {
    console.log('Server imported successfully');
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });