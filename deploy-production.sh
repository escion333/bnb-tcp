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

# Build the Docker image
echo -e "${BLUE}Building Docker image...${NC}"
docker build -t $FULL_IMAGE .

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
echo "3. Update environment variables for production"
echo ""
echo -e "${GREEN}🚀 Ready for NodeOps deployment!${NC}" 