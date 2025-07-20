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
import { Timer, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OtpCardProps {
  length?: number;
  onSubmit?: (otp: string) => void;
  title?: string;
  email?: string;
  onResend?: () => void;
  loading?: boolean;
}

export const OtpCard: React.FC<{
  title: string;
  email?: string;
  onSubmit: (otp: string) => void;
  onResend: () => void;
  loading: boolean;
}> = ({ title, email, onSubmit, onResend, loading }) => {
  const [otp, setOtp] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOtp(e.target.value);
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0">
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>
          Please enter the verification code sent to{" "}
          <span className="font-medium">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              placeholder="Enter code"
              value={otp}
              onChange={handleChange}
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button
          className="w-full"
          disabled={otp.length < 4 || loading}
          onClick={() => onSubmit(otp)}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
        <Button variant="ghost" onClick={onResend} disabled={loading}>
          Resend Code
        </Button>
      </CardFooter>
    </Card>
  );
};

