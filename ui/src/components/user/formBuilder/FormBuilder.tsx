import { useState } from "react";
// import { useNavigate } from "react-router";
import { Plus, Save, Settings, Eye, BookCopy } from "lucide-react";
import { gql, useMutation } from "@apollo/client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormFieldEditor } from "./FormFieldEditor";
// import { FormPreview } from "./FormPreview";
import { FormSettingsDialog } from "./FormSettingsDialog";
import { toast } from "sonner";
import FormsPage from "./FormsPage";
import { FormPreviewForEdit } from "./formPreviewForEdit";

// Updated GraphQL mutation to match backend schema
const CREATE_FORM = gql`
  mutation CreateForm($input: CreateFormInput!) {
    createForm(input: $input) {
      id
      title
      description
      type
      isActive
      submissionCount
      fields {
        id
        type
        label
        placeholder
        required
        options
        validation
        order
      }
      createdAt
      updatedAt
    }
  }
`;

export interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: string;
  order?: number;
}

export default function FormBuilder() {
//   const navigate = useNavigate();
  const [formTitle, setFormTitle] = useState("Untitled Form");
  const [formDescription, setFormDescription] = useState("Form description");
  const [formType, setFormType] = useState("AGREEMENT");
  const [isActive, setIsActive] = useState(true);
  const [fields, setFields] = useState<FormField[]>([]);
  const [activeTab, setActiveTab] = useState("edit");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogActiveTab, setdialogActiveTab] = useState("form");

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // GraphQL mutation hook
  const [createFormMutation] = useMutation(CREATE_FORM, {
    onCompleted: () => {
      toast.success("Form saved successfully!", {
        description: "Your form has been created and saved.",
        duration: 5000,
      });

      //   navigate("/forms");
    },
    onError: (error) => {
      console.error("GraphQL save failed:", error);
      toast.error("Failed to save form", {
        description: "Please check your connection and try again.",
      });
    },
  });

  const addField = (type: string) => {
    const newField: FormField = {
      id: generateId(),
      type: type.toUpperCase(),
      label: `New ${type} field`,
      placeholder:
        type === "signature" || type === "checkbox" || type === "radio"
          ? undefined
          : `Enter ${type}`,
      required: false,
      options:
        type === "select" || type === "radio" || type === "checkbox"
          ? ["Option 1", "Option 2"]
          : undefined,
      validation: undefined,
      order: fields.length,
    };

    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeField = (id: string) => {
    const updatedFields = fields.filter((field) => field.id !== id);
    // Update order for remaining fields
    const reorderedFields = updatedFields.map((field, index) => ({
      ...field,
      order: index,
    }));
    setFields(reorderedFields);
  };

  const moveField = (id: string, direction: "up" | "down") => {
    const index = fields.findIndex((field) => field.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const [movedField] = newFields.splice(index, 1);
    newFields.splice(newIndex, 0, movedField);

    // Update order for all fields
    const reorderedFields = newFields.map((field, idx) => ({
      ...field,
      order: idx,
    }));

    setFields(reorderedFields);
  };

  const validateForm = () => {
    if (!formTitle.trim()) {
      toast.error("Please enter a form title");
      return false;
    }

    if (fields.length === 0) {
      toast.error("Please add at least one field to your form");
      return false;
    }

    // Validate required fields have labels
    const fieldsWithoutLabels = fields.filter((field) => !field.label.trim());
    if (fieldsWithoutLabels.length > 0) {
      toast.error("All fields must have labels");
      return false;
    }

    // Validate select/radio/checkbox fields have options
    const optionFields = fields.filter((field) =>
      ["SELECT", "RADIO", "CHECKBOX"].includes(field.type.toUpperCase())
    );
    const fieldsWithoutOptions = optionFields.filter(
      (field) => !field.options || field.options.length === 0
    );
    if (fieldsWithoutOptions.length > 0) {
      toast.error(
        "Select, radio, and checkbox fields must have at least one option"
      );
      return false;
    }

    return true;
  };

  const saveForm = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Prepare fields for GraphQL (match backend schema)
      const preparedFields = fields.map((field, index) => ({
        type: field.type.toUpperCase(),
        label: field.label.trim(),
        placeholder: field.placeholder || null,
        required: field.required,
        options: field.options || [],
        validation: field.validation || null,
        order: field.order !== undefined ? field.order : index,
      }));

      await createFormMutation({
        variables: {
          input: {
            title: formTitle.trim(),
            description: formDescription.trim() || null,
            type: formType,
            isActive: isActive,
            fields: preparedFields,
          },
        },
      });
    } catch (error) {
      console.error("Form save error:", error);
      toast.error("Failed to save form", {
        description: "Please try again or check your connection.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen mt-20 bg-gray-50">
      {/* Header */}

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}

          <div className="lg:col-span-3">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="flex justify-between">
                <TabsList className="bg-gray-100 p-1 rounded-lg mb-6">
                  <TabsTrigger
                    value="edit"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
                  >
                    Edit Form
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger
                    value="saved"
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-4 py-2"
                  >
                    <BookCopy className="h-4 w-4 mr-2" />
                    Saved
                  </TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-3 p-1 rounded-lg mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSettingsOpen(true)}
                    className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    onClick={saveForm}
                    size="sm"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save {fields.length} field
                        {fields.length !== 1 ? "s" : ""}
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {activeTab === "edit" && dialogActiveTab === "form" && (
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">
                    {formTitle}
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">{formDescription}</p>
                </div>
              )}
              <TabsContent value="edit" className="mt-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  {fields.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-gray-400 mb-4">
                        <Plus className="h-12 w-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No fields added yet
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Add fields from the settings to start building your
                        form.
                      </p>
                      <Button
                        onClick={() => setSettingsOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Field
                      </Button>
                    </div>
                  ) : (
                    <div className="p-6 space-y-4">
                      {fields
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map((field) => (
                          <FormFieldEditor
                            key={field.id}
                            field={field}
                            onUpdate={(updates) =>
                              updateField(field.id, updates)
                            }
                            onRemove={() => removeField(field.id)}
                            onMove={(direction) =>
                              moveField(field.id, direction)
                            }
                          />
                        ))}

                      {/* Add Field Button */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Button
                          onClick={() => setSettingsOpen(true)}
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Another Field
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="mt-0">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                  <FormPreviewForEdit
                    title={formTitle}
                    description={formDescription}
                    fields={fields.sort(
                      (a, b) => (a.order || 0) - (b.order || 0)
                    )}
                    
                  />

                  {fields.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">
                        No fields to preview yet. Add some fields to see how
                        your form will look.
                      </p>
                      <Button
                        onClick={() => {
                          setActiveTab("edit");
                          setSettingsOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Fields
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="saved" className="mt-0">
                <FormsPage />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <FormSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        formTitle={formTitle}
        formDescription={formDescription}
        formType={formType}
        isActive={isActive}
        onTitleChange={setFormTitle}
        onDescriptionChange={setFormDescription}
        onTypeChange={setFormType}
        onActiveChange={setIsActive}
        addField={addField}
        activeTab={dialogActiveTab}
        setActiveTab={setdialogActiveTab}
        fields={fields}
      />
    </div>
  );
}
