#!/bin/bash

# Deployment script for Basement to Breakthrough

set -e

echo "🚀 Starting deployment process..."

# Check if environment is specified
if [ -z "$1" ]; then
  echo "Error: Please specify environment (staging|production)"
  echo "Usage: ./scripts/deploy.sh [staging|production]"
  exit 1
fi

ENVIRONMENT=$1

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
  export $(cat .env.$ENVIRONMENT | xargs)
fi

# Build the application
echo "📦 Building for $ENVIRONMENT..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test -- --run

# Check build size
echo "📊 Checking build size..."
MAX_SIZE_KB=500
ACTUAL_SIZE_KB=$(du -sk dist | cut -f1)

if [ $ACTUAL_SIZE_KB -gt $MAX_SIZE_KB ]; then
  echo "❌ Build size ($ACTUAL_SIZE_KB KB) exceeds limit ($MAX_SIZE_KB KB)"
  exit 1
fi

echo "✅ Build size OK: $ACTUAL_SIZE_KB KB"

# Deploy based on environment
case $ENVIRONMENT in
  staging)
    echo "🌍 Deploying to staging..."
    # Add your staging deployment command here
    # Example: rsync -avz dist/ user@staging-server:/var/www/basement-staging/
    ;;
    
  production)
    echo "🌍 Deploying to production..."
    # Add your production deployment command here
    # Example: rsync -avz dist/ user@production-server:/var/www/basement/
    
    # Invalidate CDN cache if using one
    # Example: aws cloudfront create-invalidation --distribution-id $CDN_DISTRIBUTION_ID --paths "/*"
    ;;
    
  *)
    echo "Error: Unknown environment $ENVIRONMENT"
    exit 1
    ;;
esac

echo "✅ Deployment complete!"