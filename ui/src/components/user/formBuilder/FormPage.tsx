"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { gql, useQuery, useMutation } from "@apollo/client";

import { Button } from "@/components/ui/button";
import { FormPreview } from "./FormPreview";
import { FormSubmission } from "./FormSubmission";
import { toast } from "sonner";

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
`;

// Fixed GraphQL mutation to match your schema
const SUBMIT_FORM = gql`
  mutation SubmitForm($input: FormSubmissionInput!, $signImage: [Upload]) {
    submitForm(input: $input, signImage: $signImage) {
      id
      formId
      data
      status
      userId
      serviceId
      createdAt
      updatedAt
    }
  }
`;

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

  return form.fields.every(
    (field: any) => field.id && field.type && field.label
  );
};

export default function FormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [signatureFiles, setSignatureFiles] = useState<File[]>([]);
  const [localForm, setLocalForm] = useState<Form | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // GraphQL query to fetch form
  const { data, loading, error, refetch } = useQuery(GET_FORM, {
    variables: { id: id },
    skip: !id,
    errorPolicy: "all",
  });

  // GraphQL mutation for form submission
  const [submitFormMutation] = useMutation(SUBMIT_FORM, {
    onCompleted: (data) => {
      console.log("Form submitted successfully:", data);
      setSubmissionResult(data.submitForm);
      setIsSubmitted(true);
      setIsSubmitting(false);
      toast.success("Form submitted successfully!", {
        description: "Your form has been submitted and is being processed.",
      });
    },
    onError: (error) => {
      console.error("Form submission error:", error);
      setIsSubmitting(false);
      toast.error("Submission failed", {
        description:
          error.message ||
          "An error occurred while submitting the form. Please try again.",
      });
    },
  });

  // Initialize form data based on form fields
  const initializeFormData = (form: Form) => {
    const initialData: Record<string, any> = {};

    // Sort fields by order before initializing
    const sortedFields = [...form.fields].sort(
      (a, b) => (a.order || 0) - (b.order || 0)
    );

    sortedFields.forEach((field: FormField) => {
      const fieldType = field.type.toUpperCase();
      const fieldKey = field.label; // Use label instead of ID

      if (fieldType === "CHECKBOX") {
        // For checkbox fields, initialize each option
        field.options?.forEach((option, index: number) => {
          initialData[`${fieldKey}-${option}`] = false; // Use label + option name
        });
      } else if (fieldType === "SIGNATURE") {
        initialData[fieldKey] = null;
      } else {
        initialData[fieldKey] = "";
      }
    });
    setFormData(initialData);
  };

  // Effect to handle form data initialization
  useEffect(() => {
    const form = data?.form || localForm;
    if (form && Object.keys(formData).length === 0) {
      initializeFormData(form);
    }
  }, [data?.form, localForm, formData]);

  // Updated handleInputChange function - simplified for auto-capture
  const handleInputChange = (fieldId: string, value: any) => {
    const form = data?.form || localForm;
    const field = form?.fields.find((f) => f.id === fieldId);
    const fieldKey = field?.label || fieldId;

    // Handle checkbox special case
    if (
      typeof value === "object" &&
      value.option &&
      typeof value.checked !== "undefined"
    ) {
      const checkboxKey = `${fieldKey}-${value.option}`;
      setFormData((prev) => ({
        ...prev,
        [checkboxKey]: value.checked,
      }));
      return;
    }

    // Handle signature fields
    if (field?.type.toUpperCase() === "SIGNATURE") {
      // If it's a file upload, store the file
      if (value instanceof File) {
        setFormData((prev) => ({
          ...prev,
          [fieldKey]: value,
        }));

        // Update signature files array
        setSignatureFiles((prev) => {
          const newFiles = [...prev];
          const existingIndex = newFiles.findIndex((f) =>
            f.name.includes(fieldKey)
          );
          if (existingIndex >= 0) {
            newFiles[existingIndex] = value;
          } else {
            newFiles.push(value);
          }
          return newFiles;
        });
        return;
      } else {
        // For drawn signatures, just store the status (will be captured on submit)
        setFormData((prev) => ({
          ...prev,
          [fieldKey]: value, // "signature_present" or null
        }));
        return;
      }
    }

    // Handle regular form data
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  // Updated validation for signature fields
  const validateRequiredFields = (form: Form) => {
    const requiredFields = form.fields.filter(
      (field: FormField) => field.required
    );

    const missingFields = requiredFields.filter((field: FormField) => {
      const fieldType = field.type.toUpperCase();
      const fieldKey = field.label;

      if (fieldType === "SIGNATURE") {
        const signatureValue = formData[fieldKey];

        // Check various ways signature can be provided
        return (
          !(signatureValue instanceof File) &&
          signatureValue !== "signature_provided" &&
          signatureValue !== "signature_present" &&
          !signatureFiles.some((f) => f.name.includes(fieldKey))
        );
      }

      if (fieldType === "CHECKBOX") {
        const hasSelectedOption = field.options?.some(
          (option) => formData[`${fieldKey}-${option}`]
        );
        return !hasSelectedOption;
      }

      const value = formData[fieldKey];
      return !value && value !== false && value !== 0;
    });

    return { isValid: missingFields.length === 0, missingFields };
  };

  const validateFieldData = (form: Form) => {
    const errors: string[] = [];

    form.fields.forEach((field: FormField) => {
      const fieldKey = field.label;
      const value = formData[fieldKey];
      const fieldType = field.type.toUpperCase();

      // Skip validation if field is empty and not required
      if (!field.required && (!value || value === "")) {
        return;
      }

      // Skip validation for non-text fields
      if (["CHECKBOX", "RADIO", "SELECT", "SIGNATURE"].includes(fieldType)) {
        return;
      }

      // Skip validation if no validation rule is set
      if (!field.validation || field.validation.trim() === "") {
        return;
      }

      // Convert value to string for validation
      const stringValue = String(value || "").trim();

      // Skip if value is empty (already handled by required field validation)
      if (stringValue === "") {
        return;
      }

      console.log(`🔍 Validating field: "${field.label}"`);
      console.log(`   - Field type: ${fieldType}`);
      console.log(`   - Validation rule: "${field.validation}"`);
      console.log(`   - Current value: "${stringValue}"`);

      // Email validation
      if (field.validation === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(stringValue)) {
          console.log(`❌ Email validation failed for field: ${field.label}`);
          errors.push(`${field.label} must be a valid email address`);
        } else {
          console.log(`✅ Email validation passed for field: ${field.label}`);
        }
        return;
      }

      // Phone validation
      if (field.validation === "phone") {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const cleanedPhone = stringValue.replace(/[\s\-\(\)]/g, "");
        if (!phoneRegex.test(cleanedPhone)) {
          console.log(`❌ Phone validation failed for field: ${field.label}`);
          errors.push(`${field.label} must be a valid phone number`);
        } else {
          console.log(`✅ Phone validation passed for field: ${field.label}`);
        }
        return;
      }

      // URL validation
      if (field.validation === "url") {
        try {
          new URL(stringValue);
          console.log(`✅ URL validation passed for field: ${field.label}`);
        } catch {
          console.log(`❌ URL validation failed for field: ${field.label}`);
          errors.push(`${field.label} must be a valid URL`);
        }
        return;
      }

      // Number validation
      if (field.validation === "number") {
        if (isNaN(Number(stringValue))) {
          console.log(`❌ Number validation failed for field: ${field.label}`);
          errors.push(`${field.label} must be a valid number`);
        } else {
          console.log(`✅ Number validation passed for field: ${field.label}`);
        }
        return;
      }

      // Custom regex validation (only if not a predefined type)
      if (!["email", "phone", "url", "number"].includes(field.validation)) {
        // Handle common invalid validation strings
        if (
          field.validation === "custom regex" ||
          field.validation === "text" ||
          field.validation === "string" ||
          field.validation === "name" ||
          field.validation === "names"
        ) {
          console.log(
            `⚠️ Skipping invalid validation rule: "${field.validation}" for field: ${field.label}`
          );
          return;
        }

        try {
          console.log(`🔧 Testing custom regex: ${field.validation}`);
          const regex = new RegExp(field.validation);
          if (!regex.test(stringValue)) {
            console.log(
              `❌ Custom regex validation failed for field: ${field.label}`
            );
            console.log(`   - Expected pattern: ${field.validation}`);
            console.log(`   - Actual value: ${stringValue}`);
            errors.push(
              `${field.label} format is invalid (expected pattern: ${field.validation})`
            );
          } else {
            console.log(
              `✅ Custom regex validation passed for field: ${field.label}`
            );
          }
        } catch (regexError) {
          console.warn(
            `⚠️ Invalid regex pattern for field ${field.label}: ${field.validation}`,
            regexError
          );
          // Don't add error for invalid regex patterns, just skip validation
        }
      }
    });

    if (errors.length > 0) {
      console.log(`🚨 Total validation errors found: ${errors.length}`);
      console.log("Error details:", errors);
    } else {
      console.log("✅ All validations passed!");
    }

    return errors;
  };

  // Updated handleSubmit function with automatic signature capture
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const form = data?.form || localForm;
    if (!form) {
      toast.error("Form data not available");
      return;
    }

    // Check if form is active
    if (!form.isActive) {
      toast.error("Form is not accepting submissions", {
        description:
          "This form has been deactivated and no longer accepts new submissions.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Auto-capture signatures from canvas elements
      const signatureFields = form.fields.filter(
        (field) => field.type.toUpperCase() === "SIGNATURE"
      );
      const capturedSignatures: File[] = [];

      console.log(
        `🔍 Found ${signatureFields.length} signature fields to process`
      );

      for (const field of signatureFields) {
        const fieldKey = field.label;

        // Check if user already uploaded a file
        if (formData[fieldKey] instanceof File) {
          capturedSignatures.push(formData[fieldKey]);
          console.log(`✅ Using uploaded file for field: ${fieldKey}`);
          continue;
        }

        // Find the signature canvas for this field
        const signatureElement = document.querySelector(
          `[data-signature-field="${field.id}"]`
        );

        if (signatureElement) {
          const canvas = signatureElement.querySelector("canvas");
          if (canvas) {
            // Check if canvas has signature content
            const context = canvas.getContext("2d");
            if (context) {
              const imageData = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
              const hasSignature = imageData.data.some(
                (channel) => channel !== 0
              );

              if (hasSignature) {
                // Convert canvas to blob and then to file
                const blob = await new Promise<Blob>((resolve) => {
                  canvas.toBlob((blob) => {
                    resolve(blob!);
                  }, "image/png");
                });

                const signatureFile = new File(
                  [blob],
                  `signature-${fieldKey}-${Date.now()}.png`,
                  {
                    type: "image/png",
                    lastModified: Date.now(),
                  }
                );

                capturedSignatures.push(signatureFile);

                // Update form data
                setFormData((prev) => ({
                  ...prev,
                  [fieldKey]: signatureFile,
                }));

                console.log(
                  `✅ Auto-captured signature for field: ${fieldKey}`
                );
              } else if (field.required) {
                // Empty required signature field
                setIsSubmitting(false);
                toast.error("Missing required signature", {
                  description: `Please provide a signature for: ${field.label}`,
                  duration: 5000,
                });
                return;
              }
            }
          }
        } else if (field.required) {
          // Required signature field not found
          setIsSubmitting(false);
          toast.error("Missing required signature", {
            description: `Please provide a signature for: ${field.label}`,
            duration: 5000,
          });
          return;
        }
      }

      // Step 2: Update signature files state
      setSignatureFiles(capturedSignatures);
      console.log(`📎 Captured ${capturedSignatures.length} signature files`);

      // Step 3: Validate required fields
      const requiredValidation = validateRequiredFields(form);
      if (!requiredValidation.isValid) {
        const fieldNames = requiredValidation.missingFields
          .map((f) => f.label)
          .join(", ");
        setIsSubmitting(false);
        toast.error("Missing required fields", {
          description: `Please fill in: ${fieldNames}`,
          duration: 5000,
        });
        return;
      }

      // Step 4: Validate field data
      const validationErrors = validateFieldData(form);
      if (validationErrors.length > 0) {
        console.log("🚨 Validation errors found:", validationErrors);
        setIsSubmitting(false);
        toast.error("Validation errors", {
          description: validationErrors.join(". "),
          duration: 7000,
        });
        return;
      }

      // Step 5: Process form data for submission
      const processedData = { ...formData };

      form.fields.forEach((field: FormField) => {
        const fieldKey = field.label;

        if (field.type.toUpperCase() === "CHECKBOX") {
          // Process checkbox data
          const selectedOptions =
            field.options?.filter(
              (option) => formData[`${fieldKey}-${option}`]
            ) || [];
          processedData[fieldKey] = selectedOptions;

          // Remove individual checkbox entries
          field.options?.forEach((option) => {
            delete processedData[`${fieldKey}-${option}`];
          });
        } else if (field.type.toUpperCase() === "SIGNATURE") {
          // Mark signature as provided (files sent separately)
          if (
            capturedSignatures.some((file) => file.name.includes(fieldKey)) ||
            processedData[fieldKey] instanceof File
          ) {
            processedData[fieldKey] = "signature_provided";
          }
        }
      });

      // Step 6: Submit form
      const variables = {
        input: {
          formId: form.id,
          data: JSON.stringify(processedData),
        },
        signImage: capturedSignatures.length > 0 ? capturedSignatures : null,
      };

      console.log("📤 Submitting form:", {
        formId: form.id,
        dataFields: Object.keys(processedData),
        signatureCount: capturedSignatures.length,
      });

      await submitFormMutation({ variables });
    } catch (error) {
      console.error("💥 Submission error:", error);
      setIsSubmitting(false);
      toast.error("Submission failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    }
  };

  const handleBackToForms = () => {
    navigate(-1);
  };

  const handleRetryForm = () => {
    setIsSubmitted(false);
    setSubmissionResult(null);
    setSignatureFiles([]);
    // Reset form data
    const form = data?.form || localForm;
    if (form) {
      initializeFormData(form);
    }
  };

  // Loading state
  if (loading && !localForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center max-w-md w-full mx-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Form
          </h3>
          <p className="text-gray-600">
            Please wait while we fetch your form...
          </p>
        </div>
      </div>
    );
  }

  const form = data?.form || localForm;

  // Error state - form not found
  if (!loading && !form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Form Not Found
          </h2>
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
    );
  }

  // Form inactive state
  if (form && !form.isActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center max-w-md w-full mx-4">
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="h-8 w-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Form Not Available
          </h2>
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
    );
  }

  // Submission state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <FormSubmission
          formTitle={form.title}
          formId={form.id}
          submissionData={formData}
          submissionResult={submissionResult}
          onBackToForms={handleBackToForms}
          onRetry={handleRetryForm}
        />
      </div>
    );
  }

  // Sort fields by order before rendering
  const sortedFields = [...form.fields].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  // Main form display
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={handleBackToForms}
            className="text-gray-600 hover:text-gray-900"
            disabled={isSubmitting}
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
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
