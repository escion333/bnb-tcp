import { useState } from 'react'
import { X, Settings, Eye, EyeOff, ExternalLink, Download, Upload, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useUserConfig } from '../contexts/UserConfigContext'
import { getSetupInstructions, exportConfig, importConfig, type UserConfig } from '../lib/userConfig'

interface ConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ConfigurationModal({ isOpen, onClose }: ConfigurationModalProps) {
  const { config, updateConfig, resetConfig, validation, serviceStatus } = useUserConfig()
  const [formData, setFormData] = useState<UserConfig>(config)
  const [showPasswords, setShowPasswords] = useState({
    supabaseKey: false,
    openaiKey: false,
    supraKey: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('configure')

  const setupInstructions = getSetupInstructions()

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
      updateConfig(formData)
      onClose()
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save configuration')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all configuration? This will clear all your API keys.')) {
      resetConfig()
      setFormData(config)
      onClose()
    }
  }

  const handleExport = () => {
    try {
      const configJson = exportConfig(formData)
      const blob = new Blob([configJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'defi-copilot-config.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      setSaveError('Failed to export configuration')
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const configJson = e.target?.result as string
        const importedConfig = importConfig(configJson)
        setFormData(importedConfig)
        setSaveError(null)
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Failed to import configuration')
      }
    }
    reader.readAsText(file)
    
    // Reset the input
    event.target.value = ''
  }

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const getServiceIcon = (isConfigured: boolean) => {
    if (isConfigured) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    } else {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    }
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configure">Configure</TabsTrigger>
            <TabsTrigger value="instructions">Setup Guide</TabsTrigger>
            <TabsTrigger value="backup">Backup/Restore</TabsTrigger>
          </TabsList>

          <TabsContent value="configure" className="space-y-6">
            {/* Service Status Overview */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Service Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  {getServiceIcon(serviceStatus.supabase)}
                  <span className="text-sm">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  {getServiceIcon(serviceStatus.openai)}
                  <span className="text-sm">AI Trading</span>
                </div>
                <div className="flex items-center gap-2">
                  {getServiceIcon(serviceStatus.supra)}
                  <span className="text-sm">Price Data</span>
                </div>
                <div className="flex items-center gap-2">
                  {getServiceIcon(serviceStatus.bsc)}
                  <span className="text-sm">Blockchain</span>
                </div>
              </div>
            </div>

            {/* Validation Messages */}
            {validation.errors.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="font-semibold text-red-400">Configuration Errors</span>
                </div>
                <ul className="text-sm text-red-300 space-y-1">
                  {validation.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {validation.warnings.length > 0 && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold text-yellow-400">Configuration Warnings</span>
                </div>
                <ul className="text-sm text-yellow-300 space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Supabase Configuration */}
            <div className="space-y-4 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white">Supabase Database</h3>
              <p className="text-sm text-gray-400">Required for trade history and data persistence</p>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="supabase-url">Project URL</Label>
                  <Input
                    id="supabase-url"
                    placeholder="https://your-project-id.supabase.co"
                    value={formData.supabase.url}
                    onChange={(e) => handleInputChange('supabase', 'url', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="supabase-key">Anonymous Key</Label>
                  <div className="relative">
                    <Input
                      id="supabase-key"
                      type={showPasswords.supabaseKey ? 'text' : 'password'}
                      placeholder="eyJ..."
                      value={formData.supabase.anonKey}
                      onChange={(e) => handleInputChange('supabase', 'anonKey', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => togglePasswordVisibility('supabaseKey')}
                    >
                      {showPasswords.supabaseKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* OpenAI Configuration */}
            <div className="space-y-4 border border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white">OpenAI API</h3>
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
              <h3 className="text-lg font-semibold text-white">Supra Oracle & Automation</h3>
              <p className="text-sm text-gray-400">
                Required for automated trading. Price feeds have fallback options (CoinGecko → Mock data).
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
                <p className="text-xs text-gray-500 mt-1">
                  • Price feeds: Optional (falls back to CoinGecko if unavailable)<br/>
                  • Automation: Required for stop-loss/take-profit orders
                </p>
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
          </TabsContent>

          <TabsContent value="instructions" className="space-y-6">
            {Object.entries(setupInstructions).map(([key, instruction]) => (
              <div key={key} className="border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">{instruction.title}</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(instruction.url, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                </div>
                <p className="text-sm text-gray-400 mb-3">{instruction.description}</p>
                <ul className="text-sm text-gray-300 space-y-1">
                  {instruction.steps.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="backup" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Backup & Restore Configuration</h3>
              
              <div className="border border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Export Configuration</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Download your configuration as a JSON file for backup or sharing between devices.
                </p>
                <Button onClick={handleExport} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Configuration
                </Button>
              </div>

              <div className="border border-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Import Configuration</h4>
                <p className="text-sm text-gray-400 mb-3">
                  Upload a configuration file to restore your settings.
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    id="import-config"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="import-config" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Import Configuration
                    </label>
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-semibold text-yellow-400">Security Notice</span>
                </div>
                <p className="text-sm text-yellow-300">
                  Configuration files contain sensitive API keys. Store them securely and never share them publicly.
                  Only import configuration files from trusted sources.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 