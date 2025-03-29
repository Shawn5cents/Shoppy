#!/bin/bash

# Create necessary directories
mkdir -p css

# Run Tailwind build
npm run build

# Clean up any old files
rm -rf css/output.css

# Copy static assets to root
cp static/css/output.css css/

# Ensure permissions are correct
chmod 644 css/output.css
