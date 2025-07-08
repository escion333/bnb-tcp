// Test script for Supra Oracle integration
import { supraOracle } from '../lib/supra'

async function testSupraOracle() {
  console.log('🔮 Testing Supra Oracle DORA V2 Integration...')
  console.log('=====================================')
  
  try {
    // Test health check first
    console.log('1. Health Check...')
    const health = await supraOracle.healthCheck()
    console.log(`   Status: ${health.status}`)
    console.log(`   Message: ${health.message}`)
    
    if (health.status === 'error') {
      console.error('❌ Health check failed. Stopping test.')
      return
    }
    
    console.log('✅ Health check passed!')
    console.log('')
    
    // Test price fetching
    console.log('2. Fetching BNB/USDT Price (Pair ID: 49)...')
    const priceData = await supraOracle.getCurrentPrice()
    
    console.log('✅ Price data received!')
    console.log(`   Price: $${priceData.price.toFixed(6)}`)
    console.log(`   24h Change: ${priceData.change24h >= 0 ? '+' : ''}${priceData.change24h.toFixed(4)} (${priceData.changePercent24h.toFixed(2)}%)`)
    console.log(`   24h High: $${priceData.high24h.toFixed(6)}`)
    console.log(`   24h Low: $${priceData.low24h.toFixed(6)}`)
    console.log(`   Last Update: ${priceData.lastUpdate.toISOString()}`)
    console.log(`   Source: ${priceData.source}`)
    
    if (priceData.rawData) {
      console.log(`   Raw Data:`)
      console.log(`     Raw Data:`, priceData.rawData)
      console.log(`     Timestamp: ${priceData.rawData.timestamp}`)
    }
    
    console.log('')
    console.log('🎉 Supra Oracle integration test successful!')
    console.log('Ready for production use!')
    
  } catch (error) {
    console.error('❌ Supra Oracle test failed:')
    console.error(error)
    console.error('')
    console.error('Troubleshooting:')
    console.error('1. Check network connection')
    console.error('2. Verify Supra mainnet endpoint is accessible')
    console.error('3. Ensure BNB_USDT pair (49) is available')
  }
}

// Run test if called directly
if (typeof window === 'undefined') {
  testSupraOracle()
}

export { testSupraOracle } 