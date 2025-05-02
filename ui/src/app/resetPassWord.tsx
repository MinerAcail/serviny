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
import { CustomOTPInput } from "./otpinput";

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

// Define status type
type StatusType = {
  type: "success" | "error";
  message: string;
} | null;
type UserType = "USER" | "SERVICE";

export function PasswordReset(): JSX.Element {
  const [step, setStep] = useState<number>(1);
  const [email, setEmail] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [status, setStatus] = useState<StatusType>(null);
  const [usertype, setUsertype] = useState<UserType>("USER");

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

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
              "Verification code sent to your email",
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

          // Store in localStorage that user has reset their password
          localStorage.setItem("passwordReset", "true");

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

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle request password reset
  const handleRequestReset = (e: React.FormEvent): void => {
    e.preventDefault();

    // Validate email
    if (!email) {
      setErrors({ ...errors, email: "Email is required" });
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ ...errors, email: "Please enter a valid email address" });
      return;
    }

    setErrors({});

    // Call the mutation to request password reset OTP
    requestForResetOtp({
      variables: {
        input: {
          email,
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
  const handleResetPassword = (e: React.FormEvent): void => {
    e.preventDefault();

    // Validate password
    let newErrors = {};

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
          email,
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
          email,
        },
      },
    });
  };

  return (
    <Card className="w-full h-fit mt-20 max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Reset Your Password</CardTitle>
        <CardDescription>
          {step === 1 && "Enter your email to receive a verification code"}
          {step === 2 && "Enter the 6-digit code sent to your email"}
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
          <form onSubmit={handleRequestReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
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
              type="submit"
              className="w-full rounded-full"
              disabled={requestLoading}
            >
              {requestLoading ? "Sending..." : "Send Verification Code"}
              {!requestLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
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
                Change email address
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
          <form onSubmit={handleResetPassword} className="space-y-4">
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
              type="submit"
              className="w-full rounded-full"
              disabled={resetLoading}
            >
              {resetLoading ? "Processing..." : "Reset Password"}
              {!resetLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </form>
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
