#!/bin/bash

echo "🚀 Starting clean deploy process for Expo Web on Vercel..."

# 1. Clean previous installs
echo "🧹 Cleaning old dependencies and lockfiles..."
rm -rf node_modules
rm -f package-lock.json yarn.lock pnpm-lock.yaml

# 2. Reinstall dependencies
echo "📦 Installing dependencies with legacy peer resolution..."
npm install --legacy-peer-deps

# 3. Build Expo Web
echo "🌐 Exporting Expo Web build to /dist..."
npx expo export --platform web --output-dir dist

# 4. Ensure vercel.json exists
if [ ! -f "vercel.json" ]; then
  echo "⚙️ Creating vercel.json for static hosting..."
  cat <<EOF > vercel.json
{
  "builds": [
    { "src": "dist/**/*", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/(.*)", "dest": "/dist/\$1" }
  ]
}
EOF
fi

# 5. Optional Git commit
read -p "📝 Do you want to auto-commit and push to GitHub? (y/n): " yn
if [[ $yn == "y" ]]; then
  git add .
  git commit -m "Automated deploy build"
  git push origin main
  echo "✅ Pushed to GitHub!"
fi

echo "✅ Build complete! Now go to Vercel dashboard and deploy without build command."
