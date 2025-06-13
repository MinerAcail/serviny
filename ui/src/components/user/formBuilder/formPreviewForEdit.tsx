import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import React, { useRef, useState } from 'react'

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

interface FormPreviewForEditProps {
  title: string;
  description?: string;
  fields: FormField[];
}

export function FormPreviewForEdit({ 
  title, 
  description, 
  fields
}: FormPreviewForEditProps) {
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({})
  const [isDrawing, setIsDrawing] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<Record<string, string | boolean | null>>({})

  const handleInputChange = (fieldId: string, value: string | boolean | null) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const renderField = (field: FormField) => {
    const fieldType = field.type.toUpperCase()
    const fieldValue = formData[field.id] || ""
    const isRequired = field.required

    const fieldLabel = (
      <label className="text-sm font-medium text-gray-700 block mb-2">
        {field.label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>
    )

    switch (fieldType) {
      case 'TEXT':
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Input
              type="text"
              placeholder={field.placeholder}
              value={typeof fieldValue === "string" ? fieldValue : ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={isRequired}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )

      case 'TEXTAREA':
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <textarea
              placeholder={field.placeholder}
                            value={typeof fieldValue === "string" ? fieldValue : ""}

              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={isRequired}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none min-h-[100px] resize-y"
            />
          </div>
        )

      case 'SELECT':
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <select
                            value={typeof fieldValue === "string" ? fieldValue : ""}

              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={isRequired}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="">{field.placeholder || "Select an option"}</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )

      case 'RADIO':
        return (
          <div key={field.id} className="space-y-3">
            {fieldLabel}
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="radio"
                    id={`${field.id}-${index}`}
                    name={field.id}
                    value={option}
                    checked={fieldValue === option}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={isRequired}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor={`${field.id}-${index}`} className="text-sm font-normal text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )

      case 'CHECKBOX':
        return (
          <div key={field.id} className="space-y-3">
            {fieldLabel}
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="checkbox"
                    id={`${field.id}-${index}`}
                    checked={Boolean(formData[`${field.id}-${option}`])}
                    onChange={(e) => 
                      handleInputChange(`${field.id}-${option}`, e.target.checked)
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor={`${field.id}-${index}`} className="text-sm font-normal text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )

     case 'SIGNATURE':
        return (
          <div key={field.id} className="space-y-3" data-signature-field={field.id}>
            {fieldLabel}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              
              {/* Canvas for drawing signature */}
              <div className="mb-4">
                <Label className="text-sm text-gray-600 mb-2 block">Draw your signature:</Label>
                <div className="border border-gray-300 rounded bg-white">
                  <canvas
                    ref={(el) => canvasRefs.current[field.id] = el}
                    width={400}
                    height={150}
                    className="cursor-crosshair block w-full h-auto"
                    onMouseDown={(e) => startDrawing(e, field.id)}
                    onMouseMove={(e) => draw(e, field.id)}
                    onMouseUp={() => stopDrawing(field.id)}
                    onMouseLeave={() => stopDrawing(field.id)}
                    onTouchStart={(e) => {
                      e.preventDefault()
                      startDrawing(e, field.id)
                    }}
                    onTouchMove={(e) => {
                      e.preventDefault()
                      draw(e, field.id)
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault()
                      stopDrawing(field.id)
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
                      <span className="text-green-600">✓ Signature ready (will be saved on form submit)</span>
                    ) : (
                      <span>No signature provided</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div key={field.id} className="space-y-2">
            {fieldLabel}
            <Input
              type="text"
              placeholder={field.placeholder}
                            value={typeof fieldValue === "string" ? fieldValue : ""}

              onChange={(e) => handleInputChange(field.id, e.target.value)}
              required={isRequired}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )
    }
  }
  // Fixed coordinate calculation for better positioning
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }

  // Signature drawing functions
  const startDrawing = (e: React.MouseEvent | React.TouchEvent, fieldId: string) => {
     const canvas = canvasRefs.current[fieldId]
     if (!canvas) return
 
     setIsDrawing(prev => ({ ...prev, [fieldId]: true }))
     
     const { x, y } = getCoordinates(e, canvas)
     
     const ctx = canvas.getContext('2d')
     if (ctx) {
       ctx.beginPath()
       ctx.moveTo(x, y)
     }
   }

  const draw = (e: React.MouseEvent | React.TouchEvent, fieldId: string) => {
    const canvas = canvasRefs.current[fieldId]
    if (!canvas || !isDrawing[fieldId]) return

    const { x, y } = getCoordinates(e, canvas)
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#000000'
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const stopDrawing = (fieldId: string) => {
    setIsDrawing(prev => ({ ...prev, [fieldId]: false }))
    handleInputChange(fieldId, "signature_present")
  }

  const clearSignature = (fieldId: string) => {
    const canvas = canvasRefs.current[fieldId]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    handleInputChange(fieldId, null)
  }

  const hasSignatureContent = (fieldId: string): boolean => {
    const canvas = canvasRefs.current[fieldId]
    if (!canvas) return false

    const context = canvas.getContext('2d')
    if (!context) return false

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
    return imageData.data.some(channel => channel !== 0)
  }

  return (
    <div className="space-y-6">
      {/* Form Header */}
      <div className="text-center space-y-2 pb-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {description && (
          <p className="text-gray-600 max-w-2xl mx-auto">{description}</p>
        )}
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {fields.map(renderField)}
      </div>

      {/* Preview Notice */}
      <div className="pt-6 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-800">
            <strong>Preview Mode:</strong> This is how your form will appear to users. 
            The form is interactive but data won't be saved.
          </p>
        </div>
      </div>
    </div>
  )
}