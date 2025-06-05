"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { gql, useMutation } from "@apollo/client"
import { toast } from "sonner"

// GraphQL mutation for form submission
const SUBMIT_FORM = gql`
  mutation SubmitForm($input: FormSubmissionInput!) {
    submitForm(input: $input) {
      id
      submissionId
      status
      submittedAt
      message
    }
  }
`

interface FormSubmissionProps {
  formTitle: string
  formId: string
  submissionData: any
  onBackToForms: () => void
  onRetry?: () => void
}

export function FormSubmission({ 
  formTitle, 
  formId, 
  submissionData, 
  onBackToForms, 
  onRetry 
}: FormSubmissionProps) {
  const [submissionStatus, setSubmissionStatus] = useState<'submitting' | 'success' | 'error'>('submitting')
  const [submissionId, setSubmissionId] = useState<string | null>(null)

  const [submitFormMutation, { loading, error }] = useMutation(SUBMIT_FORM, {
    onCompleted: (data) => {
      setSubmissionStatus('success')
      setSubmissionId(data.submitForm.submissionId)
      toast.success("Form submitted successfully!", {
        description: `Submission ID: ${data.submitForm.submissionId}`,
        duration: 5000,
      })
    },
    onError: (error) => {
      setSubmissionStatus('error')
      toast.error("Failed to submit form", {
        description: error.message,
        duration: 5000,
      })
    }
  })

  // Auto-submit when component mounts
  useEffect(() => {
    const submitForm = async () => {
      try {
        await submitFormMutation({
          variables: {
            input: {
              formId,
              formTitle,
              data: submissionData,
              submittedAt: new Date().toISOString(),
            }
          }
        })
      } catch (err) {
        console.error('Form submission error:', err)
      }
    }

    submitForm()
  }, []) // Only run once on mount

  const handleRetrySubmission = async () => {
    setSubmissionStatus('submitting')
    try {
      await submitFormMutation({
        variables: {
          input: {
            formId,
            formTitle,
            data: submissionData,
            submittedAt: new Date().toISOString(),
          }
        }
      })
    } catch (err) {
      console.error('Retry submission error:', err)
    }
  }

  if (submissionStatus === 'submitting' || loading) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Submitting Form
          </h2>
          <p className="text-gray-600 mb-6">
            Please wait while we process your submission...
          </p>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (submissionStatus === 'error') {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Submission Failed
          </h2>
          <p className="text-gray-600 mb-6">
            We encountered an error while submitting "{formTitle}". Please try again.
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={handleRetrySubmission}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Try Again'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={onBackToForms}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Back to Forms
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Form Submitted Successfully
        </h2>
        <p className="text-gray-600 mb-6">
          Thank you for submitting "{formTitle}". Your response has been recorded.
        </p>
        
        {submissionId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-700 font-medium">
              Submission ID: 
              <span className="font-mono ml-2">{submissionId}</span>
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <Button 
            onClick={onBackToForms}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Back to Forms
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.print()}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Print Confirmation
          </Button>
        </div>
      </div>
    </div>
  )
}