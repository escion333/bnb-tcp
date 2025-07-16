import { getUserConfig } from './userConfig'

// Get dynamic configuration from user settings
export function getConfig() {
  const userConfig = getUserConfig()
  
  return {
    supabase: {
      url: userConfig.supabase.url,
      anonKey: userConfig.supabase.anonKey,
    },
    bsc: {
      rpcUrl: userConfig.bsc.rpcUrl,
      chainId: 56,
    },
    ai: {
      openaiApiKey: userConfig.ai.openaiApiKey,
    },
    supra: {
      apiKey: userConfig.supra.apiKey,
    },
    contracts: {
      pancakeswapRouter: import.meta.env.VITE_PANCAKESWAP_ROUTER || '0x10ED43C718714eb63d5aA57B78B54704E256024E',
      venusComptroller: import.meta.env.VITE_VENUS_COMPTROLLER || '0xfD36E2c2a6789Db23113685031d7F16329158384',
      wbnbAddress: import.meta.env.VITE_WBNB_ADDRESS || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      usdtAddress: import.meta.env.VITE_USDT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955',
    },
  } as const
}

// Legacy export for backward compatibility (will be replaced in services)
export const config = getConfig()

// BSC Network Configuration
export const bscNetwork = {
  id: 56,
  name: 'BNB Smart Chain',
  network: 'bsc',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpcUrls: {
    default: { http: [config.bsc.rpcUrl] },
    public: { http: [config.bsc.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'BscScan', url: 'https://bscscan.com' },
  },
} as const; 