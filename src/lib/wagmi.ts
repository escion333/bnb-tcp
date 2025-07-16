import { createConfig, http } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { metaMask } from 'wagmi/connectors'
import { getUserConfig } from './userConfig'

// Get dynamic BSC RPC URL
function getBscRpcUrl(): string {
  const config = getUserConfig()
  return config.bsc.rpcUrl || 'https://bsc-dataseed1.binance.org/'
}

// BSC Mainnet configuration with dynamic RPC
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
    [bsc.id]: http(getBscRpcUrl()),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
} 