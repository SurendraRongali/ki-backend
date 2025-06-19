#!/bin/bash

# Krugman Insights Backend Deployment Script for AWS EC2
# This script prepares and deploys the backend to production

set -e

echo "🚀 Starting Krugman Insights Backend Deployment..."

# Check if running as root (required for some system operations)
if [[ $EUID -eq 0 ]]; then
   echo "⚠️  Running as root. Proceeding with deployment..."
fi

# Set production environment
export NODE_ENV=production

echo "📋 Pre-deployment checks..."

# Check Node.js version
NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

# Check npm version
NPM_VERSION=$(npm --version)
echo "✅ npm version: $NPM_VERSION"

# Verify essential environment variables
if [[ -z "$DATABASE_URL" ]]; then
    echo "❌ DATABASE_URL not set. Loading from .env.production..."
    if [[ -f ".env.production" ]]; then
        export $(grep -v '^#' .env.production | xargs)
    else
        echo "❌ .env.production file not found!"
        exit 1
    fi
fi

echo "📦 Installing production dependencies..."
npm ci --only=production

echo "🔨 Building application..."
npm run build

echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p dist/uploads
mkdir -p dist/shared
mkdir -p dist/email-templates

echo "📋 Verifying build output..."
if [[ ! -f "dist/index.js" ]]; then
    echo "❌ Build failed! dist/index.js not found."
    exit 1
fi

echo "🔒 Setting up security..."
# Set proper file permissions
chmod 644 dist/*.js
chmod 755 dist/
chmod 755 logs/

echo "🌐 Testing database connection..."
node -e "
require('dotenv').config({ path: '.env.production' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Database connection successful');
    pool.end();
  }
});
"

echo "🧪 Running production health check..."
timeout 30s node dist/index.js &
PID=$!
sleep 5

# Check if the process is still running
if ps -p $PID > /dev/null; then
    echo "✅ Application started successfully"
    kill $PID
else
    echo "❌ Application failed to start"
    exit 1
fi

echo "🎯 Production deployment complete!"
echo "📝 Next steps:"
echo "   1. Configure PM2: pm2 start ecosystem.config.js"
echo "   2. Set up nginx reverse proxy"
echo "   3. Configure SSL certificate"
echo "   4. Set up monitoring and logging"
echo ""
echo "🚀 To start the application:"
echo "   npm run production:start"
echo "   or"
echo "   pm2 start ecosystem.config.js"