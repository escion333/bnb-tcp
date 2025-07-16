export interface UserConfig {
  supabase: {
    url: string
    anonKey: string
  }
  ai: {
    openaiApiKey: string
  }
  supra: {
    apiKey: string
  }
  bsc: {
    rpcUrl: string
  }
}

export interface ConfigValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ServiceStatus {
  supabase: boolean
  openai: boolean
  supra: boolean
  bsc: boolean
}

const CONFIG_STORAGE_KEY = 'defi-copilot-config'
const CONFIG_VERSION = '1.0'

// Default configuration with fallbacks
const DEFAULT_CONFIG: UserConfig = {
  supabase: {
    url: '',
    anonKey: '',
  },
  ai: {
    openaiApiKey: '',
  },
  supra: {
    apiKey: '',
  },
  bsc: {
    rpcUrl: 'https://bsc-dataseed1.binance.org/',
  },
}

/**
 * Get user configuration from localStorage with fallback to environment variables
 */
export function getUserConfig(): UserConfig {
  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.version === CONFIG_VERSION) {
        // Merge with defaults to handle new config fields
        return {
          ...DEFAULT_CONFIG,
          ...parsed.config,
        }
      }
    }
  } catch (error) {
    console.warn('Failed to load user config from localStorage:', error)
  }

  // Fallback to environment variables (will be empty in deployed version)
  return {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || DEFAULT_CONFIG.supabase.url,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_CONFIG.supabase.anonKey,
    },
    ai: {
      openaiApiKey: import.meta.env.VITE_OPENAI_API_KEY || DEFAULT_CONFIG.ai.openaiApiKey,
    },
    supra: {
      apiKey: import.meta.env.VITE_SUPRA_API_KEY || DEFAULT_CONFIG.supra.apiKey,
    },
    bsc: {
      rpcUrl: import.meta.env.VITE_BSC_RPC_URL || DEFAULT_CONFIG.bsc.rpcUrl,
    },
  }
}

/**
 * Save user configuration to localStorage
 */
export function saveUserConfig(config: UserConfig): void {
  try {
    const configData = {
      version: CONFIG_VERSION,
      config,
      savedAt: new Date().toISOString(),
    }
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configData))
    console.log('✅ User configuration saved to localStorage')
  } catch (error) {
    console.error('❌ Failed to save user config:', error)
    throw new Error('Failed to save configuration. Please try again.')
  }
}

/**
 * Clear user configuration from localStorage
 */
export function clearUserConfig(): void {
  try {
    localStorage.removeItem(CONFIG_STORAGE_KEY)
    console.log('✅ User configuration cleared')
  } catch (error) {
    console.error('❌ Failed to clear user config:', error)
  }
}

/**
 * Validate user configuration
 */
export function validateConfig(config: UserConfig): ConfigValidation {
  const errors: string[] = []
  const warnings: string[] = []

  // Supabase validation
  if (!config.supabase.url) {
    errors.push('Supabase URL is required for trade history and data persistence')
  } else if (!config.supabase.url.includes('supabase.co')) {
    warnings.push('Supabase URL should be from supabase.co domain')
  }

  if (!config.supabase.anonKey) {
    errors.push('Supabase anonymous key is required')
  } else if (!config.supabase.anonKey.startsWith('eyJ')) {
    warnings.push('Supabase anonymous key should start with "eyJ"')
  }

  // OpenAI validation
  if (!config.ai.openaiApiKey) {
    warnings.push('OpenAI API key is required for AI trade ideas generation')
  } else if (!config.ai.openaiApiKey.startsWith('sk-')) {
    warnings.push('OpenAI API key should start with "sk-"')
  }

  // Supra validation
  if (!config.supra.apiKey) {
    warnings.push('Supra API key is required for real-time price feeds and automation')
  }

  // BSC RPC validation
  if (!config.bsc.rpcUrl) {
    errors.push('BSC RPC URL is required')
  } else if (!config.bsc.rpcUrl.startsWith('http')) {
    errors.push('BSC RPC URL must be a valid HTTP(S) URL')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Get service status based on configuration
 */
export function getServiceStatus(config: UserConfig): ServiceStatus {
  return {
    supabase: !!(config.supabase.url && config.supabase.anonKey),
    openai: !!config.ai.openaiApiKey,
    supra: !!config.supra.apiKey,
    bsc: !!config.bsc.rpcUrl,
  }
}

/**
 * Check if user has completed initial setup
 */
export function isConfigured(config: UserConfig): boolean {
  const status = getServiceStatus(config)
  // Core services required for basic functionality
  return status.supabase && status.bsc
}

/**
 * Get missing services for user guidance
 */
export function getMissingServices(config: UserConfig): string[] {
  const status = getServiceStatus(config)
  const missing: string[] = []

  if (!status.supabase) missing.push('Supabase (Database)')
  if (!status.openai) missing.push('OpenAI (AI Trade Ideas)')
  if (!status.supra) missing.push('Supra (Price Data & Automation)')
  if (!status.bsc) missing.push('BSC RPC (Blockchain Connection)')

  return missing
}

/**
 * Export configuration for backup
 */
export function exportConfig(config: UserConfig): string {
  const exportData = {
    version: CONFIG_VERSION,
    config,
    exportedAt: new Date().toISOString(),
    appName: 'DeFi Trading Co-Pilot',
  }
  return JSON.stringify(exportData, null, 2)
}

/**
 * Import configuration from backup
 */
export function importConfig(configJson: string): UserConfig {
  try {
    const importData = JSON.parse(configJson)
    
    if (!importData.config) {
      throw new Error('Invalid configuration format')
    }

    // Validate imported config structure
    const validation = validateConfig(importData.config)
    if (!validation.isValid) {
      console.warn('Imported config has validation errors:', validation.errors)
    }

    return importData.config
  } catch (error) {
    throw new Error('Failed to import configuration: Invalid JSON format')
  }
}

/**
 * Get setup instructions for each service
 */
export function getSetupInstructions() {
  return {
    supabase: {
      title: 'Supabase Database',
      description: 'Required for trade history and data persistence',
      steps: [
        '1. Go to https://supabase.com and create a free account',
        '2. Create a new project',
        '3. Go to Settings → API',
        '4. Copy your Project URL and anon/public key',
      ],
      url: 'https://supabase.com/dashboard',
    },
    openai: {
      title: 'OpenAI API',
      description: 'Required for AI-powered trade idea generation',
      steps: [
        '1. Go to https://platform.openai.com',
        '2. Create an account or sign in',
        '3. Go to API Keys section',
        '4. Create a new API key',
        '5. Copy the key (starts with sk-)',
      ],
      url: 'https://platform.openai.com/api-keys',
    },
    supra: {
      title: 'Supra Oracle & Automation',
      description: 'Required for real-time price feeds and automated trading',
      steps: [
        '1. Go to https://supra.com',
        '2. Create a developer account',
        '3. Access the API section',
        '4. Generate an API key for Oracle and Automation services',
      ],
      url: 'https://supra.com',
    },
    bsc: {
      title: 'BSC RPC Provider',
      description: 'Blockchain connection for trade execution',
      steps: [
        'Default: https://bsc-dataseed1.binance.org/ (free)',
        'For better performance, consider:',
        '• Alchemy: https://alchemy.com',
        '• Infura: https://infura.io',
        '• QuickNode: https://quicknode.com',
      ],
      url: 'https://docs.bnbchain.org/docs/rpc',
    },
  }
} 