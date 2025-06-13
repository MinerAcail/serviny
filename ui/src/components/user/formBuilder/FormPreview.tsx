import React, { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, X } from "lucide-react";
import UserAuthCard, {
  UserAuthCardForRider,
  UserAuthCardForWorker,
} from "@/components/custom/users/create";
import { useAuth } from "@/middleware/context/authContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface FormPreviewProps {
  title: string;
  type?: string;
  description?: string;
  fields: FormField[];
  formData: Record<string, any>;
  onInputChange: (fieldId: string, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  showSubmitButton?: boolean;
  isSubmitting?: boolean;
}

export function FormPreview({
  title,
  description,
  type,
  fields,
  formData,
  onInputChange,
  onSubmit,
  showSubmitButton = false,
  isSubmitting = false,
}: FormPreviewProps) {
  const { isAuthenticated, user } = useAuth();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [isDrawing, setIsDrawing] = useState<Record<string, boolean>>({});
  const [signatureData, setSignatureData] = useState<Record<string, string>>({});

  const renderField = (field: FormField) => {
    const fieldType = field.type.toUpperCase();
    const fieldKey = field.label; // Use label as key instead of ID
    const fieldValue = formData[fieldKey] || "";
    const isRequired = field.required;

    const fieldLabel = (
      <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
        {field.label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>
    );

    switch (fieldType) {
      case "TEXT":
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Input
              id={field.id}
              type="text"
              placeholder={field.placeholder}
              value={fieldValue}
              onChange={(e) => onInputChange(field.id, e.target.value)}
              required={isRequired}
              className="w-full"
            />
          </div>
        );

      case "TEXTAREA":
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={fieldValue}
              onChange={(e) => onInputChange(field.id, e.target.value)}
              required={isRequired}
              className="w-full min-h-[100px]"
            />
          </div>
        );

      case "SELECT":
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Select
              value={fieldValue}
              onValueChange={(value) => onInputChange(field.id, value)}
              required={isRequired}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={field.placeholder || "Select an option"}
                />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case "RADIO":
        return (
          <div key={field.id} className="space-y-3">
            {fieldLabel}
            <RadioGroup
              value={fieldValue}
              onValueChange={(value) => onInputChange(field.id, value)}
              required={isRequired}
            >
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                  <Label
                    htmlFor={`${field.id}-${index}`}
                    className="text-sm font-normal"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case "CHECKBOX":
        return (
          <div key={field.id} className="space-y-3">
            {fieldLabel}
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${index}`}
                    checked={formData[`${fieldKey}-${option}`] || false}
                    onCheckedChange={(checked) =>
                      onInputChange(field.id, { option, checked, index })
                    }
                  />
                  <Label
                    htmlFor={`${field.id}-${index}`}
                    className="text-sm font-normal"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case "SIGNATURE":
        return (
          <div
            key={field.id}
            className="space-y-3"
            data-signature-field={field.id}
          >
            {fieldLabel}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {/* Canvas for drawing signature */}
              <div className="mb-4">
                <Label className="text-sm text-gray-600 mb-2 block">
                  Draw your signature:
                </Label>
                <div className="border border-gray-300 rounded bg-white">
                  <canvas
                    ref={(el) => (canvasRefs.current[field.id] = el)}
                    width={400}
                    height={150}
                    className="cursor-crosshair block w-full h-auto"
                    onMouseDown={(e) => startDrawing(e, field.id)}
                    onMouseMove={(e) => draw(e, field.id)}
                    onMouseUp={() => stopDrawing(field.id)}
                    onMouseLeave={() => stopDrawing(field.id)}
                    onTouchStart={(e) => {
                      e.preventDefault();
                      startDrawing(e, field.id);
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault();
                      draw(e, field.id);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      stopDrawing(field.id);
                    }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => clearSignature(field.id)}
                  >
                    Clear
                  </Button>
                  <div className="text-xs text-gray-500">
                    {hasSignatureContent(field.id) ? (
                      <span className="text-green-600">
                        ✓ Signature ready (will be saved on form submit)
                      </span>
                    ) : (
                      <span>No signature provided</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Input
              id={field.id}
              type="text"
              placeholder={field.placeholder}
              value={fieldValue}
              onChange={(e) => onInputChange(field.id, e.target.value)}
              required={isRequired}
              className="w-full"
            />
          </div>
        );
    }
  };

  // Fixed coordinate calculation for better positioning
  const getCoordinates = (
    e: React.MouseEvent | React.TouchEvent,
    canvas: HTMLCanvasElement
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (
    e: React.MouseEvent | React.TouchEvent,
    fieldId: string
  ) => {
    const canvas = canvasRefs.current[fieldId];
    if (!canvas) return;

    setIsDrawing((prev) => ({ ...prev, [fieldId]: true }));

    const { x, y } = getCoordinates(e, canvas);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent, fieldId: string) => {
    const canvas = canvasRefs.current[fieldId];
    if (!canvas || !isDrawing[fieldId]) return;

    const { x, y } = getCoordinates(e, canvas);

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000000";
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = (fieldId: string) => {
    setIsDrawing((prev) => ({ ...prev, [fieldId]: false }));
    // Notify parent that signature content exists
    onInputChange(fieldId, "signature_present");
  };

  const clearSignature = (fieldId: string) => {
    const canvas = canvasRefs.current[fieldId];
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onInputChange(fieldId, null);
    setSignatureData((prev) => ({ ...prev, [fieldId]: "" }));
  };

  const hasSignatureContent = (fieldId: string): boolean => {
    const canvas = canvasRefs.current[fieldId];
    if (!canvas) return false;

    const context = canvas.getContext("2d");
    if (!context) return false;

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    return imageData.data.some((channel) => channel !== 0);
  };

  console.log("type", type);
  const UserType = user?.type;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Form Header */}
      <div className="text-center space-y-2 pb-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-6">{fields.map(renderField)}</div>

      {/* Submit Button */}
      <div className="pt-6 border-t border-gray-200">
        {showSubmitButton && (
          <>
            {(() => {
              // Helper to show dialog if user type does not match
              const showTypeRequirementDialog = (requiredType: string) =>
                isAuthenticated && UserType !== requiredType;

              // Helper to show submit button if user type matches
              const showSubmitButtonForType = (requiredType: string) =>
                isAuthenticated && UserType === requiredType;

              switch (type) {
                case "WORKERS":
                  return (
                    <>
                      {showSubmitButtonForType("USER") && (
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Worker Form"
                          )}
                        </Button>
                      )}
                      {showTypeRequirementDialog("USER") && (
                        <TypeRequirementDialog type={type} />
                      )}
                      {!isAuthenticated && (
                        <UserAuthCardForWorker>
                          <Button
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              "Submit Worker Form"
                            )}
                          </Button>
                        </UserAuthCardForWorker>
                      )}
                    </>
                  );
                case "RIDERS":
                  return (
                    <>
                      {showSubmitButtonForType("RIDER") && (
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Rider Form"
                          )}
                        </Button>
                      )}
                      {showTypeRequirementDialog("RIDER") && (
                        <TypeRequirementDialog type={type} />
                      )}
                      {!isAuthenticated && (
                        <UserAuthCardForRider>
                          <Button
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              "Submit Rider Form"
                            )}
                          </Button>
                        </UserAuthCardForRider>
                      )}
                    </>
                  );
                default:
                  return (
                    <>
                      {!isAuthenticated ? (
                        <UserAuthCard>
                          <Button
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              "Submit Form"
                            )}
                          </Button>
                        </UserAuthCard>
                      ) : (
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Submit Form"
                          )}
                        </Button>
                      )}
                    </>
                  );
              }
            })()}
          </>
        )}
      </div>
    </form>
  );
}

function TypeRequirementDialog({
  type,
  open = true,
  onOpenChange,
}: {
  type: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(open);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notice</DialogTitle>
        </DialogHeader>
        <div className="text-center py-4">
          YOU SHOULD BE A {type} BEFORE YOU CAN PROCESSED
        </div>
      </DialogContent>
    </Dialog>
  );
}