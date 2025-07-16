# DeFi Trading Co-Pilot - NodeOps Deployment Guide

This guide walks you through deploying the DeFi Trading Co-Pilot to NodeOps Cloud Infrastructure.

## 🎉 NEW: Zero-Config Deployment!

The app now supports **runtime configuration** through the frontend UI! No more build-time environment variables needed - just deploy and configure your API keys through the settings interface.

## 🚀 Quick Deploy

### Prerequisites
- Docker installed locally
- Docker Hub account
- NodeOps account

### Step 1: Build and Push Docker Image

1. **Login to Docker Hub:**
```bash
docker login -u {your_dockerhub_username}
```

2. **Build and push the image:**
```bash
# Replace 'yourusername' with your actual Docker Hub username
docker build -t yourusername/defi-trading-copilot:latest . --push --platform linux/amd64
```

### Step 2: Update Template

1. **Edit `nodeops-template.yaml`:**
   - Replace `YOUR_DOCKERHUB_USERNAME` with your actual Docker Hub username
   - Add any required environment variables

2. **Template Configuration:**
```yaml
version: '0.1'
services:
  defi-trading-copilot:
    image: yourusername/defi-trading-copilot:latest  # ← Update this
    # ... rest of configuration
```

### Step 3: Deploy to NodeOps

1. **Upload template to NodeOps Marketplace:**
   - Login to NodeOps dashboard
   - Navigate to Templates → Create Template
   - Upload your `nodeops-template.yaml`
   - Fill in template details and documentation

2. **Deploy from Marketplace:**
   - Find your template in the marketplace
   - Click "Deploy"
   - Configure any environment variables
   - Launch your deployment

## 🔧 Local Testing

### Test Docker Build Locally
```bash
# Build the image
docker build -t defi-trading-copilot .

# Run locally
docker run -p 3000:80 defi-trading-copilot

# Visit http://localhost:3000
```

### Test with Docker Compose
```bash
# Run production build
docker-compose up

# Run development mode
docker-compose --profile dev up defi-trading-copilot-dev
```

## 📋 Template Features

### Resource Allocation
- **Idle:** 100m CPU, 256Mi Memory
- **Peak:** 500m CPU, 512Mi Memory
- **Port:** 80 (HTTP) exposed to internet

### Security Features
- Multi-stage build (minimal attack surface)
- Non-root user execution
- Security headers in nginx
- Gzip compression enabled

### Health Monitoring
- Health check endpoint: `/health`
- Returns 200 OK when healthy

## 🎯 Integration Features

This deployment template provides:
- ✅ **BNB Chain**: PancakeSwap trading integration
- ✅ **Supra Oracle**: Real-time price feeds
- ✅ **Supra Automation**: TP/SL automation
- ✅ **NodeOps**: Containerized infrastructure deployment

## 🔍 Troubleshooting

### Build Issues
- Ensure all dependencies are in `package.json`
- Check that `npm run build` works locally
- Verify Docker daemon is running

### Deployment Issues
- Confirm Docker image is public and accessible
- Check resource limits don't exceed NodeOps constraints
- Verify environment variables are properly configured

### Runtime Issues
- Check application logs in NodeOps dashboard
- Verify health endpoint responds: `{your-app-url}/health`
- Ensure all API keys and environment variables are set

## 📚 Additional Resources

- [NodeOps Documentation](https://docs.nodeops.com)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [nginx Configuration Guide](https://nginx.org/en/docs/)

---

## 🔧 Post-Deployment Setup (For End Users)

After deploying from the NodeOps marketplace, users need to configure their API keys:

### Step 1: Open the App
- Visit your deployed app URL from NodeOps
- You'll see a configuration prompt since no API keys are set

### Step 2: Configure API Keys
Click the **"Configure Now"** button or **"Setup"** in the header to open the Settings modal:

#### Required Services:
1. **Supabase Database** (Required)
   - Go to [supabase.com](https://supabase.com) and create a free account
   - Create a new project
   - Get your Project URL and anon key from Settings → API

2. **OpenAI API** (For AI Trade Ideas)
   - Go to [platform.openai.com](https://platform.openai.com/api-keys)
   - Create an API key (starts with `sk-`)

3. **Supra Oracle** (For Price Data & Automation)
   - Go to [supra.com](https://supra.com)
   - Get an API key for Oracle services

4. **BSC RPC** (Optional)
   - Default: Free Binance RPC (works fine)
   - For better performance: Alchemy, Infura, or QuickNode

### Step 3: Save Configuration
- Click **"Save Configuration"** 
- Your settings are stored securely in your browser
- The app will reload with full functionality

### Step 4: Connect Wallet & Trade
- Connect your MetaMask wallet
- Generate AI trade ideas
- Execute trades on PancakeSwap
- Monitor automated positions

## 🔒 Security Notes
- API keys are stored locally in your browser (localStorage)
- Never share your configuration file publicly
- Use the Export/Import feature to backup settings

---

**🎉 Your DeFi Trading Co-Pilot is now ready for production deployment on decentralized NodeOps infrastructure!** 