"use client";

import type React from "react";

import {
  useState,
  useRef,
  useEffect,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";
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
import { cn } from "@/lib/utils";
import { Timer, ArrowRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface OtpCardProps {
  length?: number;
  onSubmit?: (otp: string) => void;
  title?: string;
  email?: string;
  onResend?: () => void;
  loading?: boolean;
}

export default function OtpCard({
  length = 6,
  onSubmit = () => {},
  title = "Verification Code",
  email,
  onResend = () => {},
  loading = false,
}: OtpCardProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(180);
  const [canResend, setCanResend] = useState(false);

  // Initialize countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value;

    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    // Update the OTP array
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();

    // Check if pasted content is all digits and correct length
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.substring(0, length).split("");
    const newOtp = [...otp];

    digits.forEach((digit, index) => {
      if (index < length) {
        newOtp[index] = digit;
      }
    });

    setOtp(newOtp);

    // Focus on the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex((val) => !val);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[length - 1]?.focus();
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    const otpString = otp.join("");

    // Validate OTP
    if (otpString.length !== length) {
      toast.error("Error", {
        description: `Please enter all ${length} digits of the verification code.`,
      });
      return;
    }

    setIsSubmitting(true);

    // Call the onSubmit callback with the OTP
    onSubmit(otpString);

    // Reset submission state after a delay (simulating API call)
    setTimeout(() => {
      setIsSubmitting(false);
    }, 1500);
  };

  // Handle resend
  const handleResend = () => {
    if (!canResend) return;

    onResend();
    setCanResend(false);
    setCountdown(180);

    // Clear the OTP fields
    setOtp(Array(length).fill(""));
    inputRefs.current[0]?.focus();

    toast.success("Code Resent", {
      description: "A new verification code has been sent to your email.",
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0 overflow-hidden">
      <div className="absolute h-2 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 top-0 left-0 right-0"></div>
      <CardHeader className="pb-4 pt-6">
        <CardTitle className="text-2xl font-bold text-center">
          {title}
        </CardTitle>
        <CardDescription className="text-center">
          <p>
            We've sent a verification code to <strong>{email}</strong>. Please
            enter it below to continue.
          </p>
          <p className="text-sm text-muted-foreground">
            If you don’t see the email, check your <strong>spam</strong> or{" "}
            <strong>junk</strong> folder. Then mark the email as{" "}
            <strong>"Not Spam"</strong> to ensure you receive future messages.
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div>
            <Label htmlFor="otp-input" className="sr-only">
              Enter verification code
            </Label>
            <div className="flex justify-between gap-2 mt-2">
              {Array.from({ length }).map((_, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[index]}
                  onChange={(e) => handleChange(e, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={cn(
                    "h-14 w-14 text-center text-xl font-bold rounded-xl transition-all duration-200",
                    "focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:scale-105",
                    "border-gray-200 dark:border-gray-700",
                    otp[index] &&
                      "bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-blue-900",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                  disabled={loading || isSubmitting}
                  aria-label={`Digit ${index + 1} of verification code`}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          onClick={handleSubmit}
          disabled={otp.join("").length !== length || loading || isSubmitting}
        >
          {isSubmitting ? (
            <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-5 w-5" />
          )}
          Verify
        </Button>

        <div className="flex items-center justify-center text-sm">
          <Button
            variant="link"
            size="sm"
            onClick={handleResend}
            disabled={!canResend || loading || isSubmitting}
            className={cn(
              "text-muted-foreground transition-all duration-200",
              canResend &&
                "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            )}
          >
            {canResend ? (
              "Resend code"
            ) : (
              <span className="flex items-center">
                <Timer className="mr-1 h-3 w-3" />
                Resend in {Math.floor(countdown / 60)}:
                {(countdown % 60).toString().padStart(2, "0")}
              </span>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
