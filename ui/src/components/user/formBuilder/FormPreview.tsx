"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SignatureCanvas } from "./SignatureCanvas"

interface FormPreviewProps {
  title: string
  description: string
  fields: any[]
  formData?: any
  onInputChange?: (fieldId: string, value: any) => void
  onSubmit?: (e: React.FormEvent) => void
  showSubmitButton?: boolean
  isSubmitting?: boolean
}

export function FormPreview({
  title,
  description,
  fields,
  formData = {},
  onInputChange = () => {},
  onSubmit = () => {},
  showSubmitButton = false,
  isSubmitting = false,
}: FormPreviewProps) {
  const renderField = (field: any) => {
    const isRequired = field.required
    const fieldType = field.type?.toLowerCase() || field.type

    switch (fieldType) {
      case "text":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              placeholder={field.placeholder}
              value={formData[field.id] || ""}
              onChange={(e) => onInputChange(field.id, e.target.value)}
              required={isRequired}
              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
            />
          </div>
        )

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={formData[field.id] || ""}
              onChange={(e) => onInputChange(field.id, e.target.value)}
              required={isRequired}
              className="min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg resize-y"
            />
          </div>
        )

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <Select 
              value={formData[field.id] || ""} 
              onValueChange={(value) => onInputChange(field.id, value)}
            >
              <SelectTrigger
                id={field.id}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
              >
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string, index: number) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </div>
        )

      case "checkbox":
        return (
          <div key={field.id} className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <div className="space-y-3">
              {field.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-3">
                  <Checkbox
                    id={`${field.id}-${index}`}
                    checked={formData[`${field.id}-${index}`] || false}
                    onCheckedChange={(checked) => onInputChange(`${field.id}-${index}`, checked)}
                  />
                  <Label 
                    htmlFor={`${field.id}-${index}`} 
                    className="text-sm text-gray-700 font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              )) || []}
            </div>
          </div>
        )

      case "radio":
        return (
          <div key={field.id} className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <RadioGroup 
              value={formData[field.id] || ""} 
              onValueChange={(value) => onInputChange(field.id, value)}
            >
              {field.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-3">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                  <Label 
                    htmlFor={`${field.id}-${index}`} 
                    className="text-sm text-gray-700 font-normal cursor-pointer"
                  >
                    {option}
                  </Label>
                </div>
              )) || []}
            </RadioGroup>
          </div>
        )

      case "signature":
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <SignatureCanvas 
              value={formData[field.id]} 
              onChange={(value) => onInputChange(field.id, value)} 
            />
          </div>
        )

      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              {field.label} {isRequired && <span className="text-red-500">*</span>}
            </Label>
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Unsupported field type: {field.type}
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">{title}</h2>
        {description && <p className="text-gray-600 leading-relaxed">{description}</p>}
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No fields added</h3>
          <p className="text-gray-500">Add some fields to see how your form will look.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          {fields.map(renderField)}

          {showSubmitButton && (
            <div className="pt-6 border-t border-gray-200">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-medium transition-colors duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Form'
                )}
              </Button>
            </div>
          )}
        </form>
      )}
    </div>
  )
}