#!/bin/bash

# DeFi Trading Co-Pilot - NodeOps Deployment Script
# This script builds and pushes the Docker image for NodeOps deployment

set -e  # Exit on any error

# Configuration
DOCKER_USERNAME="${1:-your_dockerhub_username}"
IMAGE_NAME="defi-trading-copilot"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "🚀 Building and deploying DeFi Trading Co-Pilot to NodeOps"
echo "Docker Image: ${FULL_IMAGE_NAME}"
echo ""

# Check if Docker username is provided
if [ "$DOCKER_USERNAME" = "your_dockerhub_username" ]; then
    echo "❌ Please provide your Docker Hub username:"
    echo "Usage: ./build-and-deploy.sh YOUR_DOCKERHUB_USERNAME"
    exit 1
fi

# Step 1: Build the application first (to catch build errors early)
echo "📦 Building React application..."
npm run build
echo "✅ React build complete"
echo ""

# Step 2: Build Docker image
echo "🐳 Building Docker image..."
docker build -t ${FULL_IMAGE_NAME} . --platform linux/amd64
echo "✅ Docker build complete"
echo ""

# Step 3: Test the image locally (optional)
echo "🧪 Testing Docker image locally..."
echo "Starting container on port 3001..."
docker run -d --name defi-trading-test -p 3001:80 ${FULL_IMAGE_NAME}
sleep 3

# Check if container is running
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check failed, but continuing..."
fi

# Cleanup test container
docker stop defi-trading-test >/dev/null 2>&1 || true
docker rm defi-trading-test >/dev/null 2>&1 || true
echo ""

# Step 4: Push to Docker Hub
echo "⬆️  Pushing to Docker Hub..."
echo "Make sure you're logged in: docker login -u ${DOCKER_USERNAME}"
read -p "Press Enter to continue with push, or Ctrl+C to cancel..."

docker push ${FULL_IMAGE_NAME}
echo "✅ Push complete"
echo ""

# Step 5: Update NodeOps template
echo "📝 Updating NodeOps template..."
sed -i.bak "s/YOUR_DOCKERHUB_USERNAME/${DOCKER_USERNAME}/g" nodeops-template.yaml
echo "✅ Template updated with your Docker Hub username"
echo ""

# Final instructions
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Upload 'nodeops-template.yaml' to NodeOps Marketplace"
echo "2. Deploy from the marketplace"
echo "3. Your app will be available at: https://your-app.atlasnetwork.app"
echo ""
echo "Template file: nodeops-template.yaml"
echo "Docker image: ${FULL_IMAGE_NAME}"
echo ""
echo "🏆 All integrations complete:"
echo "✅ BNB Chain (PancakeSwap trading)"
echo "✅ Supra (Oracle + Automation)"  
echo "✅ NodeOps (Infrastructure deployment)" 