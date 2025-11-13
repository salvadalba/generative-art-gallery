#!/bin/bash

# Simple Static Deployment Script for Generative Art Gallery
echo "🚀 Deploying Generative Art Gallery..."

# Check if build exists
if [ ! -d "dist" ]; then
    echo "📦 Building application..."
    npm run build
fi

# Create deployment package
echo "📁 Creating deployment package..."
mkdir -p deploy-package
cp -r dist/* deploy-package/

# Add deployment instructions
cat > deploy-package/README.md << 'EOF'
# Generative Art Gallery - Deployment Package

## Quick Deploy Options

### Option 1: Netlify Drop
1. Visit https://app.netlify.com/drop
2. Drag and drop this entire folder
3. Your site will be live instantly!

### Option 2: GitHub Pages
1. Create a new GitHub repository
2. Upload these files to the repository
3. Enable GitHub Pages in repository settings
4. Your site will be live at https://yourusername.github.io/repository-name

### Option 3: Surge.sh
1. Install surge: `npm install -g surge`
2. Run: `surge` from this directory
3. Follow prompts to deploy

### Option 4: Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run: `firebase init hosting`
3. Run: `firebase deploy`

## Features
- Three.js WebGL generative art
- Interactive parameter controls
- Gallery system
- PNG export
- Responsive design
- Modern UI

## Configuration
The application is pre-configured for production use. 
For backend integration, update the API URLs in the environment variables.
EOF

echo "✅ Deployment package created!"
echo "📦 Files ready in: deploy-package/"
echo ""
echo "🎯 Next steps:"
echo "1. Choose a hosting platform (Netlify, GitHub Pages, etc.)"
echo "2. Upload the deploy-package contents"
echo "3. Your generative art gallery will be live!"
echo ""
echo "🔗 Recommended: Try Netlify Drop first - it's the fastest!"