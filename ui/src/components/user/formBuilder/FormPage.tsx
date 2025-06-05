"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { gql, useQuery } from "@apollo/client"

import { Button } from "@/components/ui/button"
import { FormPreview } from "./FormPreview"
import { FormSubmission } from "./FormSubmission"
import { toast } from "sonner"

// Updated GraphQL query to match backend schema
const GET_FORM = gql`
  query GetForm($id: String!) {
    form(id: $id) {
      id
      title
      description
      type
      isActive
      submissionCount
      fields {
        id
        type
        label
        placeholder
        required
        options
        validation
        order
      }
      createdAt
      updatedAt
    }
  }
`

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: string;
  order?: number;
}

interface Form {
  id: string;
  title: string;
  description?: string;
  type: string;
  isActive: boolean;
  submissionCount: number;
  fields: FormField[];
  createdAt: string;
  updatedAt: string;
}

// Form data validation
const validateFormData = (form: any): form is Form => {
  if (!form || !form.fields || !Array.isArray(form.fields)) {
    return false;
  }
  
  return form.fields.every((field: any) => 
    field.id && field.type && field.label
  );
}

export default function FormPage() {
//   const params = useParams()
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [localForm, setLocalForm] = useState<Form | null>(null)

  // GraphQL query to fetch form
  const { data, loading, error, refetch } = useQuery(GET_FORM, {
    variables: { id: id },
    skip: !id,
    errorPolicy: 'all',
    onError: (error) => {
      console.warn('GraphQL form fetch failed, falling back to localStorage:', error)
      // Fallback to localStorage
      loadFormFromLocalStorage()
    }
  })

  // Fallback function to load from localStorage
  const loadFormFromLocalStorage = () => {
    try {
      const savedForms = JSON.parse(localStorage.getItem("savedForms") || "[]")
      const foundForm = savedForms.find((f: any) => f.id === id)
      
      if (foundForm && validateFormData(foundForm)) {
        setLocalForm(foundForm)
        initializeFormData(foundForm)
      } else {
        toast.error("Form not found", {
          description: "The form you're looking for doesn't exist or is invalid."
        })
      }
    } catch (err) {
      console.error('Error loading form from localStorage:', err)
      toast.error("Error loading form", {
        description: "Failed to load form data."
      })
    }
  }

  // Initialize form data based on form fields
  const initializeFormData = (form: Form) => {
    const initialData: Record<string, any> = {}
    
    // Sort fields by order before initializing
    const sortedFields = [...form.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    
    sortedFields.forEach((field: FormField) => {
      const fieldType = field.type.toUpperCase()
      
      if (fieldType === "CHECKBOX") {
        // For checkbox fields, initialize each option
        field.options?.forEach((_, index: number) => {
          initialData[`${field.id}-${index}`] = false
        })
      } else if (fieldType === "SIGNATURE") {
        initialData[field.id] = null
      } else {
        initialData[field.id] = ""
      }
    })
    setFormData(initialData)
  }

  // Effect to handle form data initialization
  useEffect(() => {
    const form = data?.form || localForm
    if (form && Object.keys(formData).length === 0) {
      initializeFormData(form)
    }
  }, [data?.form, localForm, formData])

  // Effect to load from localStorage on mount if GraphQL fails
  useEffect(() => {
    if (error && !loading && !data?.form && !localForm) {
      loadFormFromLocalStorage()
    }
  }, [error, loading, data?.form, localForm, id])

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const validateRequiredFields = (form: Form) => {
    const requiredFields = form.fields.filter((field: FormField) => field.required)
    const missingFields = requiredFields.filter((field: FormField) => {
      const fieldType = field.type.toUpperCase()
      
      if (fieldType === "SIGNATURE") {
        return !formData[field.id]
      }
      if (fieldType === "CHECKBOX") {
        // Check if at least one checkbox option is selected
        const hasSelectedOption = field.options?.some((_, index: number) => 
          formData[`${field.id}-${index}`]
        )
        return !hasSelectedOption
      }
      
      const value = formData[field.id]
      return !value && value !== false && value !== 0
    })

    return { isValid: missingFields.length === 0, missingFields }
  }

  const validateFieldData = (form: Form) => {
    const errors: string[] = []
    
    form.fields.forEach((field: FormField) => {
      const value = formData[field.id]
      const fieldType = field.type.toUpperCase()
      
      // Skip validation if field is empty and not required
      if (!field.required && (!value || value === "")) {
        return
      }
      
      // Email validation
      if (field.validation === "email" && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          errors.push(`${field.label} must be a valid email address`)
        }
      }
      
      // Phone validation
      if (field.validation === "phone" && value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
        if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
          errors.push(`${field.label} must be a valid phone number`)
        }
      }
      
      // URL validation
      if (field.validation === "url" && value) {
        try {
          new URL(value)
        } catch {
          errors.push(`${field.label} must be a valid URL`)
        }
      }
      
      // Custom regex validation
      if (field.validation && !["email", "phone", "url"].includes(field.validation) && value) {
        try {
          const regex = new RegExp(field.validation)
          if (!regex.test(value)) {
            errors.push(`${field.label} format is invalid`)
          }
        } catch {
          // Invalid regex, skip validation
        }
      }
    })
    
    return errors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const form = data?.form || localForm
    if (!form) {
      toast.error("Form data not available")
      return
    }

    // Check if form is active
    if (!form.isActive) {
      toast.error("Form is not accepting submissions", {
        description: "This form has been deactivated and no longer accepts new submissions."
      })
      return
    }

    // Validate required fields
    const requiredValidation = validateRequiredFields(form)
    if (!requiredValidation.isValid) {
      const fieldNames = requiredValidation.missingFields.map(f => f.label).join(', ')
      toast.error("Missing required fields", {
        description: `Please fill in: ${fieldNames}`,
        duration: 5000,
      })
      return
    }

    // Validate field data
    const validationErrors = validateFieldData(form)
    if (validationErrors.length > 0) {
      toast.error("Validation errors", {
        description: validationErrors.join('. '),
        duration: 7000,
      })
      return
    }

    // Process form data for submission
    const processedData = { ...formData }
    
    // Convert checkbox data to a more readable format
    form.fields.forEach((field: FormField) => {
      if (field.type.toUpperCase() === "CHECKBOX") {
        const selectedOptions = field.options?.filter((_, index: number) => 
          formData[`${field.id}-${index}`]
        ) || []
        processedData[field.id] = selectedOptions
        
        // Remove individual checkbox entries
        field.options?.forEach((_, index: number) => {
          delete processedData[`${field.id}-${index}`]
        })
      }
    })

    setIsSubmitted(true)
  }

  const handleBackToForms = () => {
    navigate(-1)
  }

  const handleRetryForm = () => {
    setIsSubmitted(false)
  }

  // Loading state
  if (loading && !localForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center max-w-md w-full mx-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Form</h3>
          <p className="text-gray-600">Please wait while we fetch your form...</p>
        </div>
      </div>
    )
  }

  const form = data?.form || localForm

  // Error state - form not found
  if (!loading && !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Not Found</h2>
          <p className="text-gray-600 mb-6">
            The form you're looking for doesn't exist or has been deleted.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => refetch()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={handleBackToForms}
              className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forms
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Form inactive state
  if (form && !form.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Form Not Available</h2>
          <p className="text-gray-600 mb-6">
            This form is currently inactive and not accepting submissions.
          </p>
          <Button 
            variant="outline" 
            onClick={handleBackToForms}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forms
          </Button>
        </div>
      </div>
    )
  }

  // Submission state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <FormSubmission 
          formTitle={form.title}
          formId={form.id}
          submissionData={formData}
          onBackToForms={handleBackToForms}
          onRetry={handleRetryForm}
        />
      </div>
    )
  }

  // Sort fields by order before rendering
  const sortedFields = [...form.fields].sort((a, b) => (a.order || 0) - (b.order || 0))

  // Main form display
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <Button 
            variant="ghost" 
            onClick={handleBackToForms}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Forms
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <FormPreview
              title={form.title}
              description={form.description}
              fields={sortedFields}
              formData={formData}
              onInputChange={handleInputChange}
              onSubmit={handleSubmit}
              showSubmitButton={true}
            />
          </div>
        </div>
      </div>
    </div>
  )
}