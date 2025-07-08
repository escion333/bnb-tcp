console.log('SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);


// Environment Configuration
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  bsc: {
    rpcUrl: import.meta.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/',
    chainId: 56,
  },
  ai: {
    openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  },
  contracts: {
    pancakeswapRouter: import.meta.env.VITE_PANCAKESWAP_ROUTER || '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    venusComptroller: import.meta.env.VITE_VENUS_COMPTROLLER || '0xfD36E2c2a6789Db23113685031d7F16329158384',
    wbnbAddress: import.meta.env.VITE_WBNB_ADDRESS || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    usdtAddress: import.meta.env.VITE_USDT_ADDRESS || '0x55d398326f99059fF775485246999027B3197955',
  },
} as const;

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