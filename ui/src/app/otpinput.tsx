import React, { useRef, useState, useEffect, ChangeEvent, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface CustomOTPInputProps {
  length?: number;
  onComplete?: (value: string) => void;
  onChange?: (value: string) => void;
  value?: string;
  autoFocus?: boolean;
  separator?: boolean;
  disabled?: boolean;
  className?: string;
}

export const CustomOTPInput: React.FC<CustomOTPInputProps> = ({
  length = 6,
  onComplete,
  onChange,
  value = "",
  autoFocus = true,
  separator = true,
  disabled = false,
  className = ""
}) => {
  const [otp, setOtp] = useState<string[]>(value.split("").slice(0, length));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize input refs
  useEffect(() => {
    inputs.current = inputs.current.slice(0, length);
  }, [length]);

  // Focus first input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputs.current[0]) {
      inputs.current[0]?.focus();
    }
  }, [autoFocus]);

  // Update the internal state when value prop changes
  useEffect(() => {
    const newOtp = value.split("").slice(0, length);
    if (newOtp.join("") !== otp.join("")) {
      setOtp(newOtp);
    }
  }, [value, length, otp]);

  // Handle input change
  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const target = e.target;
    let targetValue = target.value;
    
    // Limit to only one character and only numbers
    const regex = /^[0-9]$/;
    
    // Paste handling
    if (targetValue.length > 1) {
      // User pasted something
      const pastedData = targetValue.split("")
        .filter(char => regex.test(char))
        .slice(0, length - index);
      
      // Create a new OTP array with the pasted data
      const newOtp = [...otp];
      
      pastedData.forEach((char, i) => {
        if (index + i < length) {
          newOtp[index + i] = char;
        }
      });
      
      setOtp(newOtp);
      
      // Call onChange with the new value
      if (onChange) {
        onChange(newOtp.join(""));
      }
      
      // Focus next available input or last input if all filled
      const nextIndex = Math.min(index + pastedData.length, length - 1);
      if (inputs.current[nextIndex]) {
        inputs.current[nextIndex]?.focus();
      }
      
      // Check if OTP is complete after paste
      if (newOtp.filter(Boolean).length === length) {
        if (onComplete) onComplete(newOtp.join(""));
      }
      
      return;
    }

    // Handle single character input
    if (targetValue === "" || regex.test(targetValue)) {
      const newOtp = [...otp];
      newOtp[index] = targetValue;
      setOtp(newOtp);
      
      // Call onChange with the new value
      if (onChange) {
        onChange(newOtp.join(""));
      }
      
      // Auto-focus next input if current input is filled
      if (targetValue !== "" && index < length - 1) {
        inputs.current[index + 1]?.focus();
      }
      
      // Check if OTP is complete
      if (newOtp.filter(Boolean).length === length) {
        if (onComplete) onComplete(newOtp.join(""));
      }
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && index > 0) {
        // Focus previous input when backspace on empty input
        inputs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputs.current[index + 1]?.focus();
    }
  };

  // Handle paste event
  const handlePaste = (e: ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData("text").trim();
    
    if (clipboardData) {
      // Process clipboard data and update OTP
      const regex = /^[0-9]$/;
      const pastedData = clipboardData.split("")
        .filter(char => regex.test(char))
        .slice(0, length - index);
      
      const newOtp = [...otp];
      
      pastedData.forEach((char, i) => {
        if (index + i < length) {
          newOtp[index + i] = char;
        }
      });
      
      setOtp(newOtp);
      
      // Call onChange with the new value
      if (onChange) {
        onChange(newOtp.join(""));
      }
      
      // Focus next available input or last input if all filled
      const nextIndex = Math.min(index + pastedData.length, length - 1);
      if (inputs.current[nextIndex]) {
        inputs.current[nextIndex]?.focus();
      }
      
      // Check if OTP is complete after paste
      if (newOtp.filter(Boolean).length === length) {
        if (onComplete) onComplete(newOtp.join(""));
      }
    }
  };

  // Render input groups with separators
  const renderInputs = () => {
    const inputArray: React.ReactNode[] = [];
    const halfLength = Math.floor(length / 2);
    
    for (let i = 0; i < length; i++) {
      // Add input
      inputArray.push(
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={otp[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={(e) => handlePaste(e, i)}
          ref={(ref) => {
            inputs.current[i] = ref;
          }}
          disabled={disabled}
          className={cn(
            "w-10 h-12 text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg font-medium",
            disabled ? "bg-muted cursor-not-allowed" : "bg-background",
            otp[i] ? "border-primary" : "border-input"
          )}
          aria-label={`Digit ${i + 1}`}
        />
      );
      
      // Add separator after each group (except the last group)
      if (separator && i === halfLength - 1 && i < length - 1) {
        inputArray.push(
          <div key={`sep-${i}`} className="flex items-center mx-2">
            <div className="w-2 h-1 bg-muted-foreground/50 rounded-full mx-0.5"></div>
            <div className="w-2 h-1 bg-muted-foreground/50 rounded-full mx-0.5"></div>
          </div>
        );
      }
    }
    
    return inputArray;
  };

  return (
    <div className={cn("flex items-center justify-center space-x-2", className)}>
      {renderInputs()}
    </div>
  );
};