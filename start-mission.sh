#!/bin/bash
cd "$(dirname "$0")/web"
echo "Initializing Helicarrier HUD on Port 3000..."
npm run dev -- -p 3000
