#!/bin/bash

echo "🔍 Testing build configuration..."

# Clean install
echo "📦 Clean installing dependencies..."
rm -rf node_modules
npm ci

# Check for required dependencies
echo "✅ Checking dependencies..."
npm list tailwindcss postcss autoprefixer

# Run build
echo "🏗️ Running build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi 