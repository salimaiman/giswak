#!/usr/bin/env bash

echo "Starting deployment build..."

# Clean and recreate the giswak deployment directory
rm -rf giswak
mkdir giswak

# Copy static assets and data
echo "Copying public assets..."
cp -r public/* giswak/ 2>/dev/null || true

# Copy source code
echo "Copying source code..."
cp src/style.css giswak/
cp src/main.js giswak/
if [ -f src/main_.js ]; then
    cp src/main_.js giswak/
fi

# Copy and rename index.html to index.php
echo "Building index.php..."
cp src/index.html giswak/index.php

echo "Deployment package successfully built in giswak/!"

# Build docs/ directory for GitHub Pages
echo "Building docs for GitHub Pages..."
rm -rf docs
cp -r giswak docs
mv docs/index.php docs/index.html

echo "Deployment package successfully built in docs/!"
