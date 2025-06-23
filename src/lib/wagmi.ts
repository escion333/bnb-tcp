import { createConfig, http } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'

// BSC Mainnet configuration
export const config = createConfig({
  chains: [bsc],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'DeFi Trading Co-Pilot',
        url: 'https://localhost:5173',
      },
    }),
  ],
  transports: {
    [bsc.id]: http(import.meta.env.VITE_BSC_RPC_URL || 'https://bsc-dataseed1.binance.org/'),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
} 