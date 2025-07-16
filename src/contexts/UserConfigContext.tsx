import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { 
  getUserConfig, 
  saveUserConfig, 
  clearUserConfig, 
  validateConfig, 
  getServiceStatus, 
  isConfigured, 
  getMissingServices,
  type UserConfig,
  type ConfigValidation,
  type ServiceStatus
} from '../lib/userConfig'

interface UserConfigContextType {
  config: UserConfig
  updateConfig: (newConfig: UserConfig) => void
  resetConfig: () => void
  validation: ConfigValidation
  serviceStatus: ServiceStatus
  isSetupComplete: boolean
  missingServices: string[]
  isLoading: boolean
}

const UserConfigContext = createContext<UserConfigContextType | undefined>(undefined)

interface UserConfigProviderProps {
  children: ReactNode
}

export function UserConfigProvider({ children }: UserConfigProviderProps) {
  const [config, setConfig] = useState<UserConfig>(() => getUserConfig())
  const [isLoading, setIsLoading] = useState(true)

  // Derived state
  const validation = validateConfig(config)
  const serviceStatus = getServiceStatus(config)
  const isSetupComplete = isConfigured(config)
  const missingServices = getMissingServices(config)

  // Initialize configuration on mount
  useEffect(() => {
    try {
      const initialConfig = getUserConfig()
      setConfig(initialConfig)
      console.log('✅ User configuration loaded:', {
        hasSupabase: !!initialConfig.supabase.url,
        hasOpenAI: !!initialConfig.ai.openaiApiKey,
        hasSupra: !!initialConfig.supra.apiKey,
        hasCustomRPC: initialConfig.bsc.rpcUrl !== 'https://bsc-dataseed1.binance.org/',
      })
    } catch (error) {
      console.error('❌ Failed to load user configuration:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateConfig = (newConfig: UserConfig) => {
    try {
      setConfig(newConfig)
      saveUserConfig(newConfig)
      console.log('✅ Configuration updated successfully')
    } catch (error) {
      console.error('❌ Failed to update configuration:', error)
      throw error
    }
  }

  const resetConfig = () => {
    try {
      clearUserConfig()
      const defaultConfig = getUserConfig()
      setConfig(defaultConfig)
      console.log('✅ Configuration reset to defaults')
    } catch (error) {
      console.error('❌ Failed to reset configuration:', error)
      throw error
    }
  }

  const contextValue: UserConfigContextType = {
    config,
    updateConfig,
    resetConfig,
    validation,
    serviceStatus,
    isSetupComplete,
    missingServices,
    isLoading,
  }

  return (
    <UserConfigContext.Provider value={contextValue}>
      {children}
    </UserConfigContext.Provider>
  )
}

export function useUserConfig(): UserConfigContextType {
  const context = useContext(UserConfigContext)
  if (context === undefined) {
    throw new Error('useUserConfig must be used within a UserConfigProvider')
  }
  return context
}

// Custom hook for checking if a specific service is configured
export function useServiceStatus() {
  const { serviceStatus } = useUserConfig()
  
  return {
    isSupabaseConfigured: serviceStatus.supabase,
    isOpenAIConfigured: serviceStatus.openai,
    isSupraConfigured: serviceStatus.supra,
    isBSCConfigured: serviceStatus.bsc,
    isAnyServiceConfigured: Object.values(serviceStatus).some(Boolean),
    areAllServicesConfigured: Object.values(serviceStatus).every(Boolean),
  }
}

// Custom hook for configuration validation
export function useConfigValidation() {
  const { validation } = useUserConfig()
  
  return {
    isValid: validation.isValid,
    hasErrors: validation.errors.length > 0,
    hasWarnings: validation.warnings.length > 0,
    errors: validation.errors,
    warnings: validation.warnings,
    errorCount: validation.errors.length,
    warningCount: validation.warnings.length,
  }
} 