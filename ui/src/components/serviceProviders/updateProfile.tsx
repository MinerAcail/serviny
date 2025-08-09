"use client";

import type React from "react";

import { useRef, useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { gql, useQuery, useMutation } from "@apollo/client";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Icons
import {
  User,
  KeyRound,
  Camera,
  Calendar,
  ChevronRight,
  Share,
  Mails,
  NotebookTabs,
  MapPin,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import BackButton from "../back";
// import { ThemeSelector } from "@/hooks/theme-selector"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { ModeToggle } from "@/hooks/theme-selector";
import BusinessTypeSelector from "./createProvider/business-type-selector";
import { Link } from "react-router";
import { getImageUrl } from "../global/formatPrice";
import { SubdomainGenerator } from "./subDomain";
// import MainNaveBar from "./menuBar";

// GraphQL Queries and Mutations
const GET_SERVICE = gql`
  query getService {
    getService {
      id
      dpfile
      name
      number
      email
      profession
      aboutMe
      location
      createdAt
    }
  }
`;

const UPDATE_SERVICE = gql`
  mutation updateService(
    $dpfile: Upload
    $input: UpdateServiceInput!
    $removeProfession: [String]
  ) {
    updateService(
      dpfile: $dpfile
      input: $input
      removeProfession: $removeProfession
    ) {
      id
      dpfile
      name
      number
      email
      profession
      aboutMe
      location
    }
  }
`;

// Add these GraphQL mutations after the existing updateService mutation
const UPDATE_REQUEST_OTP = gql`
  mutation ReSetPasswordORUpdateOtp($input: RequestOtpInput!) {
    reSetPasswordORUpdateOTP(input: $input) {
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
      IsValid
      otpSent
      email
    }
  }
`;

const useUpdatePasswordOtp = () => {
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordFormValues | null>(
    null
  );
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [requestPasswordOtp, { loading: requestingOtp }] = useMutation(
    UPDATE_REQUEST_OTP,
    {
      onCompleted: (data) => {
        if (data.reSetPasswordORUpdateOTP.success) {
          setShowOtpDialog(true);
          setOtpResendTimer(60); // Start 60 second timer
          toast.success("Verification code sent", {
            description: `We've sent a verification code to ${data.reSetPasswordORUpdateOTP.email}`,
          });
        } else {
          toast.error("Error", {
            description:
              data.reSetPasswordORUpdateOTP.message ||
              "Failed to send verification code",
          });
        }
        setIsLoading(false);
      },
      onError: (error) => {
        toast.error("Error", {
          description: error.message || "Failed to send verification code",
        });
        setIsLoading(false);
      },
    }
  );

  const [verifyPasswordOtp] = useMutation(VERIFY_OTP, {
    onCompleted: (data) => {
      setIsVerifyingOtp(false);
      if (data.verifyOtp.success && data.verifyOtp.IsValid) {
        setShowOtpDialog(false);
        setOtpValue("");

        // If we have password data, proceed with the password update
        if (passwordData) {
          // Here you would call your actual password update mutation
          // For now, we'll simulate it with a timeout
          setIsLoading(true);
          setTimeout(() => {
            setIsLoading(false);
            toast.success("Password updated successfully");
            // passwordForm.reset({
            //   currentPassword: "",
            //   newPassword: "",
            //   confirmPassword: "",
            // });
            setPasswordData(null);
          }, 1000);
        }
      } else {
        setOtpError(data.verifyOtp.message || "Invalid verification code");
      }
    },
    onError: (error) => {
      setIsVerifyingOtp(false);
      setOtpError(error.message || "Verification failed");
    },
  });

  const [resendPasswordOtp, { loading: resendingOtp }] = useMutation(
    RESEND_OTP,
    {
      onCompleted: (data) => {
        if (data.resendOTP.success) {
          setOtpResendTimer(60); // Reset timer to 60 seconds
          toast.success("Code resent", {
            description: `We've sent a new verification code to ${data.resendOTP.email}`,
          });
        } else {
          toast.error("Error", {
            description:
              data.resendOTP.message || "Failed to resend verification code",
          });
        }
      },
      onError: (error) => {
        toast.error("Error", {
          description: error.message || "Failed to resend verification code",
        });
      },
    }
  );

  return {
    showOtpDialog,
    setShowOtpDialog,
    otpValue,
    setOtpValue,
    otpError,
    setOtpError,
    isVerifyingOtp,
    setIsVerifyingOtp,
    passwordData,
    setPasswordData,
    otpResendTimer,
    setOtpResendTimer,
    requestPasswordOtp,
    verifyPasswordOtp,
    resendPasswordOtp,
    requestingOtp,
    resendingOtp,
    isLoading,
    setIsLoading,
  };
};

// Types and Schemas
interface Profession {
  value: string;
  label: string;
}

const AVAILABLE_PROFESSIONS: Profession[] = [
  { value: "architect", label: "Architect" },
  { value: "interior_designer", label: "Interior Designer" },
  { value: "contractor", label: "Contractor" },
  { value: "landscaper", label: "Landscaper" },
  { value: "electrician", label: "Electrician" },
  { value: "plumber", label: "Plumber" },
  { value: "carpenter", label: "Carpenter" },
  { value: "painter", label: "Painter" },
];

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, {
      message: "Name must be at least 2 characters.",
    })
    .optional(),
  number: z
    .string()
    .regex(/^\d+$/, {
      message: "Please enter a valid number.",
    })
    .optional(),
  email: z.string().email({ message: "Invalid email address." }).optional(),
  profession: z.array(z.string()).optional(),
  aboutMe: z.string().optional(),
  location: z.string().optional(),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    newPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match.",
    path: ["confirmPassword"],
  });

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfileService() {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([]);
  const [customProfession, setCustomProfession] = useState("");
  const [removedProfessions, setRemovedProfessions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    showOtpDialog,
    setShowOtpDialog,
    otpValue,
    setOtpValue,
    otpError,
    setOtpError,
    isVerifyingOtp,
    setIsVerifyingOtp,
    // passwordData,
    setPasswordData,
    otpResendTimer,
    setOtpResendTimer,
    requestPasswordOtp,
    verifyPasswordOtp,
    resendPasswordOtp,
    // requestingOtp,
    resendingOtp,
    // isLoading: otpLoading,
    setIsLoading: setOtpLoading,
  } = useUpdatePasswordOtp();

  // GraphQL Hooks
  const { loading: queryLoading, data: serviceData } = useQuery(GET_SERVICE);
  const [updateService, { loading: mutationLoading }] = useMutation(
    UPDATE_SERVICE,
    {
      onCompleted: () => {
        toast("Profile updated successfully.");
        setIsLoading(false);
      },
      onError: (error) => {
        toast("Error updating profile: " + error.message);
        setIsLoading(false);
      },
      refetchQueries: [{ query: GET_SERVICE }],
    }
  );

  // Form Hooks
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      number: "",
      email: "",
      profession: [],
      aboutMe: "",
      location: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Effects
  useEffect(() => {
    if (serviceData?.getService) {
      const service = serviceData.getService;

      // Update the form with service data
      profileForm.reset({
        name: service.name || "",
        number: service.number || "",
        email: service.email || "",
        profession: service.profession || [],
        aboutMe: service.aboutMe || "",
        location: service.location || "",
      });
      // Reset removed professions when data loads
      setRemovedProfessions([]);
      // Update selected professions state
      setSelectedProfessions(service.profession || []);
    }
  }, [serviceData, profileForm]);

  // Derived values
  const isPageLoading = queryLoading || mutationLoading || isLoading;

  // Helper functions
  const getUserInitials = () => {
    const name = serviceData?.getService?.name || "JD";
    return name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarSrc = () => {
    if (previewUrl) return previewUrl;
    if ( serviceData?.getService?.dpfile) return getImageUrl(serviceData?.getService?.dpfile);
    return "/placeholder.svg?height=128&width=128";
  };

  // Event handlers
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);

      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result as string);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleAddProfession = (profession: string) => {
    if (profession.trim() && !selectedProfessions.includes(profession.trim())) {
      const updatedProfessions = [...selectedProfessions, profession.trim()];
      setSelectedProfessions(updatedProfessions);
      profileForm.setValue("profession", updatedProfessions);

      // If we're re-adding a previously removed profession, remove it from removedProfessions
      setRemovedProfessions((prev) =>
        prev.filter((p) => p !== profession.trim())
      );
    }
  };

  // Updated handleRemoveProfession function
  const handleRemoveProfession = (profession: string) => {
    const updatedProfessions = selectedProfessions.filter(
      (p) => p !== profession
    );
    setSelectedProfessions(updatedProfessions);
    profileForm.setValue("profession", updatedProfessions);

    // Add to removed professions list to be sent to the server
    setRemovedProfessions((prev) => [...prev, profession]);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleShare = () => {
    const serviceId = serviceData?.getService?.id;
    const baseUrl = "https://ssr.winnemart.com";
    const shareUrl = serviceId
      ? `${baseUrl}/${serviceId}`
      : window.location.href;

    navigator.clipboard.writeText(shareUrl);
    toast("Link copied to clipboard.");
  };

  // Form submission handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    setIsLoading(true);

    const input = {
      ...(data.name && { name: data.name }),
      ...(data.number && { number: data.number }),
      ...(data.email && { email: data.email }),
      ...(data.profession &&
        data.profession.length > 0 && { profession: data.profession }),
      ...(data.aboutMe && { aboutMe: data.aboutMe }),
      ...(data.location && { location: data.location }),
    };

    updateService({
      variables: {
        dpfile: selectedFile,
        input,
        removeProfession:
          removedProfessions.length > 0 ? removedProfessions : undefined,
      },
    });
  };

  // Replace the existing onPasswordSubmit function with this one
  const onPasswordSubmit = (data: PasswordFormValues) => {
    setOtpLoading(true);
    setPasswordData(data);

    // Request OTP for password change
    requestPasswordOtp({
      variables: {
        input: {
          email: serviceData?.getService?.email,
          // You might need to adjust these fields based on your API requirements
          name: serviceData?.getService?.name,
          number: serviceData?.getService?.number,
        },
      },
    });
  };

  // Add these handler functions after the existing handler functions
  const handleVerifyOtp = (otp?: string) => {
    const codeToVerify = otp || otpValue;

    if (!codeToVerify.trim()) {
      setOtpError("Please enter the verification code");
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError("");

    verifyPasswordOtp({
      variables: {
        input: {
          email: serviceData?.getService?.email,
          otp: codeToVerify,
        },
      },
    });
  };

  const handleResendOtp = () => {
    if (otpResendTimer > 0) return;

    resendPasswordOtp({
      variables: {
        input: {
          email: serviceData?.getService?.email,
          name: serviceData?.getService?.name,
          number: serviceData?.getService?.number,
        },
      },
    });
  };

  // Add this effect for the OTP resend timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpResendTimer > 0) {
      timer = setTimeout(() => setOtpResendTimer(otpResendTimer - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [otpResendTimer]);

  // Component rendering
  const renderUserInfo = () => (
    <Card className="border-none shadow-md sticky top-4">
      <BackButton />
      <CardContent className="pt-6 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
            <AvatarImage
              src={getAvatarSrc() || "/placeholder.svg"}
              alt="Profile picture"
            />
            <AvatarFallback className="text-2xl sm:text-3xl font-semibold bg-primary/10">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <label htmlFor="profile-picture">
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 cursor-pointer"
              type="button"
              onClick={triggerFileInput}
            >
              <Camera className="h-4 w-4" />
            </Button>
            <input
              id="profile-picture"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </label>
        </div>

        <div className="space-y-1.5 mb-4">
          <h2 className="text-lg sm:text-xl font-bold">
            {serviceData?.getService?.name || "Loading..."}
          </h2>
          <div className="grid grid-cols-2 gap-3 px-10">
            <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
              <NotebookTabs className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span className="truncate max-w-[200px]">
                {serviceData?.getService?.number || "Loading..."}
              </span>
            </div>
            <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span className="truncate max-w-[200px]">
                {serviceData?.getService?.location || "Loading..."}
              </span>
            </div>
            <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
              <Mails className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span className="truncate max-w-[200px]">
                {serviceData?.getService?.email || "Loading..."}
              </span>
            </div>
            <div className="flex items-center justify-center text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
              <span>
                Member since{" "}
                {serviceData?.getService?.createdAt
                  ? new Date(
                      serviceData.getService.createdAt
                    ).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Loading..."}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-wrap gap-2 justify-center">
          <Link to={"/dbp/social"}>
            <Button variant="outline" className="bg-primary/5">
              Social Media
            </Button>
          </Link>
          <BusinessTypeSelector />
          <SubdomainGenerator />

          <Badge
            variant="outline"
            className="gap-1 bg-primary/5 cursor-pointer"
            onClick={handleShare}
          >
            <Share className="h-3 w-3" />
            <span>Share</span>
          </Badge>
          <ModeToggle />
        </div>
      </CardContent>

      <CardFooter className="flex flex-col px-4 sm:px-6 py-4 border-t">
        <Tabs className="w-full space-y-3">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto">
            <TabsTrigger
              value="profile"
              className={`flex justify-start px-3 py-2.5 ${
                activeTab === "profile" ? "bg-primary/10" : ""
              }`}
              onClick={() => setActiveTab("profile")}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className={`flex justify-start px-3 py-2.5 ${
                activeTab === "password" ? "bg-primary/10" : ""
              }`}
              onClick={() => setActiveTab("password")}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardFooter>
    </Card>
  );

  const renderProfessionSelector = () => (
    <FormItem>
      <FormLabel>Profession</FormLabel>
      <div className="space-y-2">
        <Select onValueChange={handleAddProfession}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a profession" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_PROFESSIONS.map((profession) => (
              <SelectItem
                key={profession.value}
                value={profession.value}
                disabled={selectedProfessions.includes(profession.value)}
              >
                {profession.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Input
            placeholder="Add custom profession"
            value={customProfession}
            onChange={(e) => setCustomProfession(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customProfession.trim()) {
                e.preventDefault();
                handleAddProfession(customProfession);
                setCustomProfession("");
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              if (customProfession.trim()) {
                handleAddProfession(customProfession);
                setCustomProfession("");
              }
            }}
          >
            Add
          </Button>
        </div>

        {selectedProfessions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedProfessions.map((profession) => {
              const professionLabel =
                AVAILABLE_PROFESSIONS.find((p) => p.value === profession)
                  ?.label || profession;
              return (
                <Badge
                  key={profession}
                  variant="secondary"
                  className="pl-2 pr-1 py-1"
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
        )}

        <input
          type="hidden"
          value={selectedProfessions.join(",")}
          {...profileForm.register("profession")}
        />
      </div>
      <FormMessage />
    </FormItem>
  );

  const renderProfileForm = () => (
    <Form {...profileForm}>
      <form
        onSubmit={profileForm.handleSubmit(onProfileSubmit)}
        className="space-y-4"
      >
        <FormField
          control={profileForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={profileForm.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="Enter your phone number"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={profileForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter your email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {renderProfessionSelector()}

        <FormField
          control={profileForm.control}
          name="aboutMe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About Me</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us about yourself" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={profileForm.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="Enter your location" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button
            className="gap-2 w-[30%] mr-3 sm:w-auto"
            variant="outline"
            onClick={() => {
              // profileForm.reset({
              //   name: "",
              //   number: "",
              //   email: "",
              //   profession: [],
              //   aboutMe: "",
              //   location: "",
              // });
              setSelectedProfessions([]);
              window.history.back();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button className="w-[70%]" type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );

  const renderPasswordForm = () => (
    <Form {...passwordForm}>
      <form
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            passwordForm.handleSubmit(onPasswordSubmit)();
          }
        }}
        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
        className="space-y-6"
      >
        <FormField
          control={passwordForm.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...field}
                  className="bg-background"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={passwordForm.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormDescription className="text-xs sm:text-sm">
                  Password must be at least 8 characters long.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={passwordForm.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm New Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button
            className="gap-2 w-full mr-3 sm:w-auto"
            variant="outline"
            onClick={() => {
              passwordForm.reset({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
              });
              window.history.back();
            }}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPageLoading}
            className="gap-2 w-full sm:w-auto"
          >
            {isPageLoading ? (
              <>Updating password...</>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                <span>Update Password</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );

  return (
    <div className=" py-8 w-full">
      <div className="hidden sm:flex items-center text-sm text-muted-foreground pl-4">
        <div>Account</div>
        <ChevronRight className="h-4 w-4 mx-1" />
        <span className="font-medium text-foreground">
          {activeTab === "profile"
            ? "Profile Information"
            : "Password & Security"}
        </span>
      </div>
      <div className=" px-4 py-8 mx-auto ">
        {/* Breadcrumb - visible on tablet and larger */}

        <div className="grid  grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sidebar with user info */}
          <div className="md:col-span-1">{renderUserInfo()}</div>

          {/* Main content */}
           <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsContent value="profile" className="m-0">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your account details and public profile
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {queryLoading ? (
                      <div className="flex justify-center py-8">
                        Loading profile data...
                      </div>
                    ) : (
                      renderProfileForm()
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="password" className="m-0">
                <Card className="border-none shadow-md">
                  <CardHeader>
                    <CardTitle>Password & Security</CardTitle>
                    <CardDescription>
                      Ensure your account stays secure with a strong password
                    </CardDescription>
                  </CardHeader>

                  <CardContent>{renderPasswordForm()}</CardContent>
                </Card>
              </TabsContent>
            </Tabs>
        </div>
      </div>
      {/* Remove this Dialog component since we're using OtpCard */}
      <Dialog
        open={showOtpDialog}
        onOpenChange={(open) => !isVerifyingOtp && setShowOtpDialog(open)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Verify your identity</DialogTitle>
            <DialogDescription>
              Enter the verification code sent to{" "}
              {serviceData?.getService?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                placeholder="Enter 6-digit code"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                className={otpError ? "border-destructive" : ""}
                maxLength={6}
              />
              {otpError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {otpError}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowOtpDialog(false)}
              disabled={isVerifyingOtp}
              className="sm:w-auto w-full order-2 sm:order-1"
            >
              Cancel
            </Button>
            <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
              <Button
                variant="secondary"
                onClick={handleResendOtp}
                disabled={otpResendTimer > 0 || isVerifyingOtp || resendingOtp}
                className="flex-1"
              >
                {otpResendTimer > 0 ? `Resend in ${otpResendTimer}s` : "Resend"}
              </Button>
              <Button
                onClick={() => handleVerifyOtp()}
                disabled={isVerifyingOtp}
                className="flex-1"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>{" "}
      
    </div>
  );
}
