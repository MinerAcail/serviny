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
  Users,
  Briefcase,
} from "lucide-react";

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
  fields: FormField[];
}

// New Application Type Dialog Component
interface ApplicationTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTypeSelect: (type: string) => void;
}

function ApplicationTypeDialog({
  open,
  onOpenChange,
  onTypeSelect,
}: ApplicationTypeDialogProps) {
  const applicationTypes = [
    {
      value: "RIDERS",
      label: "Riders Application",
      description: "For delivery riders, drivers, or transportation workers",
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      value: "WORKERS",
      label: "Workers Application", 
      description: "For general workers, employees, or service providers",
      icon: Briefcase,
      color: "bg-green-100 text-green-600",
    },
  ];

  const handleTypeSelect = (type: string) => {
    onTypeSelect(type);
    onOpenChange(false);
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onOpenChange(false)} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white p-6 shadow-lg rounded-lg">
        <div className="mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Application Type
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            What type of application are you creating?
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {applicationTypes.map((type) => {
            const IconComponent = type.icon;
            return (
              <button
                key={type.value}
                className="w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors text-left"
                onClick={() => handleTypeSelect(type.value)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {type.label}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
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
  const [applicationTypeDialogOpen, setApplicationTypeDialogOpen] = useState(false);

  // Set initial tab based on fields when dialog opens
  useEffect(() => {
    if (open) {
      if (fields && fields.length > 0) {
        setActiveTab("fields");
      } else {
        setActiveTab("form");
      }
    }
  }, [open, fields, setActiveTab]);

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
      value: "RIDERS",
      label: "Riders Application",
      description: "For delivery riders, drivers, or transportation workers",
    },
    {
      value: "WORKERS",
      label: "Workers Application",
      description: "For general workers, employees, or service providers",
    },
    {
      value: "FEEDBACK",
      label: "Feedback",
      description: "Customer feedback, reviews",
    },
    { value: "OTHER", label: "Other", description: "Custom form type" },
  ];

  const handleFormTypeChange = (type: string) => {
    if (type === "APPLICATION") {
      // Open the application type dialog instead of directly setting the type
      setApplicationTypeDialogOpen(true);
    } else {
      onTypeChange(type);
    }
  };

  const handleApplicationTypeSelect = (applicationType: string) => {
    // Set the form type to the specific application type
    onTypeChange(applicationType);
  };

  const handleAddField = (type: string) => {
    addField(type);
    // Close dialog after adding field
    onOpenChange(false);
  };

  // Get display label for form type
  const getFormTypeDisplay = () => {
    if (formType === "RIDERS") return "Riders Application";
    if (formType === "WORKERS") return "Workers Application";
    return formTypes.find((t) => t.value === formType)?.label || formType;
  };

  return (
    <>
      <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onOpenChange(false)} />
        <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
          
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Form Settings
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Configure your form settings and add fields
            </p>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <div className="w-full">
              <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                <button
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "form" 
                      ? "bg-white shadow-sm text-gray-900" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setActiveTab("form")}
                >
                  Form Settings
                </button>
                <button
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "fields" 
                      ? "bg-white shadow-sm text-gray-900" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  onClick={() => setActiveTab("fields")}
                >
                  Add Fields
                </button>
              </div>

              {activeTab === "form" && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 block">
                        Form Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formTitle}
                        onChange={(e) => onTitleChange(e.target.value)}
                        placeholder="Enter form title"
                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        maxLength={255}
                      />
                      <p className="text-xs text-gray-500">
                        {formTitle.length}/255 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 block">
                        Form Description
                      </label>
                      <textarea
                        value={formDescription}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="Enter form description (optional)"
                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[80px] resize-y"
                        maxLength={1000}
                      />
                      <p className="text-xs text-gray-500">
                        {formDescription.length}/1000 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 block">
                        Form Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formType}
                        onChange={(e) => handleFormTypeChange(e.target.value)}
                        className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="" className="text-gray-500">Select form type</option>
                        {formTypes.filter(type => type.value !== "RIDERS" && type.value !== "WORKERS").map((type) => (
                          <option key={type.value} value={type.value} className="text-gray-900">
                            {type.label}
                          </option>
                        ))}
                        {(formType === "RIDERS" || formType === "WORKERS") && (
                          <option value={formType} className="text-gray-900">
                            {formTypes.find(t => t.value === formType)?.label}
                          </option>
                        )}
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2 pb-10 border-t border-gray-100">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block">
                          Active Form
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          Inactive forms won't accept new submissions
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => onActiveChange(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
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
                            Type: {getFormTypeDisplay()}
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
                </div>
              )}

              {activeTab === "fields" && (
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-4">
                    Choose field types to add to your form
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                    {fieldTypes.map((fieldType) => {
                      const IconComponent = fieldType.icon;
                      return (
                        <button
                          key={fieldType.type}
                          className="h-auto p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-left"
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
                        </button>
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
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 border-t bg-white">
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => onOpenChange(false)}
            >
              Close
            </button>
            {activeTab === "fields" && (
              <button
                onClick={() => setActiveTab("form")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Back to Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Application Type Selection Dialog */}
      <ApplicationTypeDialog
        open={applicationTypeDialogOpen}
        onOpenChange={setApplicationTypeDialogOpen}
        onTypeSelect={handleApplicationTypeSelect}
      />
    </>
  );
}