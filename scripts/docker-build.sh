#!/bin/bash

# Docker build script for DeFi Trading Copilot
# Usage: ./scripts/docker-build.sh [tag_name]

set -e

# Default tag name
TAG_NAME=${1:-defi-trading-copilot:latest}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🐳 Building Docker image: $TAG_NAME${NC}"

echo -e "${GREEN}✅ Building with runtime configuration support${NC}"

# Build Docker image
echo -e "${YELLOW}🔨 Starting Docker build...${NC}"

docker build -t "$TAG_NAME" .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully: $TAG_NAME${NC}"
    echo -e "${YELLOW}📊 Image details:${NC}"
    docker images "$TAG_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
    echo -e "${YELLOW}🚀 To run the container:${NC}"
    echo "   docker run -p 3000:80 $TAG_NAME"
    echo ""
    echo -e "${YELLOW}🐳 Or use docker-compose:${NC}"
    echo "   docker-compose up"
    echo ""
    echo -e "${YELLOW}⚙️  Configure the app at: http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi 