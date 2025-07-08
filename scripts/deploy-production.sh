#!/bin/bash

# DeFi Trading Copilot - Production Deployment Script
# Builds and deploys to Docker Hub for NodeOps deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 DeFi Trading Copilot - Production Deployment${NC}"
echo "================================================="

# Check if Docker Hub username provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Docker Hub username required${NC}"
    echo "Usage: ./deploy-production.sh <dockerhub-username>"
    echo "Example: ./deploy-production.sh peachy333"
    exit 1
fi

DOCKERHUB_USER=$1
IMAGE_NAME="defi-trading-copilot"
TAG="latest"
FULL_IMAGE="${DOCKERHUB_USER}/${IMAGE_NAME}:${TAG}"

echo -e "${YELLOW}📦 Building production image: ${FULL_IMAGE}${NC}"

# Build the Docker image with build arguments for environment variables
echo -e "${BLUE}Building Docker image with environment variables...${NC}"
docker build \
  --build-arg VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
  --build-arg VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY}" \
  --build-arg VITE_OPENAI_API_KEY="${VITE_OPENAI_API_KEY}" \
  --build-arg VITE_BSC_RPC_URL="${VITE_BSC_RPC_URL:-https://bsc-dataseed1.binance.org/}" \
  --build-arg VITE_PANCAKESWAP_ROUTER="${VITE_PANCAKESWAP_ROUTER:-0x10ED43C718714eb63d5aA57B78B54704E256024E}" \
  --build-arg VITE_WBNB_ADDRESS="${VITE_WBNB_ADDRESS:-0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c}" \
  --build-arg VITE_USDT_ADDRESS="${VITE_USDT_ADDRESS:-0x55d398326f99059fF775485246999027B3197955}" \
  -t $FULL_IMAGE .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully${NC}"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

# Push to Docker Hub
echo -e "${BLUE}🔄 Pushing to Docker Hub...${NC}"
docker push $FULL_IMAGE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image pushed to Docker Hub successfully${NC}"
    echo -e "${GREEN}📍 Image available at: ${FULL_IMAGE}${NC}"
else
    echo -e "${RED}❌ Docker push failed${NC}"
    echo -e "${YELLOW}💡 Make sure you're logged in: docker login${NC}"
    exit 1
fi

# Display deployment information
echo ""
echo -e "${GREEN}🎉 PRODUCTION DEPLOYMENT COMPLETE!${NC}"
echo "============================================="
echo -e "${BLUE}Docker Image:${NC} ${FULL_IMAGE}"
echo -e "${BLUE}NodeOps Template:${NC} nodeops-template.yaml"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Upload nodeops-template.yaml to NodeOps marketplace"
echo "2. Deploy using NodeOps with the image: ${FULL_IMAGE}"
echo "3. Set the following environment variables in NodeOps:"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY" 
echo "   - OPENAI_API_KEY"
echo "   - BSC_RPC_URL (optional, defaults to public RPC)"
echo "   - PANCAKESWAP_ROUTER (optional, defaults to mainnet router)"
echo "   - WBNB_ADDRESS (optional, defaults to mainnet WBNB)"
echo "   - USDT_ADDRESS (optional, defaults to mainnet USDT)"
echo ""
echo -e "${GREEN}🚀 Ready for NodeOps deployment!${NC}" 