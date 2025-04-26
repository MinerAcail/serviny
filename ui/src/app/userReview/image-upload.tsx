"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { X } from "lucide-react"

interface ImageUploadProps {
  onChange: (files: File[]) => void
  maxFiles: number
}

export function ImageUpload({ onChange, maxFiles }: ImageUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Update files array
      const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles)
      setFiles(newFiles)
      
      // Create and update preview URLs
      const newPreviews = newFiles.map(file => {
        // Check if we already have a preview for this file
        const existingPreview = files.findIndex(f => f.name === file.name && f.size === file.size)
        if (existingPreview >= 0 && existingPreview < previews.length) {
          return previews[existingPreview]
        }
        // Create new preview URL
        return URL.createObjectURL(file)
      })
      
      // Clean up old preview URLs that are no longer needed
      previews.forEach((preview) => {
        if (!newPreviews.includes(preview)) {
          URL.revokeObjectURL(preview)
        }
      })
      
      setPreviews(newPreviews)
      onChange(newFiles)
    },
    [files, maxFiles, onChange, previews],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxFiles: maxFiles - files.length,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const removeImage = (index: number) => {
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(previews[index])
    
    // Remove the file and preview
    const updatedFiles = files.filter((_, i) => i !== index)
    const updatedPreviews = previews.filter((_, i) => i !== index)
    
    setFiles(updatedFiles)
    setPreviews(updatedPreviews)
    onChange(updatedFiles)
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${
          isDragActive ? "border-primary" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? <p>Drop the files here ...</p> : <p>Drag 'n' drop some files here, or click to select files</p>}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {previews.map((preview, index) => (
          <div key={preview} className="relative">
            <img
              src={preview || "/placeholder.svg"}
              alt={`Uploaded image ${index + 1}`}
              width={100}
              height={100}
              className="object-cover rounded-md"
            />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}