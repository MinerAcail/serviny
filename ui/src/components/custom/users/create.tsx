"use client";

import React, { useState, useRef } from "react";
import { Phone, User, Lock, Mail, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { gql, useMutation } from "@apollo/client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/middleware/context/authContext";
import OtpCard from "@/components/serviceProviders/createOTP";
// import OtpCard from "./createOTP"; // Reusing the OTP component
// Define GraphQL mutations
const SERVICE_LOGIN = gql`
  mutation serviceLogin($input: LoginInput!) {
    serviceLogin(input: $input) {
      __typename
      ... on Service {
        id
        name
        number
        type
      }
      ... on User {
        id
        name
        number
        type
      }
    }
  }
`;

const CREATE_USER = gql`
  mutation createUser($input: inputUser!) {
    createUser(input: $input) {
      id
      name
      number
      type
      numberType
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
      IsValid
      otpSent
      email
    }
  }
`;

// Types for phone types
enum PhoneType {
  WHATSAPP = "WHATSAPP",
  PHONE = "PHONE",
  BOTH = "BOTH",
}

export default function UserAuthCard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const switchToLoginTab = () => {
    if (tabsRef.current) {
      const loginTrigger = tabsRef.current.querySelector(
        '[value="login"]'
      ) as HTMLButtonElement;
      if (loginTrigger) {
        loginTrigger.click();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Welcome</CardTitle>
            <CardDescription className="text-center">
              Login or create a new account to continue
            </CardDescription>
          </CardHeader>
          <Tabs defaultValue="login" className="w-full" ref={tabsRef}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="create">Create Account</TabsTrigger>
              <TabsTrigger value="login">Login</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <LogInUser setOpen={setOpen} />
            </TabsContent>

            {/* Create Account Form */}
            <TabsContent value="create">
              <CreateUser switchToLoginTab={switchToLoginTab} />
            </TabsContent>
          </Tabs>
        </Card>
      </DialogContent>
    </Dialog>
  );
}

// Login form component
function LogInUser({ setOpen }: { setOpen: (open: boolean) => void }) {
  const { login: Auth } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Set up mutation
  const [serviceLogin, { loading }] = useMutation(SERVICE_LOGIN, {
    onCompleted: (data) => {
      console.log("Login successful:", data);
      toast.success("Login successful!");
      // Handle successful login (store user data, redirect, etc.)
      // Close the dialog
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`Login failed: ${error.message}`);
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await serviceLogin({
      variables: {
        input: {
          number: phoneNumber,
          password: password,
        },
      },
    });

    if (result?.data?.serviceLogin) {
      Auth(result.data.serviceLogin);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="phone-login">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone-login"
              type="tel"
              placeholder="Enter your phone number"
              className="pl-10"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password-login">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password-login"
              type="password"
              placeholder="Enter your password"
              className="pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Logging in..." : "Login"}
        </Button>
      </CardFooter>
    </form>
  );
}
interface FormData {
  name: string;
  email: string;
  number: string;
  phoneType: PhoneType;
  password: string;
}
// Create user form component with OTP verification
function CreateUser({ switchToLoginTab }: { switchToLoginTab: () => void }) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [phoneType, setPhoneType] = useState<PhoneType>(PhoneType.BOTH);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // OTP verification states
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  // const [otpSent, setOtpSent] = useState(false);


  const [formData, setFormData] = useState<FormData | null>(null);

  // Set up mutations
  const [createUser] = useMutation(CREATE_USER, {
    onCompleted: (data) => {
      console.log("Account created:", data);
      toast.success("Account created successfully!", {
        description:
          "Please kindly use the information to log in and continue.",
      });

      // Move the user to the login tab
      switchToLoginTab();

      // Reset states
      setShowOtpVerification(false);
      // setOtpSent(false);
      setFormData(null);

      // Clear input fields after successful account creation
      setName("");
      setEmail("");
      setPhoneNumber("");
      setPhoneType(PhoneType.BOTH);
      setPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      console.error("Create account error:", error);
      toast.error("Account creation failed", {
        description:
          "A user with the same email or phone number already exists.",
      });
    },
  });

  const [requestOtp] = useMutation(REQUEST_OTP);
  const [verifyOtp] = useMutation(VERIFY_OTP);
  const [resendOTP] = useMutation(RESEND_OTP);

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Send OTP before submitting form
  const handleSendOtp = async (data: FormData) => {
    setIsLoading(true);
    setFormData(data);

    try {
      const result = await requestOtp({
        variables: {
          input: {
            email: data.email,
            name: data.name,
            number: data.number,
            type: "USER", // Using USER type for regular users
          },
        },
      });

      if (result.data?.requestOtp?.success) {
        // setOtpSent(true);
        setShowOtpVerification(true);
        toast.success("OTP Sent", {
          description: `Verification code sent to ${data.email}`,
        });
      } else {
        toast.error("Error", {
          description: result.data?.requestOtp?.message || "Failed to send verification code",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to send verification code",
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
            type: "USER", // Using USER type for regular users
          },
        },
      });

      if (result.data?.verifyOtp?.success && result.data?.verifyOtp?.IsValid) {
        toast.success("Verification Successful", {
          description: "Your email has been verified successfully",
        });

        // Submit the form data after successful verification
        if (formData) {
          submitFormData(formData);
        }
      } else {
        toast.error("Verification Failed", {
          description: result.data?.verifyOtp?.message || "Invalid verification code",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Verification failed",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle OTP resend
  const handleResendOtp = async () => {
    try {
      const result = await resendOTP({
        variables: {
          input: {
            email: formData?.email,
            name: formData?.name,
            number: formData?.number,
            type: "USER", // Using USER type for regular users
          },
        },
      });

      if (result.data?.resendOTP?.success) {
        toast.success("OTP Resent", {
          description: `New verification code sent to ${formData?.email}`,
        });
      } else {
        toast.error("Error", {
          description: result.data?.resendOTP?.message || "Failed to resend verification code",
        });
      }
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to resend verification code",
      });
    }
  };

  // Submit form data to database after OTP verification
  const submitFormData = async (data: FormData) => {
    setIsLoading(true);

    try {
      await createUser({
        variables: {
          input: {
            name: data.name,
            number: data.number,
            numberType: data.phoneType,
            password: data.password,
            email: data.email,
          },
        },
      });
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial form submission handler - triggers OTP flow
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswords()) return;

    const data = {
      name,
      email,
      number: phoneNumber,
      phoneType,
      password,
    };

    // Initiate OTP verification process
    await handleSendOtp(data);
  };

  // Cancel OTP verification and go back to form
  const handleCancelOtp = () => {
    setShowOtpVerification(false);
  
  };

  if (showOtpVerification) {
    return (
      <div className="space-y-6">
        <OtpCard
          title="Email Verification"
          description={`We've sent a verification code to ${formData?.email}. Please enter it below.`}
          onSubmit={handleVerifyOtp}
          onResend={handleResendOtp}
          loading={verifyingOtp}
        />
        <div className="flex justify-center px-6 pb-6">
          <Button variant="outline" onClick={handleCancelOtp} disabled={verifyingOtp}>
            Back to Form
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleCreateAccount} className="sm:max-w-lg max-h-80 overflow-y-auto">
      <CardContent className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              className="pl-10"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone-create">Phone Number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone-create"
              type="tel"
              placeholder="Enter your phone number"
              className="pl-10"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email-create">
            Email (Required for verification)
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email-create"
              type="email"
              placeholder="Enter your Email"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Phone Type</Label>
          <RadioGroup
            value={phoneType}
            onValueChange={(value) => setPhoneType(value as PhoneType)}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PhoneType.WHATSAPP} id="whatsapp-create" />
              <Label htmlFor="whatsapp-create">WhatsApp only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PhoneType.PHONE} id="phone-create" />
              <Label htmlFor="phone-create">Phone only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value={PhoneType.BOTH} id="both-create" />
              <Label htmlFor="both-create">Both</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password-create">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password-create"
              type="password"
              placeholder="Create a password"
              className="pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm your password"
              className="pl-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {passwordError && (
            <p className="text-sm text-red-500">{passwordError}</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Create Account
            </>
          )}
        </Button>
      </CardFooter>
    </form>
  );
}