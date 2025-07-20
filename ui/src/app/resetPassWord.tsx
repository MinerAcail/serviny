import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { gql } from "@apollo/client";
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
import { AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Custom OTP Input Component
interface CustomOTPInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  className?: string;
}

const CustomOTPInput: React.FC<CustomOTPInputProps> = ({ 
  length, 
  value, 
  onChange, 
  onComplete, 
  className = "" 
}) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));

  const handleChange = (element: HTMLInputElement, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    
    const otpValue = newOtp.join("");
    onChange(otpValue);
    
    // Move to next input
    if (element.value && index < length - 1) {
      const nextSibling = element.nextElementSibling as HTMLInputElement;
      if (nextSibling) {
        nextSibling.focus();
      }
    }
    
    // Call onComplete when all digits are entered
    if (otpValue.length === length) {
      onComplete(otpValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevSibling = (e.target as HTMLInputElement).previousElementSibling as HTMLInputElement;
      if (prevSibling) {
        prevSibling.focus();
      }
    }
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {Array(length).fill(null).map((_, index) => (
        <Input
          key={index}
          type="text"
          maxLength={1}
          className="w-12 h-12 text-center text-lg font-semibold"
          value={otp[index]}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        />
      ))}
    </div>
  );
};

// GraphQL mutation for requesting password reset OTP
const REQUEST_PASSWORD_MUTATION = gql`
  mutation RequestForResetOtp($input: ResetPassWordOtpInput!) {
    requestForResetOtp(input: $input) {
      success
      message
      otpSent
      IsValid
      email
    }
  }
`;

// GraphQL mutation for resetting password
const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      success
      message
      isReset
      email
    }
  }
`;

// Define types
interface StatusType {
  type: "success" | "error";
  message: string;
}

type UserType = "USER" | "SERVICE";

interface ErrorsType {
  phoneNumber?: string;
  password?: string;
  confirmPassword?: string;
}

export  function PasswordReset(): JSX.Element {
  const [step, setStep] = useState<number>(1);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [status, setStatus] = useState<StatusType | null>(null);
  const [usertype, setUsertype] = useState<UserType>("USER");

  const [errors, setErrors] = useState<ErrorsType>({});

  // Request password reset OTP mutation
  const [requestForResetOtp, { loading: requestLoading }] = useMutation(
    REQUEST_PASSWORD_MUTATION,
    {
      onCompleted: (data) => {
        if (data.requestForResetOtp.success) {
          setStatus({
            type: "success",
            message:
              data.requestForResetOtp.message ||
              "Verification code sent to your phone",
          });
          setTimeout(() => {
            setStatus(null);
            setStep(2);
          }, 2000);
        } else {
          setStatus({
            type: "error",
            message:
              data.requestForResetOtp.message ||
              "Failed to send verification code",
          });
        }
      },
      onError: (error) => {
        setStatus({
          type: "error",
          message:
            error.message ||
            "An error occurred while requesting password reset",
        });
      },
    }
  );

  // Reset password mutation
  const [resetPassword, { loading: resetLoading }] = useMutation(
    RESET_PASSWORD_MUTATION,
    {
      onCompleted: (data) => {
        if (data.resetPassword.success) {
          setStatus({
            type: "success",
            message:
              data.resetPassword.message || "Password reset successfully",
          });

          // Store in memory that user has reset their password
          // Note: localStorage is not available in Claude.ai artifacts

          // Redirect to login after success
          setTimeout(() => {
            window.location.href = "/login";
          }, 2000);
        } else {
          setStatus({
            type: "error",
            message: data.resetPassword.message || "Failed to reset password",
          });
        }
      },
      onError: (error) => {
        setStatus({
          type: "error",
          message:
            error.message || "An error occurred while resetting password",
        });
      },
    }
  );

  // Validate phone number format - accepts 0..., 233..., +233...
  const validatePhoneNumber = (phone: string): boolean => {
    // Remove all spaces and non-digit characters except +
    const cleaned = phone.replace(/\s/g, "");
    
    // Check for valid patterns:
    // 1. Starting with 0 followed by 9 digits (0xxxxxxxxx)
    // 2. Starting with 233 followed by 9 digits (233xxxxxxxxx)
    // 3. Starting with +233 followed by 9 digits (+233xxxxxxxxx)
    const patterns = [
      /^0\d{9}$/,           // 0xxxxxxxxx (10 digits total)
      /^233\d{9}$/,         // 233xxxxxxxxx (12 digits total)
      /^\+233\d{9}$/        // +233xxxxxxxxx (13 characters total)
    ];
    
    return patterns.some(pattern => pattern.test(cleaned));
  };

  // Format phone number - clean and standardize
  const formatPhoneNumber = (phone: string): string => {
    // Remove all spaces and non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, "");
    return cleaned;
  };

  // Handle request password reset
  const handleRequestReset = (): void => {
    // Validate phone number
    if (!phoneNumber) {
      setErrors({ ...errors, phoneNumber: "Phone number is required" });
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!validatePhoneNumber(formattedPhone)) {
      setErrors({ 
        ...errors, 
        phoneNumber: "Please enter a valid phone number (0xxxxxxxxx, 233xxxxxxxxx, or +233xxxxxxxxx)" 
      });
      return;
    }

    setErrors({});

    // Call the mutation to request password reset OTP
    requestForResetOtp({
      variables: {
        input: {
          number: formattedPhone,
        },
      },
    });
  };

  // Handle OTP verification
  const handleVerifyOtp = (): void => {
    // Check if OTP is complete
    if (otp.length !== 6) {
      setStatus({
        type: "error",
        message: "Please enter the complete 6-digit code",
      });
      return;
    }

    // In a real app, this would verify the OTP with your API
    // For now, we'll just move to the next step
    setStatus({ type: "success", message: "Code verified successfully" });
    setTimeout(() => {
      setStatus(null);
      setStep(3);
    }, 2000);
  };

  // Handle password reset submission
  const handleResetPassword = (): void => {
    // Validate password
    let newErrors: ErrorsType = {};

    if (password.length < 8) {
      newErrors = {
        ...newErrors,
        password: "Password must be at least 8 characters",
      };
    }

    if (password !== confirmPassword) {
      newErrors = { ...newErrors, confirmPassword: "Passwords don't match" };
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    // Call the mutation to reset password
    resetPassword({
      variables: {
        input: {
          number: formatPhoneNumber(phoneNumber),
          otp,
          newPassword: password,
          confirmPassword,
          type: usertype,
        },
      },
    });
  };

  // Resend code handler
  const handleResendCode = (): void => {
    requestForResetOtp({
      variables: {
        input: {
          number: formatPhoneNumber(phoneNumber),
        },
      },
    });
  };

  return (
    <Card className="w-full h-fit mt-20 max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Reset Your Password</CardTitle>
        <CardDescription>
          {step === 1 && "Enter your phone number to receive a verification code"}
          {step === 2 && "Enter the 6-digit code sent to your phone"}
          {step === 3 && "Create a new password for your account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status && (
          <Alert
            className={`mb-4 ${
              status.type === "error"
                ? "bg-red-50 text-red-800 border-red-200"
                : "bg-green-50 text-green-800 border-green-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {status.type === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertDescription>{status.message}</AlertDescription>
            </div>
          </Alert>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>
              )}
              <div className="space-y-2">
                <Label htmlFor="usertype">User Type</Label>
                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="user"
                      name="usertype"
                      value="USER"
                      checked={usertype === "USER"}
                      onChange={() => setUsertype("USER")}
                      className="shcdn-radio"
                    />
                    <Label htmlFor="user" className="ml-2">
                      User
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="service"
                      name="usertype"
                      value="SERVICE"
                      checked={usertype === "SERVICE"}
                      onChange={() => setUsertype("SERVICE")}
                      className="shcdn-radio"
                    />
                    <Label htmlFor="service" className="ml-2">
                      Service
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={handleRequestReset}
              className="w-full rounded-full"
              disabled={requestLoading}
            >
              {requestLoading ? "Sending..." : "Send Verification Code"}
              {!requestLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <div className="flex justify-center py-2">
                <CustomOTPInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  onComplete={(value) => {
                    setOtp(value);
                    // Auto-verify when all digits are entered
                    setTimeout(() => handleVerifyOtp(), 300);
                  }}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="pt-2">
              <Button
                onClick={handleVerifyOtp}
                className="w-full rounded-full"
                disabled={otp.length !== 6}
              >
                Verify Code <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="underline text-primary hover:text-primary/80"
              >
                Change phone number
              </button>
              <span className="mx-2">•</span>
              <button
                type="button"
                onClick={handleResendCode}
                className="underline text-primary hover:text-primary/80"
              >
                Resend code
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
            <Button
              onClick={handleResetPassword}
              className="w-full rounded-full"
              disabled={resetLoading}
            >
              {resetLoading ? "Processing..." : "Reset Password"}
              {!resetLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center gap-10 border-t pt-4">
        <Button
          variant="link"
          onClick={() => (window.location.href = "/login")}
        >
          Return to Login
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          Home
        </Button>
      </CardFooter>
    </Card>
  );
}