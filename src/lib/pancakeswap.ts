/**
 * PancakeSwap Integration with BNB/WBNB Handling
 * 
 * IMPORTANT: This file properly handles the distinction between:
 * - Native BNB: The gas token of BSC (address: 0x0000...)
 * - WBNB: Wrapped BNB ERC-20 token (address: 0xbb4C...)
 * 
 * Strategy:
 * 1. For UI display: Show honest token names (WBNB, USDT) - no confusion
 * 2. For trading: Use WBNB to access main liquidity pools (highest volume/TVL)
 * 3. For routing: PancakeSwap paths use WBNB addresses for best liquidity
 * 4. For simplicity: Direct WBNB trading without BNB wrapping complexity
 * 
 * Router Functions Used:
 * - swapExactETHForTokens: Native BNB -> Tokens
 * - swapExactTokensForETH: Tokens -> Native BNB  
 * - swapExactTokensForTokens: WBNB <-> Tokens, Token <-> Token
 */

import { 
  parseUnits, 
  formatUnits, 
  erc20Abi,
  parseEther,
  formatEther
} from 'viem'
import type { Address } from 'viem'
import { writeContract, readContract, simulateContract } from '@wagmi/core'
import { config } from './wagmi'

// PancakeSwap Router V2 Contract Address (BSC Mainnet)
export const PANCAKESWAP_ROUTER_ADDRESS: Address = '0x10ED43C718714eb63d5aA57B78B54704E256024E'

// Token Addresses (BSC Mainnet)
export const TOKENS = {
  WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as Address,
  USDT: '0x55d398326f99059fF775485246999027B3197955' as Address,
  CAKE: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82' as Address,
  // Native BNB - represented as zero address for swap routing
  NATIVE_BNB: '0x0000000000000000000000000000000000000000' as Address,
} as const

// Pool Addresses
export const POOLS = {
  WBNB_USDT: '0x36696169C63e42cd08ce11f5deeBbCeBae652050' as Address,
} as const

// PancakeSwap Router V2 ABI (minimal interface for swapping)
export const PANCAKESWAP_ROUTER_ABI = [
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactTokensForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactTokensForTokensSupportingFeeOnTransferTokens',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactETHForTokens',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    name: 'swapExactTokensForETH',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' }
    ],
    name: 'getAmountsOut',
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'WETH',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export interface SwapParams {
  tokenIn: Address
  tokenOut: Address
  amountIn: string // Amount in token units (e.g., "1.5" for 1.5 BNB)
  slippageTolerance: number // Percentage (e.g., 0.5 for 0.5%)
  recipient: Address
  deadline?: number // Unix timestamp, defaults to 20 minutes from now
  useNativeBNB?: boolean // If true, use native BNB instead of WBNB
}

export interface SwapQuote {
  amountOut: string
  amountOutMin: string
  priceImpact: number
  route: Address[]
  gasEstimate?: bigint
}

export interface TradeExecution {
  tokenIn: Address
  tokenOut: Address
  amountIn: string
  expectedAmountOut: string
  slippageTolerance: number
  recipient: Address
}

/**
 * Check if a token needs approval for the PancakeSwap Router
 */
export async function checkTokenApproval(
  tokenAddress: Address,
  ownerAddress: Address,
  amountNeeded: string
): Promise<{ needsApproval: boolean; currentAllowance: string }> {
  try {
    // Native BNB doesn't need approval
    if (tokenAddress === TOKENS.NATIVE_BNB) {
      return {
        needsApproval: false,
        currentAllowance: 'unlimited' // Native BNB doesn't have allowance concept
      }
    }

    const allowance = await readContract(config, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [ownerAddress, PANCAKESWAP_ROUTER_ADDRESS]
    })

    const decimals = await readContract(config, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals'
    })

    const amountNeededWei = parseUnits(amountNeeded, decimals)
    const needsApproval = allowance < amountNeededWei

    return {
      needsApproval,
      currentAllowance: formatUnits(allowance, decimals)
    }
  } catch (error) {
    console.error('Error checking token approval:', error)
    throw new Error('Failed to check token approval')
  }
}

/**
 * Approve token spending for PancakeSwap Router
 */
export async function approveToken(
  tokenAddress: Address,
  amount: string
): Promise<Address> {
  try {
    const decimals = await readContract(config, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals'
    })

    const amountWei = parseUnits(amount, decimals)

    const hash = await writeContract(config, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [PANCAKESWAP_ROUTER_ADDRESS, amountWei],
      gas: 50000n // Fixed gas limit for approvals
    })

    return hash
  } catch (error) {
    console.error('Error approving token:', error)
    throw new Error('Failed to approve token')
  }
}

/**
 * Get a quote for a token swap
 */
export async function getSwapQuote(params: SwapParams): Promise<SwapQuote> {
  try {
    const { tokenIn, tokenOut, amountIn, slippageTolerance, useNativeBNB } = params

    // Build the swap path (converts native BNB to WBNB internally)
    const route = buildSwapPath(tokenIn, tokenOut, useNativeBNB)

    // Determine if we're using native BNB
    const isNativeBNBIn = tokenIn === TOKENS.NATIVE_BNB || (tokenIn === TOKENS.WBNB && useNativeBNB !== false)
    const isNativeBNBOut = tokenOut === TOKENS.NATIVE_BNB || (tokenOut === TOKENS.WBNB && useNativeBNB !== false)

    // Get token decimals (use 18 for native BNB)
    let tokenInDecimals: number
    let tokenOutDecimals: number
    
    if (isNativeBNBIn) {
      tokenInDecimals = 18
    } else {
      tokenInDecimals = await readContract(config, {
        address: tokenIn,
        abi: erc20Abi,
        functionName: 'decimals'
      })
    }
    
    if (isNativeBNBOut) {
      tokenOutDecimals = 18
    } else {
      tokenOutDecimals = await readContract(config, {
        address: tokenOut,
        abi: erc20Abi,
        functionName: 'decimals'
      })
    }

    const amountInWei = parseUnits(amountIn, tokenInDecimals)

    // Get amounts out from PancakeSwap
    const amounts = await readContract(config, {
      address: PANCAKESWAP_ROUTER_ADDRESS,
      abi: PANCAKESWAP_ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [amountInWei, route]
    })

    const amountOut = amounts[amounts.length - 1]
    const amountOutFormatted = formatUnits(amountOut, tokenOutDecimals)

    // Calculate minimum amount out with slippage
    const slippageMultiplier = (100 - slippageTolerance) / 100
    const amountOutMin = BigInt(Math.floor(Number(amountOut) * slippageMultiplier))
    const amountOutMinFormatted = formatUnits(amountOutMin, tokenOutDecimals)

    // Simple price impact calculation (this is a basic implementation)
    const priceImpact = 0.1 // Placeholder - in a real implementation, you'd calculate this properly

    return {
      amountOut: amountOutFormatted,
      amountOutMin: amountOutMinFormatted,
      priceImpact,
      route
    }
  } catch (error) {
    console.error('Error getting swap quote:', error)
    throw new Error('Failed to get swap quote')
  }
}

/**
 * Execute a token swap
 */
export async function executeSwap(params: SwapParams): Promise<Address> {
  try {
    const { tokenIn, tokenOut, amountIn, slippageTolerance, recipient, deadline, useNativeBNB } = params

    // Get quote first
    const quote = await getSwapQuote(params)
    
    // Build the swap path (converts native BNB to WBNB internally)
    const route = buildSwapPath(tokenIn, tokenOut, useNativeBNB)
    
    // Determine if we're using native BNB
    const isNativeBNBIn = tokenIn === TOKENS.NATIVE_BNB || (tokenIn === TOKENS.WBNB && useNativeBNB !== false)
    const isNativeBNBOut = tokenOut === TOKENS.NATIVE_BNB || (tokenOut === TOKENS.WBNB && useNativeBNB !== false)
    
    // Get token decimals (use 18 for native BNB)
    let tokenInDecimals: number
    let tokenOutDecimals: number
    
    if (isNativeBNBIn) {
      tokenInDecimals = 18
    } else {
      tokenInDecimals = await readContract(config, {
        address: tokenIn,
        abi: erc20Abi,
        functionName: 'decimals'
      })
    }
    
    if (isNativeBNBOut) {
      tokenOutDecimals = 18
    } else {
      tokenOutDecimals = await readContract(config, {
        address: tokenOut,
        abi: erc20Abi,
        functionName: 'decimals'
      })
    }

    const amountInWei = parseUnits(amountIn, tokenInDecimals)
    const amountOutMinWei = parseUnits(quote.amountOutMin, tokenOutDecimals)
    
    // Default deadline: 20 minutes from now
    const swapDeadline = deadline || Math.floor(Date.now() / 1000) + 1200

    // Choose the appropriate swap function based on native BNB usage
    let hash: Address

    if (isNativeBNBIn && !isNativeBNBOut) {
      // Swapping native BNB for tokens
      hash = await writeContract(config, {
        address: PANCAKESWAP_ROUTER_ADDRESS,
        abi: PANCAKESWAP_ROUTER_ABI,
        functionName: 'swapExactETHForTokens',
        args: [amountOutMinWei, route, recipient, BigInt(swapDeadline)],
        value: amountInWei,
        gas: 180000n // Fixed gas limit for BNB swaps
      })
    } else if (!isNativeBNBIn && isNativeBNBOut) {
      // Swapping tokens for native BNB
      hash = await writeContract(config, {
        address: PANCAKESWAP_ROUTER_ADDRESS,
        abi: PANCAKESWAP_ROUTER_ABI,
        functionName: 'swapExactTokensForETH',
        args: [amountInWei, amountOutMinWei, route, recipient, BigInt(swapDeadline)],
        gas: 180000n // Fixed gas limit for token swaps
      })
    } else {
      // Swapping tokens for tokens (including WBNB <-> tokens)
      hash = await writeContract(config, {
        address: PANCAKESWAP_ROUTER_ADDRESS,
        abi: PANCAKESWAP_ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [amountInWei, amountOutMinWei, route, recipient, BigInt(swapDeadline)],
        gas: 200000n // Fixed gas limit for token-to-token swaps
      })
    }

    return hash
  } catch (error) {
    console.error('Error executing swap:', error)
    throw new Error('Failed to execute swap')
  }
}

/**
 * Check if we should use native BNB for this swap
 */
function shouldUseNativeBNB(tokenIn: Address, tokenOut: Address, useNativeBNB?: boolean): boolean {
  if (useNativeBNB === false) return false
  return tokenIn === TOKENS.NATIVE_BNB || tokenOut === TOKENS.NATIVE_BNB || 
         tokenIn === TOKENS.WBNB || tokenOut === TOKENS.WBNB
}

/**
 * Convert token address for swap path (NATIVE_BNB -> WBNB for routing)
 */
function getSwapTokenAddress(tokenAddress: Address): Address {
  return tokenAddress === TOKENS.NATIVE_BNB ? TOKENS.WBNB : tokenAddress
}

/**
 * Build optimal swap path between two tokens
 */
function buildSwapPath(tokenIn: Address, tokenOut: Address, useNativeBNB?: boolean): Address[] {
  // Convert native BNB to WBNB for path building
  const swapTokenIn = getSwapTokenAddress(tokenIn)
  const swapTokenOut = getSwapTokenAddress(tokenOut)
  
  // Direct pair exists
  if (
    (swapTokenIn === TOKENS.WBNB && swapTokenOut === TOKENS.USDT) ||
    (swapTokenIn === TOKENS.USDT && swapTokenOut === TOKENS.WBNB)
  ) {
    return [swapTokenIn, swapTokenOut]
  }

  // Route through WBNB (most common base pair)
  if (swapTokenIn !== TOKENS.WBNB && swapTokenOut !== TOKENS.WBNB) {
    return [swapTokenIn, TOKENS.WBNB, swapTokenOut]
  }

  // Direct pair with WBNB
  return [swapTokenIn, swapTokenOut]
}

/**
 * Get token balance for an address
 * Handles both native BNB and ERC-20 tokens (including WBNB)
 */
export async function getTokenBalance(
  tokenAddress: Address,
  userAddress: Address
): Promise<string> {
  try {
    if (tokenAddress === TOKENS.NATIVE_BNB) {
      // Get native BNB balance using wagmi's getBalance
      const { getBalance } = await import('@wagmi/core')
      const balance = await getBalance(config, { address: userAddress })
      return formatUnits(balance.value, 18) // BNB has 18 decimals
    }

    // For ERC-20 tokens (including WBNB)
    const balance = await readContract(config, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [userAddress]
    })

    const decimals = await readContract(config, {
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'decimals'
    })

    return formatUnits(balance, decimals)
  } catch (error) {
    console.error('Error getting token balance:', error)
    return '0'
  }
}

/**
 * Get token information
 */
export async function getTokenInfo(tokenAddress: Address) {
  try {
    const [symbol, name, decimals] = await Promise.all([
      readContract(config, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'symbol'
      }),
      readContract(config, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'name'
      }),
      readContract(config, {
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals'
      })
    ])

    return { symbol, name, decimals }
  } catch (error) {
    console.error('Error getting token info:', error)
    throw new Error('Failed to get token information')
  }
}

/**
 * Calculate slippage-adjusted minimum amount
 */
export function calculateMinimumAmount(
  amount: string,
  slippagePercent: number,
  decimals: number
): bigint {
  const amountWei = parseUnits(amount, decimals)
  const slippageMultiplier = (100 - slippagePercent) / 100
  return BigInt(Math.floor(Number(amountWei) * slippageMultiplier))
}

/**
 * Utility to format token amounts for display
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  displayDecimals: number = 4
): string {
  const formatted = formatUnits(amount, decimals)
  const num = parseFloat(formatted)
  return num.toFixed(displayDecimals)
}

/**
 * Get display name for token (shows actual token names)
 */
export function getTokenDisplayName(tokenAddress: Address): string {
  switch (tokenAddress) {
    case TOKENS.NATIVE_BNB:
      return 'BNB'
    case TOKENS.WBNB:
      return 'WBNB'
    case TOKENS.USDT:
      return 'USDT'
    case TOKENS.CAKE:
      return 'CAKE'
    default:
      return 'Unknown Token'
  }
}

/**
 * Get the appropriate token address for balance checking
 * For trading, we often want to check native BNB balance even when using WBNB
 */
export function getBalanceTokenAddress(tokenAddress: Address, preferNative: boolean = true): Address {
  if (tokenAddress === TOKENS.WBNB && preferNative) {
    return TOKENS.NATIVE_BNB
  }
  return tokenAddress
}

/**
 * Check if a token address represents BNB (either native or wrapped)
 */
export function isBNBToken(tokenAddress: Address): boolean {
  return tokenAddress === TOKENS.NATIVE_BNB || tokenAddress === TOKENS.WBNB
}

/**
 * Get the best token address for trading (prefers WBNB for main liquidity access)
 */
export function getTradingTokenAddress(tokenAddress: Address, preferWBNB: boolean = true): Address {
  if (tokenAddress === TOKENS.NATIVE_BNB && preferWBNB) {
    return TOKENS.WBNB
  }
  if (tokenAddress === TOKENS.WBNB && !preferWBNB) {
    return TOKENS.NATIVE_BNB
  }
  return tokenAddress
}

// Export common token pairs for easy access
export const COMMON_PAIRS = {
  WBNB_USDT: {
    tokenA: TOKENS.WBNB,
    tokenB: TOKENS.USDT,
    pool: POOLS.WBNB_USDT,
    displayName: 'WBNB/USDT' // Show honest token names
  }
} as const 