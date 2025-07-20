"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useMutation, gql } from "@apollo/client"
import { useForm } from "react-hook-form"
import { useJsApiLoader, type Libraries } from "@react-google-maps/api"
import { useNavigate } from "react-router"

// UI Components
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
// import { NotificationAlertDialog } from "@/components/ui/notification-alert-dialog" // New import for AlertDialog
import {
  Loader2,
  X,
  Upload,
  CheckCircle,
  EyeOff,
  Eye,
  User,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  Camera,
  FileText,
  Calendar,
  Star,
  AlertTriangle,
} from "lucide-react"

import { OtpCard } from "@/components/serviceProviders/createOTP"
import { ErrorBoundary, NotificationAlertDialog } from "../GlobalLogic/ErrorBoundary"
// import { ErrorBoundary } from "@/components/error-boundary" // Updated import path

// Fixed GraphQL Mutation with proper file upload parameters
const CREATE_RIDER = gql`
  mutation craeteRider(
    $input: RiderInput!
    $dpfile: Upload
    $idCardfiles: [Upload!]
  ) {
    craeteRider(input: $input, dpfile: $dpfile, idCardfiles: $idCardfiles) {
      id
      name
      email
      type
      number
      location
      availability
      experience
      createdAt
    }
  }
`
const REQUEST_OTP = gql`
  mutation RequestOtp($input: RequestOtpInput!) {
    requestOtp(input: $input) {
      success
      message
      otpSent
      email
    }
  }
`
const VERIFY_OTP = gql`
  mutation VerifyOtp($input: VerifyOtpInput!) {
    verifyOtp(input: $input) {
      success
      message
      IsValid
      otpSent
      email
    }
  }
`
const RESEND_OTP = gql`
  mutation ResendOtp($input: RequestOtpInput!) {
    resendOTP(input: $input) {
      success
      message
      IsValid
      otpSent
      email
    }
  }
`

// Types
interface FormData {
  name: string
  email: string
  password?: string
  confirmPassword?: string
  number: string
  location?: string
  experience: string
  type: string
  availability?: boolean
}
interface PlacePrediction {
  description: string
  place_id: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}
interface ExperienceOption {
  value: string
  label: string
}

const riderTypes: string[] = ["DELIVERY", "COURIER", "TAXI"]
const experienceOptions: ExperienceOption[] = [
  { value: "0-1", label: "0-1 years" },
  { value: "1-2", label: "1-2 years" },
  { value: "2-5", label: "2-5 years" },
  { value: "5+", label: "5+ years" },
]

// The actual RiderRegistration component content
function RiderRegistrationContent(): JSX.Element {
  // Google Maps API configuration
  const libraries: Libraries = ["places"]
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey,
    libraries,
  })

  // State for active tab
  const [activeTab, setActiveTab] = useState<string>("personal")
  // State for form fields
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [idCardPreviews, setIdCardPreviews] = useState<string[]>([])
  const [coordinates, setCoordinates] = useState<number[]>([])
  // State for password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false)
  // Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false)
  // Refs
  const searchInputRef = useRef<HTMLDivElement>(null)
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const geocoderRef = useRef<google.maps.Geocoder | null>(null)
  // State for location search
  const [searchValue, setSearchValue] = useState<string>("")
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false)
  const [showPredictions, setShowPredictions] = useState<boolean>(false)
  // State to store form data before OTP verification
  const [formDataToSubmit, setFormDataToSubmit] = useState<FormData | null>(null)
  const [showOtpVerification, setShowOtpVerification] = useState(false)
  const navigate = useNavigate()
  // Fixed file upload state - moved inside component
  const [profilePic, setProfilePic] = useState<File | null>(null)
  const [idCards, setIdCards] = useState<File[]>([])

  // State for NotificationAlertDialog
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean
    title: string
    description: string
    type: "success" | "error" | "warning" | "info"
  } | null>(null)

  const showDialog = (title: string, description: string, type: "success" | "error" | "warning" | "info") => {
    setDialogState({ isOpen: true, title, description, type })
  }

  const closeDialog = () => {
    setDialogState(null)
  }

  // Form validation
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      email: "",
      number: "",
      experience: "0-1",
      type: "DELIVERY",
      availability: true,
    },
  })

  // Watch form values
  const watchedName = watch("name")
  const watchedEmail = watch("email")
  const watchedNumber = watch("number")
  const watchedPassword = watch("password")
  const watchedConfirmPassword = watch("confirmPassword")
  const watchedLocation = watch("location")

  // GraphQL mutations with error handling
  const [createRiderMutation] = useMutation(CREATE_RIDER, {
    errorPolicy: "all",
    onError: (error) => {
      console.error("GraphQL mutation error:", error)
      showDialog("Registration Failed", error.message || "Please try again later.", "error")
    },
  })
  const [requestOtpMutation] = useMutation(REQUEST_OTP)
  const [verifyOtpMutation] = useMutation(VERIFY_OTP)
  const [resendOtpMutation] = useMutation(RESEND_OTP)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  // Handle Google Maps load error
  useEffect(() => {
    if (loadError) {
      console.error("Google Maps failed to load:", loadError)
      showDialog("Maps Service Unavailable", "Location search may not work properly.", "warning")
    }
  }, [loadError])

  // Initialize Google services when API is loaded
  useEffect(() => {
    if (!isLoaded || loadError) return
    try {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService()
      geocoderRef.current = new window.google.maps.Geocoder()
    } catch (error) {
      console.error("Error initializing Google Maps services:", error)
      showDialog("Location Services Unavailable", "You can still register but location search won't work.", "warning")
    }
  }, [isLoaded, loadError])

  // Handle search input change with error handling
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchValue(value)
    if (value.length > 2 && autocompleteServiceRef.current) {
      setShowPredictions(true)
      fetchPredictions(value)
    } else {
      setPredictions([])
      setShowPredictions(false)
    }
  }

  // Fetch predictions from Google Places API with error handling
  const fetchPredictions = async (input: string) => {
    if (!autocompleteServiceRef.current) return
    try {
      setIsSearchLoading(true)
      autocompleteServiceRef.current.getPlacePredictions({ input }, (predictions, status) => {
        setIsSearchLoading(false)
        if (status !== window.google.maps.places.PlacesServiceStatus.OK || !predictions) {
          if (status !== window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.error("Error fetching predictions:", status)
            showDialog("Location Search Error", "Unable to search locations. Please try again.", "error")
          }
          setPredictions([])
          return
        }
        setPredictions(
          predictions.map((p) => ({
            description: p.description,
            place_id: p.place_id,
            structured_formatting: {
              main_text: p.structured_formatting?.main_text || p.description,
              secondary_text: p.structured_formatting?.secondary_text || "",
            },
          })),
        )
      })
    } catch (error) {
      console.error("Error fetching predictions:", error)
      setIsSearchLoading(false)
      setPredictions([])
      showDialog("Location Search Failed", "Please try typing your location manually.", "error")
    }
  }

  // Handle prediction selection with error handling
  const handlePredictionSelect = (place: PlacePrediction) => {
    setSearchValue(place.description)
    setShowPredictions(false)
    // Store the location description for form submission
    setValue("location", place.description)
    // Get coordinates from place_id
    if (geocoderRef.current) {
      geocoderRef.current.geocode({ placeId: place.place_id }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0] && results[0].geometry) {
          const lat = results[0].geometry.location.lat()
          const lng = results[0].geometry.location.lng()
          setCoordinates([lng, lat])
        } else {
          console.error("Geocoding failed:", status)
          showDialog(
            "Location Coordinates Unavailable",
            "Location saved but coordinates couldn't be determined.",
            "warning",
          )
        }
      })
    }
  }

  // Close predictions when clicking outside search input
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowPredictions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Handle profile picture upload with better error handling
  const handleProfilePicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (event.target.files && event.target.files[0]) {
        const file = event.target.files[0]
        // Validate file type
        if (!file.type.startsWith("image/")) {
          showDialog("Invalid File Type", "Please select an image file (JPG, PNG, WebP).", "error")
          return
        }
        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          showDialog("File Too Large", "Image must be less than 5MB in size", "error")
          return
        }
        setProfilePic(file)
        // Generate preview URL
        const objectUrl = URL.createObjectURL(file)
        setPreviewImage(objectUrl)
        // showDialog("Profile Picture Uploaded", "Image ready for submission.", "success")
      }
    } catch (error) {
      console.error("Error handling profile picture:", error)
      showDialog("Upload Failed", "Failed to process profile picture. Please try again.", "error")
    }
  }

  // Handle ID card uploads with better error handling
  const handleIdCardChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (event.target.files && event.target.files.length > 0) {
        const newFiles = Array.from(event.target.files)
        // Validate file types
        const invalidFiles = newFiles.filter(
          (file) => !file.type.startsWith("image/") && file.type !== "application/pdf",
        )
        if (invalidFiles.length > 0) {
          showDialog("Invalid File Types", "Please select only image files (JPG, PNG) or PDF documents.", "error")
          return
        }
        // Check file sizes
        const largeFiles = newFiles.filter((file) => file.size > 5 * 1024 * 1024)
        if (largeFiles.length > 0) {
          showDialog("Files Too Large", "ID card files must be less than 5MB in size each", "error")
          return
        }
        // Add to existing ID cards
        setIdCards((prev) => [...prev, ...newFiles])
        // Generate previews for image files only
        const newPreviews = newFiles
          .filter((file) => file.type.startsWith("image/"))
          .map((file) => URL.createObjectURL(file))
        setIdCardPreviews((prev) => [...prev, ...newPreviews])
        // showDialog(
        //   "Documents Uploaded",
        //   `${newFiles.length} ID document(s) uploaded. Documents ready for submission.`,
        //   "success",
        // )
      }
    } catch (error) {
      console.error("Error handling ID cards:", error)
      showDialog("Upload Failed", "Failed to process ID documents. Please try again.", "error")
    }
  }

  // Remove a specific ID card
  const removeIdCard = (index: number) => {
    try {
      setIdCards((prev) => prev.filter((_, i) => i !== index))
      // Revoke the object URL to avoid memory leaks
      if (idCardPreviews[index]) {
        URL.revokeObjectURL(idCardPreviews[index])
      }
      setIdCardPreviews((prev) => prev.filter((_, i) => i !== index))
      showDialog("Document Removed", "ID document has been removed from upload queue.", "success")
    } catch (error) {
      console.error("Error removing ID card:", error)
      showDialog("Remove Failed", "Failed to remove document. Please try again.", "error")
    }
  }

  // Remove profile picture
  const handleRemoveProfilePic = () => {
    try {
      setProfilePic(null)
      if (previewImage) {
        URL.revokeObjectURL(previewImage)
        setPreviewImage(null)
      }
      showDialog("Profile Picture Removed", "You can upload a new profile picture if needed.", "success")
    } catch (error) {
      console.error("Error removing profile picture:", error)
      showDialog("Remove Failed", "Failed to remove profile picture. Please try again.", "error")
    }
  }

  // Clear all form data
  const handleClearForm = () => {
    try {
      // Reset form and state
      reset()
      setProfilePic(null)
      setIdCards([])
      setCoordinates([])
      setSearchValue("")
      setActiveTab("personal")
      setFormDataToSubmit(null) // Clear stored form data
      setShowOtpVerification(false) // Hide OTP verification
      // Clear previews and revoke URLs
      if (previewImage) URL.revokeObjectURL(previewImage)
      idCardPreviews.forEach((url) => URL.revokeObjectURL(url))
      setPreviewImage(null)
      setIdCardPreviews([])
      showDialog("Form Cleared", "All data has been reset.", "info")
    } catch (error) {
      console.error("Error clearing form:", error)
      showDialog("Clear Failed", "Failed to clear form. Please refresh the page.", "error")
    }
  }

  // Form validation for each step
  const isPersonalInfoComplete = Boolean(
    watchedName && watchedEmail && watchedNumber && !errors.name && !errors.email && !errors.number,
  )
  const isLocationInfoComplete = Boolean(watchedLocation && coordinates.length === 2)
  const isPasswordValid = Boolean(
    watchedPassword &&
      watchedConfirmPassword &&
      watchedPassword === watchedConfirmPassword &&
      watchedPassword.length >= 8 &&
      !errors.password &&
      !errors.confirmPassword,
  )

  // Send OTP
  const handleSendOtp = async (data: FormData) => {
    setIsLoading(true)
    setFormDataToSubmit(data) // Store data for later submission
    try {
      const result = await requestOtpMutation({
        variables: {
          input: {
            email: data.email,
            name: data.name,
            number: data.number,
            type: "SERVICE", // Assuming 'SERVICE' type for OTP request
          },
        },
      })
      if (result.data?.requestOtp?.success) {
        setShowOtpVerification(true) // Show OTP verification component
        showDialog("OTP Sent", `Verification code sent to ${data.number}`, "success")
      } else {
        showDialog("Error", result.data?.requestOtp?.message || "Failed to send verification code", "error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send verification code"
      showDialog("Error", errorMessage, "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Submit the actual rider registration after OTP verification
  const submitRiderRegistration = async (data: FormData) => {
    setIsLoading(true)
    try {
      // Prepare the input data
      const riderInput = {
        name: data.name,
        email: data.email,
        type: data.type,
        number: data.number,
        location: data.location,
        password: data.password,
        availability: data.availability ?? true,
        experience: data.experience,
        coordinates: coordinates.length === 2 ? coordinates : null,
      }
      // Execute the mutation with proper file handling
      const result = await createRiderMutation({
        variables: {
          input: riderInput,
          dpfile: profilePic, // Pass the file directly, not FormData
          idCardfiles: idCards, // Pass the file array directly
        },
      })
      if (result.data?.craeteRider) {
        // Show success message
        showDialog("Rider Registered Successfully", `${data.name} has been registered as a rider`, "success")
        // Reset form and navigate
        handleClearForm()
        navigate(`/login`)
      }
    } catch (error: unknown) {
      console.error("Error registering rider:", error)
      let errorMessage = "Failed to register rider. Please try again."
      if (error instanceof Error) {
        errorMessage = error.message
      }
      showDialog("Registration Failed", errorMessage, "error")
    } finally {
      setIsLoading(false)
    }
  }

  // Verify OTP
  const handleVerifyOtp = async (otpCode: string) => {
    setVerifyingOtp(true)
    if (!formDataToSubmit) {
      showDialog("Error", "Form data missing. Please restart registration.", "error")
      setVerifyingOtp(false)
      return
    }
    try {
      const result = await verifyOtpMutation({
        variables: {
          input: {
            number: formDataToSubmit.number, // Use number for verification
            otp: otpCode,
            type: "DELIVERY", // Assuming 'DELIVERY' type for verification
          },
        },
      })
      if (result.data?.verifyOtp?.success && result.data?.verifyOtp?.IsValid) {
        showDialog("Verification Successful", "Your number has been verified successfully", "success")
        // Proceed with actual rider registration
        await submitRiderRegistration(formDataToSubmit)
      } else {
        showDialog("Verification Failed", result.data?.verifyOtp?.message || "Invalid verification code", "error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Verification failed"
      showDialog("Error", errorMessage, "error")
    } finally {
      setVerifyingOtp(false)
    }
  }

  // Cancel OTP verification and go back to form
  const handleCancelOtp = () => {
    setShowOtpVerification(false)
    setFormDataToSubmit(null) // Clear stored data if user cancels
    setIsLoading(false) // Ensure loading is off
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (!formDataToSubmit) {
      showDialog("Error", "Cannot resend OTP. Form data missing.", "error")
      return
    }
    try {
      const result = await resendOtpMutation({
        variables: {
          input: {
            email: formDataToSubmit.email,
            name: formDataToSubmit.name,
            number: formDataToSubmit.number,
            type: "DELIVERY", // Assuming 'DELIVERY' type for resend
          },
        },
      })
      if (result.data?.resendOTP?.success) {
        showDialog("OTP Resent", `New verification code sent to ${formDataToSubmit.number}`, "success")
      } else {
        showDialog("Error", result.data?.resendOTP?.message || "Failed to resend verification code", "error")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to resend verification code"
      showDialog("Error", errorMessage, "error")
    }
  }

  // Main form submission handler - triggers OTP flow
  const onSubmit = async (data: FormData) => {
    // Check if password and confirm password match (already handled by react-hook-form validation)
    if (data.password !== data.confirmPassword) {
      showDialog("Error", "Passwords do not match", "error")
      return
    }
    // Trigger OTP flow
    await handleSendOtp(data)
  }

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (previewImage) URL.revokeObjectURL(previewImage)
      idCardPreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  // Show loading state for Google Maps
  if (!isLoaded && !loadError) {
    return (
      <div className="py-8 w-full">
        <div className="px-4 py-8 mx-auto">
          <div className="max-w-3xl mx-auto">
            <Card className="w-full shadow-lg border-0">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">Loading registration form...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Show OTP verification component if needed
  if (showOtpVerification) {
    return (
      <div className="space-y-6">
        <OtpCard
          title="Number Verification"
          email={formDataToSubmit?.number} // Pass the number for OTP
          onSubmit={handleVerifyOtp}
          onResend={handleResendOtp}
          loading={verifyingOtp}
        />
        <div className="flex justify-center px-6 pb-6">
          <Button variant="outline" onClick={handleCancelOtp} disabled={verifyingOtp}>
            Back to Form
          </Button>
        </div>
        {dialogState && (
          <NotificationAlertDialog
            isOpen={dialogState.isOpen}
            onClose={closeDialog}
            title={dialogState.title}
            description={dialogState.description}
            type={dialogState.type}
          />
        )}
      </div>
    )
  }

  return (
    <div className="py-8 w-full">
      <div className="px-4 py-8 mx-auto">
        <div className="max-w-3xl mx-auto">
          <Card className="w-full shadow-lg border-0">
            <CardHeader className="border-b border-gray-50 rounded-t-lg">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-primary" />
                Register as a Rider
              </CardTitle>
            </CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 pt-6">
                <TabsList className="grid w-full grid-cols-3 mb-6 h-14">
                  <TabsTrigger
                    value="personal"
                    className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">Personal Info</span>
                    <span className="sm:hidden">Info</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="location"
                    className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    disabled={!isPersonalInfoComplete}
                  >
                    <MapPin className="h-4 w-4" />
                    <span className="hidden sm:inline">Location</span>
                    <span className="sm:hidden">Location</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="verification"
                    className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    disabled={!isPersonalInfoComplete || !isLocationInfoComplete}
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">Verification</span>
                    <span className="sm:hidden">Verify</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              <CardContent>
                <form id="rider-form" onSubmit={handleSubmit(onSubmit)}>
                  {/* Personal Info Tab */}
                  <TabsContent value="personal" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="name"
                          className={`flex items-center gap-2 ${errors.name ? "text-destructive" : ""}`}
                        >
                          <User className="h-4 w-4" />
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          placeholder="Enter your full name"
                          {...register("name", {
                            required: "Name is required",
                            minLength: {
                              value: 2,
                              message: "Name must be at least 2 characters",
                            },
                          })}
                          className={errors.name ? "border-destructive" : ""}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className={`flex items-center gap-2 ${errors.email ? "text-destructive" : ""}`}
                        >
                          <Mail className="h-4 w-4" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="example@example.com"
                          {...register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Invalid email address",
                            },
                          })}
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="number"
                          className={`flex items-center gap-2 ${errors.number ? "text-destructive" : ""}`}
                        >
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </Label>
                        <Input
                          id="number"
                          placeholder="Enter your phone number"
                          {...register("number", {
                            required: "Phone number is required",
                            pattern: {
                              value: /^[0-9+ -]+$/,
                              message: "Invalid phone number format",
                            },
                            minLength: {
                              value: 10,
                              message: "Phone number must be at least 10 digits",
                            },
                          })}
                          className={errors.number ? "border-destructive" : ""}
                        />
                        {errors.number && <p className="text-sm text-destructive">{errors.number.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            Rider Type
                          </div>
                        </Label>
                        <Select onValueChange={(value) => setValue("type", value)} defaultValue="DELIVERY">
                          <SelectTrigger>
                            <SelectValue placeholder="Select rider type" />
                          </SelectTrigger>
                          <SelectContent>
                            {riderTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0) + type.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Experience
                          </div>
                        </Label>
                        <Select onValueChange={(value) => setValue("experience", value)} defaultValue="0-1">
                          <SelectTrigger>
                            <SelectValue placeholder="Years of experience" />
                          </SelectTrigger>
                          <SelectContent>
                            {experienceOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="availability" className="flex justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            Availability
                          </div>
                          <Switch
                            id="availability"
                            defaultChecked={true}
                            onCheckedChange={(checked) => setValue("availability", checked)}
                          />
                        </Label>
                        <p className="text-sm text-gray-500">Set your initial availability status</p>
                      </div>
                    </div>
                    {isPersonalInfoComplete && (
                      <div className="flex justify-end mt-6">
                        <Button
                          type="button"
                          onClick={() => setActiveTab("location")}
                          className="flex items-center gap-2"
                        >
                          Continue to Location
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="lucide lucide-chevron-right"
                          >
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  {/* Location Tab */}
                  <TabsContent value="location" className="mt-0 space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="location" className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4" />
                          Your Location
                        </Label>
                        {loadError && (
                          <Alert className="mb-4 bg-yellow-50 text-yellow-800 border-yellow-200">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Location search is unavailable. You can type your address manually.
                            </AlertDescription>
                          </Alert>
                        )}
                        <div className="relative" ref={searchInputRef}>
                          <Input
                            id="location"
                            placeholder="Search for your location or type manually"
                            value={searchValue}
                            onChange={handleSearchChange}
                            className="pr-10"
                          />
                          {searchValue && (
                            <button
                              type="button"
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              onClick={() => {
                                setSearchValue("")
                                setValue("location", "")
                                setCoordinates([])
                              }}
                            >
                              <X size={16} />
                            </button>
                          )}
                          {/* Predictions dropdown */}
                          {showPredictions && predictions.length > 0 && !loadError && (
                            <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                              {isSearchLoading ? (
                                <div className="p-3 text-center text-sm text-gray-500">
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                                  Searching...
                                </div>
                              ) : (
                                <ul className="py-1">
                                  {predictions.map((place) => (
                                    <li
                                      key={place.place_id}
                                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                      onClick={() => handlePredictionSelect(place)}
                                    >
                                      <div className="font-medium text-sm">{place.structured_formatting.main_text}</div>
                                      <div className="text-xs text-gray-500">
                                        {place.structured_formatting.secondary_text}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Location confirmation */}
                    {watchedLocation && coordinates.length === 2 && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-2">
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-blue-500 mr-2" />
                          <h3 className="font-medium">Location Confirmed</h3>
                        </div>
                        <p className="text-sm text-gray-600">{watchedLocation}</p>
                        <div className="text-xs text-gray-500">
                          Coordinates: {coordinates[1].toFixed(6)}, {coordinates[0].toFixed(6)}
                        </div>
                      </div>
                    )}
                    {/* Manual location entry fallback */}
                    {watchedLocation && coordinates.length === 0 && (
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 space-y-2">
                        <div className="flex items-center">
                          <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                          <h3 className="font-medium">Manual Location Entry</h3>
                        </div>
                        <p className="text-sm text-gray-600">{watchedLocation}</p>
                        <div className="text-xs text-gray-500">
                          Location saved without coordinates. This may affect location-based features.
                        </div>
                      </div>
                    )}
                    {/* Profile picture upload */}
                    <div className="space-y-4 mt-6">
                      <Label className="flex items-center gap-2">
                        <Camera className="h-4 w-4" />
                        Profile Picture (Optional)
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                            previewImage ? "border-primary" : "border-gray-300"
                          }`}
                          onClick={() => document.getElementById("profile-picture")?.click()}
                        >
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm font-medium">
                            {previewImage ? "Change picture" : "Upload profile picture"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, WebP (Max 5MB)</p>
                          <Input
                            id="profile-picture"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePicChange}
                            className="hidden"
                          />
                        </div>
                        {previewImage ? (
                          <div className="flex flex-col items-center space-y-3">
                            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary shadow-md">
                              <img
                                src={previewImage || "/placeholder.svg"}
                                alt="Profile Preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs bg-transparent"
                              onClick={handleRemoveProfilePic}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-12 w-12 text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500 mt-3">No image selected</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("personal")}
                        className="flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-chevron-left"
                        >
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                        Back
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setActiveTab("verification")}
                        disabled={!watchedLocation}
                        className="flex items-center gap-2"
                      >
                        Continue to Verification
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-chevron-right"
                        >
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </Button>
                    </div>
                  </TabsContent>
                  {/* Verification Tab */}
                  <TabsContent value="verification" className="mt-0 space-y-6">
                    <Alert className="bg-blue-50 text-blue-800 border-blue-200 mb-6">
                      <AlertDescription className="flex items-center gap-2 text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-shield-check"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                          <path d="m9 12 2 2 4-4" />
                        </svg>
                        Complete verification to secure your rider account.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-6">
                      {/* ID Card upload */}
                      <div className="space-y-4">
                        <Label className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          ID Card Documents (Optional)
                        </Label>
                        <p className="text-sm text-gray-500">
                          Upload your government-issued ID cards or driver's license (front and back)
                        </p>
                        <div
                          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors border-gray-300"
                          onClick={() => document.getElementById("id-cards")?.click()}
                        >
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm font-medium">Upload ID Documents</p>
                          <p className="text-xs text-gray-500 mt-1">Supported formats: JPG, PNG, PDF (Max 5MB each)</p>
                          <Input
                            id="id-cards"
                            type="file"
                            accept="image/*,application/pdf"
                            multiple
                            onChange={handleIdCardChange}
                            className="hidden"
                          />
                        </div>
                        {/* ID Card previews */}
                        {(idCardPreviews.length > 0 || idCards.length > 0) && (
                          <div className="space-y-4">
                            <h4 className="font-medium text-sm">Uploaded Documents ({idCards.length})</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              {idCardPreviews.map((preview, index) => (
                                <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200">
                                  <img
                                    src={preview || "/placeholder.svg"}
                                    alt={`ID Card ${index + 1}`}
                                    className="w-full h-32 object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeIdCard(index)}
                                    className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                                  >
                                    <X size={16} className="text-red-500" />
                                  </button>
                                  <div className="bg-gray-100 p-1 text-xs text-center">ID Document {index + 1}</div>
                                </div>
                              ))}
                              {/* Show non-image files */}
                              {idCards.slice(idCardPreviews.length).map((file, index) => (
                                <div
                                  key={`file-${idCardPreviews.length + index}`}
                                  className="relative rounded-lg border border-gray-200 p-4"
                                >
                                  <div className="flex flex-col items-center justify-center h-24">
                                    <FileText className="h-8 w-8 text-gray-400 mb-2" />
                                    <p className="text-xs text-center truncate w-full">{file.name}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeIdCard(idCardPreviews.length + index)}
                                    className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                                  >
                                    <X size={16} className="text-red-500" />
                                  </button>
                                  <div className="bg-gray-100 p-1 text-xs text-center">
                                    ID Document {idCardPreviews.length + index + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Password setup */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="space-y-2 relative">
                          <Label
                            htmlFor="password"
                            className={`flex items-center gap-2 ${errors.password ? "text-destructive" : ""}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-key"
                            >
                              <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
                            </svg>
                            Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Create a secure password"
                              {...register("password", {
                                required: "Password is required",
                                minLength: {
                                  value: 8,
                                  message: "Password must be at least 8 characters",
                                },
                                pattern: {
                                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                  message:
                                    "Password must contain at least one uppercase letter, one lowercase letter, and one number",
                                },
                              })}
                              className={errors.password ? "border-destructive" : ""}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                            >
                              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                        </div>
                        <div className="space-y-2 relative">
                          <Label
                            htmlFor="confirmPassword"
                            className={`flex items-center gap-2 ${errors.confirmPassword ? "text-destructive" : ""}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="lucide lucide-check-circle"
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <path d="m9 11 3 3L22 4" />
                            </svg>
                            Confirm Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              placeholder="Confirm your password"
                              {...register("confirmPassword", {
                                required: "Please confirm your password",
                                validate: (value) => value === watchedPassword || "Passwords do not match",
                              })}
                              className={errors.confirmPassword ? "border-destructive" : ""}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                            >
                              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                          </div>
                          {errors.confirmPassword && (
                            <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                          )}
                        </div>
                      </div>
                      {/* Password strength indicator */}
                      {watchedPassword && (
                        <div className="mt-4 space-y-2">
                          <div className="text-sm font-medium">Password Requirements:</div>
                          <div className="space-y-1">
                            <div
                              className={`flex items-center space-x-2 text-sm ${
                                watchedPassword.length >= 8 ? "text-green-600" : "text-gray-500"
                              }`}
                            >
                              {watchedPassword.length >= 8 ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                              )}
                              <span>At least 8 characters</span>
                            </div>
                            <div
                              className={`flex items-center space-x-2 text-sm ${
                                /[A-Z]/.test(watchedPassword) ? "text-green-600" : "text-gray-500"
                              }`}
                            >
                              {/[A-Z]/.test(watchedPassword) ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                              )}
                              <span>One uppercase letter</span>
                            </div>
                            <div
                              className={`flex items-center space-x-2 text-sm ${
                                /[a-z]/.test(watchedPassword) ? "text-green-600" : "text-gray-500"
                              }`}
                            >
                              {/[a-z]/.test(watchedPassword) ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                              )}
                              <span>One lowercase letter</span>
                            </div>
                            <div
                              className={`flex items-center space-x-2 text-sm ${
                                /\d/.test(watchedPassword) ? "text-green-600" : "text-gray-500"
                              }`}
                            >
                              {/\d/.test(watchedPassword) ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                              )}
                              <span>One number</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("location")}
                        className="flex items-center gap-2"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="lucide lucide-chevron-left"
                        >
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                        Back
                      </Button>
                      <Button type="submit" disabled={isLoading || !isPasswordValid} className="min-w-[140px]">
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Registering...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Complete Registration
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </form>
              </CardContent>
            </Tabs>
            <CardFooter className="flex justify-between border-t p-6 rounded-b-lg">
              <Button variant="outline" onClick={handleClearForm} disabled={isLoading}>
                Cancel
              </Button>
              <div className="text-sm text-gray-500">
                Already have an account?{" "}
                <a href="/login" className="text-primary font-medium hover:underline">
                  Sign in here
                </a>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
      {dialogState && (
        <NotificationAlertDialog
          isOpen={dialogState.isOpen}
          onClose={closeDialog}
          title={dialogState.title}
          description={dialogState.description}
          type={dialogState.type}
        />
      )}
    </div>
  )
}

// Default export wrapped with ErrorBoundary
export default function RiderRegistration() {
  return (
    <>
      <RiderRegistrationContent />
    </>
  )
}
