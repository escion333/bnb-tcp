# DeFi Trading Copilot 🤖

AI-powered DeFi trading assistant with real-time market analysis and automated trade execution on Binance Smart Chain.

## Features

- 🤖 AI-powered trade idea generation using OpenAI
- 📊 Real-time price monitoring and analysis
- 🔄 Automated trade execution via PancakeSwap
- 💡 Risk management with stop-loss and take-profit
- 📱 Responsive web interface with dark mode
- 🔐 Secure wallet integration with MetaMask

## Trade Execution Functionality

The trade execution feature allows you to:
- Execute trades directly on PancakeSwap
- Set automated stop-loss and take-profit orders
- Monitor active positions in real-time
- Track trade history and performance

## Environment Variables

For the trade execution functionality to work, you need to set the following environment variables:

### Required Variables:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Optional Variables (have defaults):
```bash
VITE_BSC_RPC_URL=https://bsc-dataseed1.binance.org/
VITE_PANCAKESWAP_ROUTER=0x10ED43C718714eb63d5aA57B78B54704E256024E
VITE_WBNB_ADDRESS=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
VITE_USDT_ADDRESS=0x55d398326f99059fF775485246999027B3197955
```

## Setup Instructions

### Using the Environment Template

This repository includes an `env.example` file with all the necessary environment variable templates:

1. **Copy the template:**
   ```bash
   cp env.example .env
   ```

2. **Edit the `.env` file** with your actual values:
   - Replace `https://your-project-id.supabase.co` with your Supabase project URL
   - Replace `your-supabase-anon-key` with your Supabase anonymous key
   - Replace `your-openai-api-key` with your OpenAI API key
   - Replace `your-supra-api-key` with your Supra Oracle API key (if using)

3. **Never commit the `.env` file** - it contains sensitive information and is already in `.gitignore`

The `env.example` file serves as documentation for all required and optional environment variables.

## Production Deployment

### Fix for Missing Trade Execution:

If trade execution isn't working in production, it's likely due to missing environment variables. The fixes have been applied to:

1. **nodeops-template.yaml** - Uncommented required environment variables
2. **Dockerfile** - Added build-time environment variable support
3. **scripts/deploy-production.sh** - Added environment variable passing during build

### Deployment Steps:

1. **Set environment variables locally:**
   ```bash
   export VITE_SUPABASE_URL="your_supabase_url"
   export VITE_SUPABASE_ANON_KEY="your_supabase_key"
   export VITE_OPENAI_API_KEY="your_openai_key"
   ```

2. **Build and deploy:**
   ```bash
   ./scripts/deploy-production.sh your-dockerhub-username
   ```

3. **Configure NodeOps:**
   - Upload the updated `nodeops-template.yaml`
   - Set the following variables in NodeOps:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
     - `OPENAI_API_KEY`
     - `BSC_RPC_URL` (optional)

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp env.example .env
   # Edit .env with your values
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## Troubleshooting

### Trade Execution Not Working:
- ✅ Check that all environment variables are set
- ✅ Verify Supabase and OpenAI API keys are valid
- ✅ Ensure wallet is connected to BSC mainnet
- ✅ Check console for any error messages

### Build Issues:
- Environment variables must be available during build time
- Use the updated `scripts/deploy-production.sh` script
- Verify Docker build arguments are being passed correctly

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Blockchain**: Wagmi + Viem for BSC interaction
- **AI**: OpenAI GPT for trade analysis
- **Database**: Supabase for data persistence
- **Deployment**: Docker + NodeOps

## License

MIT License - see LICENSE file for details.
