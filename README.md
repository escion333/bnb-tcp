# DeFi Trading Copilot 🤖

> **AI-powered DeFi trading assistant with real-time market analysis and automated trade execution on Binance Smart Chain.**

## ✨ Features

### 🤖 **AI-Powered Trading**
- Real-time price feeds from CoinGecko
- AI-powered trade recommendations via OpenAI GPT-4
- Automated stop-loss/take-profit via Supra Automation
- One-click trade execution through PancakeSwap
- Comprehensive trade history and portfolio tracking
- Web3 wallet integration (MetaMask, WalletConnect)
- Responsive design for desktop and mobile

### 📊 **Advanced Market Data**
- **Real-time BNB/USD pricing** from CoinGecko API
- **24h price changes, volume, and market cap** data  
- **Automated price updates** every 60 seconds
- **Professional-grade price feeds** for accurate trading

### 🛡️ **Smart Risk Management**
- **Automated stop-loss orders** via Supra Automation
- **Take-profit automation** with configurable targets
- **Risk/reward ratio calculations** for every trade
- **Portfolio tracking** with real-time P&L

### 🎨 **Modern Interface**
- Responsive design optimized for desktop and mobile
- Dark mode with professional trading aesthetics
- Real-time price widgets and interactive charts
- Intuitive configuration management through UI

### 🔐 **Security & Integration**
- Secure MetaMask wallet integration with BSC support
- Local browser storage for API keys (never server-side)
- Multi-platform Docker deployment (ARM64 + AMD64)
- Production-ready with nginx and security headers

## 🚀 **Zero-Config Deployment**

The app now supports **runtime configuration** through the frontend UI! No more complex environment variable setup - just deploy and configure your API keys through the settings interface.

### Quick Start with Docker

```bash
# 1. Clone the repository
git clone <repository-url>
cd bnb-tcp

# 2. Build and run with Docker
docker build -t defi-trading-copilot .
docker run -p 3000:80 defi-trading-copilot

# 3. Open http://localhost:3000 and configure through the UI
```

### Docker Compose (Recommended)

```bash
# Production build
docker-compose up

# Development mode with hot reload
docker-compose --profile dev up defi-trading-copilot-dev
```

## ⚙️ Configuration

### Runtime Configuration (Recommended)

1. **Access the app** at your deployed URL
2. **Click "Configure Now"** or the Setup button in the header
3. **Add your API keys** through the intuitive settings modal:

#### Required Services:
- **🗄️ Supabase Database** - Trade history and data persistence
  - Get from [supabase.com](https://supabase.com/dashboard)
  - Free tier available

- **🤖 OpenAI API** - AI trade idea generation  
  - Get from [platform.openai.com](https://platform.openai.com/api-keys)
  - Starts with `sk-`

#### Optional Services:
- **📊 Supra Oracle** - Enhanced price feeds and automation
  - Get from [supra.com](https://supra.com)
  - Price feeds fall back to CoinGecko if unavailable
  - Required only for automated stop-loss/take-profit

- **🔗 BSC RPC Provider** - Blockchain connection
  - Default: Free Binance RPC (works fine)
  - Premium: Alchemy, Infura, or QuickNode for better performance

### Environment Variables (Advanced)

For automated deployments, you can still use environment variables:

```bash
# Copy the template
cp env.example .env

# Required
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_OPENAI_API_KEY=sk-your-openai-api-key

# Optional
VITE_SUPRA_API_KEY=your-supra-api-key
VITE_BSC_RPC_URL=https://bsc-dataseed1.binance.org/
```

## 🛠️ Development

### Prerequisites
- Node.js 18+ and npm
- MetaMask wallet with BSC network configured
- Git for version control

### Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp env.example .env
# Edit .env with your API keys

# 3. Start development server
npm run dev

# 4. Open http://localhost:5173
```

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build locally
npm run lint     # Run ESLint for code quality
```

### Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── ConfigurationModal.tsx
│   ├── PriceWidget.tsx
│   ├── TradeIdeaCard.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── usePriceData.ts
│   └── useTradeIdeas.ts
├── lib/                # Core business logic
│   ├── supra-automation.ts # Supra Automation integration
│   ├── openai.ts       # AI integration
│   ├── pancakeswap.ts  # DEX integration
│   └── ...
├── contexts/           # React contexts
├── types/             # TypeScript type definitions
└── utils/             # Helper utilities
```

## 🚢 Production Deployment

### NodeOps Deployment (Recommended)

See [docs/NODEOPS.md](./docs/NODEOPS.md) for detailed NodeOps deployment instructions.

### Docker Hub Deployment

```bash
# Build multi-platform image
docker buildx build --platform linux/amd64,linux/arm64 \
  -t yourusername/defi-trading-copilot:latest --push .

# Deploy to your infrastructure
docker run -p 3000:80 yourusername/defi-trading-copilot:latest
```

### Health Check

All deployments include a health endpoint:
```bash
curl http://your-app-url/health
# Returns: "healthy"
```

## 🔧 Troubleshooting

### Common Issues

**❌ Trade execution not working:**
- ✅ Verify wallet is connected to BSC mainnet (Chain ID: 56)
- ✅ Check Supabase configuration in settings
- ✅ Ensure sufficient BNB for gas fees
- ✅ Check browser console for error messages

**❌ Price data not loading:**
- ✅ Check network connectivity  
- ✅ Verify CoinGecko API is accessible
- ✅ Check browser console for API errors

**❌ AI trade ideas not generating:**
- ✅ Verify OpenAI API key is correctly configured
- ✅ Check API key has sufficient credits
- ✅ Ensure key starts with `sk-`

**❌ Docker container exits immediately:**
- ✅ Check if running on correct architecture (use multi-platform build)
- ✅ Verify nginx configuration
- ✅ Check container logs: `docker logs container-name`

### Debug Mode

Enable debug logging by opening browser dev tools console:
```javascript
localStorage.setItem('debug', 'true')
// Reload the page to see detailed logs
```

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Radix UI primitives
- **Blockchain**: Wagmi + Viem for BSC interaction
- **AI**: OpenAI GPT-4 for market analysis
- **Database**: Supabase (PostgreSQL) for persistence
- **Price Data**: CoinGecko API for real-time BNB pricing
- **Automation**: Supra Automation for stop-loss/take-profit orders
- **Deployment**: Docker + nginx with multi-platform support

### Data Flow
1. **Price Data**: CoinGecko API for real-time BNB/USD pricing
2. **AI Analysis**: OpenAI GPT-4 processes market data and user requests
3. **Trade Execution**: Wagmi → MetaMask → PancakeSwap Router
4. **Automation**: Supra Automation for stop-loss/take-profit orders
5. **Persistence**: Supabase for trade history and user preferences

### Security Features
- Client-side API key storage (localStorage)
- Non-root Docker container execution
- Secure nginx configuration with security headers
- Input validation and sanitization
- Rate limiting on API calls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Code formatting
- `refactor:` Code refactoring
- `test:` Adding tests

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Supra** for oracle and automation infrastructure
- **PancakeSwap** for DEX integration
- **OpenAI** for AI capabilities
- **Supabase** for database services
- **NodeOps** for decentralized deployment platform


