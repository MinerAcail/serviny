
import { useState, useMemo, useEffect } from "react"
import { gql, useQuery, useLazyQuery } from "@apollo/client"
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Users,
  Database,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Printer,
  // Share2,
  ArrowLeft,
  // ArrowRight,
  X,
  User,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { toast } from "sonner"
import { getImageUrl } from "@/components/global/formatPrice"

// GraphQL Queries
const GET_SUBMISSIONS = gql`
  query Submissions {
    submissions {
      id
      formId
      serviceId
      data
      status
      userId
      createdAt
      updatedAt
    }
  }
`

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

const GET_USER_INFOR = gql`
  query GetUserInfor($userID: String!) {
    getUserInfor(userId: $userID) {
      id
      name
      type
      number
      email
      location
      dpfile
    }
  }
`

// Types
interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: string
  order?: number
}

interface Form {
  id: string
  title: string
  description?: string
  type: string
  isActive: boolean
  submissionCount: number
  fields: FormField[]
  createdAt: string
  updatedAt: string
}

interface Submission {
  id: string
  formId: string
  serviceId?: string
  data: string
  status?: string
  userId?: string
  createdAt: string
  updatedAt: string
}

interface ParsedSubmissionData {
  [key: string]: any
}

interface UserInfo {
  id: string
  name: string
  type: string
  number: string
  email: string
  location: string
  dpfile: string
}

interface SubmissionWithParsedData extends Omit<Submission, "data"> {
  parsedData: ParsedSubmissionData
  dataPreview: string
  formTitle?: string
  mappedData?: ParsedSubmissionData
  form?: Form
  userInfo?: UserInfo
}

export default function SubmissionsViewer() {
  // State management
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [formIdFilter, setFormIdFilter] = useState("all")
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithParsedData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewMode, setViewMode] = useState<"list" | "form">("list")
  const [formsCache, setFormsCache] = useState<Map<string, Form>>(new Map())
  const [userInfoCache, setUserInfoCache] = useState<Map<string, UserInfo>>(new Map())
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isStatsOpen, setIsStatsOpen] = useState(false)

  // GraphQL query for submissions
  const {
    data: submissionsData,
    loading: submissionsLoading,
    error: submissionsError,
    refetch,
  } = useQuery(GET_SUBMISSIONS, {
    errorPolicy: "all",
    onError: (error) => {
      console.error("Failed to fetch submissions:", error)
      toast.error("Failed to load submissions", {
        description: error.message,
      })
    },
  })

  // Lazy query for individual forms
  const [getForm] = useLazyQuery(GET_FORM, {
    onCompleted: (formData) => {
      if (formData.form) {
        setFormsCache((prev) => new Map(prev.set(formData.form.id, formData.form)))
      }
    },
    onError: (error) => {
      console.warn("Failed to fetch form:", error)
    },
  })

  // Lazy query for user information
  const [getUserInfo] = useLazyQuery(GET_USER_INFOR, {
    onCompleted: (userData) => {
      if (userData.getUserInfor) {
        setUserInfoCache((prev) => new Map(prev.set(userData.getUserInfor.id, userData.getUserInfor)))
      }
    },
    onError: (error) => {
      console.warn("Failed to fetch user info:", error)
    },
  })

  // Effect to fetch form data and user info for unique form IDs and user IDs
  useEffect(() => {
    if (!submissionsData?.submissions) return

    const uniqueFormIds = Array.from(new Set(submissionsData.submissions.map((s: Submission) => s.formId)))
    const uniqueUserIds = Array.from(
      new Set(submissionsData.submissions.map((s: Submission) => s.userId).filter(Boolean)),
    )

    uniqueFormIds.forEach((formId) => {
      if (!formsCache.has(formId)) {
        getForm({ variables: { id: formId } })
      }
    })

    uniqueUserIds.forEach((userId) => {
      if (userId && !userInfoCache.has(userId)) {
        getUserInfo({ variables: { userID: userId } })
      }
    })
  }, [submissionsData, formsCache, userInfoCache, getForm, getUserInfo])

  // Map submission data using form field labels
  const mapSubmissionData = (rawData: ParsedSubmissionData, form?: Form): ParsedSubmissionData => {
    if (!form || !form.fields || form.fields.length === 0) {
      return rawData
    }

    const mappedData: ParsedSubmissionData = {}
    const fieldMap = new Map(form.fields.map((field) => [field.id, field.label]))

    Object.entries(rawData).forEach(([key, value]) => {
      const fieldLabel = fieldMap.get(key)
      if (fieldLabel) {
        mappedData[fieldLabel] = value
      } else {
        mappedData[key] = value
      }
    })

    return mappedData
  }

  // Parse and process submissions data
  const processedSubmissions = useMemo(() => {
    if (!submissionsData?.submissions) return []

    return submissionsData.submissions.map((submission: Submission): SubmissionWithParsedData => {
      let parsedData: ParsedSubmissionData = {}
      let mappedData: ParsedSubmissionData = {}
      let dataPreview = "Invalid JSON"

      try {
        parsedData = JSON.parse(submission.data)

        const form = formsCache.get(submission.formId)
        mappedData = mapSubmissionData(parsedData, form)

        const previewData = Object.keys(mappedData).length > 0 ? mappedData : parsedData
        const previewEntries = Object.entries(previewData)
          .slice(0, 3)
          .map(([key, value]) => `${key}: ${String(value).substring(0, 30)}`)
          .join(", ")
        dataPreview = previewEntries + (Object.keys(previewData).length > 3 ? "..." : "")
      } catch (error) {
        console.warn(`Failed to parse data for submission ${submission.id}:`, error)
        dataPreview = submission.data.substring(0, 100) + "..."
      }

      return {
        ...submission,
        parsedData,
        mappedData,
        dataPreview,
        formTitle: formsCache.get(submission.formId)?.title,
        form: formsCache.get(submission.formId),
        userInfo: submission.userId ? userInfoCache.get(submission.userId) : undefined,
      }
    })
  }, [submissionsData, formsCache, userInfoCache])

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    return processedSubmissions.filter((submission) => {
      const matchesSearch =
        searchTerm === "" ||
        submission.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.formId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.dataPreview.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (submission.userId && submission.userId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (submission.userInfo?.name && submission.userInfo.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (submission.userInfo?.email && submission.userInfo.email.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = statusFilter === "all" || submission.status === statusFilter
      const matchesFormId = formIdFilter === "all" || submission.formId === formIdFilter

      return matchesSearch && matchesStatus && matchesFormId
    })
  }, [processedSubmissions, searchTerm, statusFilter, formIdFilter])

  // Get unique form IDs and statuses for filters
  const uniqueFormIds = useMemo(() => {
    const formIds = processedSubmissions.map((s) => s.formId)
    return Array.from(new Set(formIds))
  }, [processedSubmissions])

  const uniqueStatuses = useMemo(() => {
    const statuses = processedSubmissions.map((s) => s.status).filter(Boolean)
    return Array.from(new Set(statuses))
  }, [processedSubmissions])

  // Navigation functions
  const goToPrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      setSelectedSubmission(filteredSubmissions[newIndex])
    }
  }

  const goToNext = () => {
    if (currentIndex < filteredSubmissions.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      setSelectedSubmission(filteredSubmissions[newIndex])
    }
  }

  // View submission in form mode
  const viewSubmissionAsForm = (submission: SubmissionWithParsedData, index: number) => {
    setSelectedSubmission(submission)
    setCurrentIndex(index)
    setViewMode("form")
  }

  // Export functionality
  const exportSubmissions = (format: "json" | "csv") => {
    if (filteredSubmissions.length === 0) {
      toast.error("No submissions to export")
      return
    }

    let dataStr = ""
    let filename = ""

    if (format === "json") {
      dataStr = JSON.stringify(filteredSubmissions, null, 2)
      filename = `submissions-${new Date().toISOString().split("T")[0]}.json`
    } else {
      const headers = ["ID", "Form ID", "Status", "User ID", "User Name", "User Email", "Created At", "Data"]
      const csvRows = [
        headers.join(","),
        ...filteredSubmissions.map((sub) =>
          [
            sub.id,
            sub.formId,
            sub.status || "",
            sub.userId || "",
            sub.userInfo?.name || "",
            sub.userInfo?.email || "",
            sub.createdAt,
            `"${JSON.stringify(sub.mappedData || sub.parsedData).replace(/"/g, '""')}"`,
          ].join(","),
        ),
      ]
      dataStr = csvRows.join("\n")
      filename = `submissions-${new Date().toISOString().split("T")[0]}.csv`
    }

    const blob = new Blob([dataStr], { type: format === "json" ? "application/json" : "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Exported ${filteredSubmissions.length} submissions as ${format.toUpperCase()}`)
  }

  // Status badge component
  const StatusBadge = ({ status }: { status?: string }) => {
    if (!status) return null

    const statusConfig = {
      PENDING: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
      SUBMITTED: { color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      PROCESSED: { color: "bg-blue-100 text-blue-800 border-blue-200", icon: Database },
      FAILED: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: AlertCircle,
    }

    const IconComponent = config.icon

    return (
      <Badge className={`${config.color} border flex items-center gap-1 px-2 py-1`}>
        <IconComponent className="h-3 w-3" />
        {status}
      </Badge>
    )
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString() + " " + new Date(dateString).toLocaleTimeString()
  }

  // Render field value in form style
  const renderFormFieldValue = (field: FormField, value: any, submission: SubmissionWithParsedData) => {
    const fieldType = field.type.toUpperCase()

    if (!value && value !== false && value !== 0) {
      return <span className="text-gray-400 italic">Not provided</span>
    }

    switch (fieldType) {
      case "TEXT":
      case "TEXTAREA":
        return (
          <div className="border-b border-dotted border-gray-400 pb-1 min-h-[1.5rem] flex items-end">
            <span className="text-gray-900">{String(value)}</span>
          </div>
        )

      case "SELECT":
      case "RADIO":
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center gap-1">
                <div
                  className={`w-4 h-4 border-2 rounded-full ${
                    value === option ? "bg-blue-600 border-blue-600" : "border-gray-300"
                  }`}
                >
                  {value === option && <div className="w-2 h-2 bg-white rounded-full m-0.5" />}
                </div>
                <span className="text-sm">{option}</span>
              </div>
            ))}
          </div>
        )

      case "CHECKBOX":
        return (
          <div className="space-y-2">
            {field.options?.map((option) => {
              const isChecked = Array.isArray(value) ? value.includes(option) : false
              return (
                <div key={option} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 border-2 ${
                      isChecked ? "bg-blue-600 border-blue-600" : "border-gray-300"
                    } flex items-center justify-center`}
                  >
                    {isChecked && <CheckCircle className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm">{option}</span>
                </div>
              )
            })}
          </div>
        )

      case "SIGNATURE":
        // Handle different signature value formats
        if (value === "signature_provided") {
          // Check if we have signature URLs in the submission data
          const signatureURLs = submission.parsedData?.signature_urls || submission.mappedData?.signature_urls

          if (signatureURLs && Array.isArray(signatureURLs) && signatureURLs.length > 0) {
            // Find signature URL that might correspond to this field
            const fieldSignatureURL =
              signatureURLs.find(
                (url) => url.includes(field.label.toLowerCase().replace(/\s+/g, "-")) || url.includes(field.id),
              ) || signatureURLs[0] // Fallback to first signature if no match

            return (
              <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Digital Signature:</p>
                  <div className="border border-gray-200 rounded bg-white p-2">
                    <img
                      src={getImageUrl(fieldSignatureURL) || "/placeholder.svg"}
                      alt={`Signature for ${field.label}`}
                      className="max-w-full h-auto max-h-32 object-contain mx-auto"
                      style={{
                        filter: "contrast(1.2) brightness(0.9)",
                        imageRendering: "crisp-edges",
                      }}
                      onError={(e) => {
                        // Fallback if image fails to load
                        e.currentTarget.style.display = "none"
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = "block"
                      }}
                    />
                    <div style={{ display: "none" }} className="text-center py-4 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Signature image unavailable</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(fieldSignatureURL, "_blank")}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Full Size
                  </Button>
                </div>
              </div>
            )
          } else {
            // Signature was provided but no URL found
            return (
              <div className="border border-gray-300 rounded p-4 bg-gray-50 text-center">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <p className="text-sm text-gray-600">Signature provided</p>
                <p className="text-xs text-gray-500 mt-1">(Image processing)</p>
              </div>
            )
          }
        } else if (typeof value === "string" && value.startsWith("http")) {
          // Direct URL provided
          return (
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Digital Signature:</p>
                <div className="border border-gray-200 rounded bg-white p-2">
                  <img
                    src={getImageUrl(value) || "/placeholder.svg"}
                    alt={`Signature for ${field.label}`}
                    className="max-w-full h-auto max-h-32 object-contain mx-auto"
                    style={{
                      filter: "contrast(1.2) brightness(0.9)",
                      imageRendering: "crisp-edges",
                    }}
                    onError={(e) => {
                      // Fallback if image fails to load
                      e.currentTarget.style.display = "none"
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement
                      if (fallback) fallback.style.display = "block"
                    }}
                  />
                  <div style={{ display: "none" }} className="text-center py-4 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Signature image unavailable</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => window.open(value, "_blank")} className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  View Full Size
                </Button>
              </div>
            </div>
          )
        } else {
          // Unknown signature format
          return (
            <div className="border border-gray-300 rounded p-4 bg-gray-50 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm text-gray-600">Signature provided</p>
            </div>
          )
        }

      default:
        return (
          <div className="border-b border-dotted border-gray-400 pb-1 min-h-[1.5rem] flex items-end">
            <span className="text-gray-900">{String(value)}</span>
          </div>
        )
    }
  }

  // Enhanced submission preview
  const enhancedSubmissionPreview = (submission: SubmissionWithParsedData) => {
    const data =
      submission.mappedData && Object.keys(submission.mappedData).length > 0
        ? submission.mappedData
        : submission.parsedData

    // Count signature fields
    const signatureCount =
      data.signature_urls && Array.isArray(data.signature_urls)
        ? data.signature_urls.length
        : Object.values(data).filter((value) => value === "signature_provided").length

    return (
      <div className="space-y-3">
        {/* User Information */}
        {submission.userInfo && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              {submission.userInfo.dpfile ? (
                <img
                  src={getImageUrl(submission.userInfo.dpfile) || "/placeholder.svg"}
                  alt={submission.userInfo.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 truncate">{submission.userInfo.name}</p>
              <p className="text-xs text-blue-600 truncate">{submission.userInfo.email}</p>
            </div>
          </div>
        )}

        {/* Preview of form data (excluding signature_urls) */}
        <div className="text-sm">
          {Object.entries(data)
            .filter(([key]) => key !== "signature_urls")
            .slice(0, 3)
            .map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0"
              >
                <span className="text-gray-600 font-medium truncate mr-2">{key}:</span>
                <span className="text-gray-900 text-right truncate max-w-[60%]">
                  {value === "signature_provided" ? (
                    <span className="flex items-center gap-1 text-blue-600">
                      <FileText className="h-3 w-3" />
                      Signed
                    </span>
                  ) : (
                    <>
                      {Array.isArray(value) ? value.join(", ") : String(value).substring(0, 20)}
                      {String(value).length > 20 ? "..." : ""}
                    </>
                  )}
                </span>
              </div>
            ))}
          {Object.keys(data).filter((key) => key !== "signature_urls").length > 3 && (
            <div className="text-xs text-gray-400 mt-2 text-center">
              +{Object.keys(data).filter((key) => key !== "signature_urls").length - 3} more fields
            </div>
          )}
        </div>

        {/* Show signature count if any */}
        {signatureCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded p-2">
            <FileText className="h-3 w-3" />
            <span>
              {signatureCount} digital signature{signatureCount > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    )
  }

  // Render paper-like form view
  const renderFormView = (submission: SubmissionWithParsedData) => {
    const form = submission.form
    const data =
      submission.mappedData && Object.keys(submission.mappedData).length > 0
        ? submission.mappedData
        : submission.parsedData

    return (
      <div className="max-w-4xl mx-auto ">
        {/* Navigation Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Button variant="outline" onClick={() => setViewMode("list")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to List
            </Button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
              

             

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.print()} className="hidden sm:flex">
                  <Printer className="h-4 w-4 mr-1" />
                  Print
                </Button>
               
              </div>
            </div>
          </div>
        </div>

        {/* Paper Form */}
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 sm:p-8 print:shadow-none print:border-gray-400">
          {/* Form Header */}
          <div className="border-b-2 border-gray-800 pb-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {form?.title || "Form Submission"}
                </h1>
                {form?.description && <p className="text-gray-600 mb-4">{form.description}</p>}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                 
                  <span>Type: {form?.type || "Unknown"}</span>
                </div>
              </div>
              <StatusBadge status={submission.status} />
            </div>
          </div>

          {/* Submission Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
          
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted On</label>
              <p className="text-sm text-gray-900">{formatDate(submission.createdAt)}</p>
            </div>
           
          </div>

          {/* User Information Section */}
          {submission.userInfo && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Submitted By</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    {submission.userInfo.dpfile ? (
                      <img
                        src={getImageUrl(submission.userInfo.dpfile) || "/placeholder.svg"}
                        alt={submission.userInfo.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{submission.userInfo.name}</p>
                    <p className="text-sm text-gray-600">{submission.userInfo.type}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</label>
                    <p className="text-sm text-gray-900">{submission.userInfo.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</label>
                    <p className="text-sm text-gray-900">{submission.userInfo.number}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Location</label>
                    <p className="text-sm text-gray-900">{submission.userInfo.location}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            {form?.fields
              ? // Render using form structure
                [...form.fields]
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((field) => {
                    const value = data[field.label] || data[field.id]
                    return (
                      <div key={field.id} className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className="pl-2 sm:pl-4">{renderFormFieldValue(field, value, submission)}</div>
                      </div>
                    )
                  })
              : // Fallback: render raw data
                Object.entries(data)
                  .filter(([key]) => key !== "signature_urls") // Don't show signature_urls as a separate field
                  .map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">{key}</label>
                      <div className="pl-2 sm:pl-4">
                        <div className="border-b border-dotted border-gray-400 pb-1 min-h-[1.5rem] flex items-end">
                          <span className="text-gray-900 break-words">
                            {Array.isArray(value) ? value.join(", ") : String(value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-gray-300 text-center text-xs text-gray-500">
            <p>This submission was received on {formatDate(submission.createdAt)}</p>
            <p className="mt-1 break-all">Submission ID: {submission.id}</p>
            {data.signature_urls && Array.isArray(data.signature_urls) && data.signature_urls.length > 0 && (
              <p className="mt-1">Contains {data.signature_urls.length} digital signature(s)</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (submissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    )
  }

  if (submissionsError && !submissionsData) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Failed to Load Submissions</CardTitle>
            <CardDescription>{submissionsError.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Form view mode
  if (viewMode === "form" && selectedSubmission) {
    return <div className="">{renderFormView(selectedSubmission)}</div>
  }

  // List view mode
  return (
    <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-6 max-w-7xl">
      {/* Compact Search and Toggle Bar */}
      <div className="mb-4 flex gap-2">
        {/* Search Bar - 70% width */}
        <div className="relative flex-[0.7]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search submissions, users, emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Toggle Buttons - 30% width */}
        <div className="flex-[0.3] flex gap-1">
          <Button
            variant="ghost"
            className="flex-1 justify-center p-2 h-10 hover:bg-gray-50 text-xs"
            onClick={() => setIsStatsOpen(!isStatsOpen)}
          >
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span className="hidden sm:inline font-medium">Stats</span>
            </div>
            {isStatsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          <Button
            variant="ghost"
            className="flex-1 justify-center p-2 h-10 hover:bg-gray-50 text-xs"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <div className="flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span className="hidden sm:inline font-medium">Menu</span>
              {(statusFilter !== "all" || formIdFilter !== "all") && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
            </div>
            {isFiltersOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Collapsible Filters Menu */}
      <Card className="mb-6">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filters & Actions</span>
                {(statusFilter !== "all" || formIdFilter !== "all") && (
                  <Badge variant="secondary" className="ml-2">
                    {[statusFilter !== "all" ? "Status" : "", formIdFilter !== "all" ? "Form" : ""]
                      .filter(Boolean)
                      .join(", ")}
                  </Badge>
                )}
              </div>
              {isFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              <div className="space-y-4">
                {/* Filter Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Status Filter</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {uniqueStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Form Filter</label>
                    <Select value={formIdFilter} onValueChange={setFormIdFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by form" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Forms</SelectItem>
                        {uniqueFormIds.map((formId) => (
                          <SelectItem key={formId} value={formId}>
                            {formsCache.get(formId)?.title || `${formId.substring(0, 8)}...`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                
                  <Button
                    variant="outline"
                    onClick={() => exportSubmissions("csv")}
                    className="flex items-center gap-2 flex-1"
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2 flex-1">
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>

                {/* Clear Filters */}
                {(statusFilter !== "all" || formIdFilter !== "all" || searchTerm) && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStatusFilter("all")
                      setFormIdFilter("all")
                      setSearchTerm("")
                    }}
                    className="w-full text-gray-600 hover:text-gray-900"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Stats Cards - iOS Style with Toggle */}
      <Card className="mb-6 sm:mb-8">
        <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-4 h-auto hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="font-medium">Statistics Overview</span>
              </div>
              {isStatsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <FileText className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
                        {processedSubmissions.length}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Total</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <Users className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
                        {uniqueFormIds.length}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Forms</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
                        {processedSubmissions.filter((s) => s.status === "SUBMITTED").length}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Submitted</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                      <Clock className="h-6 w-6 sm:h-7 sm:w-7 text-orange-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">
                        {processedSubmissions.filter((s) => s.status === "PENDING").length}
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wide">Pending</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Submissions Grid */}
      {filteredSubmissions.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all" || formIdFilter !== "all"
              ? "Try adjusting your search or filters"
              : "No form submissions have been received yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredSubmissions.map((submission, index) => (
            <Card
              key={submission.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">
                      {submission.formTitle || "Form Submission"}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {formatDate(submission.createdAt)}
                    </CardDescription>
                  </div>
                  <StatusBadge status={submission.status} />
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {enhancedSubmissionPreview(submission)}

                <Separator className="my-3" />

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => viewSubmissionAsForm(submission, index)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Form
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      exportSubmissions("json")
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                {/* Submission metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 mt-3">
                  <span className="truncate">ID: {submission.id.substring(0, 8)}...</span>
                  {submission.userId && (
                    <span className="truncate ml-2">User: {submission.userId.substring(0, 8)}...</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
