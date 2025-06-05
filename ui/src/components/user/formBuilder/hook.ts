

// ==============================================
// TypeScript Interfaces
// ==============================================

export interface FormField {
  id: string
  type: 'TEXT' | 'TEXTAREA' | 'SELECT' | 'CHECKBOX' | 'RADIO' | 'SIGNATURE'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: any
  order?: number
}

export interface Form {
  id: string
  title: string
  description?: string
  type: 'AGREEMENT' | 'SURVEY' | 'APPLICATION' | 'FEEDBACK' | 'OTHER'
  fields: FormField[]
  createdAt: string
  updatedAt: string
  isActive: boolean
  submissionCount: number
  createdBy?: string
}

export interface FormSubmission {
  id: string
  formId: string
  submissionId: string
  formTitle: string
  data: Record<string, any>
  submittedAt: string
  status: 'PENDING' | 'SUBMITTED' | 'PROCESSED' | 'FAILED'
  message?: string
  ipAddress?: string
  userAgent?: string
}

export interface FormAnalytics {
  totalSubmissions: number
  submissionsToday: number
  submissionsThisWeek: number
  submissionsThisMonth: number
  averageCompletionTime?: number
  conversionRate?: number
  fieldAnalytics: FieldAnalytics[]
}

export interface FieldAnalytics {
  fieldId: string
  fieldLabel: string
  completionRate: number
  averageLength?: number
  commonValues: string[]
}

// Input Types
export interface CreateFormInput {
  title: string
  description?: string
  type: Form['type']
  fields: Omit<FormField, 'id'>[]
  isActive?: boolean
}

export interface UpdateFormInput {
  id: string
  title?: string
  description?: string
  type?: Form['type']
  fields?: FormField[]
  isActive?: boolean
}

export interface FormSubmissionInput {
  formId: string
  formTitle: string
  data: Record<string, any>
  submittedAt: string
  ipAddress?: string
  userAgent?: string
}

export interface FormsFilter {
  type?: Form['type']
  isActive?: boolean
  createdBy?: string
  search?: string
}

// ==============================================
// GraphQL Queries and Mutations
// ==============================================

export const GET_FORMS = gql`
  query GetForms(
    $filter: FormsFilter
    $limit: Int
    $offset: Int
    $orderBy: String
    $orderDirection: String
  ) {
    forms(
      filter: $filter
      limit: $limit
      offset: $offset
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      title
      description
      type
      createdAt
      updatedAt
      isActive
      submissionCount
      fields {
        id
        type
        label
        required
      }
    }
  }
`

export const GET_FORM = gql`
  query GetForm($id: ID!) {
    form(id: $id) {
      id
      title
      description
      type
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
      isActive
      submissionCount
    }
  }
`

export const CREATE_FORM = gql`
  mutation CreateForm($input: CreateFormInput!) {
    createForm(input: $input) {
      id
      title
      description
      type
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
      isActive
      submissionCount
    }
  }
`

export const UPDATE_FORM = gql`
  mutation UpdateForm($input: UpdateFormInput!) {
    updateForm(input: $input) {
      id
      title
      description
      type
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
      isActive
      submissionCount
    }
  }
`

export const DELETE_FORM = gql`
  mutation DeleteForm($id: ID!) {
    deleteForm(id: $id)
  }
`

export const DUPLICATE_FORM = gql`
  mutation DuplicateForm($id: ID!, $title: String) {
    duplicateForm(id: $id, title: $title) {
      id
      title
      description
      type
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
      isActive
      submissionCount
    }
  }
`

export const SUBMIT_FORM = gql`
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

export const GET_SUBMISSIONS = gql`
  query GetSubmissions(
    $formId: ID
    $status: SubmissionStatus
    $limit: Int
    $offset: Int
    $orderBy: String
    $orderDirection: String
  ) {
    submissions(
      formId: $formId
      status: $status
      limit: $limit
      offset: $offset
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      submissionId
      formTitle
      submittedAt
      status
      data
      ipAddress
    }
  }
`

export const GET_FORM_ANALYTICS = gql`
  query GetFormAnalytics($formId: ID!) {
    formAnalytics(formId: $formId) {
      totalSubmissions
      submissionsToday
      submissionsThisWeek
      submissionsThisMonth
      averageCompletionTime
      conversionRate
      fieldAnalytics {
        fieldId
        fieldLabel
        completionRate
        averageLength
        commonValues
      }
    }
  }
`

export const BULK_DELETE_FORMS = gql`
  mutation BulkDeleteForms($ids: [ID!]!) {
    bulkDeleteForms(ids: $ids)
  }
`

export const EXPORT_FORM_SUBMISSIONS = gql`
  mutation ExportFormSubmissions($formId: ID!, $format: String) {
    exportFormSubmissions(formId: $formId, format: $format)
  }
`

// ==============================================
// Subscriptions
// ==============================================

export const FORM_SUBMITTED = gql`
  subscription FormSubmitted($formId: ID!) {
    formSubmitted(formId: $formId) {
      id
      submissionId
      formTitle
      submittedAt
      status
      data
    }
  }
`

export const FORM_UPDATED = gql`
  subscription FormUpdated($formId: ID!) {
    formUpdated(formId: $formId) {
      id
      title
      description
      type
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
      updatedAt
      isActive
    }
  }
`

export const FORM_ANALYTICS_UPDATED = gql`
  subscription FormAnalyticsUpdated($formId: ID!) {
    formAnalyticsUpdated(formId: $formId) {
      totalSubmissions
      submissionsToday
      submissionsThisWeek
      submissionsThisMonth
      averageCompletionTime
      conversionRate
      fieldAnalytics {
        fieldId
        fieldLabel
        completionRate
        averageLength
        commonValues
      }
    }
  }
`

// ==============================================
// Apollo Client Error Handling
// ==============================================

export const handleGraphQLError = (error: any) => {
  if (error.networkError) {
    console.error('Network error:', error.networkError)
    return {
      type: 'NETWORK_ERROR',
      message: 'Network connection failed. Please check your internet connection.',
    }
  }

  if (error.graphQLErrors?.length > 0) {
    const graphQLError = error.graphQLErrors[0]
    console.error('GraphQL error:', graphQLError)
    return {
      type: 'GRAPHQL_ERROR',
      message: graphQLError.message,
      code: graphQLError.extensions?.code,
    }
  }

  return {
    type: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again.',
  }
}

// ==============================================
// Validation Schemas
// ==============================================

export const validateFormInput = (input: CreateFormInput): string[] => {
  const errors: string[] = []

  if (!input.title.trim()) {
    errors.push('Form title is required')
  }

  if (input.title.length > 100) {
    errors.push('Form title must be less than 100 characters')
  }

  if (input.description && input.description.length > 500) {
    errors.push('Form description must be less than 500 characters')
  }

  if (!input.fields || input.fields.length === 0) {
    errors.push('At least one field is required')
  }

  input.fields.forEach((field, index) => {
    if (!field.label.trim()) {
      errors.push(`Field ${index + 1}: Label is required`)
    }

    if (field.label.length > 100) {
      errors.push(`Field ${index + 1}: Label must be less than 100 characters`)
    }

    if (['SELECT', 'CHECKBOX', 'RADIO'].includes(field.type) && (!field.options || field.options.length === 0)) {
      errors.push(`Field ${index + 1}: Options are required for ${field.type} fields`)
    }
  })

  return errors
}

export const validateSubmissionInput = (input: FormSubmissionInput, form: Form): string[] => {
  const errors: string[] = []

  if (!input.formId) {
    errors.push('Form ID is required')
  }

  if (!input.data || Object.keys(input.data).length === 0) {
    errors.push('Form data is required')
  }

  // Validate required fields
  form.fields.forEach(field => {
    if (field.required) {
      const value = input.data[field.id]
      if (field.type === 'CHECKBOX') {
        // For checkboxes, check if at least one option is selected
        const hasSelection = field.options?.some((_, index) => 
          input.data[`${field.id}-${index}`]
        )
        if (!hasSelection) {
          errors.push(`${field.label} is required`)
        }
      } else if (!value && value !== false && value !== 0) {
        errors.push(`${field.label} is required`)
      }
    }
  })

  return errors
}