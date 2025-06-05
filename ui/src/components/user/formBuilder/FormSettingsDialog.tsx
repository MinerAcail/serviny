"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Settings,
  Type,
  AlignLeft,
  List,
  CheckSquare,
  Circle,
  PenTool,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface FormSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
    activeTab: string;
  setActiveTab: (open: string) => void;
  formTitle: string;
  formDescription: string;
  formType: string;
  isActive: boolean;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onTypeChange: (type: string) => void;
  onActiveChange: (active: boolean) => void;
  addField: (type: string) => void;
  fields: FormField[]
}

export function FormSettingsDialog({
  open,
  onOpenChange,
  formTitle,
  formDescription,
  formType,
  isActive,
  onTitleChange,
  onDescriptionChange,
  onTypeChange,
  onActiveChange,
  addField,
  fields,
   activeTab,
   setActiveTab,
}: FormSettingsDialogProps) {

  // Set initial tab based on fields when dialog opens
  useEffect(() => {
    if (open) {
      if (fields && fields.length > 0) {
        setActiveTab("fields");
      } else {
        setActiveTab("form");
      }
    }
  }, [open, fields]);

  const fieldTypes = [
    {
      type: "text",
      name: "Text Input",
      description: "Single line text input",
      icon: Type,
    },
    {
      type: "textarea",
      name: "Textarea",
      description: "Multi-line text input",
      icon: AlignLeft,
    },
    {
      type: "select",
      name: "Dropdown",
      description: "Select one option from a list",
      icon: List,
    },
    {
      type: "checkbox",
      name: "Checkbox",
      description: "Select multiple options",
      icon: CheckSquare,
    },
    {
      type: "radio",
      name: "Radio Buttons",
      description: "Select one option from multiple choices",
      icon: Circle,
    },
    {
      type: "signature",
      name: "Signature",
      description: "Digital signature field",
      icon: PenTool,
    },
  ];

  const formTypes = [
    {
      value: "AGREEMENT",
      label: "Agreement",
      description: "Legal agreements, terms & conditions",
    },
    {
      value: "SURVEY",
      label: "Survey",
      description: "Feedback forms, questionnaires",
    },
    {
      value: "APPLICATION",
      label: "Application",
      description: "Job applications, registrations",
    },
    {
      value: "FEEDBACK",
      label: "Feedback",
      description: "Customer feedback, reviews",
    },
    { value: "OTHER", label: "Other", description: "Custom form type" },
  ];

  const handleAddField = (type: string) => {
    addField(type);
    // Close dialog after adding field
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Form Settings
          </DialogTitle>
          <DialogDescription>
            Configure your form settings and add fields
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form">Form Settings</TabsTrigger>
            <TabsTrigger value="fields">Add Fields</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-title" className="text-sm font-medium">
                  Form Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="form-title"
                  value={formTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="Enter form title"
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  maxLength={255}
                />
                <p className="text-xs text-gray-500">
                  {formTitle.length}/255 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="form-description"
                  className="text-sm font-medium"
                >
                  Form Description
                </Label>
                <Textarea
                  id="form-description"
                  value={formDescription}
                  onChange={(e) => onDescriptionChange(e.target.value)}
                  placeholder="Enter form description (optional)"
                  className="min-h-[80px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500">
                  {formDescription.length}/1000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="form-type" className="text-sm font-medium">
                  Form Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formType} onValueChange={onTypeChange}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select form type" />
                  </SelectTrigger>
                  <SelectContent>
                    {formTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-gray-500">
                            {type.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between py-2 pb-10 border-t border-gray-100">
                <div>
                  <Label htmlFor="form-active" className="text-sm font-medium">
                    Active Form
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Inactive forms won't accept new submissions
                  </p>
                </div>
                <Switch
                  id="form-active"
                  checked={isActive}
                  onCheckedChange={onActiveChange}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Form Preview</h4>
                <div className="text-sm text-blue-800">
                  <p className="font-medium">{formTitle || "Untitled Form"}</p>
                  <p className="text-blue-600 mt-1">
                    {formDescription || "No description"}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-blue-500">
                      Type: {formTypes.find((t) => t.value === formType)?.label}
                    </p>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fields" className="mt-6">
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              <div className="text-sm text-gray-600 mb-4">
                Choose field types to add to your form
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {fieldTypes.map((fieldType) => {
                  const IconComponent = fieldType.icon;
                  return (
                    <Button
                      key={fieldType.type}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start text-left hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      onClick={() => handleAddField(fieldType.type)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {fieldType.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {fieldType.description}
                          </p>
                        </div>
                        <Plus className="h-4 w-4 text-gray-400" />
                      </div>
                    </Button>
                  );
                })}
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                <h4 className="font-medium text-gray-900 mb-2">
                  Field Type Guidelines
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    • <strong>Text Input:</strong> Names, emails, short answers
                    (single line)
                  </li>
                  <li>
                    • <strong>Textarea:</strong> Comments, descriptions, long
                    text (multi-line)
                  </li>
                  <li>
                    • <strong>Dropdown:</strong> Single selection from many
                    options
                  </li>
                  <li>
                    • <strong>Radio Buttons:</strong> Single selection from few
                    options
                  </li>
                  <li>
                    • <strong>Checkbox:</strong> Multiple selections allowed
                  </li>
                  <li>
                    • <strong>Signature:</strong> Digital signatures for
                    agreements
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Close
          </Button>
          {activeTab === "fields" && (
            <Button
              onClick={() => setActiveTab("form")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Back to Settings
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}