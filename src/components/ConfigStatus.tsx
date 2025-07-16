import { useState } from 'react'
import { Settings, AlertCircle, CheckCircle2, AlertTriangle, Zap } from 'lucide-react'
import { Button } from './ui/button'
import { useUserConfig, useServiceStatus } from '../contexts/UserConfigContext'
import { ConfigurationModal } from './ConfigurationModal'

export function ConfigStatus() {
  const { isSetupComplete, missingServices } = useUserConfig()
  const {
    isSupabaseConfigured,
    isOpenAIConfigured,
    isSupraConfigured,
    isBSCConfigured,
    areAllServicesConfigured,
  } = useServiceStatus()
  
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

  // If everything is configured, show minimal status
  if (areAllServicesConfigured) {
    return (
      <>
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">All services configured</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsConfigModalOpen(true)}
            className="h-6 w-6 p-0 ml-1"
          >
            <Settings className="h-3 w-3" />
          </Button>
        </div>
        <ConfigurationModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
        />
      </>
    )
  }

  // If basic setup is incomplete, show prominent setup prompt
  if (!isSetupComplete) {
    return (
      <>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-400">Setup Required</h3>
                <p className="text-sm text-red-300">
                  Configure your API keys to start using the app
                </p>
                {missingServices.length > 0 && (
                  <p className="text-xs text-red-400 mt-1">
                    Missing: {missingServices.join(', ')}
                  </p>
                )}
              </div>
            </div>
            <Button
              onClick={() => setIsConfigModalOpen(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Now
            </Button>
          </div>
        </div>
        <ConfigurationModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
        />
      </>
    )
  }

  // If basic setup is done but some services are missing, show compact status
  return (
    <>
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-yellow-400">Partial Configuration</h4>
              <div className="flex items-center gap-3 text-sm">
                <ServiceIndicator label="DB" isConfigured={isSupabaseConfigured} />
                <ServiceIndicator label="AI" isConfigured={isOpenAIConfigured} />
                <ServiceIndicator label="Oracle" isConfigured={isSupraConfigured} />
                <ServiceIndicator label="RPC" isConfigured={isBSCConfigured} />
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConfigModalOpen(true)}
          >
            <Settings className="h-3 w-3 mr-1" />
            Setup
          </Button>
        </div>
      </div>
      <ConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </>
  )
}

interface ServiceIndicatorProps {
  label: string
  isConfigured: boolean
}

function ServiceIndicator({ label, isConfigured }: ServiceIndicatorProps) {
  return (
    <div className="flex items-center gap-1">
      {isConfigured ? (
        <CheckCircle2 className="h-3 w-3 text-green-500" />
      ) : (
        <AlertCircle className="h-3 w-3 text-red-500" />
      )}
      <span className={`text-xs ${isConfigured ? 'text-green-400' : 'text-red-400'}`}>
        {label}
      </span>
    </div>
  )
}

// Compact version for header/toolbar use
export function ConfigStatusCompact() {
  const { areAllServicesConfigured } = useServiceStatus()
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsConfigModalOpen(true)}
        className={`h-8 ${
          areAllServicesConfigured 
            ? 'text-green-400 hover:text-green-300' 
            : 'text-yellow-400 hover:text-yellow-300'
        }`}
      >
        <Settings className="h-4 w-4 mr-1" />
        {areAllServicesConfigured ? 'Settings' : 'Setup'}
      </Button>
      <ConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </>
  )
}

// Feature-specific status indicators
export function FeatureStatus({ feature }: { feature: 'ai' | 'trading' | 'data' }) {
  const {
    isSupabaseConfigured,
    isOpenAIConfigured,
    isSupraConfigured,
    isBSCConfigured,
  } = useServiceStatus()
  
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

  const getFeatureStatus = () => {
    switch (feature) {
      case 'ai':
        return {
          isReady: isOpenAIConfigured,
          name: 'AI Trade Ideas',
          description: 'OpenAI API required',
        }
      case 'trading':
        return {
          isReady: isBSCConfigured,
          name: 'Trade Execution',
          description: 'BSC RPC required',
        }
      case 'data':
        return {
          isReady: isSupabaseConfigured && isSupraConfigured,
          name: 'Data & Analytics',
          description: 'Supabase + Supra required',
        }
      default:
        return { isReady: false, name: 'Unknown', description: '' }
    }
  }

  const status = getFeatureStatus()

  if (status.isReady) {
    return (
      <div className="flex items-center gap-2 text-green-400">
        <Zap className="h-3 w-3" />
        <span className="text-xs">Ready</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <AlertCircle className="h-3 w-3 text-yellow-500" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsConfigModalOpen(true)}
          className="text-xs text-yellow-400 hover:text-yellow-300 h-auto p-0"
        >
          Setup {status.name}
        </Button>
      </div>
      <ConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </>
  )
} 