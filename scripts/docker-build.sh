#!/bin/bash

# Docker build script for bnb-tcp
# Usage: ./scripts/docker-build.sh [tag_name]

set -e

# Default tag name
TAG_NAME=${1:-bnb-tcp:latest}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🐳 Building Docker image: $TAG_NAME${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo -e "${YELLOW}💡 Please create a .env file based on env.example${NC}"
    echo "   cp env.example .env"
    echo "   # Then edit .env with your actual values"
    exit 1
fi

# Source environment variables from .env file
export $(grep -v '^#' .env | xargs)

# Validate required environment variables
REQUIRED_VARS=(
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: Required environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Build Docker image with all environment variables as build args
echo -e "${YELLOW}🔨 Starting Docker build...${NC}"

docker build \
    --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
    --build-arg VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
    --build-arg VITE_BSC_RPC_URL="$VITE_BSC_RPC_URL" \
    --build-arg VITE_SUPRA_API_KEY="$VITE_SUPRA_API_KEY" \
    --build-arg VITE_OPENAI_API_KEY="$VITE_OPENAI_API_KEY" \
    --build-arg VITE_PANCAKESWAP_ROUTER="$VITE_PANCAKESWAP_ROUTER" \
    --build-arg VITE_VENUS_COMPTROLLER="$VITE_VENUS_COMPTROLLER" \
    --build-arg VITE_WBNB_ADDRESS="$VITE_WBNB_ADDRESS" \
    --build-arg VITE_USDT_ADDRESS="$VITE_USDT_ADDRESS" \
    -t "$TAG_NAME" \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully: $TAG_NAME${NC}"
    echo -e "${YELLOW}📊 Image details:${NC}"
    docker images "$TAG_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
    echo -e "${YELLOW}🚀 To run the container:${NC}"
    echo "   docker run -p 3000:80 $TAG_NAME"
    echo ""
    echo -e "${YELLOW}🐳 Or use docker-compose:${NC}"
    echo "   docker-compose up --build"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi 