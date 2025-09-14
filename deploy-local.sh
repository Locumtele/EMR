#!/bin/bash

# Local deployment script for testing
# This replaces the placeholder with your actual Notion secret

echo "🔧 Setting up local deployment..."

# Check if Notion secret is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your Notion secret as an argument:"
    echo "   ./deploy-local.sh YOUR_NOTION_SECRET_HERE"
    exit 1
fi

NOTION_SECRET=$1

# Replace placeholder with actual secret
echo "📝 Replacing Notion secret in dynamic-form.html..."
sed -i.bak "s/YOUR_NOTION_SECRET_HERE/$NOTION_SECRET/g" forms/notion-based/dynamic-form.html

echo "📝 Replacing Notion secret in CONFIGURATION-REFERENCE.md..."
sed -i.bak "s/YOUR_NOTION_SECRET_HERE/$NOTION_SECRET/g" forms/notion-based/CONFIGURATION-REFERENCE.md

echo "✅ Local deployment ready!"
echo "🌐 You can now test your forms locally by opening:"
echo "   file://$(pwd)/forms/notion-based/dynamic-form.html"
echo ""
echo "🧪 Test URLs:"
echo "   ?screener=GLP1&db=26e82abf7eae80f5ae8eeb0c7ecc76f0"
echo "   ?screener=NAD&db=26e82abf7eae80f5ae8eeb0c7ecc76f0"
echo "   ?screener=Semorelin&db=26e82abf7eae80f5ae8eeb0c7ecc76f0"
