import { useState, useEffect } from 'react'
import { Settings, Eye, EyeOff, AlertTriangle, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'

import { useUserConfig } from '../contexts/UserConfigContext'
import { validateConfig, type UserConfig } from '../lib/userConfig'

interface ConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ConfigurationModal({ isOpen, onClose }: ConfigurationModalProps) {
  const { config, updateConfig, resetConfig, serviceStatus } = useUserConfig()
  const [formData, setFormData] = useState<UserConfig>(config)
  
  // Sync form data with config when it changes (e.g., after reset)
  useEffect(() => {
    setFormData(config)
  }, [config])
  
  // Validate the current form data, not the saved config
  const validation = validateConfig(formData)
  const [showPasswords, setShowPasswords] = useState({
    openaiKey: false,
    supraKey: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)


  const handleInputChange = (field: keyof UserConfig, subfield: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [subfield]: value,
      },
    }))
    setSaveError(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveError(null)
    
    try {
      console.log('🔧 Starting configuration save...')
      console.log('🔧 Form data:', {
        hasOpenAIKey: !!formData.ai.openaiApiKey,
        hasSupraKey: !!formData.supra.apiKey,
        bscRpcUrl: formData.bsc.rpcUrl
      })
      
      // Check validation state
      const currentValidation = validation
      console.log('🔧 Validation state:', {
        isValid: currentValidation.isValid,
        errors: currentValidation.errors,
        warnings: currentValidation.warnings
      })
      
      // Check localStorage availability
      try {
        localStorage.setItem('test-key', 'test-value')
        localStorage.removeItem('test-key')
        console.log('🔧 localStorage is available')
      } catch (localStorageError) {
        console.error('🔧 localStorage test failed:', localStorageError)
        throw new Error('localStorage is not available in this environment')
      }
      
      // Validate required fields manually
      if (!formData.bsc.rpcUrl) {
        throw new Error('BSC RPC URL is required')
      }
      
      console.log('🔧 All validations passed, attempting to save...')
      updateConfig(formData)
      console.log('🔧 Configuration saved successfully!')
      onClose()
    } catch (error) {
      console.error('🔧 Configuration save failed:', error)
      setSaveError(error instanceof Error ? error.message : 'Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all configuration? This will clear all your API keys.')) {
      resetConfig()
      // The useEffect will automatically sync formData with the reset config
      onClose()
    }
  }



  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }))
  }



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configuration Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">



            {/* OpenAI Configuration */}
            <div className="space-y-4 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">OpenAI API</h3>
                <a
                  href="https://platform.openai.com/docs/overview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Get API Key
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-sm text-gray-400">Required for AI-powered trade idea generation</p>
              
              <div>
                <Label htmlFor="openai-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="openai-key"
                    type={showPasswords.openaiKey ? 'text' : 'password'}
                    placeholder="sk-proj-..."
                    value={formData.ai.openaiApiKey}
                    onChange={(e) => handleInputChange('ai', 'openaiApiKey', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => togglePasswordVisibility('openaiKey')}
                  >
                    {showPasswords.openaiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Supra Configuration */}
            <div className="space-y-4 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Supra Automation</h3>
                <a
                  href="https://supra.com/developers/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  Get API Key
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-sm text-gray-400">
                Required for automated stop-loss and take-profit orders.
              </p>
              
              <div>
                <Label htmlFor="supra-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="supra-key"
                    type={showPasswords.supraKey ? 'text' : 'password'}
                    placeholder="Your Supra API key"
                    value={formData.supra.apiKey}
                    onChange={(e) => handleInputChange('supra', 'apiKey', e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => togglePasswordVisibility('supraKey')}
                  >
                    {showPasswords.supraKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* BSC RPC Configuration */}
            <div className="space-y-4 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white">BSC RPC Provider</h3>
              <p className="text-sm text-gray-400">Blockchain connection for trade execution</p>
              
              <div>
                <Label htmlFor="bsc-rpc">RPC URL</Label>
                <Input
                  id="bsc-rpc"
                  placeholder="https://bsc-dataseed1.binance.org/"
                  value={formData.bsc.rpcUrl}
                  onChange={(e) => handleInputChange('bsc', 'rpcUrl', e.target.value)}
                />
              </div>
            </div>

            {/* Error Display */}
            {saveError && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-red-400">{saveError}</span>
                </div>
              </div>
            )}

            {/* Configuration Status - Only show if there are issues or user has started configuring */}
            {(typeof Storage === 'undefined' || (!validation.isValid && (formData.supabase.url || formData.supabase.anonKey || formData.ai.openaiApiKey || formData.supra.apiKey))) && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-blue-400">Configuration Status</span>
                </div>
                <div className="text-sm text-blue-300 space-y-1">
                  {!validation.isValid && (formData.supabase.url || formData.supabase.anonKey || formData.ai.openaiApiKey || formData.supra.apiKey) && <div>⚠️ Please fix all errors before saving</div>}
                  {typeof Storage === 'undefined' && <div>⚠️ Browser storage not available - configuration cannot be saved</div>}
                </div>
              </div>
            )}



            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving || !validation.isValid}
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReset}>
                Reset All
              </Button>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}