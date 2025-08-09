import { gql, useMutation, useLazyQuery, useQuery } from '@apollo/client'
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, Edit2, Globe, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

const GET_SERVICE = gql`
  query getService {
    getService {
      id
      name
      subDomain
    }
  }
`;

const CHECK_SUBDOMAIN_AVAILABILITY = gql`
  query CheckSubdomainAvailability($subdomain: String!) {
    checkSubdomainAvailability(subdomain: $subdomain) {
      subdomain
      available
      suggestions
    }
  }
`

const GENERATE_SUBDOMAIN = gql`
  mutation GenerateSubDomain($tryName: String) {
    generateSubDomain(tryName: $tryName) {
      id
      name
      subDomain
      
    }
  }
`

const CREATE_SERVICE_WITH_SUBDOMAIN = gql`
  mutation CreateServiceWithSubdomain($name: String!, $subdomain: String!) {
    createServiceWithSubdomain(name: $name, subdomain: $subdomain) {
      id
      name
      subDomain
      
    }
  }
`

const UPDATE_SUBDOMAIN = gql`
  mutation UpdateSubdomain($newSubdomain: String!) {
    updateSubdomain(newSubdomain: $newSubdomain) {
      id
      name
      subDomain
      
    }
  }
`

export function useSubdomain() {
  const [isChecking, setIsChecking] = useState(false)
  const [availabilityData, setAvailabilityData] = useState<any>(null)
  
  const { data: serviceData, loading: serviceLoading, refetch: refetchService } = useQuery(GET_SERVICE)
  
  const [checkAvailability] = useLazyQuery(CHECK_SUBDOMAIN_AVAILABILITY, {
    onCompleted: (data) => {
      setAvailabilityData(data.checkSubdomainAvailability)
      setIsChecking(false)
    },
    onError: (error) => {
      console.error('Availability check error:', error)
      setIsChecking(false)
    }
  })
  
  const [generateSubdomain, { loading: isGenerating }] = useMutation(GENERATE_SUBDOMAIN, {
    onCompleted: () => {
      refetchService()
    }
  })
  const [createService, { loading: isCreatingService }] = useMutation(CREATE_SERVICE_WITH_SUBDOMAIN)
  const [updateSubdomain, { loading: isUpdating }] = useMutation(UPDATE_SUBDOMAIN, {
    onCompleted: () => {
      refetchService()
    }
  })
  
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) return
    
    setIsChecking(true)
    setAvailabilityData(null)
    
    try {
      await checkAvailability({ variables: { subdomain } })
    } catch (error) {
      setIsChecking(false)
      throw error
    }
  }
  
  const generateCleanSubdomain = (name: string): string => {
    if (!name) return ''
    
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .substring(0, 20) // Limit length
  }
  
  return {
    isChecking,
    isGenerating,
    isCreatingService,
    isUpdating,
    serviceLoading,
    serviceData: serviceData?.getService,
    availabilityData,
    checkSubdomainAvailability,
    generateSubdomain,
    createService,
    updateSubdomain,
    generateCleanSubdomain,
    resetAvailability: () => setAvailabilityData(null),
    refetchService
  }
}

export function SubdomainGenerator() {
  const [open, setOpen] = useState(false)
  const [serviceName, setServiceName] = useState("")
  const [userName, setUserName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [isEditing, setIsEditing] = useState(true)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [error, setError] = useState("")
  const [mode] = useState('generate') // Default mode since no props
  
  const {
    isChecking,
    isGenerating,
    isCreatingService,
    isUpdating,
    serviceData,
    availabilityData,
    checkSubdomainAvailability,
    generateSubdomain,
    createService,
    updateSubdomain,
    generateCleanSubdomain,
    resetAvailability
  } = useSubdomain()

  // Load existing service data when dialog opens
  useEffect(() => {
    if (open && serviceData) {
      if (mode === 'update') {
        setServiceName(serviceData.name || '')
        setSubdomain(serviceData.subDomain || '')
        if (serviceData.subDomain) {
          setHasGenerated(true)
          setIsEditing(false)
        }
      } else if (mode === 'create' || mode === 'generate') {
        // Pre-populate with existing data if available
        setServiceName(serviceData.name || '')
        if (serviceData.subDomain) {
          setSubdomain(serviceData.subDomain)
        }
      }
    }
  }, [open, mode, serviceData])

  const handleNameChange = (value: string) => {
    if (mode === 'create') {
      setServiceName(value)
    } else {
      setUserName(value)
    }
    
    // Only auto-generate subdomain if we haven't manually generated one yet
    if (!hasGenerated && mode !== 'update') {
      const cleanSubdomain = generateCleanSubdomain(value)
      setSubdomain(cleanSubdomain)
    }
    setError("")
  }

  const handleSubdomainChange = (value: string) => {
    // Clean input to only allow valid characters
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setSubdomain(cleaned)
    resetAvailability()
    setError("")
  }

  const validateSubdomain = (subdomain: string): string | null => {
    if (!subdomain) {
      return "Subdomain is required"
    }
    
    if (subdomain.length < 3) {
      return "Subdomain must be at least 3 characters long"
    }
    
    if (subdomain.length > 63) {
      return "Subdomain must be no more than 63 characters long"
    }
    
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
      return "Subdomain can only contain lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen"
    }

    // Check for reserved subdomains
    const reserved = ['www', 'mail', 'ftp', 'api', 'admin', 'root', 'support', 'help', 'ssr']
    if (reserved.includes(subdomain)) {
      return `Subdomain '${subdomain}' is reserved`
    }
    
    return null
  }

  const validateAndCheck = async () => {
    const validationError = validateSubdomain(subdomain)
    if (validationError) {
      setError(validationError)
      return
    }
    
    setHasGenerated(true)
    setIsEditing(false)
    await checkSubdomainAvailability(subdomain)
  }

  const handleSubmit = async () => {
    setError("")
    
    try {
      let result
      
      if (mode === 'create') {
        if (!serviceName) {
          setError("Service name is required")
          return
        }
        result = await createService({
          variables: {
            name: serviceName,
            subdomain
          }
        })
        // if (onSuccess) {
        //   onSuccess(result.data.createServiceWithSubdomain)
        // }
      } else if (mode === 'update') {
        result = await updateSubdomain({
          variables: {
            newSubdomain: subdomain
          }
        })
        // if (onSuccess) {
        //   onSuccess(result.data.updateSubdomain)
        // }
      } else {
        // generate mode
        result = await generateSubdomain({
          variables: {
            tryName: userName || undefined
          }
        })
        // if (onSuccess) {
        //   onSuccess(result.data.generateSubDomain)
        // }
      }
      
      setOpen(false)
      handleReset()
    } catch (err: any) {
      setError(err.message || 'Operation failed')
    }
  }

  const handleReset = () => {
    setServiceName("")
    setUserName("")
    setSubdomain("")
    setIsEditing(true)
    setHasGenerated(false)
    setError("")
    resetAvailability()
  }

  const handleEdit = () => {
    setIsEditing(true)
    resetAvailability()
  }

  const selectSuggestion = (suggestion: string) => {
    setSubdomain(suggestion)
    setIsEditing(true)
    resetAvailability()
  }

  const currentName = mode === 'create' ? serviceName : userName
  const namePlaceholder = mode === 'create' ? 'Enter service name' : 'Enter your name'
  const nameLabel = mode === 'create' ? 'Service Name' : 'Your Name'
  const isLoading = isChecking || isGenerating || isCreatingService || isUpdating

  const getButtonText = () => {
    if (mode === 'create') return 'Create Service'
    if (mode === 'update') return 'Update Subdomain'
    return 'Generate Subdomain'
  }

  const getDialogTitle = () => {
    if (mode === 'create') return 'Create Service with Subdomain'
    if (mode === 'update') return 'Update Subdomain'
    return 'Generate Your Subdomain'
  }

  const getDialogDescription = () => {
    if (mode === 'create') return 'Create a new service with a personalized subdomain.'
    if (mode === 'update') return 'Update your service subdomain.'
    return 'Create a personalized subdomain based on your name. You can edit it before generating.'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <Globe className="h-4 w-4" />
          {getButtonText()}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {mode !== 'update' && (
            <div className="space-y-2">
              <Label htmlFor="name">{nameLabel}</Label>
              <Input
                id="name"
                placeholder={namePlaceholder}
                value={currentName}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain Preview</Label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 flex items-center">
                {isEditing ? (
                  <Input
                    id="subdomain"
                    placeholder="your-subdomain"
                    value={subdomain}
                    onChange={(e) => handleSubdomainChange(e.target.value)}
                    maxLength={63}
                    disabled={isLoading}
                  />
                ) : (
                  <div className="flex-1 px-3 py-2 border rounded-md bg-gray-50">
                    {subdomain}
                  </div>
                )}
                <span className="ml-2 text-sm text-gray-500">.winnemart.com</span>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={handleEdit} disabled={isLoading}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            {subdomain && (
              <p className="text-xs text-gray-500">
                {subdomain.length}/63 characters
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {availabilityData && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {availabilityData.available ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Available
                    </Badge>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-red-500" />
                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                      Already taken
                    </Badge>
                  </>
                )}
              </div>
              
              {!availabilityData.available && availabilityData.suggestions && availabilityData.suggestions.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Suggested alternatives:</Label>
                  <div className="flex flex-wrap gap-2">
                    {availabilityData.suggestions.map((suggestion: string) => (
                      <Button
                        key={suggestion}
                        variant="outline"
                        size="sm"
                        onClick={() => selectSuggestion(suggestion)}
                        className="text-xs"
                        disabled={isLoading}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isChecking && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking availability...</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
          <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto" disabled={isLoading}>
            Reset
          </Button>
          
          {isEditing ? (
            <Button 
              onClick={validateAndCheck} 
              disabled={!subdomain || (mode !== 'update' && !currentName) || isLoading}
              className="w-full sm:w-auto"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check Availability'
              )}
            </Button>
          ) : availabilityData?.available ? (
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {mode === 'create' ? 'Creating...' : mode === 'update' ? 'Updating...' : 'Generating...'}
                </>
              ) : (
                getButtonText()
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleEdit}
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isLoading}
            >
              Try Different Name
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}