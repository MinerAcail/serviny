/* eslint-disable @typescript-eslint/ban-ts-comment */
// The entire file is now ignored by TypeScript's type checking
// @ts-nocheck



import type React from "react";
import { useState } from "react";
import { useMutation, gql } from "@apollo/client";
import { type FieldValues, useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import OtpCard from "./createOTP";
// import MainNaveBar from "./menuBar";
import { countries } from "./data/countries";

// GraphQL Mutation
const CREATE_SERVICE = gql`
  mutation CreateService($dpfile: Upload, $input: CreateServiceInput!) {
    createService(dpfile: $dpfile, input: $input) {
      id
      name
      type
      number
      email
      location
      profession
    }
  }
`;
const REQUEST_OTP = gql`
  mutation RequestOtp($input: RequestOtpInput!) {
    requestOtp(input: $input) {
      success
      message
      otpSent
      email
    }
  }
`;

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
`;

const RESEND_OTP = gql`
  mutation ResendOtp($input: RequestOtpInput!) {
    resendOTP(input: $input) {
      success
      message
      # IsValid
      IsValid
      otpSent
      email
    }
  }
`;
// Types
interface Profession {
  value: string;
  label: string;
}

interface CreateServiceInput {
  name: string;
  number: string;
  email: string;
  location?: string;
  profession?: string[];
  password: string;
}

// Available professions for selection
const availableProfessions: Profession[] = [
  { value: "architect", label: "Architect" },
  { value: "interior_designer", label: "Interior Designer" },
  { value: "contractor", label: "Contractor" },
  { value: "landscaper", label: "Landscaper" },
  { value: "electrician", label: "Electrician" },
  { value: "plumber", label: "Plumber" },
  { value: "carpenter", label: "Carpenter" },
  { value: "painter", label: "Painter" },
];

export const CreateServiceProvider: React.FC = () => {
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // OTP verification states
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    number: string;
    email: string;
    location?: string;
    password?: string;
    confirmPassword?: string;
  } | null>(null);
  console.log(otpSent);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<{
    name: string;
    number: string;
    email: string;
    location?: string;
    password?: string;
    confirmPassword?: string;
  }>({
    defaultValues: {
      name: "",
      number: "",
      email: "",
      location: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Watch form values to enable form progression
  const watchedName = watch("name");
  const watchedEmail = watch("email");
  const watchedNumber = watch("number");
  const watchedPassword = watch("password");
  const watchedConfirmPassword = watch("confirmPassword");

  // GraphQL mutations
  const [createService] = useMutation(CREATE_SERVICE);
  const [requestOtp] = useMutation(REQUEST_OTP);
  const [verifyOtp] = useMutation(VERIFY_OTP);
  const [resendOTP] = useMutation(RESEND_OTP);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setProfilePic(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setProfilePic(null);
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
      setPreviewImage(null);
    }
  };

  const handleAddProfession = (profession: string) => {
    if (profession.trim() && !selectedProfessions.includes(profession)) {
      setSelectedProfessions([...selectedProfessions, profession]);
    }
    setInputValue(""); // Clear input after adding
  };

  const handleRemoveProfession = (profession: string) => {
    setSelectedProfessions(selectedProfessions.filter((p) => p !== profession));
  };

  // Send OTP before submitting form
  const handleSendOtp = async (data: {
    name: string;
    number: string;
    email: string;
    location?: string;
    password?: string;
    confirmPassword?: string;
  }) => {
    setIsLoading(true);
    setFormData(data);

    try {
      const result = await requestOtp({
        variables: {
          input: {
            email: data.email,
            name: data.name,
            number: data.number,
            type: "SERVICE",
          },
        },
      });

      if (result.data?.requestOtp?.success) {
        setOtpSent(true);
        setShowOtpVerification(true);
        toast.success("OTP Sent", {
          description: `Verification code sent to ${data.email}`,
        });
      } else {
        toast.error("Error", {
          description:
            result.data?.requestOtp?.message ||
            "Failed to send verification code",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to send verification code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (otpCode: string) => {
    setVerifyingOtp(true);

    try {
      const result = await verifyOtp({
        variables: {
          input: {
            email: formData?.email,
            otp: otpCode,
            type: "SERVICE",
          },
        },
      });

      if (result.data?.verifyOtp?.success && result.data?.verifyOtp?.IsValid) {
        toast.success("Verification Successful", {
          description: "Your email has been verified successfully",
        });

        // Submit the form data after successful verification
        if (formData) {
          if (formData?.password && formData?.confirmPassword) {
            submitFormData({
              ...formData,
              password: formData.password,
              confirmPassword: formData.confirmPassword,
            });
          } else {
            toast.error("Error", {
              description: "Password and Confirm Password are required.",
            });
          }
        }
      } else {
        toast.error("Verification Failed", {
          description:
            result.data?.verifyOtp?.message || "Invalid verification code",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Verification failed",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle OTP resend
  const handleResendOtp = async (data: {
    name: string;
    number: string;
    email: string;
    location?: string;
    password?: string;
    confirmPassword?: string;
  }) => {
    try {
      const result = await resendOTP({
        variables: {
          input: {
            email: data.email,
            name: data.name,
            number: data.number,
            type: "SERVICE",
          },
        },
      });

      if (result.data?.resendOTP?.success) {
        toast.success("OTP Resent", {
          description: `New verification code sent to ${formData?.email}`,
        });
      } else {
        toast.error("Error", {
          description:
            result.data?.resendOTP?.message ||
            "Failed to resend verification code",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to resend verification code",
      });
    }
  };

  // Submit form data to database after OTP verification
  const submitFormData = async (data: {
    name: string;
    number: string;
    email: string;
    location?: string;
    password: string;
    confirmPassword: string;
  }) => {
    setIsLoading(true);

    try {
      const input: CreateServiceInput = {
        name: data.name,
        number: data.number,
        email: data.email,
        location: data.location,
        profession: selectedProfessions,
        password: data.password,
      };

      await createService({
        variables: {
          dpfile: profilePic,
          input,
        },
      });

      // Reset form and states
      reset();
      setSelectedProfessions([]);
      setProfilePic(null);
      setShowOtpVerification(false);
      setOtpSent(false);
      setFormData(null);

      if (previewImage) {
        URL.revokeObjectURL(previewImage);
        setPreviewImage(null);
      }

      toast.success("Success!", {
        description: "Service provider profile created successfully.",
      });
    } catch (err) {
      toast.error("Error", {
        description:
          err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Form validation for each step
  const isPersonalInfoComplete = Boolean(
    watchedName &&
      watchedEmail &&
      !errors.name &&
      !errors.email &&
      watchedNumber &&
      !errors.number
  );

  const isPasswordValid: boolean =
    !!watchedPassword &&
    !!watchedConfirmPassword &&
    watchedPassword === watchedConfirmPassword &&
    !errors.password &&
    !errors.confirmPassword;

  // Initial form submission handler - triggers OTP flow
  const onSubmit = async (data: {
    name: string;
    number: string;
    email: string;
    location?: string;
    password?: string;
    confirmPassword?: string;
  }) => {
    // Check if password and confirm password match
    if (data.password !== data.confirmPassword) {
      toast.error("Error", {
        description: "Passwords do not match",
      });
      return;
    }

    // Initiate OTP verification process
    await handleSendOtp(data);
  };

  // Cancel OTP verification and go back to form
  const handleCancelOtp = () => {
    setShowOtpVerification(false);
    setOtpSent(false);
  };

  return (
    <div className=" py-8 w-full">
      {/* <div className="pb-14">
        <MainNaveBar />
      </div> */}

      <div className=" px-4 py-8 mx-auto">
        <div className="max-w-3xl mx-auto">
          {showOtpVerification ? (
            <div className="space-y-6">
              <OtpCard
                title="Email Verification"
                email={formData?.email}
                onSubmit={handleVerifyOtp}
                onResend={() => formData && handleResendOtp(formData)}
                loading={verifyingOtp}
              />

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleCancelOtp}
                  disabled={verifyingOtp}
                >
                  Back to Form
                </Button>
              </div>
            </div>
          ) : (
            <Card className="w-full shadow-lg border-0">
              <CardHeader className="border-b b-gray-50 rounded-t-lg">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary" />
                  Create Service Provider Profile
                </CardTitle>
                <CardDescription>
                  Fill out the information below to create your professional
                  profile
                </CardDescription>
              </CardHeader>
              <FormsInfor
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isPersonalInfoComplete={isPersonalInfoComplete}
                isPasswordValid={isPasswordValid}
                handleSubmit={handleSubmit}
                // @ts-expect-error: Type mismatch due to custom form handling logic
                onSubmit={handleSubmit(onSubmit)}
                // @ts-expect-error: Type mismatch due to custom form handling logic

                register={register}
                watchedPassword={watchedPassword || ""}
                errors={errors}
                selectedProfessions={selectedProfessions}
                inputValue={inputValue}
                setInputValue={setInputValue}
                handleAddProfession={handleAddProfession}
                handleRemoveProfession={handleRemoveProfession}
                availableProfessions={availableProfessions}
                previewImage={previewImage}
                handleFileChange={handleFileChange}
                handleRemoveImage={handleRemoveImage}
                isLoading={isLoading}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                showConfirmPassword={showConfirmPassword}
                setShowConfirmPassword={setShowConfirmPassword}
              />

              {/* /> */}
              <CardFooter className="flex justify-between border-t p-6  rounded-b-lg">
                <Button
                  variant="outline"
                  onClick={() => {
                    reset();
                    setSelectedProfessions([]);
                    setProfilePic(null);
                    if (previewImage) {
                      URL.revokeObjectURL(previewImage);
                      setPreviewImage(null);
                    }
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>

                <div className="text-sm text-gray-500">
                  Already have an account?{" "}
                  <a
                    href="/login"
                    className="text-primary font-medium hover:underline"
                  >
                    Sign in here
                  </a>
                </div>
              </CardFooter>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

interface FormsInforProps {
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  isPersonalInfoComplete: boolean;
  isPasswordValid: boolean;
  handleSubmit: ReturnType<typeof useForm>["handleSubmit"];
  onSubmit: (data: FieldValues) => void;
  register: ReturnType<typeof useForm>["register"];
  errors: ReturnType<typeof useForm>["formState"]["errors"];
  watchedPassword: string;
  selectedProfessions: string[];
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  handleAddProfession: (profession: string) => void;
  handleRemoveProfession: (profession: string) => void;
  availableProfessions: Profession[];
  previewImage: string | null;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveImage: () => void;
  isLoading: boolean;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmPassword: boolean;
  setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
}

const FormsInfor: React.FC<FormsInforProps> = ({
  activeTab,
  setActiveTab,
  isPersonalInfoComplete,
  isPasswordValid,
  handleSubmit,
  onSubmit,
  register,
  errors,
  watchedPassword,
  selectedProfessions,
  inputValue,
  setInputValue,
  handleAddProfession,
  handleRemoveProfession,
  availableProfessions,
  previewImage,
  handleFileChange,
  handleRemoveImage,
  isLoading,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}) => {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [city, setCity] = useState("");

  const updateLocationValue = ({
    country,
    city,
  }: {
    country: string;
    city: string;
  }): void => {
    const locationValue =
      country && city ? `${country}-${city}` : country || city || "";
    console.log("locationValue", locationValue);

    // Update the hidden input for location
    const locationInput = document.getElementById(
      "location"
    ) as HTMLInputElement | null;
    if (locationInput) {
      locationInput.value = locationValue;
    }
  };

  return (
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
            value="professional"
            className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            disabled={!isPersonalInfoComplete}
          >
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Professional</span>
            <span className="sm:hidden">Prof.</span>
          </TabsTrigger>
          <TabsTrigger
            value="account"
            className="flex gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            disabled={!isPersonalInfoComplete}
          >
            <CheckCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
            <span className="sm:hidden">Secure</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <CardContent>
        <form id="service-form" onSubmit={handleSubmit(onSubmit)}>
          <TabsContent value="personal" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className={`flex items-center gap-2 ${
                    errors.name ? "text-destructive" : ""
                  }`}
                >
                  <User className="h-4 w-4" />
                  Full Name / Business Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your name or business name"
                  {...register("name", { required: "Name is required" })}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">
                    {typeof errors.name.message === "string" &&
                      errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className={`flex items-center gap-2 ${
                    errors.email ? "text-destructive" : ""
                  }`}
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
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {typeof errors.email.message === "string" &&
                      errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="number"
                  className={`flex items-center gap-2 ${
                    errors.number ? "text-destructive" : ""
                  }`}
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
                  })}
                  className={errors.number ? "border-destructive" : ""}
                />
                {errors.number && (
                  <p className="text-sm text-destructive">
                    {typeof errors.number.message === "string" &&
                      errors.number.message}
                  </p>
                )}
              </div>

              {/* Country-City Selection */}
              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className={`flex items-center gap-2 ${
                    errors.location ? "text-destructive" : ""
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  Location / Service Area
                </Label>
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Select
                        onValueChange={(value) => {
                          setSelectedCountry(value);
                          updateLocationValue({ country: value, city });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        placeholder="Enter City"
                        value={city}
                        onChange={(e) => {
                          const newCity = e.target.value;
                          setCity(newCity);
                          updateLocationValue({
                            country: selectedCountry,
                            city: newCity,
                          });
                        }}
                      />
                    </div>
                  </div>
                  {selectedCountry && city && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Selected Location:</span>{" "}
                      {selectedCountry}-{city}
                    </div>
                  )}
                </div>
                <Input
                  id="location"
                  type="hidden"
                  {...register("location")}
                  className={errors.location ? "border-destructive" : ""}
                />
                {errors.location && (
                  <p className="text-sm text-destructive">
                    {typeof errors.location.message === "string" &&
                      errors.location.message}
                  </p>
                )}
              </div>
            </div>

            {isPersonalInfoComplete && (
              <div className="flex justify-end mt-6">
                <Button
                  type="button"
                  onClick={() => setActiveTab("professional")}
                  className="flex items-center gap-2"
                >
                  Continue to Professional Info
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

          <TabsContent value="professional" className="mt-0 space-y-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Professions / Services Offered
                  </Label>
                  {selectedProfessions.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {selectedProfessions.length} selected
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Dropdown */}
                  <div>
                    <Select onValueChange={handleAddProfession}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a profession" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProfessions.map((profession) => (
                          <SelectItem
                            key={profession.value}
                            value={profession.value}
                            disabled={selectedProfessions.includes(
                              profession.value
                            )}
                          >
                            {profession.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Manual Input for Custom Professions */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Type a custom profession and press Enter"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddProfession(inputValue);
                        }
                      }}
                      onBlur={() => {
                        if (inputValue.trim()) {
                          handleAddProfession(inputValue);
                        }
                      }}
                    />
                    {inputValue && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={() => handleAddProfession(inputValue)}
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
                          className="lucide lucide-plus"
                        >
                          <path d="M5 12h14" />
                          <path d="M12 5v14" />
                        </svg>
                      </Button>
                    )}
                  </div>
                </div>

                {/* Display Selected Professions */}
                <div className=" rounded-lg p-4 min-h-24">
                  {selectedProfessions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedProfessions.map((profession) => {
                        const professionLabel =
                          availableProfessions.find(
                            (p) => p.value === profession
                          )?.label || profession;
                        return (
                          <Badge
                            key={profession}
                            variant="secondary"
                            className="pl-2 pr-1 py-1 text-sm"
                          >
                            {professionLabel}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => handleRemoveProfession(profession)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-2">
                      <p className="text-sm">No professions selected yet</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Picture
                </Label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
                      previewImage ? "border-primary" : "border-gray-300"
                    }`}
                    onClick={() =>
                      document.getElementById("profile-picture")?.click()
                    }
                  >
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium">
                      {previewImage
                        ? "Change picture"
                        : "Upload profile picture"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPG, PNG, WebP (Max 5MB)
                    </p>
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
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
                        className="text-xs"
                        onClick={handleRemoveImage}
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
                      <p className="text-xs text-gray-500 mt-3">
                        No image selected
                      </p>
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
                  onClick={() => setActiveTab("account")}
                  className="flex items-center gap-2"
                >
                  Continue to Security
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
            </div>
          </TabsContent>

          <TabsContent value="account" className="mt-0 space-y-6">
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
                Create a strong password to secure your service provider
                account.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <Label
                  htmlFor="password"
                  className={`flex items-center gap-2 ${
                    errors.password ? "text-destructive" : ""
                  }`}
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
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {typeof errors.password.message === "string" &&
                      errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 relative">
                <Label
                  htmlFor="confirmPassword"
                  className={`flex items-center gap-2 ${
                    errors.confirmPassword ? "text-destructive" : ""
                  }`}
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
                      validate: (value, formValues) =>
                        value === formValues.password ||
                        "Passwords do not match",
                    })}
                    className={
                      errors.confirmPassword ? "border-destructive" : ""
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {typeof errors.confirmPassword.message === "string" &&
                      errors.confirmPassword.message}
                  </p>
                )}
              </div>
            </div>

            {watchedPassword && watchedPassword.length >= 8 && (
              <div className="mt-4">
                <div className="flex items-center space-x-2">
                  <div className="bg-green-100 text-green-800 rounded-full p-1">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-green-800">
                    Password meets minimum length requirement
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("professional")}
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
                type="submit"
                disabled={isLoading || !isPasswordValid}
                className="min-w-[140px]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Setup
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </form>
      </CardContent>
    </Tabs>
  );
};
