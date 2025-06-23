import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { useEffect, useState } from 'react'
import { Button } from './ui'

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const [isWrongNetwork, setIsWrongNetwork] = useState(false)
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false)

  // Check if we're on the correct network (BSC)
  useEffect(() => {
    if (isConnected && chain) {
      setIsWrongNetwork(chain.id !== bsc.id)
    } else {
      setIsWrongNetwork(false)
    }
  }, [isConnected, chain])

  const addBSCNetwork = async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed')
    }

    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x38', // BSC Chain ID in hex (56 in decimal)
        chainName: 'Binance Smart Chain',
        nativeCurrency: {
          name: 'BNB',
          symbol: 'BNB',
          decimals: 18
        },
        rpcUrls: ['https://bsc-dataseed1.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com/']
      }]
    })
  }

  const switchToBSCManual = async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed')
    }

    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x38' }] // BSC Chain ID in hex
    })
  }

  const handleConnect = () => {
    const metaMaskConnector = connectors.find(connector => connector.name === 'MetaMask')
    if (metaMaskConnector) {
      connect({ connector: metaMaskConnector })
    }
  }

  const handleSwitchToBSC = async () => {
    setIsSwitchingNetwork(true)
    
    try {
      // First try wagmi's switchChain (might work if BSC is already added)
      if (switchChain) {
        try {
          await switchChain({ chainId: bsc.id })
          console.log('Successfully switched via wagmi')
          return
        } catch (wagmiError) {
          console.log('Wagmi switch failed, trying manual approach:', wagmiError)
        }
      }

      // Try manual switch first
      try {
        await switchToBSCManual()
        console.log('Successfully switched via manual method')
      } catch (switchError: any) {
        console.log('Manual switch failed:', switchError)
        
        // If network doesn't exist (error 4902), add it
        if (switchError.code === 4902) {
          console.log('Network not found, adding BSC network...')
          await addBSCNetwork()
          console.log('BSC network added successfully')
          
          // Try switching again after adding
          await switchToBSCManual()
          console.log('Successfully switched after adding network')
        } else {
          throw switchError
        }
      }
    } catch (error: any) {
      console.error('Failed to switch to BSC:', error)
      alert(`Failed to switch to BSC: ${error.message || 'Unknown error'}`)
    } finally {
      setIsSwitchingNetwork(false)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2 text-yellow-400">
            🔗 Connect Your Wallet
          </h3>
          <p className="text-gray-400 mb-4">
            Connect MetaMask to start trading on BSC
          </p>
        </div>
        
        <Button
          onClick={handleConnect}
          disabled={isPending}
          className="w-full justify-center"
        >
          {isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <span>🦊</span>
              <span>Connect MetaMask</span>
            </>
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          <p>Make sure you have MetaMask installed</p>
          <p>You'll need to switch to BSC after connecting</p>
        </div>
      </div>
    )
  }

  if (isWrongNetwork) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2 text-red-400">
            ⚠️ Wrong Network Detected
          </h3>
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-gray-300 text-sm mb-1">
              <span className="text-red-400">Current:</span> {chain?.name || 'Unknown'} (ID: {chain?.id || 'Unknown'})
            </p>
            <p className="text-gray-300 text-sm">
              <span className="text-green-400">Required:</span> Binance Smart Chain (ID: 56)
            </p>
          </div>
          <p className="text-gray-400 text-sm">
            Click below to switch to BSC
          </p>
        </div>
        
        <div className="flex flex-col space-y-3 w-full">
          <Button
            onClick={handleSwitchToBSC}
            disabled={isSwitchingNetwork}
            className="justify-center"
          >
            {isSwitchingNetwork ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Switching to BSC...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Switch to Binance Smart Chain</span>
              </>
            )}
          </Button>
          
          <Button variant="secondary" size="sm" onClick={() => disconnect()} className="justify-center">
            Disconnect Wallet
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center mt-2">
          <p>BSC network will be added to MetaMask if not present</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2 text-green-400">
          ✅ Connected to BSC
        </h3>
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
          <div className="space-y-1">
            <p className="text-gray-300 text-sm">
              <span className="text-gray-400">Address:</span>{' '}
              <span className="font-mono text-green-400">
                {formatAddress(address || '')}
              </span>
            </p>
            <p className="text-gray-300 text-sm">
              <span className="text-gray-400">Network:</span>{' '}
              <span className="text-green-400 font-medium">{chain?.name}</span>
            </p>
            <p className="text-gray-300 text-sm">
              <span className="text-gray-400">Chain ID:</span>{' '}
              <span className="text-green-400 font-mono">{chain?.id}</span>
            </p>
          </div>
        </div>
      </div>
      
      <Button variant="secondary" size="sm" onClick={() => disconnect()} className="justify-center">
        Disconnect
      </Button>
    </div>
  )
} 