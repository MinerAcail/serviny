import type React from "react"

import { useState } from "react"
import { ArrowUp, ArrowDown, Trash2, GripVertical, ChevronDown, ChevronRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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

interface FormFieldEditorProps {
  field: FormField
  onUpdate: (updates: Partial<FormField>) => void
  onRemove: () => void
  onMove: (direction: "up" | "down") => void
}

export function FormFieldEditor({ field, onUpdate, onRemove, onMove }: FormFieldEditorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ label: e.target.value })
  }

  const handlePlaceholderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ placeholder: e.target.value })
  }

  const handleRequiredChange = (checked: boolean) => {
    onUpdate({ required: checked })
  }

  const handleValidationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ validation: e.target.value })
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(field.options || [])]
    newOptions[index] = value
    onUpdate({ options: newOptions })
  }

  const addOption = () => {
    const currentOptions = field.options || []
    onUpdate({ options: [...currentOptions, `Option ${currentOptions.length + 1}`] })
  }

  const removeOption = (index: number) => {
    const newOptions = [...(field.options || [])]
    newOptions.splice(index, 1)
    onUpdate({ options: newOptions })
  }

  const getFieldTypeIcon = (type: string) => {
    const iconClass = "h-4 w-4"
    switch (type?.toUpperCase()) {
      case "TEXT":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
      case "TEXTAREA":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
      case "SELECT":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
      case "CHECKBOX":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      case "RADIO":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" /></svg>
      case "SIGNATURE":
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
      default:
        return <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
    }
  }

  const getFieldTypeDisplay = (type: string) => {
    switch (type?.toUpperCase()) {
      case "TEXT": return "Text Input"
      case "TEXTAREA": return "Textarea"
      case "SELECT": return "Dropdown"
      case "CHECKBOX": return "Checkbox"
      case "RADIO": return "Radio Buttons"
      case "SIGNATURE": return "Signature"
      default: return type
    }
  }

  const fieldType = field.type?.toUpperCase()
  const hasOptions = ["SELECT", "RADIO", "CHECKBOX"].includes(fieldType)
  const showPlaceholder = !["CHECKBOX", "SIGNATURE", "RADIO"].includes(fieldType)
  const showValidation = ["TEXT", "TEXTAREA"].includes(fieldType)

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="cursor-move text-gray-400 hover:text-gray-600">
            <GripVertical className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-gray-500">
              {getFieldTypeIcon(field.type)}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {field.label || `Untitled ${getFieldTypeDisplay(field.type)} field`}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{getFieldTypeDisplay(field.type)}</span>
                {field.required && (
                  <>
                    <span>•</span>
                    <span className="text-red-600">Required</span>
                  </>
                )}
                {hasOptions && field.options?.length > 0 && (
                  <>
                    <span>•</span>
                    <span>{field.options.length} option{field.options.length !== 1 ? 's' : ''}</span>
                  </>
                )}
                {field.order !== undefined && (
                  <>
                    <span>•</span>
                    <span>Order: {field.order + 1}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              >
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="ml-1">Settings</span>
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove("up")}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            title="Move up"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove("down")}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            title="Move down"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRemove} 
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Delete field"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleContent>
          <div className="px-4 pb-4 border-t border-gray-200 pt-4 bg-white rounded-b-lg">
            <div className="space-y-4">
              {/* Field Label */}
              <div className="space-y-2">
                <Label htmlFor={`label-${field.id}`} className="text-sm font-medium text-gray-700">
                  Field Label <span className="text-red-500">*</span>
                </Label>
                <Input
                  id={`label-${field.id}`}
                  value={field.label || ""}
                  onChange={handleLabelChange}
                  placeholder={`Enter ${getFieldTypeDisplay(field.type)} field label`}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  maxLength={255}
                />
                <p className="text-xs text-gray-500">
                  {(field.label || "").length}/255 characters
                </p>
              </div>

              {/* Placeholder Text */}
              {showPlaceholder && (
                <div className="space-y-2">
                  <Label htmlFor={`placeholder-${field.id}`} className="text-sm font-medium text-gray-700">
                    Placeholder Text
                  </Label>
                  <Input
                    id={`placeholder-${field.id}`}
                    value={field.placeholder || ""}
                    onChange={handlePlaceholderChange}
                    placeholder={`Enter placeholder for ${getFieldTypeDisplay(field.type)} field`}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    maxLength={255}
                  />
                </div>
              )}

              {/* Validation */}
              {showValidation && (
                <div className="space-y-2">
                  <Label htmlFor={`validation-${field.id}`} className="text-sm font-medium text-gray-700">
                    Validation Pattern (Optional)
                  </Label>
                  <Input
                    id={`validation-${field.id}`}
                    value={field.validation || ""}
                    onChange={handleValidationChange}
                    placeholder="e.g., email, phone, or custom regex"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    Common patterns: email, phone, url, or custom regex
                  </p>
                </div>
              )}

              {/* Options */}
              {hasOptions && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">
                      Options <span className="text-red-500">*</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addOption}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {(field.options || []).map((option: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            maxLength={255}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeOption(index)}
                          disabled={(field.options || []).length <= 1}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove option"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {(!field.options || field.options.length === 0) && (
                    <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-sm text-gray-500 mb-2">No options added yet</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add First Option
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Required Field Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <Label htmlFor={`required-${field.id}`} className="text-sm font-medium text-gray-700">
                    Required field
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    Users must fill this field to submit the form
                  </p>
                </div>
                <Switch 
                  id={`required-${field.id}`} 
                  checked={field.required || false} 
                  onCheckedChange={handleRequiredChange} 
                />
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}